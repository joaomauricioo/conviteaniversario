const AMBIENTE_PRODUCAO = process.env.NODE_ENV === "production";

function lerNumeroPositivo(nome: string, padrao: number) {
  const valor = Number(process.env[nome]);
  return Number.isFinite(valor) && valor > 0 ? valor : padrao;
}

function lerListaDeOrigens() {
  return (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean);
}

export const env = {
  isProduction: AMBIENTE_PRODUCAO,
  databaseUrl: process.env.DATABASE_URL,
  frontendUrls: lerListaDeOrigens(),
  port: lerNumeroPositivo("PORT", 3000),
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET,
  adminSessionTtlHours: lerNumeroPositivo("ADMIN_SESSION_TTL_HOURS", 8),
  loginRateLimitWindowMs: lerNumeroPositivo(
    "LOGIN_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000,
  ),
  loginRateLimitMax: lerNumeroPositivo("LOGIN_RATE_LIMIT_MAX", 5),
  publicRateLimitWindowMs: lerNumeroPositivo(
    "PUBLIC_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000,
  ),
  publicRateLimitMax: lerNumeroPositivo("PUBLIC_RATE_LIMIT_MAX", 60),
  adminRateLimitWindowMs: lerNumeroPositivo(
    "ADMIN_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000,
  ),
  adminRateLimitMax: lerNumeroPositivo("ADMIN_RATE_LIMIT_MAX", 120),
};

export function validarAmbienteObrigatorio() {
  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL nao foi definida. Copie .env.example para .env e configure o PostgreSQL.",
    );
  }

  if (!env.adminSessionSecret || env.adminSessionSecret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET deve ter pelo menos 32 caracteres.");
  }
}
