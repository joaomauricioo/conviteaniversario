import cors, { type CorsOptions } from "cors";
import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import helmet from "helmet";
import { z } from "zod";
import {
  exigirAdminAutenticado,
  exigirCsrfAdmin,
  limitarTentativasLogin,
  loginAdmin,
  logoutAdmin,
  obterSessaoAdmin,
} from "./lib/admin-auth";
import { env } from "./lib/env";
import { prisma } from "./lib/prisma";
import {
  limitarRotasAdministrativas,
  limitarRotasPublicas,
} from "./lib/rate-limit";
import { Prisma } from "./generated/prisma/client";

function limparTexto(texto: string) {
  return texto
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const celularSchema = z
  .string({ error: "O celular é obrigatório." })
  .trim()
  .transform((celular) => celular.replace(/\D/g, ""))
  .refine(
    (celular) => celular.length === 10 || celular.length === 11,
    "Informe um celular válido com DDD.",
  );

const nomeSchema = z
  .string({ error: "O nome é obrigatório." })
  .transform(limparTexto)
  .pipe(
    z
      .string()
      .min(1, "O nome não pode estar vazio.")
      .max(100, "O nome deve ter no máximo 100 caracteres."),
  );

const nomePresenteSchema = z
  .string({ error: "O nome do presente é obrigatório." })
  .transform(limparTexto)
  .pipe(
    z
      .string()
      .min(1, "O nome do presente não pode estar vazio.")
      .max(120, "O nome do presente deve ter no máximo 120 caracteres."),
  );

const identificacaoConvidadoSchema = z
  .string({ error: "A identificação do convidado é obrigatória." })
  .transform(limparTexto)
  .pipe(
    z
      .string()
      .min(1, "A identificação do convidado não pode estar vazia.")
      .max(120, "A identificação do convidado deve ter no máximo 120 caracteres."),
  );

const fotoUrlSchema = z
  .preprocess(
    (valor) => {
      if (typeof valor !== "string") return valor;
      const texto = valor.trim();
      return texto ? texto : null;
    },
    z
      .string()
      .max(500, "A URL da foto deve ter no máximo 500 caracteres.")
      .url("Informe uma URL válida para a foto.")
      .refine((url) => new URL(url).protocol === "https:", {
        message: "A URL da foto deve começar com https://.",
      })
      .nullable()
      .optional(),
  )
  .transform((fotoUrl) => fotoUrl ?? null);

const confirmacaoSchema = z
  .object({
    nome: nomeSchema,
    celular: celularSchema,
    presenca: z.boolean({
      error: "A presença deve ser informada como sim ou não.",
    }),
  })
  .strict();

const presenteSchema = z
  .object({
    nome: nomePresenteSchema,
    fotoUrl: fotoUrlSchema,
  })
  .strict();

const listaConvidadoSchema = z
  .object({
    nome: nomeSchema,
    identificacao: identificacaoConvidadoSchema,
  })
  .strict();

const editarPresenteSchema = presenteSchema
  .partial()
  .refine((dados) => dados.nome !== undefined || dados.fotoUrl !== undefined, {
    message: "Informe ao menos um campo para atualizar.",
  });

const moverPresenteSchema = z
  .object({
    direcao: z.enum(["subir", "descer"]),
  })
  .strict();

const reordenarPresentesSchema = z
  .object({
    ids: z
      .array(z.string().uuid("O identificador do presente é inválido."))
      .min(1, "Informe ao menos um presente."),
  })
  .strict();

const editarListaConvidadoSchema = listaConvidadoSchema
  .partial()
  .refine((dados) => dados.nome !== undefined || dados.identificacao !== undefined, {
    message: "Informe ao menos um campo para atualizar.",
  });

const editarConfirmacaoSchema = confirmacaoSchema
  .partial()
  .refine(
    (dados) => dados.nome !== undefined || dados.celular !== undefined || dados.presenca !== undefined,
    {
      message: "Informe ao menos um campo para atualizar.",
    },
  );

const presenteIdSchema = z.string().uuid("O identificador do presente é inválido.");
const confirmacaoIdSchema = z.string().uuid("O identificador da confirmação é inválido.");
const listaConvidadoIdSchema = z
  .string()
  .uuid("O identificador do convidado é inválido.");

function normalizarIdentificacao(valor: string) {
  return limparTexto(valor).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function origemLocalDesenvolvimento(origem: string) {
  if (env.isProduction) return false;

  try {
    const { hostname } = new URL(origem);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function buscarOrigensPermitidas(): CorsOptions["origin"] {
  const origensConfiguradas = env.frontendUrls;

  if (!env.isProduction) {
    return (origem, callback) => {
      if (
        !origem ||
        origemLocalDesenvolvimento(origem) ||
        origensConfiguradas.includes(origem)
      ) {
        callback(null, true);
        return;
      }

      callback(null, false);
    };
  }

  return origensConfiguradas;
}

const adicionarCabecalhosSeguros: RequestHandler = (_pedido, resposta, proximo) => {
  resposta.setHeader("X-Content-Type-Options", "nosniff");
  resposta.setHeader("X-Frame-Options", "DENY");
  resposta.setHeader("Referrer-Policy", "no-referrer");
  resposta.setHeader("Cache-Control", "no-store");
  proximo();
};

const exigirJson: RequestHandler = (pedido, resposta, proximo) => {
  if (!pedido.is("application/json")) {
    resposta.status(415).json({ mensagem: "Envie os dados em JSON." });
    return;
  }

  proximo();
};

function erroDeValidacao(resultado: z.ZodError) {
  return {
    mensagem: resultado.issues[0]?.message ?? "Dados inválidos.",
    erros: resultado.flatten().fieldErrors,
  };
}

function tratarErroPrisma(erro: unknown) {
  if (!(erro instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (erro.code) {
    case "P2002":
      return {
        status: 409,
        mensagem: "Já existe um registro com esse valor.",
      };
    case "P2021":
      return {
        status: 503,
        mensagem:
          "A base de dados ainda não recebeu a tabela necessária. Aplique a migration da lista de convidados no Supabase e tente novamente.",
      };
    case "P2022":
      return {
        status: 503,
        mensagem:
          "A tabela existe, mas a estrutura dela no banco não está igual ao schema esperado. Verifique as colunas da lista de convidados no Supabase e aplique a migration correta.",
      };
    case "P2025":
      return {
        status: 404,
        mensagem: "Registro não encontrado.",
      };
    default:
      return {
        status: 500,
        mensagem: "Não foi possível concluir a operação. Tente novamente.",
      };
  }
}

const listarPresentesPublicos: RequestHandler = async (_pedido, resposta, proximo) => {
  try {
    const presentes = await prisma.presente.findMany({
      select: {
        id: true,
        nome: true,
        fotoUrl: true,
      },
      orderBy: [{ ordem: "asc" }, { createdAt: "desc" }],
    });

    resposta.json({ presentes });
  } catch (erro) {
    proximo(erro);
  }
};

const listarPresentesAdministrativos: RequestHandler = async (
  _pedido,
  resposta,
  proximo,
) => {
  try {
    const presentes = await prisma.presente.findMany({
      select: {
        id: true,
        nome: true,
        fotoUrl: true,
        ordem: true,
        createdAt: true,
      },
      orderBy: [{ ordem: "asc" }, { createdAt: "desc" }],
    });

    resposta.json({ presentes });
  } catch (erro) {
    proximo(erro);
  }
};

const salvarPresente: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultado = presenteSchema.safeParse(pedido.body);

    if (!resultado.success) {
      resposta.status(400).json(erroDeValidacao(resultado.error));
      return;
    }

    const dados = resultado.data;
    const menorOrdem = await prisma.presente.aggregate({
      _min: { ordem: true },
    });
    const novaOrdem =
      menorOrdem._min.ordem === null ? 0 : menorOrdem._min.ordem - 1;
    const presente = await prisma.presente.create({
      data: {
        nome: dados.nome,
        fotoUrl: dados.fotoUrl,
        ordem: novaOrdem,
      },
    });

    resposta.status(201).json({
      mensagem: "Presente cadastrado com sucesso!",
      presente,
    });
  } catch (erro) {
    proximo(erro);
  }
};

const atualizarPresente: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultadoId = presenteIdSchema.safeParse(pedido.params.id);
    const resultado = editarPresenteSchema.safeParse(pedido.body);

    if (!resultadoId.success) {
      resposta.status(400).json({ mensagem: resultadoId.error.issues[0]?.message });
      return;
    }

    if (!resultado.success) {
      resposta.status(400).json(erroDeValidacao(resultado.error));
      return;
    }

    const presenteExistente = await prisma.presente.findUnique({
      where: { id: resultadoId.data },
      select: { id: true },
    });

    if (!presenteExistente) {
      resposta.status(404).json({ mensagem: "Presente não encontrado." });
      return;
    }

    const presente = await prisma.presente.update({
      where: { id: resultadoId.data },
      data: resultado.data,
    });

    resposta.json({
      mensagem: "Presente atualizado com sucesso!",
      presente,
    });
  } catch (erro) {
    proximo(erro);
  }
};

const moverPresente: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultadoId = presenteIdSchema.safeParse(pedido.params.id);
    const resultado = moverPresenteSchema.safeParse(pedido.body);

    if (!resultadoId.success) {
      resposta.status(400).json({ mensagem: resultadoId.error.issues[0]?.message });
      return;
    }

    if (!resultado.success) {
      resposta.status(400).json(erroDeValidacao(resultado.error));
      return;
    }

    const movimento = await prisma.$transaction(async (transacao) => {
      const presenteAtual = await transacao.presente.findUnique({
        where: { id: resultadoId.data },
        select: { id: true, ordem: true },
      });

      if (!presenteAtual) {
        return "nao-encontrado" as const;
      }

      const vizinho = await transacao.presente.findFirst({
        where:
          resultado.data.direcao === "subir"
            ? { ordem: { lt: presenteAtual.ordem } }
            : { ordem: { gt: presenteAtual.ordem } },
        select: { id: true, ordem: true },
        orderBy:
          resultado.data.direcao === "subir"
            ? { ordem: "desc" }
            : { ordem: "asc" },
      });

      if (!vizinho) {
        return "limite" as const;
      }

      await transacao.presente.update({
        where: { id: presenteAtual.id },
        data: { ordem: vizinho.ordem },
      });

      await transacao.presente.update({
        where: { id: vizinho.id },
        data: { ordem: presenteAtual.ordem },
      });

      return "movido" as const;
    });

    if (movimento === "nao-encontrado") {
      resposta.status(404).json({ mensagem: "Presente não encontrado." });
      return;
    }

    if (movimento === "limite") {
      resposta.status(409).json({
        mensagem: "Não há mais itens para mover nessa direção.",
      });
      return;
    }

    resposta.json({
      mensagem: "Ordem do presente atualizada com sucesso!",
    });
  } catch (erro) {
    proximo(erro);
  }
};

const reordenarPresentes: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultado = reordenarPresentesSchema.safeParse(pedido.body);

    if (!resultado.success) {
      resposta.status(400).json(erroDeValidacao(resultado.error));
      return;
    }

    const idsUnicos = new Set(resultado.data.ids);
    if (idsUnicos.size !== resultado.data.ids.length) {
      resposta.status(400).json({
        mensagem: "A lista de presentes contém itens repetidos.",
      });
      return;
    }

    const presentesExistentes = await prisma.presente.findMany({
      where: {
        id: {
          in: resultado.data.ids,
        },
      },
      select: { id: true },
    });

    if (presentesExistentes.length !== resultado.data.ids.length) {
      resposta.status(409).json({
        mensagem:
          "A ordem dos presentes não pôde ser atualizada. Atualize a página e tente novamente.",
      });
      return;
    }

    await prisma.$transaction(
      resultado.data.ids.map((id, indice) =>
        prisma.presente.update({
          where: { id },
          data: { ordem: indice + 1 },
        }),
      ),
    );

    resposta.json({
      mensagem: "Ordem dos presentes atualizada com sucesso!",
    });
  } catch (erro) {
    proximo(erro);
  }
};

const excluirPresente: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultadoId = presenteIdSchema.safeParse(pedido.params.id);

    if (!resultadoId.success) {
      resposta.status(400).json({ mensagem: resultadoId.error.issues[0]?.message });
      return;
    }

    const presenteExistente = await prisma.presente.findUnique({
      where: { id: resultadoId.data },
      select: { id: true },
    });

    if (!presenteExistente) {
      resposta.status(404).json({ mensagem: "Presente não encontrado." });
      return;
    }

    await prisma.presente.delete({ where: { id: resultadoId.data } });

    resposta.json({ mensagem: "Presente excluído com sucesso!" });
  } catch (erro) {
    proximo(erro);
  }
};

const obterRelatorioAdministrativo: RequestHandler = async (
  _pedido,
  resposta,
  proximo,
) => {
  try {
    const [totalGeral, totalConfirmados, convidados] = await prisma.$transaction([
      prisma.convidado.count(),
      prisma.convidado.count({ where: { presenca: true } }),
      prisma.convidado.findMany({
        select: {
          id: true,
          nome: true,
          celular: true,
          presenca: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    resposta.json({
      totalGeral,
      totalConfirmados,
      totalNaoConfirmados: totalGeral - totalConfirmados,
      convidados,
    });
  } catch (erro) {
    proximo(erro);
  }
};

const atualizarConfirmacaoRelatorio: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultadoId = confirmacaoIdSchema.safeParse(pedido.params.id);
    const resultado = editarConfirmacaoSchema.safeParse(pedido.body);

    if (!resultadoId.success) {
      resposta.status(400).json({ mensagem: resultadoId.error.issues[0]?.message });
      return;
    }

    if (!resultado.success) {
      resposta.status(400).json(erroDeValidacao(resultado.error));
      return;
    }

    const confirmacaoExistente = await prisma.convidado.findUnique({
      where: { id: resultadoId.data },
      select: { id: true },
    });

    if (!confirmacaoExistente) {
      resposta.status(404).json({ mensagem: "Registro não encontrado." });
      return;
    }

    const dados = resultado.data;
    const celular = dados.celular ? normalizarIdentificacao(dados.celular) : undefined;

    const confirmacao = await prisma.convidado.update({
      where: { id: resultadoId.data },
      data: {
        ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
        ...(celular !== undefined ? { celular } : {}),
        ...(dados.presenca !== undefined ? { presenca: dados.presenca } : {}),
      },
    });

    resposta.json({
      mensagem: "Confirmação atualizada com sucesso!",
      confirmacao,
    });
  } catch (erro) {
    proximo(erro);
  }
};

const excluirConfirmacaoRelatorio: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultadoId = confirmacaoIdSchema.safeParse(pedido.params.id);

    if (!resultadoId.success) {
      resposta.status(400).json({ mensagem: resultadoId.error.issues[0]?.message });
      return;
    }

    const confirmacaoExistente = await prisma.convidado.findUnique({
      where: { id: resultadoId.data },
      select: { id: true },
    });

    if (!confirmacaoExistente) {
      resposta.status(404).json({ mensagem: "Registro não encontrado." });
      return;
    }

    await prisma.convidado.delete({ where: { id: resultadoId.data } });

    resposta.json({ mensagem: "Confirmação excluída com sucesso!" });
  } catch (erro) {
    proximo(erro);
  }
};

const listarConvidadosAdministrativos: RequestHandler = async (
  _pedido,
  resposta,
  proximo,
) => {
  try {
    const convidados = await prisma.listaConvidado.findMany({
      select: {
        id: true,
        nome: true,
        identificacao: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    resposta.json({ convidados });
  } catch (erro) {
    proximo(erro);
  }
};

const salvarConvidadoLista: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultado = listaConvidadoSchema.safeParse(pedido.body);

    if (!resultado.success) {
      resposta.status(400).json(erroDeValidacao(resultado.error));
      return;
    }

    const dados = resultado.data;
    const identificacao = normalizarIdentificacao(dados.identificacao);

    const convidado = await prisma.listaConvidado.create({
      data: {
        nome: dados.nome,
        identificacao,
      },
    });

    resposta.status(201).json({
      mensagem: "Convidado cadastrado com sucesso!",
      convidado,
    });
  } catch (erro) {
    proximo(erro);
  }
};

const atualizarConvidadoLista: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultadoId = listaConvidadoIdSchema.safeParse(pedido.params.id);
    const resultado = editarListaConvidadoSchema.safeParse(pedido.body);

    if (!resultadoId.success) {
      resposta.status(400).json({ mensagem: resultadoId.error.issues[0]?.message });
      return;
    }

    if (!resultado.success) {
      resposta.status(400).json(erroDeValidacao(resultado.error));
      return;
    }

    const convidadoExistente = await prisma.listaConvidado.findUnique({
      where: { id: resultadoId.data },
      select: { id: true },
    });

    if (!convidadoExistente) {
      resposta.status(404).json({ mensagem: "Convidado não encontrado." });
      return;
    }

    const dadosAtualizacao = { ...resultado.data };
    if (dadosAtualizacao.identificacao !== undefined) {
      dadosAtualizacao.identificacao = normalizarIdentificacao(dadosAtualizacao.identificacao);
    }

    const convidado = await prisma.listaConvidado.update({
      where: { id: resultadoId.data },
      data: dadosAtualizacao,
    });

    resposta.json({
      mensagem: "Convidado atualizado com sucesso!",
      convidado,
    });
  } catch (erro) {
    proximo(erro);
  }
};

const excluirConvidadoLista: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultadoId = listaConvidadoIdSchema.safeParse(pedido.params.id);

    if (!resultadoId.success) {
      resposta.status(400).json({ mensagem: resultadoId.error.issues[0]?.message });
      return;
    }

    const convidadoExistente = await prisma.listaConvidado.findUnique({
      where: { id: resultadoId.data },
      select: { id: true },
    });

    if (!convidadoExistente) {
      resposta.status(404).json({ mensagem: "Convidado não encontrado." });
      return;
    }

    await prisma.listaConvidado.delete({ where: { id: resultadoId.data } });

    resposta.json({ mensagem: "Convidado excluído com sucesso!" });
  } catch (erro) {
    proximo(erro);
  }
};

export const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(adicionarCabecalhosSeguros);
app.use(
  cors({
    origin: buscarOrigensPermitidas(),
    credentials: true,
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "20kb" }));

app.get("/", (_pedido, resposta) => {
  resposta.json({ mensagem: "API do convite de aniversário está funcionando." });
});

app.post("/admin/login", limitarTentativasLogin, exigirJson, loginAdmin);
app.get(
  "/admin/sessao",
  limitarRotasAdministrativas,
  exigirAdminAutenticado,
  obterSessaoAdmin,
);
app.post(
  "/admin/logout",
  limitarRotasAdministrativas,
  exigirAdminAutenticado,
  exigirCsrfAdmin,
  logoutAdmin,
);

app.post("/confirmar-presenca", limitarRotasPublicas, exigirJson, async (pedido, resposta, proximo) => {
  try {
    const resultado = confirmacaoSchema.safeParse(pedido.body);

    if (!resultado.success) {
      resposta.status(400).json(erroDeValidacao(resultado.error));
      return;
    }

    const dados = resultado.data;
    const identificacaoConfirmacao = normalizarIdentificacao(dados.celular);
    const convidadoExistente = await prisma.convidado.findUnique({
      where: { celular: dados.celular },
      select: {
        id: true,
        presenca: true,
      },
    });

    if (dados.presenca) {
      if (convidadoExistente?.presenca) {
        resposta.status(409).json({
          mensagem:
            "Este número já confirmou presença. Se precisar alterar seus dados, entre em contato com os organizadores do evento.",
        });
        return;
      }

      const convidadoAutorizado = await prisma.listaConvidado.findFirst({
        where: { identificacao: identificacaoConfirmacao },
        select: { id: true },
      });

      if (!convidadoAutorizado) {
        resposta.status(403).json({
          mensagem:
            "Não encontramos você na lista de convidados. Por favor, entre em contato com os organizadores do evento.",
        });
        return;
      }
    }

    await prisma.convidado.upsert({
      where: { celular: dados.celular },
      create: {
        nome: dados.nome,
        celular: dados.celular,
        presenca: dados.presenca,
      },
      update: {
        nome: dados.nome,
        presenca: dados.presenca,
      },
      select: {
        id: true,
      },
    });

    const foiAtualizado = Boolean(convidadoExistente);

    resposta.status(foiAtualizado ? 200 : 201).json({
      mensagem: foiAtualizado
        ? "Sua confirmação de presença foi atualizada com sucesso."
        : dados.presenca
          ? "Presença confirmada com sucesso!"
          : "Resposta registrada com sucesso.",
      atualizado: foiAtualizado,
    });
  } catch (erro) {
    proximo(erro);
  }
});

app.get("/presentes", limitarRotasPublicas, listarPresentesPublicos);
app.get("/admin/presentes", limitarRotasAdministrativas, exigirAdminAutenticado, listarPresentesAdministrativos);
app.post("/presentes", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, salvarPresente);
app.post("/admin/presentes", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, salvarPresente);
app.post("/presentes/:id/mover", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, moverPresente);
app.post("/admin/presentes/:id/mover", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, moverPresente);
app.put("/admin/presentes/ordem", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, reordenarPresentes);
app.put("/presentes/:id", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, atualizarPresente);
app.put("/admin/presentes/:id", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, atualizarPresente);
app.delete("/presentes/:id", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, excluirPresente);
app.delete("/admin/presentes/:id", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, excluirPresente);

app.get("/relatorio", limitarRotasAdministrativas, exigirAdminAutenticado, obterRelatorioAdministrativo);
app.get("/admin/relatorio", limitarRotasAdministrativas, exigirAdminAutenticado, obterRelatorioAdministrativo);
app.put(
  "/relatorio/:id",
  limitarRotasAdministrativas,
  exigirAdminAutenticado,
  exigirCsrfAdmin,
  exigirJson,
  atualizarConfirmacaoRelatorio,
);
app.put(
  "/admin/relatorio/:id",
  limitarRotasAdministrativas,
  exigirAdminAutenticado,
  exigirCsrfAdmin,
  exigirJson,
  atualizarConfirmacaoRelatorio,
);
app.delete(
  "/relatorio/:id",
  limitarRotasAdministrativas,
  exigirAdminAutenticado,
  exigirCsrfAdmin,
  excluirConfirmacaoRelatorio,
);
app.delete(
  "/admin/relatorio/:id",
  limitarRotasAdministrativas,
  exigirAdminAutenticado,
  exigirCsrfAdmin,
  excluirConfirmacaoRelatorio,
);

app.get("/admin/lista-convidados", limitarRotasAdministrativas, exigirAdminAutenticado, listarConvidadosAdministrativos);
app.post("/lista-convidados", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, salvarConvidadoLista);
app.post("/admin/lista-convidados", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, salvarConvidadoLista);
app.put("/lista-convidados/:id", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, atualizarConvidadoLista);
app.put("/admin/lista-convidados/:id", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, exigirJson, atualizarConvidadoLista);
app.delete("/lista-convidados/:id", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, excluirConvidadoLista);
app.delete("/admin/lista-convidados/:id", limitarRotasAdministrativas, exigirAdminAutenticado, exigirCsrfAdmin, excluirConvidadoLista);

app.use((_pedido, resposta) => {
  resposta.status(404).json({ mensagem: "Rota não encontrada." });
});

const tratarErro: ErrorRequestHandler = (erro, _pedido, resposta, _proximo) => {
  const status =
    typeof erro === "object" && erro !== null && "status" in erro
      ? Number((erro as { status?: unknown }).status)
      : 500;

  if (!env.isProduction) {
    console.error("Erro interno:", erro);
  }

  if (status === 400) {
    resposta.status(400).json({ mensagem: "Dados invalidos." });
    return;
  }

  const erroPrisma = tratarErroPrisma(erro);
  if (erroPrisma) {
    resposta.status(erroPrisma.status).json({
      mensagem: erroPrisma.mensagem,
      ...(erro instanceof Prisma.PrismaClientKnownRequestError
        ? { codigo: erro.code }
        : {}),
    });
    return;
  }

  resposta.status(500).json({
    mensagem: "Não foi possível concluir a operação. Tente novamente.",
  });
};

app.use(tratarErro);
