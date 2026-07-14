CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "convidados"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "presentes"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "administradores"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "convidados"
  ADD CONSTRAINT "convidados_nome_tamanho_check"
    CHECK (char_length("nome") BETWEEN 1 AND 100) NOT VALID,
  ADD CONSTRAINT "convidados_celular_formato_check"
    CHECK ("celular" ~ '^[0-9]{10,11}$') NOT VALID;

ALTER TABLE "presentes"
  ADD CONSTRAINT "presentes_nome_tamanho_check"
    CHECK (char_length("nome") BETWEEN 1 AND 120) NOT VALID,
  ADD CONSTRAINT "presentes_foto_url_formato_check"
    CHECK (
      "fotoUrl" IS NULL OR (
        char_length("fotoUrl") <= 500 AND
        "fotoUrl" ~ '^https://'
      )
    ) NOT VALID;

ALTER TABLE "administradores"
  ADD CONSTRAINT "administradores_senha_hash_bcrypt_check"
    CHECK ("senhaHash" ~ '^\$2[aby]\$') NOT VALID;

CREATE INDEX IF NOT EXISTS "convidados_presenca_idx" ON "convidados"("presenca");
CREATE INDEX IF NOT EXISTS "convidados_updatedAt_idx" ON "convidados"("updatedAt");
CREATE INDEX IF NOT EXISTS "presentes_createdAt_idx" ON "presentes"("createdAt");
CREATE INDEX IF NOT EXISTS "administradores_ativo_idx" ON "administradores"("ativo");

CREATE UNIQUE INDEX IF NOT EXISTS "administradores_usuario_lower_key"
  ON "administradores"(LOWER("usuario"))
  WHERE "usuario" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "administradores_email_lower_key"
  ON "administradores"(LOWER("email"))
  WHERE "email" IS NOT NULL;
