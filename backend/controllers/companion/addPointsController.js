import prisma from "../../prisma/client.js";

export async function addPoints(req, res) {
  try {
    const userId = req.user?.id;
    const { points, action } = req.body;

    if (!userId || typeof points !== "number") {
      return res.status(400).json({ error: "Usuário e pontos são obrigatórios." });
    }

    // Verifica se o usuário é uma acompanhante com perfil ativo
    const companion = await prisma.companion.findUnique({
      where: { userId },
    });

    if (!companion) {
      return res.status(404).json({ error: "Companion não encontrado para esse usuário." });
    }

    const updated = await prisma.companion.update({
      where: { userId },
      data: {
        points: {
          increment: points,
        },
        ActivityLog: {
          create: {
            action: "PONTOS_RECEBIDOS",
            details: `+${points} pontos por ${action || "ação"}`,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Pontos adicionados com sucesso.",
      updatedPoints: updated.points,
    });
  } catch (error) {
    console.error("Erro ao adicionar pontos:", error);
    return res.status(500).json({ error: "Erro ao adicionar pontos." });
  }
};

