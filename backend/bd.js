const dotenv = require("dotenv");
dotenv.config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log("Conectei no PostgreSQL com Prisma");
    } catch (error) {
        console.error("Erro ao conectar no PostgreSQL com Prisma:", error);
        process.exit(1);
    }
}

main();

module.exports = prisma;