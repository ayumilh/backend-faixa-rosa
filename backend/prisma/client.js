const { PrismaClient } = require('@prisma/client');
const dotenv = require("dotenv");

dotenv.config();

let prisma;

if (!global.prisma) {
  prisma = new PrismaClient();

  // Conecta assim que o app inicia
  prisma.$connect()
    .then(() => console.log("Conectado ao PostgreSQL com Prisma"))
    .catch((err) => {
      console.error("Erro ao conectar no PostgreSQL com Prisma:", err);
      process.exit(1);
    });

  global.prisma = prisma;
} else {
  prisma = global.prisma;
}

module.exports = prisma;
