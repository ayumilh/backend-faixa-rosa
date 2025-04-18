const prisma = require('../prisma/client'); // singleton certo!

async function updateTop10Ranking() {
  try {
    // Buscar acompanhantes com assinatura ativa
    const companions = await prisma.companion.findMany({
      where: {
        subscriptions: {
          some: { subscriptionStatus: "ACTIVE" },
        },
      },
      include: {
        subscriptions: {
          where: { subscriptionStatus: "ACTIVE" },
          orderBy: { startDate: 'asc' },
          take: 1,
        },
        user: true,
      },
    });

    // Ordenar manualmente por pontos e data de assinatura
    const ranked = companions
      .filter(c => c.subscriptions.length > 0)
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        const aDate = new Date(a.subscriptions[0].startDate);
        const bDate = new Date(b.subscriptions[0].startDate);
        return aDate - bDate;
      })
      .slice(0, 10);

    console.log("👑 Companions ranqueadas:", ranked.length);

    // Limpar Top10 antigo
    await prisma.top10.deleteMany();

    // Inserir novo Top10
    for (let i = 0; i < ranked.length; i++) {
      await prisma.top10.create({
        data: {
          rank: i + 1,
          points: ranked[i].points,
          userId: ranked[i].userId,
        },
      });
    }

    console.log("✅ Top 10 atualizado com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao atualizar o Top 10:", error);
  }
}

// Permite rodar direto via terminal
if (require.main === module) {
  updateTop10Ranking();
}

module.exports = updateTop10Ranking;
