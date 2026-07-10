import cors, { type CorsOptions } from "cors";
import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma";

function limparTexto(texto: string) {
  return texto
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
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
      .refine((url) => ["http:", "https:"].includes(new URL(url).protocol), {
        message: "A URL da foto deve começar com http:// ou https://.",
      })
      .nullable()
      .optional(),
  )
  .transform((fotoUrl) => fotoUrl ?? null);

const confirmacaoSchema = z.object({
  nome: nomeSchema,
  celular: celularSchema,
  presenca: z.boolean({
    error: "A presença deve ser informada como sim ou não.",
  }),
});

const presenteSchema = z.object({
  nome: nomePresenteSchema,
  fotoUrl: fotoUrlSchema,
});

const editarPresenteSchema = presenteSchema
  .partial()
  .refine((dados) => dados.nome !== undefined || dados.fotoUrl !== undefined, {
    message: "Informe ao menos um campo para atualizar.",
  });

const presenteIdSchema = z.string().uuid("O identificador do presente é inválido.");

function origemLocalDesenvolvimento(origem: string) {
  if (process.env.NODE_ENV === "production") return false;

  try {
    const { hostname } = new URL(origem);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function buscarOrigensPermitidas(): CorsOptions["origin"] {
  const origensConfiguradas = process.env.FRONTEND_URL?.split(",")
    .map((origem) => origem.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    return (origem, callback) => {
      if (
        !origem ||
        origemLocalDesenvolvimento(origem) ||
        origensConfiguradas?.includes(origem)
      ) {
        callback(null, true);
        return;
      }

      callback(null, false);
    };
  }

  if (origensConfiguradas?.length) return origensConfiguradas;
  return process.env.NODE_ENV === "production" ? [] : true;
}

const adicionarCabecalhosSeguros: RequestHandler = (_pedido, resposta, proximo) => {
  resposta.setHeader("X-Content-Type-Options", "nosniff");
  resposta.setHeader("X-Frame-Options", "DENY");
  resposta.setHeader("Referrer-Policy", "no-referrer");
  resposta.setHeader("Cache-Control", "no-store");
  proximo();
};

function erroDeValidacao(resultado: z.ZodError) {
  return {
    mensagem: resultado.issues[0]?.message ?? "Dados inválidos.",
    erros: resultado.flatten().fieldErrors,
  };
}

export const app = express();

app.use(adicionarCabecalhosSeguros);
app.use(
  cors({
    origin: buscarOrigensPermitidas(),
    allowedHeaders: ["Content-Type"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "20kb" }));

app.get("/", (_pedido, resposta) => {
  resposta.json({ mensagem: "API do convite de aniversário está funcionando." });
});

app.post("/confirmar-presenca", async (pedido, resposta, proximo) => {
  try {
    const resultado = confirmacaoSchema.safeParse(pedido.body);

    if (!resultado.success) {
      resposta.status(400).json(erroDeValidacao(resultado.error));
      return;
    }

    const dados = resultado.data;
    const convidadoExistente = await prisma.convidado.findUnique({
      where: { celular: dados.celular },
      select: { id: true },
    });

    const convidado = await prisma.convidado.upsert({
      where: { celular: dados.celular },
      create: dados,
      update: {
        nome: dados.nome,
        presenca: dados.presenca,
      },
      select: {
        id: true,
        nome: true,
        celular: true,
        presenca: true,
        createdAt: true,
        updatedAt: true,
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
      convidado,
    });
  } catch (erro) {
    proximo(erro);
  }
});

app.get("/presentes", async (_pedido, resposta, proximo) => {
  try {
    const presentes = await prisma.presente.findMany({
      orderBy: { createdAt: "desc" },
    });

    resposta.json({ presentes });
  } catch (erro) {
    proximo(erro);
  }
});

app.post("/presentes", async (pedido, resposta, proximo) => {
  try {
    const resultado = presenteSchema.safeParse(pedido.body);

    if (!resultado.success) {
      resposta.status(400).json(erroDeValidacao(resultado.error));
      return;
    }

    const presente = await prisma.presente.create({
      data: resultado.data,
    });

    resposta.status(201).json({
      mensagem: "Presente cadastrado com sucesso!",
      presente,
    });
  } catch (erro) {
    proximo(erro);
  }
});

app.put("/presentes/:id", async (pedido, resposta, proximo) => {
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
});

app.delete(
  "/presentes/:id",
  async (pedido, resposta, proximo) => {
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
  },
);

app.get("/relatorio", async (_pedido, resposta, proximo) => {
  try {
    const [totalGeral, totalConfirmados, convidados] = await prisma.$transaction([
      prisma.convidado.count(),
      prisma.convidado.count({ where: { presenca: true } }),
      prisma.convidado.findMany({
        select: {
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
});

app.use((_pedido, resposta) => {
  resposta.status(404).json({ mensagem: "Rota não encontrada." });
});

const tratarErro: ErrorRequestHandler = (erro, _pedido, resposta, _proximo) => {
  console.error("Erro interno:", erro instanceof Error ? erro.message : "erro desconhecido");
  resposta.status(500).json({
    mensagem: "Não foi possível concluir a operação. Tente novamente.",
  });
};

app.use(tratarErro);
