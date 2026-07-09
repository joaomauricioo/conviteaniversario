import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma";

const celularSchema = z
  .string({ error: "O celular e obrigatorio." })
  .trim()
  .transform((celular) => celular.replace(/\D/g, ""))
  .refine(
    (celular) => celular.length === 10 || celular.length === 11,
    "Informe um celular valido com DDD.",
  );

const confirmacaoSchema = z.object({
  nome: z
    .string({ error: "O nome e obrigatorio." })
    .trim()
    .min(1, "O nome nao pode estar vazio."),
  celular: celularSchema,
  presenca: z.boolean({
    error: "A presenca deve ser informada como sim ou nao.",
  }),
});

const presenteSchema = z.object({
  nome: z
    .string({ error: "O nome do presente e obrigatorio." })
    .trim()
    .min(1, "O nome do presente nao pode estar vazio."),
  fotoUrl: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((fotoUrl) => fotoUrl || null),
});

const editarPresenteSchema = presenteSchema
  .partial()
  .refine((data) => data.nome !== undefined || data.fotoUrl !== undefined, {
    message: "Informe ao menos um campo para atualizar.",
  });

const presenteIdSchema = z.string().uuid("O identificador do presente e invalido.");

function corsOrigins() {
  const configuredOrigins = process.env.FRONTEND_URL?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins?.length ? configuredOrigins : true;
}

export const app = express();

app.use(cors({ origin: corsOrigins() }));
app.use(express.json());

app.get("/", (_request, response) => {
  response.json({ mensagem: "API do convite de aniversario esta funcionando." });
});

app.post("/confirmar-presenca", async (request, response, next) => {
  try {
    const validation = confirmacaoSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        mensagem: validation.error.issues[0]?.message ?? "Dados invalidos.",
        erros: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const convidadoExistente = await prisma.convidado.findUnique({
      where: { celular: validation.data.celular },
      select: { id: true },
    });

    const convidado = await prisma.convidado.upsert({
      where: { celular: validation.data.celular },
      create: validation.data,
      update: {
        nome: validation.data.nome,
        presenca: validation.data.presenca,
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

    const atualizado = Boolean(convidadoExistente);

    response.status(atualizado ? 200 : 201).json({
      mensagem: atualizado
        ? "Sua confirma\u00e7\u00e3o de presen\u00e7a foi atualizada com sucesso."
        : validation.data.presenca
          ? "Presenca confirmada com sucesso!"
          : "Resposta registrada com sucesso.",
      atualizado,
      convidado,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/presentes", async (request, response, next) => {
  try {
    const validation = presenteSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        mensagem: validation.error.issues[0]?.message ?? "Dados invalidos.",
        erros: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const presente = await prisma.presente.create({
      data: validation.data,
    });

    response.status(201).json({
      mensagem: "Presente cadastrado com sucesso!",
      presente,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/presentes", async (_request, response, next) => {
  try {
    const presentes = await prisma.presente.findMany({
      orderBy: { createdAt: "desc" },
    });

    response.json({ presentes });
  } catch (error) {
    next(error);
  }
});

app.put("/presentes/:id", async (request, response, next) => {
  try {
    const idValidation = presenteIdSchema.safeParse(request.params.id);
    const validation = editarPresenteSchema.safeParse(request.body);

    if (!idValidation.success) {
      response.status(400).json({ mensagem: idValidation.error.issues[0]?.message });
      return;
    }

    if (!validation.success) {
      response.status(400).json({
        mensagem: validation.error.issues[0]?.message ?? "Dados invalidos.",
        erros: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const presenteExistente = await prisma.presente.findUnique({
      where: { id: idValidation.data },
      select: { id: true },
    });

    if (!presenteExistente) {
      response.status(404).json({ mensagem: "Presente nao encontrado." });
      return;
    }

    const presente = await prisma.presente.update({
      where: { id: idValidation.data },
      data: validation.data,
    });

    response.json({
      mensagem: "Presente atualizado com sucesso!",
      presente,
    });
  } catch (error) {
    next(error);
  }
});

app.delete("/presentes/:id", async (request, response, next) => {
  try {
    const idValidation = presenteIdSchema.safeParse(request.params.id);

    if (!idValidation.success) {
      response.status(400).json({ mensagem: idValidation.error.issues[0]?.message });
      return;
    }

    const presenteExistente = await prisma.presente.findUnique({
      where: { id: idValidation.data },
      select: { id: true },
    });

    if (!presenteExistente) {
      response.status(404).json({ mensagem: "Presente nao encontrado." });
      return;
    }

    await prisma.presente.delete({ where: { id: idValidation.data } });

    response.json({ mensagem: "Presente excluido com sucesso!" });
  } catch (error) {
    next(error);
  }
});

app.get("/relatorio", async (_request, response, next) => {
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

    response.json({
      totalGeral,
      totalConfirmados,
      totalNaoConfirmados: totalGeral - totalConfirmados,
      convidados,
    });
  } catch (error) {
    next(error);
  }
});

app.use((_request, response) => {
  response.status(404).json({ mensagem: "Rota nao encontrada." });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    mensagem: "Nao foi possivel concluir a operacao. Tente novamente.",
  });
};

app.use(errorHandler);
