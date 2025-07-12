import prisma from '../prisma/client.js';
import cron from 'node-cron';
import { createPayment } from '../controllers/companion/paymentCompanionController.js';

// Função para renovar as assinaturas pagas por cartão de crédito
async function renewExpiredSubscriptions() {
    const now = new Date();

    // Verificar assinaturas expiradas que precisam ser renovadas (somente as que usaram cartão de crédito)
    const subscriptionsToRenew = await prisma.planSubscription.findMany({
        where: {
            subscriptionStatus: 'EXPIRED', // Apenas as assinaturas expiradas
            paymentMethod: 'credit_card',  // Somente as que utilizam cartão de crédito para pagamento
        },
        include: {
            companion: true,  // Inclui a tabela Companion (para obter informações do acompanhante)
            plan: true,       // Inclui a tabela Plan (para obter informações do plano)
            extraPlan: true,  // Inclui a tabela ExtraPlan (para obter informações de planos extras, se houver)
        },
    });

    // Iterando sobre as assinaturas expiradas e exibindo informações do acompanhante e do plano
    for (const subscription of subscriptionsToRenew) {
        const companion = subscription.companion; // Acompanhante relacionado
        const plan = subscription.plan;           // Plano principal
        const extraPlan = subscription.extraPlan; // Plano extra, se houver

        // Buscar o pagamento referente à assinatura
        const payment = await prisma.payment.findFirst({
            where: {
                planSubscriptionId: subscription.id, // Buscar pelo planSubscriptionId
            },
            include: {
                appUser: true, // Inclui o usuário para pegar o e-mail
            },
        });



        // Recupera os dados necessários do pagamento
        const cardToken = payment.cardToken;
        const issuer_id = payment.issuer_id;
        const paymentMethodId = payment.paymentMethodId; // Pode ser 'visa', 'master', etc.
        const email = payment.user.email; // Obtendo o e-mail do usuário


        // Realiza o pagamento de renovação do plano
        try {
            const paymentResult = await createPayment(
                companion.userId,  // userId do acompanhante
                null,               // Não estamos usando um produto específico aqui
                paymentMethodId,    // 'visa', 'master', etc.
                [],                 // Sem planos extras neste exemplo
                payment.amount,         // O valor do plano
                cardToken,          // Token do cartão
                issuer_id,          // ID do emissor do cartão
                1,               // Se houver parcelas, incluir aqui
                email,              // Email do usuário
                payment.user.cpf,   // Número do CPF
                'CPF'               // Tipo de identificação
            );

            // Verifica se o pagamento foi aprovado
            if (paymentResult && paymentResult.transactionId) {
                // Atualiza o status da assinatura para renovada
                await prisma.planSubscription.update({
                    where: { id: subscription.id },
                    data: {
                        subscriptionStatus: 'ACTIVE', // Renova a assinatura
                        nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Define o próximo pagamento para 1 mês
                        updatedAt: new Date(), // Atualiza a data de atualização
                    },
                });

                console.log(`Assinatura renovada para o usuário ${companion.userId} no plano ${plan.id}`);
            } else {
                console.log(`Falha ao renovar o pagamento para o usuário ${companion.userId} no plano ${plan.id}`);
            }
        } catch (error) {
            console.error('Erro ao tentar renovar assinatura:', error);
        }
    }
}


// Agendando o cron job para rodar todos os dias a partir das 01:00 (1 hora depois da expiração)
cron.schedule('0 1 * * *', async () => {
    console.log('Verificando e renovando assinaturas expiradas pagas com cartão...');
    await renewExpiredSubscriptions().catch((error) => {
        console.error('Erro ao renovar assinaturas:', error);
    });
});

// **Teste imediato da função expireSubscriptions**
renewExpiredSubscriptions().catch((error) => {
    console.error('Erro ao expirar assinaturas durante o teste:', error);
});

export default renewExpiredSubscriptions;