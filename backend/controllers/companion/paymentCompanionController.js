const { mercadoPago } = require("../../config/mercadoPago.js");
const { Preference, Payment, CustomerCard, Preapproval } = require("mercadopago");
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

// Função para gerar idempotencyKey
function generateIdempotencyKey() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

// Criar um pagamento
exports.createPayment = async (
    userId,
    product = null,
    payment_method_id,
    extras = [],
    totalAmount = 0,
    cardToken = null, // agora usamos o cardId no lugar do token
    customer_id = null,
    issuer_id,
    installments,
    email,
    identificationNumber,
    identificationType,
    fromSavedCard = false,
    cardId = null,
) => {
    try {
        if (!userId || !payment_method_id) {
            return { error: 'Usuário ou método de pagamento não encontrado.' };
        }

        console.log('Criando pagamento...');
        console.log("Token:", cardToken);
        console.log("ID do Customer:", customer_id);
        console.log("payment_method_id:", payment_method_id);

        const user = await prisma.user.findFirst({ where: { id: userId } });
        if (!user) return { error: 'Usuário não encontrado.' };

        const plan = product
            ? await prisma.plan.findUnique({ where: { id: product } })
            : null;

        const extraPlans = await prisma.extraPlan.findMany({
            where: { id: { in: extras } },
        });

        if (!extraPlans) return { error: 'Planos extras não encontrados.' };

        const payerEmail = user.email;
        const payerCpf = user.cpf;

        const payment = new Payment(mercadoPago);

        let description = plan ? plan.name : '';
        if (extraPlans.length > 0) {
            const extraDesc = extraPlans.map(p => p.name).join(', ');
            description += ` | Extras: ${extraDesc}`;
        }

        // Se for PIX
        if (payment_method_id === 'pix') {
            const paymentResponse = await payment.create({
                body: {
                    transaction_amount: totalAmount,
                    description,
                    payment_method_id,
                    payer: {
                        email: payerEmail,
                        identification: {
                            type: 'CPF',
                            number: payerCpf,
                        },
                    },
                    notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
                },
                requestOptions: { idempotencyKey: generateIdempotencyKey() },
            });

            const transactionId = paymentResponse.id.toString();
            let paymentMethod = paymentResponse.payment_method.type;

            if (paymentMethod === 'bank_transfer') {
                paymentMethod = 'pix';
            }

            // Salva os pagamentos no banco
            if (plan) {
                await prisma.payment.create({
                    data: {
                        userId,
                        planId: plan.id,
                        amount: plan.price,
                        paymentMethod,
                        status: 'pending',
                        transactionId,
                    },
                });
            }

            for (const extra of extraPlans) {
                const extraPlan = await prisma.plan.findUnique({ where: { id: extra.id } });
                if (extraPlan && extraPlan.price) {
                    await prisma.payment.create({
                        data: {
                            userId,
                            extraPlanId: extraPlan.id,
                            amount: extraPlan.price,
                            paymentMethod,
                            status: 'pending',
                            transactionId,
                        },
                    });
                }
            }

            return {
                transactionId,
                qr_code: paymentResponse.point_of_interaction.transaction_data.qr_code,
                qr_code_base64: paymentResponse.point_of_interaction.transaction_data.qr_code_base64,
            };
        }

        // Se for Cartão de Crédito
        if (!customer_id || (!cardToken && !cardId)) {
            return { error: 'Token ou cardId e customer_id não fornecidos.' };
        }

        let savedCardId = cardId;

        if (!fromSavedCard) {
            // 🆕 Novo cartão: salvar para o cliente
            const cardClient = new CustomerCard(mercadoPago);
            const cardResponse = await cardClient.create({
                customerId: customer_id,
                body: {
                    token: cardToken,
                    payment_method: payment_method_id,
                },
            });
        
            if (!cardResponse?.body?.id) {
                console.error("Erro ao salvar cartão:", cardResponse);
                return { error: "Erro ao salvar cartão." };
            }
        
            savedCardId = cardResponse.body.id;
            console.log("✅ Cartão salvo com sucesso:", savedCardId);
        }

        const now = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        const externalReference = `user_${userId}_extra_${now.getFullYear()}${now.getMonth() + 1}`;

        const subscriptionRes = await new Preapproval(mercadoPago).create({
            body: {
                reason: description || "Assinatura",
                external_reference: externalReference,
                payer_email: email,
                card_id: savedCardId,
                payer_id: customer_id,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: totalAmount,
                    currency_id: "BRL",
                    start_date: now.toISOString(),
                    end_date: new Date(now.setFullYear(now.getFullYear() + 1)).toISOString(),
                },
                back_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
                status: "authorized"
            }
        });


        const subscriptionData = subscriptionRes.body;
        if (!subscriptionData?.id) {
            console.error("❌ Erro na assinatura:", subscriptionData);
            return { error: "Erro ao criar assinatura no Mercado Pago." };
        }

        // Grava os pagamentos no banco
        if (plan) {
            await prisma.payment.create({
                data: {
                    userId,
                    planId: plan.id,
                    amount: plan.price,
                    status: 'pending',
                    paymentMethod: 'credit_card',
                    preapprovalId: subscriptionData.id,
                    customerId: user.id.toString(),
                    cardId: savedCardId,
                    issuer_id: issuer_id || null,
                    paymentMethodId: payment_method_id,
                },
            });
        }

        for (const extra of extraPlans) {
            const extraPlan = await prisma.plan.findUnique({ where: { id: extra.id } });
            if (!extraPlan || !extraPlan.price) {
                return { error: `Plano extra inválido: ${extra.name}` };
            }

            await prisma.payment.create({
                data: {
                    userId,
                    extraPlanId: extraPlan.id,
                    amount: extraPlan.price,
                    status: 'pending',
                    paymentMethod: 'credit_card',
                    preapprovalId: subscriptionData.id,
                    customerId: user.id.toString(),
                    cardId: savedCardId,
                    issuer_id: issuer_id || null,
                    paymentMethodId: payment_method_id,
                },
            });
        }

        return {
            status: "success",
            subscriptionId: subscriptionData.id,
            payment_method_id: payment_method_id,
        };

    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        return { error: 'Erro ao criar pagamento.' };
    }
};

exports.receiveWebhook = async (req, res) => {
    try {
        const { action, data, type } = req.body;
        console.log('Webhook recebido:', req.body);

        if (type === 'subscription_preapproval') {
            const preapprovalId = data.id;
            // Busca o pagamento que foi criado com esse preapprovalId
            const payment = await prisma.payment.findFirst({
                where: { preapprovalId }
            });

            if (!payment) {
                console.warn(`❌ Nenhum pagamento encontrado com preapprovalId: ${preapprovalId}`);
                return res.status(404).json({ error: 'Pagamento não encontrado.' });
            }

            // Buscar detalhes da assinatura
            const subscriptionResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            const subscriptionInfo = await subscriptionResponse.json();

            if (!subscriptionInfo || !subscriptionInfo.status) {
                console.error('❌ Erro ao buscar assinatura:', subscriptionInfo);
                return res.status(500).json({ error: 'Erro ao buscar assinatura na API do Mercado Pago.' });
            }

            console.log('[WEBHOOK] Assinatura:', subscriptionInfo);

            // Atualizar o status da assinatura no banco
            await prisma.payment.updateMany({
                where: { preapprovalId },
                data: {
                    status: subscriptionInfo.status,
                    updatedAt: new Date(),
                },
            });

            if (payment.planSubscriptionId) {
                await prisma.planSubscription.update({
                    where: { id: payment.planSubscriptionId },
                    data: {
                        subscriptionStatus: status.toUpperCase(), // ex: "AUTHORIZED", "CANCELLED"
                        updatedAt: new Date()
                    }
                });
            }

            return res.status(200).json({ message: `Assinatura ${subscriptionInfo.id} atualizada com status "${subscriptionInfo.status}"` });
        }

        // Verificar se a ação é "payment.updated" ou "payment.created"
        if (action !== 'payment.updated' && action !== 'payment.created' && action !== 'preapproval_payment.created') {
            return res.status(400).json({ error: 'Ação do webhook não é "payment.updated" nem "payment.created".' });
        }

        const transactionId = data.id;  // ID do pagamento recebido no webhook

        // 1. Buscar detalhes do pagamento via API
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${transactionId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
            },
        });

        const paymentInfo = await response.json();

        const { status, transaction_amount, id, payer, external_reference } = paymentInfo;

        console.log('[WEBHOOK] Detalhes do pagamento:', {
            id, status, valor: transaction_amount, email: payer?.email
        });

        if (status !== 'approved') {
            console.warn(`[WEBHOOK] Pagamento ${id} com status "${status}" (${status_detail}) - NÃO será processado.`);

            // Atualiza o status no banco
            await prisma.payment.updateMany({
                where: { transactionId: id.toString() },
                data: {
                    status,
                    updatedAt: new Date(),
                },
            });

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
                    // Verifique se o companionId existe antes de associar
                    const companionExists = await prisma.companion.findUnique({
                        where: { userId: updatedPayment.userId },
                    });
                    console.log('Companion Exists:', companionExists);

                    if (!companionExists) {
                        return res.status(400).json({ error: 'Acompanhante não encontrado.' });
                    }
                    // Se não houver uma assinatura ativa, cria uma nova
                    const newPlanSubscription = await prisma.planSubscription.create({
                        data: {
                            companionId: companionExists.id,
                            planId: updatedPayment.planId,
                            startDate: new Date(),
                            endDate: null,
                            planSubscriptionId: payments.id,
                            paymentMethod: updatedPayment.paymentMethod,
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
                            subscriptionStatus: 'ACTIVE',
                            nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                            paymentMethod: updatedPayment.paymentMethod,
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

                    // Verifique se o companionId existe antes de associar
                    const companionExists = await prisma.companion.findUnique({
                        where: { userId: updatedPayment.userId },
                    });

                    if (!companionExists) {
                        return res.status(400).json({ error: 'Acompanhante não encontrado.' });
                    }

                    // Criar a assinatura para o plano extra
                    const newExtraPlanSubscription = await prisma.planSubscription.create({
                        data: {
                            companionId: companionExists.id,
                            planId: null,  // Não é um plano principal
                            extraPlanId: extraPlan.id,
                            startDate: new Date(),
                            isExtra: true,
                            endDate: null,
                            paymentMethod: updatedPayment.paymentMethod,
                        },
                    });
                    console.log('Nova assinatura criada para o plano extra:', newExtraPlanSubscription.id);

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

            return res.status(200).json({
                message: `Pagamento ${id} ignorado. Status: ${status}`,
            });
        } else if (status === 'rejected') {


            // Itera sobre todos os pagamentos encontrados
            for (const payment of payments) {
                // Atualiza o status de cada pagamento
                const updatedPayment = await prisma.payment.update({
                    where: { transactionId: id.toString() },  // Identifica o pagamento pelo seu ID
                    data: {
                        status,
                        updatedAt: new Date(),
                    },
                });
            }
        }

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
                        // Verifique se o companionId existe antes de associar
                        const companionExists = await prisma.companion.findUnique({
                            where: { userId: updatedPayment.userId },
                        });
                        console.log('Companion Exists:', companionExists);

                        if (!companionExists) {
                            return res.status(400).json({ error: 'Acompanhante não encontrado.' });
                        }
                        // Se não houver uma assinatura ativa, cria uma nova
                        const newPlanSubscription = await prisma.planSubscription.create({
                            data: {
                                companionId: companionExists.id,
                                planId: updatedPayment.planId,
                                startDate: new Date(),
                                endDate: null,
                                planSubscriptionId: payments.id,
                                paymentMethod: updatedPayment.paymentMethod,
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
                                subscriptionStatus: 'ACTIVE',
                                nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                                paymentMethod: updatedPayment.paymentMethod,
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

                        // Verifique se o companionId existe antes de associar
                        const companionExists = await prisma.companion.findUnique({
                            where: { userId: updatedPayment.userId },
                        });

                        if (!companionExists) {
                            return res.status(400).json({ error: 'Acompanhante não encontrado.' });
                        }

                        // Criar a assinatura para o plano extra
                        const newExtraPlanSubscription = await prisma.planSubscription.create({
                            data: {
                                companionId: companionExists.id,
                                planId: null,  // Não é um plano principal
                                extraPlanId: extraPlan.id,
                                startDate: new Date(),
                                isExtra: true,
                                endDate: null,
                                paymentMethod: updatedPayment.paymentMethod,
                            },
                        });
                        console.log('Nova assinatura criada para o plano extra:', newExtraPlanSubscription.id);

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
        // Busca todos os pagamentos associados ao userId e transactionId
        const payments = await prisma.payment.findMany({
            where: {
                userId,
                transactionId
            },
            include: {
                plan: true,  // Inclui os dados do plano principal
            }
        });

        // Se nenhum pagamento for encontrado, retorna um erro
        if (payments.length === 0) {
            return res.status(404).json({ error: 'Nenhum pagamento encontrado para este usuário.' });
        }

        const payment = payments[0];

        // Verifica o status do pagamento
        const paymentStatus = payment.status;

        // Busca o nome do plano básico e seu preço
        const basicPlan = payment.plan ? payment.plan.name : null;
        const basicPlanPrice = payment.plan ? payment.plan.price : 0; // Preço do plano básico

        // Coleta todos os extraPlanIds encontrados nos pagamentos
        const extraPlanIds = payments
            .filter(payment => payment.extraPlanId)  // Filtra pagamentos com extraPlanId
            .map(payment => payment.extraPlanId);  // Coleta todos os extraPlanIds

        // Busca os planos extras associados aos extraPlanIds
        const extraPlans = extraPlanIds.length > 0 ? await prisma.plan.findMany({
            where: {
                id: { in: extraPlanIds }  // Filtra pelos extraPlanIds encontrados
            },
            select: {
                name: true,   // Nome do plano extra
                price: true   // Preço do plano extra
            }
        }) : [];

        // Calcula o preço total somando o preço do plano básico com os preços dos planos extras
        const totalAmount = basicPlanPrice + extraPlans.reduce((total, plan) => total + plan.price, 0);

        // Retorna os dados do pagamento, planos e preço
        const response = {
            status: paymentStatus === 'approved' ? 'Pagamento aprovado!' :
                paymentStatus === 'pending' ? 'Pagamento pendente!' :
                    'Pagamento recusado!',
            paymentStatus,
            transactionId: payment.transactionId,
            paymentAmount: totalAmount, // Preço total do pagamento
            basicPlan,
            basicPlanPrice, // Inclui o preço do plano básico
            extraPlans,  // Inclui os planos extras com seus preços
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error('Erro ao verificar o status do pagamento:', error);
        return res.status(500).json({ error: 'Erro ao verificar o status do pagamento.' });
    }
};

exports.getSavedCards = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.email) return res.status(400).json({ error: "E-mail não encontrado" });

        const response = await fetch(`https://api.mercadopago.com/v1/customers/search?email=${user.email}`, {
            headers: {
                Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        const customer = data.results[0];
        if (!customer) return res.status(200).json({ message: "Cliente não encontrado" });

        const cardsRes = await fetch(`https://api.mercadopago.com/v1/customers/${customer.id}/cards`, {
            headers: {
                Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
            }
        });

        const cards = await cardsRes.json();
        return res.status(200).json({ cards });
    } catch (error) {
        console.error("Erro ao listar cartões:", error);
        res.status(500).json({ error: "Erro ao buscar cartões salvos" });
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
