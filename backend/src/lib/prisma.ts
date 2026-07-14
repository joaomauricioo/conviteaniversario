import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env, validarAmbienteObrigatorio } from "./env";

validarAmbienteObrigatorio();

const adaptador = new PrismaPg({ connectionString: env.databaseUrl! });

export const prisma = new PrismaClient({ adapter: adaptador });
