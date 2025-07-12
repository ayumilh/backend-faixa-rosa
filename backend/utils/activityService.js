import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const logActivity = async (companionId, action, details) => {
  try {
    await prisma.activityLog.create({
      data: {
        companionId,
        action,
        details
      }
    });
  } catch (error) {
    console.error("Erro ao registrar atividade:", error);
  }
};
