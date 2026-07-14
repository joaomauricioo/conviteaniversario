import rateLimit from "express-rate-limit";
import { env } from "./env";

const mensagemLimite = {
  mensagem: "Muitas requisicoes. Aguarde alguns minutos e tente novamente.",
};

export const limitarRotasPublicas = rateLimit({
  windowMs: env.publicRateLimitWindowMs,
  limit: env.publicRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensagemLimite,
});

export const limitarRotasAdministrativas = rateLimit({
  windowMs: env.adminRateLimitWindowMs,
  limit: env.adminRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: mensagemLimite,
});
