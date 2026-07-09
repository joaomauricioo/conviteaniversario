CREATE TABLE "presentes" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presentes_pkey" PRIMARY KEY ("id")
);
