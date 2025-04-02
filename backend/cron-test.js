const cron = require('node-cron');
const { createPayment } = require('controll');  // Ajuste para o caminho correto do seu serviço de pagamento
const prisma = require('./prismaClient');  // Ajuste para o caminho correto do seu prisma client

// Tarefa agendada que executa a cada 24 horas (ou qualquer intervalo desejado)
cron.schedule('0 0 * * *', async () => {
    console.log('Verificando renovação automática de planos...');

    // Buscar as assinaturas que precisam ser renovadas
    const subscriptionsToRenew = await prisma.planSubscription.findMany({
        where: {
            autoRenew: true,  // Renovação automática ativada
            nextPaymentDate: {
                lte: new Date(),  // Verifica se a data de pagamento já passou
            },
            subscriptionStatus: 'ACTIVE',  // Apenas as assinaturas ativas
        },
    });

    for (const subscription of subscriptionsToRenew) {
        try {
            const userId = subscription.companionId;
            const planId = subscription.planId;

            // Criar o pagamento para renovação
            const paymentResult = await createPayment(userId, planId, 'credit_card', [], planId.price, subscription.cardToken);

            // Verifica se o pagamento foi aprovado
            if (paymentResult && paymentResult.transactionId) {
                // Atualiza a assinatura com o novo próximo pagamento
                await prisma.planSubscription.update({
                    where: { id: subscription.id },
                    data: {
                        nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Define o próximo pagamento para 1 mês
                        updatedAt: new Date(),  // Atualiza o timestamp
                    },
                });

                console.log(`Assinatura renovada para o usuário ${userId} no plano ${planId}`);
            } else {
                console.log(`Falha ao renovar o pagamento para o usuário ${userId} no plano ${planId}`);
            }
        } catch (error) {
            console.error('Erro ao tentar renovar assinatura:', error);
        }
    }
});
