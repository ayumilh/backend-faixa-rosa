const { mercadoPago } = require("../../config/mercadoPago.js");
const { Preference, Payment } = require("mercadopago");
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient();

// Função para gerar idempotencyKey
function generateIdempotencyKey() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

// Criar um pagamento
exports.createPayment = async (userId, product = null, payment_method_id, extras = [], totalAmount = 0) => {
    try {
        if (!userId || !payment_method_id) {
            return { error: 'Usuario ou metodo de pagamento não encontrado.' };
        }

        const user = await prisma.user.findFirst({ where: { id: userId } });
        if (!user) return { error: 'Usuário não encontrado.' }

        let plan;
        if (product) {
            // Busca o plano usando o ID numérico
            plan = await prisma.plan.findUnique({ where: { id: product } });
        }

        const extraPlans = await prisma.extraPlan.findMany({ where: { id: { in: extras } } });

        if (!extraPlans) return { error: 'Plano não encontrado.' }

        // Garantir que o email do usuário seja utilizado para o pagador
        const payerEmail = user.email;
        const payerCpf = user.cpf;

        // Criar uma instância de pagamento usando a configuração do Mercado Pago
        const payment = new Payment(mercadoPago);  // Usa a configuração importada diretamente

        let description = plan ? plan.name : ''; // Nome do plano principal, se houver

        let paymentResponse;

        // Verifica se existe plano extra e adiciona description
        if (extraPlans.length > 0) {
            const extraPlanDescriptions = extraPlans.map(extra => extra.name).join(', ');
            description += ` | Extras: ${extraPlanDescriptions}`;
        }

        // Criação do pagamento com a SDK do Mercado Pago
        paymentResponse = await payment.create({
            body: {
                transaction_amount: totalAmount,  // O valor total da transação (preço do plano + extras)
                description: description,  // Descrição do plano principal + extras
                payment_method_id: payment_method_id,  // O ID do método de pagamento (ex: 'visa', 'pix', etc.)
                payer: {
                    email: payerEmail,  // E-mail do pagador
                    identification: {
                        type: 'CPF',  // Tipo de identificação (ex: 'CPF', 'CNPJ')
                        number: '58962188856',  // Número do CPF do pagador
                    },
                },
                notification_url: 'https://www.faixarosa.com/webhook',  // URL para receber notificações de status do pagamento
            },
            requestOptions: { idempotencyKey: generateIdempotencyKey() },  // Valor único para idempotência
        });


        // Converte o transactionId para string antes de salvar no banco
        const transactionId = paymentResponse.id.toString();  // Garante que seja uma string

        let savedPayment;

        if (product) {
            // Criação do pagamento para o plano principal
            savedPayment = await prisma.payment.create({
                data: {
                    userId,
                    planId: plan.id, // Plano principal
                    amount: plan.price,  // Usa o valor total passado
                    paymentMethod: payment_method_id,
                    status: paymentResponse.status,  // Status do pagamento retornado pela API do Mercado Pago
                    transactionId: transactionId,  // Salva como string
                },
            });
            console.log('Pagamento criado para o plano principal:', savedPayment);
        }

        // Agora, adiciona os planos extras (se houver) com o mesmo transactionId
        if (extraPlans && extraPlans.length > 0) {
            for (const extra of extraPlans) {
                // Buscar o valor do plano extra na tabela `plan`
                const extraPlan = await prisma.plan.findUnique({ where: { id: extra.id } });

                if (extraPlan && extraPlan.price) {
                    await prisma.payment.create({
                        data: {
                            userId,
                            extraPlanId: extraPlan.id,  // Agora estamos salvando o extraPlanId ao invés de planId
                            amount: extraPlan.price,  // O valor do plano extra, retirado da tabela `plan`
                            paymentMethod: payment_method_id,
                            status: paymentResponse.status,  // Status do pagamento retornado pela API do Mercado Pago
                            transactionId: transactionId,
                        },
                    });
                    console.log('Pagamento criado para o plano extra:', extraPlan.id);
                } else {
                    return { error: `O plano extra ${extra.name} não tem valor definido na tabela de planos.` };
                }
            }
        }

        // Retornar a URL de pagamento, ticket_url e o ID do pagamento
        return {
            ticket_url: paymentResponse.point_of_interaction.transaction_data.ticket_url,  // URL do ticket
            transactionId: transactionId,
            qr_code: paymentResponse.point_of_interaction.transaction_data.qr_code,
            qr_code_base64: paymentResponse.point_of_interaction.transaction_data.qr_code_base64,
        }
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        return { error: 'Erro ao criar pagamento.' };
    }
};

exports.receiveWebhook = async (req, res) => {
    try {
        const { action, data } = req.body;
        console.log('Webhook recebido:', req.body);

        // Verificar se a ação é "payment.updated" ou "payment.created"
        if (action !== 'payment.updated' && action !== 'payment.created') {
            return res.status(400).json({ error: 'Ação do webhook não é "payment.updated" nem "payment.created".' });
        }

        const transactionId = data.id;  // ID do pagamento recebido no webhook

        // Encontrar todos os pagamentos com o mesmo transactionId
        const payments = await prisma.payment.findMany({
            where: { transactionId: transactionId.toString() }
        });

        // Se nenhum pagamento for encontrado
        if (!payments || payments.length === 0) {
            return res.status(404).json({ error: 'Pagamento(s) não encontrado(s).' });
        }

        // Lógica para "payment.updated"
        if (action === 'payment.updated') {
            // Itera sobre todos os pagamentos encontrados
            for (const payment of payments) {
                // Atualiza o status de cada pagamento
                const updatedPayment = await prisma.payment.update({
                    where: { id: payment.id },  // Identifica o pagamento pelo seu ID
                    data: {
                        status: 'approved',  // Altere para o status desejado, por exemplo, "approved"
                        updatedAt: new Date(),  // Atualiza o timestamp de atualização
                    },
                });

                // Verifique se o companionId existe antes de associar
                const companionExists = await prisma.companion.findUnique({
                    where: { userId: updatedPayment.userId },
                });

                if (!companionExists) {
                    return res.status(400).json({ error: 'Acompanhante não encontrado.' });
                }

                // Se o pagamento for o plano principal, processe a reativação ou criação da assinatura
                if (updatedPayment.planId) {
                    const plan = await prisma.plan.findUnique({
                        where: { id: updatedPayment.planId },
                        include: { planType: true },
                    });

                    if (!plan) {
                        return res.status(404).json({ error: 'Plano principal não encontrado.' });
                    }

                    // Atualizar a assinatura do plano principal
                    const companionSubscription = await prisma.planSubscription.findFirst({
                        where: { planId: updatedPayment.planId, companionId: updatedPayment.userId, endDate: null },
                    });

                    let planSubscriptionId;

                    if (!companionSubscription) {
                        // Se não houver uma assinatura ativa, cria uma nova
                        const newPlanSubscription = await prisma.planSubscription.create({
                            data: {
                                companionId: updatedPayment.userId,
                                planId: updatedPayment.planId,
                                startDate: new Date(),
                                endDate: null,
                                planSubscriptionId: payments.id,
                            },
                            include: { plan: true },
                        });

                        planSubscriptionId = newPlanSubscription.id;
                    } else {
                        // Se já existir uma assinatura ativa, não cria uma nova, apenas reativa
                        const updatedPlanSubscription = await prisma.planSubscription.update({
                            where: { id: companionSubscription.id },
                            data: {
                                startDate: new Date(), // Atualiza a data de início
                                endDate: null, // Reativa a assinatura
                                updatedAt: new Date(),
                            },
                            include: { plan: true },
                        });

                        planSubscriptionId = updatedPlanSubscription.id;
                    }

                    // atualiza o payment com o id da nova planSubscription
                    await prisma.payment.update({
                        where: { id: updatedPayment.id },
                        data: {
                            planSubscriptionId: planSubscriptionId,  // Atualiza o planSubscriptionId do pagamento
                        },
                    });

                    await prisma.planSubscription.update({
                        where: { id: planSubscriptionId },
                        data: {
                            planSubscriptionId: updatedPayment.id,  // Atualiza o planSubscriptionId do pagamento
                        },
                    });

                    // Atualizar os pontos da acompanhante com base no plano
                    const create = await prisma.companion.update({
                        where: { userId: updatedPayment.userId },
                        data: {
                            planId: updatedPayment.planId,
                            planTypeId: plan.planTypeId || null,
                            points: {
                                increment: plan.planType?.points || 0,  // Incrementa os pontos com base no plano
                            },
                        },
                    });
                    console.log('Assinatura atualizada ou criada para o plano principal:', create.id, create.userId);
                }

                // Verificar se há planos extras
                if (payment.extraPlanId) {
                    const extraPlanIds = Array.isArray(payment.extraPlanId) ? payment.extraPlanId : [payment.extraPlanId];

                    for (const extraPlanId of extraPlanIds) {
                        // Verificar se o plano extra existe
                        const extraPlan = await prisma.extraPlan.findUnique({
                            where: { id: extraPlanId }
                        });

                        if (!extraPlan) {
                            return res.status(400).json({ error: `Plano extra com ID ${extraPlanId} não encontrado.` });
                        }

                        // Verificar se a assinatura já existe para a combinação de companionId e extraPlanId
                        const existingSubscription = await prisma.planSubscription.findFirst({
                            where: {
                                companionId: updatedPayment.userId,
                                extraPlanId: extraPlan.id,
                            }
                        });

                        if (existingSubscription) {
                            return res.status(400).json({ error: 'Assinatura já existente para este plano extra.' });
                        }

                        // Criar a assinatura para o plano extra
                        const newExtraPlanSubscription = await prisma.planSubscription.create({
                            data: {
                                companionId: updatedPayment.userId,
                                planId: null,  // Não é um plano principal
                                extraPlanId: extraPlan.id,
                                startDate: new Date(),
                                isExtra: true,
                                endDate: null,
                            },
                        });

                        // Atualiza o payment com o id da nova planSubscription do plano extra
                        await prisma.payment.update({
                            where: { id: updatedPayment.id },
                            data: {
                                planSubscriptionId: newExtraPlanSubscription.id,  // Atualiza o planSubscriptionId do pagamento
                            },
                        });

                        await prisma.planSubscription.update({
                            where: { id: newExtraPlanSubscription.id },
                            data: {
                                planSubscriptionId: newExtraPlanSubscription.id,  // Atualiza o planSubscriptionId do pagamento
                            },
                        });

                        console.log('Assinatura criada para o plano extra:', extraPlan.id);

                        // Atualizar os pontos da acompanhante com base no plano extra
                        await prisma.companion.update({
                            where: { userId: updatedPayment.userId },
                            data: {
                                points: {
                                    increment: extraPlan?.pointsBonus || 0,
                                },
                            },
                        });
                    }
                }

            }

            return res.status(200).json({ message: 'Status de pagamento atualizado para "aprovado".' });
        }

        // Lógica para "payment.created"
        if (action === 'payment.created') {
            console.log('Pagamento criado. Aguardando confirmação...');
            return res.status(200).json({ message: 'Pagamento criado, aguardando atualização de status.' });
        }

    } catch (error) {
        console.error('Erro ao processar o webhook:', error);
        return res.status(500).json({ error: 'Erro ao processar o webhook.' });
    }
};


exports.getPaymentStatus = async (req, res) => {
    const userId = req.user.id;
    const transactionId = req.params.transactionId;

    try {
        // Busca todos os pagamentos associados ao userId
        const payments = await prisma.payment.findMany({
            where: { userId, transactionId },  // Ajuste para buscar pelo userId
        });

        // Se nenhum pagamento for encontrado, retorna um erro
        if (payments.length === 0) {
            return res.status(404).json({ error: 'Nenhum pagamento encontrado para este usuário.' });
        }

        // Verifica o status do pagamento
        const paymentStatus = payments[0].status; // Assumindo que o status está no campo 'status'

        if (paymentStatus === 'approved') {
            return res.status(200).json({ status: 'Pagamento aprovado!', paymentStatus });
        } else if (paymentStatus === 'pending') {
            return res.status(200).json({ status: 'Pagamento pendente!', paymentStatus });
        } else if (paymentStatus === 'refused') {
            return res.status(200).json({ status: 'Pagamento recusado!', paymentStatus });
        }
    } catch (error) {
        console.error('Erro ao verificar o status do pagamento:', error);
        return res.status(500).json({ error: 'Erro ao verificar o status do pagamento.' });
    }
};



// Listar pagamentos de um usuário
exports.listPaymentsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const payments = await prisma.payment.findMany({
            where: { userId: parseInt(userId) },
        });

        return res.status(200).json(payments);
    } catch (error) {
        console.error('Erro ao listar pagamentos:', error);
        return res.status(500).json({ error: 'Erro ao listar pagamentos.' });
    }
};

// Atualizar status do pagamento
exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updatedPayment = await prisma.payment.update({
            where: { id: parseInt(id) },
            data: { status },
        });

        return res.status(200).json({ message: 'Status do pagamento atualizado.', updatedPayment });
    } catch (error) {
        console.error('Erro ao atualizar status do pagamento:', error);
        return res.status(500).json({ error: 'Erro ao atualizar status do pagamento.' });
    }
};
