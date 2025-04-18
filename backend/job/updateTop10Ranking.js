const prisma = require('../prisma/client'); // Já usando o singleton (sem .disconnect)

async function updateTop10Ranking() {
  try {
    const ranked = await prisma.companion.findMany({
      where: {
        subscriptions: {
          some: { subscriptionStatus: "ACTIVE" },
        },
      },
      include: {
        subscriptions: {
          where: { subscriptionStatus: "ACTIVE", isExtra: false },
          orderBy: { startDate: 'asc' },
          take: 1,
        },
        user: true,
      },
      orderBy: [
        { points: 'desc' },
        { subscriptions: { startDate: 'asc' } },
      ],
      take: 10,
    });

    console.log(ranked);

    await prisma.top10.deleteMany();

    for (let i = 0; i < ranked.length; i++) {
      await prisma.top10.create({
        data: {
          rank: i + 1,
          points: ranked[i].points,
          userId: ranked[i].userId,
        },
      });
    }

    console.log("🏆 Top 10 atualizado com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao atualizar o Top 10:", error);
  }
}

module.exports = updateTop10Ranking;
