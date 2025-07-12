import prisma from '../prisma/client.js';

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
        appUser: true,
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


    await prisma.top10.deleteMany();

    // Resetar todos os companions (remover referência antiga)
    await prisma.companion.updateMany({
      data: { top10Id: null }
    });

    // Inserir novo Top10
    for (let i = 0; i < ranked.length; i++) {
      const top10 = await prisma.top10.create({
        data: {
          rank: i + 1,
          points: ranked[i].points,
          userId: ranked[i].userId,
        },
      });

      await prisma.companion.update({
        where: { userId: ranked[i].userId },
        data: {
          top10Id: top10.id,
        },
      });
    }
    console.log("Top 10 atualizado com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao atualizar o Top 10:", error);
  }
}

// Permite rodar direto via terminal
// if (require.main === module) {
//   updateTop10Ranking();
// }

export default updateTop10Ranking;
