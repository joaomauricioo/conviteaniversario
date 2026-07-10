import "dotenv/config";
import { app } from "./app";
import { prisma } from "./lib/prisma";

const porta = Number(process.env.PORT) || 3000;

const servidor = app.listen(porta, () => {
  console.log(`API disponível em http://localhost:${porta}`);
});

async function desligarServidor() {
  await prisma.$disconnect();
  servidor.close(() => process.exit(0));
}

process.on("SIGINT", desligarServidor);
process.on("SIGTERM", desligarServidor);
