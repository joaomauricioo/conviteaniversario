import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const enderecoBanco = process.env.DATABASE_URL;

if (!enderecoBanco) {
  throw new Error(
    "DATABASE_URL não foi definida. Copie .env.example para .env e configure o PostgreSQL.",
  );
}

const adaptador = new PrismaPg({ connectionString: enderecoBanco });

export const prisma = new PrismaClient({ adapter: adaptador });
