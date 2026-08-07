CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "lista_convidados" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL,
  "identificacao" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lista_convidados_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lista_convidados_identificacao_key"
  ON "lista_convidados"("identificacao");

CREATE INDEX "lista_convidados_nome_idx"
  ON "lista_convidados"("nome");
