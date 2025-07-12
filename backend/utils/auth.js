import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: ["http://localhost:3000", "https://www.faixarosa.com", "https://faixarosa.com", "https://www.faixarosa.com.br", "https://faixarosa.com.br"],
});

