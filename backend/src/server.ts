import "dotenv/config";
import { app } from "./app";
import { env } from "./lib/env";
import { prisma } from "./lib/prisma";

const porta = env.port;

const servidor = app.listen(porta, () => {
  if (!env.isProduction) {
    console.log(`API disponivel em http://localhost:${porta}`);
  }
});

async function desligarServidor() {
  await prisma.$disconnect();
  servidor.close(() => process.exit(0));
}

process.on("SIGINT", desligarServidor);
process.on("SIGTERM", desligarServidor);
