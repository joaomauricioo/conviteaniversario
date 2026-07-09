DROP INDEX IF EXISTS "convidados_email_key";

ALTER TABLE "convidados"
  RENAME COLUMN "email" TO "celular";

CREATE UNIQUE INDEX "convidados_celular_key" ON "convidados"("celular");
