CREATE TABLE "administradores" (
    "id" UUID NOT NULL,
    "usuario" TEXT,
    "email" TEXT,
    "senhaHash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "administradores_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "administradores_usuario_ou_email_check" CHECK ("usuario" IS NOT NULL OR "email" IS NOT NULL)
);

CREATE UNIQUE INDEX "administradores_usuario_key" ON "administradores"("usuario");
CREATE UNIQUE INDEX "administradores_email_key" ON "administradores"("email");
