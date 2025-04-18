const prisma = require('../prisma/client');

async function expireSubscriptions() {
  const now = new Date();
  const expirationDate = new Date(now);
  expirationDate.setMonth(expirationDate.getMonth() - 1);

  const expiredSubscriptions = await prisma.planSubscription.updateMany({
    where: {
      startDate: {
        lt: expirationDate,
      },
      subscriptionStatus: 'ACTIVE',
    },
    data: {
      subscriptionStatus: 'EXPIRED',
    },
  });

  console.log(`🔒 ${expiredSubscriptions.count} assinaturas expiradas`);
}

module.exports = expireSubscriptions;
