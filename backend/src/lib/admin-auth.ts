import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { env } from "./env";
import { prisma } from "./prisma";

const COOKIE_SESSAO_ADMIN = env.isProduction
  ? "__Host-admin_session"
  : "admin_session";
const COOKIE_SESSAO_ADMIN_LEGADO = "admin_session";
const TAMANHO_MINIMO_SEGREDO = 32;
const HASH_COMPARACAO_FALSA = bcrypt.hashSync("senha-invalida-para-comparacao", 12);
const MENSAGEM_CREDENCIAIS_INVALIDAS = "Usuário ou senha inválidos.";

type PayloadSessaoAdmin = {
  adminId: string;
  csrfToken: string;
  exp: number;
};

type AdminAutenticado = {
  id: string;
  usuario: string | null;
  email: string | null;
};

type SessaoAdmin = {
  admin: AdminAutenticado;
  csrfToken: string;
};

const loginSchema = z
  .object({
    usuarioOuEmail: z
      .string({ error: "Informe o usuário ou e-mail." })
      .trim()
      .min(1, "Informe o usuário ou e-mail.")
      .max(254, "Usuário ou e-mail inválido."),
    senha: z
      .string({ error: "Informe a senha." })
      .min(1, "Informe a senha.")
      .max(200, "Senha inválida."),
  })
  .strict();

function ambienteProducao() {
  return env.isProduction;
}

function buscarSegredoSessao() {
  const segredo = env.adminSessionSecret;

  if (!segredo || segredo.length < TAMANHO_MINIMO_SEGREDO) {
    throw new Error(
      `ADMIN_SESSION_SECRET deve ter pelo menos ${TAMANHO_MINIMO_SEGREDO} caracteres.`,
    );
  }

  return segredo;
}

function buscarDuracaoSessaoMs() {
  return env.adminSessionTtlHours * 60 * 60 * 1000;
}

function assinar(valor: string) {
  return createHmac("sha256", buscarSegredoSessao()).update(valor).digest("base64url");
}

function compararSeguro(valorA: string, valorB: string) {
  const bufferA = Buffer.from(valorA);
  const bufferB = Buffer.from(valorB);

  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

function codificarSessao(payload: PayloadSessaoAdmin) {
  const corpo = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${corpo}.${assinar(corpo)}`;
}

function decodificarSessao(token?: string): PayloadSessaoAdmin | null {
  if (!token) return null;

  const [corpo, assinatura] = token.split(".");
  if (!corpo || !assinatura || !compararSeguro(assinatura, assinar(corpo))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8"));
    const resultado = z
      .object({
        adminId: z.string().uuid(),
        csrfToken: z.string().min(32),
        exp: z.number().int(),
      })
      .safeParse(payload);

    if (!resultado.success || resultado.data.exp < Date.now()) return null;
    return resultado.data;
  } catch {
    return null;
  }
}

function lerCookie(pedido: Request, nome: string) {
  const cabecalho = pedido.headers.cookie;
  if (!cabecalho) return null;

  const cookies = cabecalho.split(";").map((cookie) => cookie.trim());
  const prefixo = `${nome}=`;
  const cookie = cookies.find((item) => item.startsWith(prefixo));
  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(prefixo.length));
  } catch {
    return null;
  }
}

function configurarCookieSessao(resposta: Response, token: string) {
  resposta.cookie(COOKIE_SESSAO_ADMIN, token, {
    httpOnly: true,
    secure: ambienteProducao(),
    sameSite: "lax",
    path: "/",
    maxAge: buscarDuracaoSessaoMs(),
  });
}

function limparCookieSessao(resposta: Response) {
  resposta.clearCookie(COOKIE_SESSAO_ADMIN, {
    httpOnly: true,
    secure: ambienteProducao(),
    sameSite: "lax",
    path: "/",
  });

  if (COOKIE_SESSAO_ADMIN !== COOKIE_SESSAO_ADMIN_LEGADO) {
    resposta.clearCookie(COOKIE_SESSAO_ADMIN_LEGADO, {
      httpOnly: true,
      secure: ambienteProducao(),
      sameSite: "lax",
      path: "/",
    });
  }
}

function criarTokenSessao(adminId: string) {
  return codificarSessao({
    adminId,
    csrfToken: randomBytes(32).toString("base64url"),
    exp: Date.now() + buscarDuracaoSessaoMs(),
  });
}

function responderNaoAutenticado(resposta: Response) {
  resposta.status(401).json({ mensagem: "Autenticação necessária." });
}

function buscarSessaoResposta(resposta: Response): SessaoAdmin | undefined {
  return resposta.locals.sessaoAdmin as SessaoAdmin | undefined;
}

export const limitarTentativasLogin = rateLimit({
  windowMs: env.loginRateLimitWindowMs,
  limit: env.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensagem: MENSAGEM_CREDENCIAIS_INVALIDAS },
});

export const exigirAdminAutenticado: RequestHandler = async (
  pedido,
  resposta,
  proximo,
) => {
  try {
    const tokenSessao =
      lerCookie(pedido, COOKIE_SESSAO_ADMIN) ??
      lerCookie(pedido, COOKIE_SESSAO_ADMIN_LEGADO) ??
      undefined;
    const payload = decodificarSessao(tokenSessao);

    if (!payload) {
      responderNaoAutenticado(resposta);
      return;
    }

    const admin = await prisma.administrador.findUnique({
      where: { id: payload.adminId },
      select: { id: true, usuario: true, email: true, ativo: true },
    });

    if (!admin?.ativo) {
      limparCookieSessao(resposta);
      responderNaoAutenticado(resposta);
      return;
    }

    resposta.locals.sessaoAdmin = {
      admin: {
        id: admin.id,
        usuario: admin.usuario,
        email: admin.email,
      },
      csrfToken: payload.csrfToken,
    } satisfies SessaoAdmin;

    proximo();
  } catch (erro) {
    proximo(erro);
  }
};

export const exigirCsrfAdmin: RequestHandler = (pedido, resposta, proximo) => {
  const sessao = buscarSessaoResposta(resposta);
  const tokenEnviado = pedido.get("x-csrf-token");

  if (
    !sessao?.csrfToken ||
    !tokenEnviado ||
    !compararSeguro(tokenEnviado, sessao.csrfToken)
  ) {
    resposta.status(403).json({ mensagem: "Requisição não autorizada." });
    return;
  }

  proximo();
};

export const loginAdmin: RequestHandler = async (pedido, resposta, proximo) => {
  try {
    const resultado = loginSchema.safeParse(pedido.body);

    if (!resultado.success) {
      resposta.status(401).json({ mensagem: MENSAGEM_CREDENCIAIS_INVALIDAS });
      return;
    }

    const { usuarioOuEmail, senha } = resultado.data;
    const identificador = usuarioOuEmail.toLowerCase();
    const admin = await prisma.administrador.findFirst({
      where: {
        ativo: true,
        OR: [
          { usuario: { equals: identificador, mode: "insensitive" } },
          { email: { equals: identificador, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        usuario: true,
        email: true,
        senhaHash: true,
      },
    });

    const senhaValida = await bcrypt.compare(
      senha,
      admin?.senhaHash ?? HASH_COMPARACAO_FALSA,
    );

    if (!admin || !senhaValida) {
      resposta.status(401).json({ mensagem: MENSAGEM_CREDENCIAIS_INVALIDAS });
      return;
    }

    const tokenSessao = criarTokenSessao(admin.id);
    const payloadSessao = decodificarSessao(tokenSessao);

    if (!payloadSessao) {
      throw new Error("Falha ao criar sessão administrativa.");
    }

    configurarCookieSessao(resposta, tokenSessao);

    resposta.json({
      admin: {
        id: admin.id,
        usuario: admin.usuario,
        email: admin.email,
      },
      csrfToken: payloadSessao.csrfToken,
    });
  } catch (erro) {
    proximo(erro);
  }
};

export const obterSessaoAdmin: RequestHandler = (_pedido, resposta) => {
  const sessao = buscarSessaoResposta(resposta);
  resposta.json(sessao);
};

export const logoutAdmin: RequestHandler = (_pedido, resposta) => {
  limparCookieSessao(resposta);
  resposta.json({ mensagem: "Sessão encerrada." });
};
