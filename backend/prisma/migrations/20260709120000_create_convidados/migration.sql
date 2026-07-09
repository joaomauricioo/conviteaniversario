CREATE TABLE "convidados" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "presenca" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convidados_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convidados_email_key" ON "convidados"("email");
