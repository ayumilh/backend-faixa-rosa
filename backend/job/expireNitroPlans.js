import prisma from '../prisma/client.js';

async function expireNitroPlans() {
  try {
    const now = new Date();

    const expiredNitroPlans = await prisma.planSubscription.findMany({
      where: {
        isExtra: true,
        extraPlanId: 6, // ID do Plano Nitro
        endDate: null,
        startDate: {
          lte: new Date(now.getTime() - 60 * 60 * 1000), // 1 hora atrás
        },
      },
    });

    if (expiredNitroPlans.length === 0) {
      console.log("⏳ Nenhum plano Nitro expirado.");
      return;
    }

    const expiredIds = expiredNitroPlans.map(plan => plan.id);

    await prisma.planSubscription.updateMany({
      where: { id: { in: expiredIds } },
      data: { endDate: now },
    });

    console.log(`${expiredIds.length} plano(s) Nitro expirado(s) com sucesso.`);
  } catch (error) {
    console.error("❌ Erro ao expirar planos Nitro:", error.message);
  }
}

export default expireNitroPlans;