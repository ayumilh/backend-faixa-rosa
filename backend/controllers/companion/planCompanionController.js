const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require("../../utils/activityService");
const { createPayment } = require('./paymentCompanionController');

// listar planos
exports.listPlans = async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({
            include: {
                planType: true,
                extraPlans: true,
            },
        });
        return res.status(200).json(plans);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao listar planos' });
    }
};

// listar planos disponíveis
exports.listAvailablePlanTypes = async (req, res) => {
    try {
        const planTypes = await prisma.planType.findMany({
            orderBy: { points: 'desc' }, // Ordena pelos pontos, por exemplo
        });
        return res.status(200).json(planTypes);
    } catch (error) {
        console.error('Erro ao listar tipos de planos:', error);
        return res.status(500).json({ error: 'Erro ao listar tipos de planos.' });
    }
};

// obter funcionalidades dos plano
exports.listPlanTypes = async (req, res) => {
    try {
        const planTypes = await prisma.planType.findMany();
        return res.status(200).json(planTypes);
    } catch (error) {
        console.error('Erro ao listar tipos de planos:', error);
        return res.status(500).json({ error: 'Erro ao listar tipos de planos.' });
    }
};

// Lista os planos assinados por um usuário
exports.listUserPlans = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    try {
        const userPlans = await prisma.companion.findUnique({
            where: { userId },
            include: {
                plan: {
                    include: {
                        planType: true, // Inclui informações do plano principal
                    },
                },
                subscriptions: {
                    where: { isExtra: true, endDate: null }, // Apenas planos extras ativos
                    include: {
                        extraPlan: true, // Inclui os detalhes do plano extra
                    },
                },
            },
        });

        if (!userPlans.plan && (!userPlans.extraPlans || userPlans.extraPlans.length === 0)) {
            return res.status(200).json({ message: 'Usuário não possui nenhum plano ativo.' });
        }

        return res.status(200).json(userPlans);
    } catch (error) {
        console.error('Erro ao listar planos do usuário:', error);
        return res.status(500).json({ error: 'Erro ao listar planos do usuário.' });
    }
};

// assinar plano basico
exports.subscribeToPlan = async (req, res) => {
    const userId = req.user?.id;
    const { planId, payment_method_id } = req.body;
    console.log(planId);
    console.log(payment_method_id);

    if (!planId || isNaN(planId)) {
        return res.status(400).json({ error: 'O ID do plano é obrigatório.' });
    }

    try {
        const companion = await prisma.companion.findUnique({
            where: { userId },
        });

        if (!companion) {
            return res.status(403).json({ error: 'Apenas acompanhantes podem assinar planos.' });
        }

        // Verifica se o plano existe
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
            include: { planType: true },
        });

        if (!plan) {
            return res.status(404).json({ error: 'Plano não encontrado.' });
        }

        // Verifica se a acompanhante já assinou esse plano antes
        const previousSubscription = await prisma.planSubscription.findFirst({
            where: {
                companionId: companion.id,
                planId: planId,
            },
        });

        if (previousSubscription) {
            // Se já assinou antes, apenas reativa a assinatura


            // Verifica se já existe um pagamento pendente para o mesmo plano
            const pendingPayment = await prisma.payment.findFirst({
                where: {
                    userId,
                    planId,
                    status: 'pending',
                },
            });

            if (pendingPayment) {
                // Deleta o pagamento pendente encontrado
                await prisma.payment.delete({
                    where: { id: pendingPayment.id },
                });
                console.log(`Pagamento pendente de ID ${pendingPayment.id} excluído.`);
            }


            const updatedSubscription = await prisma.planSubscription.update({
                where: { id: previousSubscription.id },
                data: {
                    startDate: new Date(), // Atualiza a data de início
                    endDate: null, // Reativa a assinatura
                    updatedAt: new Date(), // Atualiza o timestamp
                },
                include: { plan: true },
            });

            await prisma.companion.update({
                where: { userId },
                data: {
                    planId: plan.id,
                    planTypeId: plan.planTypeId || null,
                    points: {
                        increment: plan.planType?.points || 0,
                    },
                },
            });

            await logActivity(companion.id, "Reativação de Plano",
                `Acompanhante reativou o plano ${plan.name}.`);

            const paymentResult = await createPayment(userId, plan.id, payment_method_id);
            console.log(paymentResult);
            if (!paymentResult || paymentResult.status !== 'approved') {
                return res.status(200).json({
                    ticketUrl: paymentResult.ticket_url,
                    paymentId: paymentResult.paymentId,
                    qr_code: paymentResult.qr_code,
                });
            }

            return res.status(200).json({
                message: 'Plano reativado com sucesso.',
                subscription: updatedSubscription,
                paymentUrl: paymentResult.init_point,
                ticketUrl: paymentResult.ticket_url,
                paymentId: paymentResult.paymentId,
                qr_code: paymentResult.qr_code,
            });
        }

        // Verifica se já existe um pagamento pendente
        const pendingPayment = await prisma.payment.findFirst({
            where: {
                userId,
                planId,
                status: 'pending',
            },
        });

        if (pendingPayment) {
            // Deleta o pagamento pendente encontrado
            await prisma.payment.delete({
                where: { id: pendingPayment.id },
            });
            console.log(`Pagamento pendente de ID ${pendingPayment.id} excluído.`);
        }


        // Verifica se a acompanhante já possui uma assinatura ativa
        const existingSubscription = await prisma.planSubscription.findFirst({
            where: {
                companionId: companion.id,
                endDate: null,
            },
        });

        if (existingSubscription) {
            return res.status(200).json({ message: 'Você já possui uma assinatura principal ativa.' });
        }

        const paymentResult = await createPayment(userId, plan.id, payment_method_id);
        console.log(paymentResult);
        if (!paymentResult || paymentResult.status !== 'approved') {
            return res.status(200).json({
                ticketUrl: paymentResult.ticket_url,
                transactionId: paymentResult.transactionId,
                qr_code: paymentResult.qr_code,
            });
        }

        // Se nunca assinou antes, cria uma nova assinatura
        const newSubscription = await prisma.planSubscription.create({
            data: {
                companionId: companion.id,
                planId: plan.id,
                startDate: new Date(),
                endDate: null,
            },
            include: { plan: true },
        });

        await prisma.companion.update({
            where: { userId },
            data: {
                planId: plan.id,
                planTypeId: plan.planTypeId || null,
                points: {
                    increment: plan.planType?.points || 0,
                },
            },
        });

        await logActivity(companion.id, "Assinatura de Plano",
            `Acompanhante assinou o plano ${plan.name}.`);

        return res.status(201).json({
            message: 'Plano assinado com sucesso.',
            subscription: newSubscription,
            paymentUrl: paymentResult.init_point,
            ticketUrl: paymentResult.ticket_url,
            paymentId: paymentResult.paymentId,
        });
    } catch (error) {
        console.error('Erro ao assinar plano:', error);
        return res.status(500).json({ error: 'Erro ao processar a assinatura.' });
    }
};

// criar plano e adicionar extras, durante o processo de criar plano
// exports.createUserPlan = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const { planTypeId, extras, payment_method_id } = req.body;

//         // Verifica se o tipo de plano existe
//         const planType = await prisma.planType.findUnique({
//             where: { id: planTypeId },
//         });

//         if (!planType) {
//             return res.status(404).json({ error: 'Tipo de plano não encontrado.' });
//         }

//         // Busca a acompanhante vinculada ao usuário
//         const companion = await prisma.companion.findUnique({
//             where: { userId },
//             select: { id: true },
//         });

//         if (!companion) {
//             return res.status(403).json({ error: 'Apenas acompanhantes podem criar planos.' });
//         }

//         let totalPointsToAdd = 0;

//         // Verifica se a acompanhante já assinou esse plano básico antes
//         const previousPlan = await prisma.planSubscription.findFirst({
//             where: {
//                 companionId: companion.id,
//                 planId: planTypeId,
//             },
//         });

//         let userPlan;

//         // Verifica se já existe um pagamento pendente para o plano principal
//         const pendingPayment = await prisma.payment.findFirst({
//             where: {
//                 userId,
//                 planId: planTypeId,
//                 status: 'pending',
//             },
//         });

//         if (pendingPayment) {
//             // Deleta o pagamento pendente encontrado
//             await prisma.payment.delete({
//                 where: { id: pendingPayment.id },
//             });
//             console.log(`Pagamento pendente de ID ${pendingPayment.id} excluído.`);
//         }

//         if (previousPlan) {
//             // Se já assinou antes, apenas reativa o plano básico
//             userPlan = await prisma.planSubscription.update({
//                 where: { id: previousPlan.id },
//                 data: {
//                     startDate: new Date(),
//                     endDate: null, // Reativa
//                     updatedAt: new Date(),
//                 },
//             });

//             totalPointsToAdd += planType.points || 0;

//             await logActivity(companion.id, "Reativação de Plano", `Acompanhante reativou o plano ${planType.name}.`);
//         } else {
//             // Cria a assinatura do plano básico se nunca foi assinado antes
//             userPlan = await prisma.planSubscription.create({
//                 data: {
//                     companionId: companion.id,
//                     planId: planTypeId,
//                     isExtra: false,
//                     startDate: new Date(),
//                     endDate: null,
//                 },
//             });

//             totalPointsToAdd += planType.points || 0;

//             await logActivity(companion.id, "Assinatura de Plano", `Acompanhante assinou o plano ${planType.name}.`);
//         }

//         // Atualiza os campos `planId` e `planTypeId` da acompanhante
//         await prisma.companion.update({
//             where: { id: companion.id },
//             data: {
//                 planId: planTypeId,
//                 planTypeId: planTypeId,
//             },
//         });

//         // Lógica para processar os planos extras
//         const extraPlanResults = [];
//         if (extras && extras.length > 0) {
//             // Busca os planos extras já assinados antes
//             const existingExtras = await prisma.planSubscription.findMany({
//                 where: {
//                     companionId: companion.id,
//                     isExtra: true,
//                     extraPlanId: { in: extras },
//                 },
//                 select: { id: true, extraPlanId: true, endDate: true },
//             });

//             // Filtra os planos extras que precisam ser reativados
//             const toReactivate = existingExtras.filter(plan => plan.endDate !== null);
//             const toReactivateIds = toReactivate.map(plan => plan.id);

//             // Identifica os novos planos extras que ainda não foram assinados
//             const existingExtraIds = existingExtras.map(plan => plan.extraPlanId);
//             const newExtras = extras.filter(extraId => !existingExtraIds.includes(extraId));

//             // Reativa planos extras já assinados antes
//             if (toReactivateIds.length > 0) {
//                 await prisma.planSubscription.updateMany({
//                     where: { id: { in: toReactivateIds } },
//                     data: {
//                         endDate: null, // Reativa
//                         startDate: new Date(), // Atualiza a data de início
//                         updatedAt: new Date(),
//                     },
//                 });

//                 const reactivatedExtraPlans = await prisma.extraPlan.findMany({
//                     where: { id: { in: toReactivate.map(sub => sub.extraPlanId) } },
//                     select: { name: true, pointsBonus: true },
//                 });

//                 const reactivatedExtraList = reactivatedExtraPlans.map(plan => plan.name).join(", ");

//                 totalPointsToAdd += reactivatedExtraPlans.reduce((total, plan) => total + (plan.pointsBonus || 0), 0);

//                 await logActivity(companion.id, "Reativação de Planos Extras",
//                     `Acompanhante reativou os planos extras: ${reactivatedExtraList}.`);
//             }

//             // Adiciona novos planos extras
//             if (newExtras.length > 0) {
//                 const newExtraSubscriptions = newExtras.map(extraId => ({
//                     companionId: companion.id,
//                     extraPlanId: extraId,
//                     isExtra: true,
//                     startDate: new Date(),
//                     endDate: null,
//                 }));

//                 await prisma.planSubscription.createMany({ data: newExtraSubscriptions });

//                 const newExtraPlans = await prisma.extraPlan.findMany({
//                     where: { id: { in: newExtras } },
//                     select: { name: true, pointsBonus: true },
//                 });

//                 const newExtraList = newExtraPlans.map(plan => plan.name).join(", ");

//                 totalPointsToAdd += newExtraPlans.reduce((total, plan) => total + (plan.pointsBonus || 0), 0);

//                 await logActivity(companion.id, "Assinatura de Planos Extras",
//                     `Acompanhante adicionou os planos extras: ${newExtraList}.`);
//             }
//         }

//         // Atualiza os pontos totais do acompanhante
//         if (totalPointsToAdd > 0) {
//             await prisma.companion.update({
//                 where: { id: companion.id },
//                 data: {
//                     points: { increment: totalPointsToAdd }, // Adiciona os pontos bônus totais
//                 },
//             });
//         }

//         // Criação do pagamento para o plano principal
//         const paymentResult = await createPayment(userId, planTypeId, payment_method_id);
//         console.log(paymentResult);

//         if (!paymentResult || paymentResult.status !== 'approved') {
//             return res.status(200).json({
//                 ticketUrl: paymentResult.ticket_url,
//                 transactionId: paymentResult.transactionId,
//                 qr_code: paymentResult.qr_code,
//             });
//         }

//         return res.status(201).json({
//             message: previousPlan ? "Plano reativado com sucesso." : "Plano principal criado com sucesso.",
//             userPlan,
//             addedExtras: extras || [],
//             ticketUrl: paymentResult.ticket_url,
//             paymentId: paymentResult.paymentId,
//             qr_code: paymentResult.qr_code,
//         });

//     } catch (error) {
//         console.error('Erro ao criar plano:', error);
//         return res.status(500).json({ error: 'Erro ao criar plano.' });
//     }
// };


exports.createUserPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planTypeId, extras = [], payment_method_id = null, cardToken = null } = req.body;

        console.log('TOKEN DO CARTÂO:', cardToken);

        // Verifica se o tipo de plano existe
        const planType = await prisma.planType.findUnique({
            where: { id: planTypeId },
        });

        if (!planType) {
            return res.status(404).json({ error: 'Tipo de plano não encontrado.' });
        }

        // Busca a acompanhante vinculada ao usuário
        const companion = await prisma.companion.findUnique({
            where: { userId },
            select: { id: true, planTypeId: true },
        });

        if (!companion) {
            return res.status(403).json({ error: 'Apenas acompanhantes podem criar planos.' });
        }

        // Verifica se a acompanhante já tem um plano principal (planId) ativo
        if (companion.planTypeId) {
            return res.status(200).json({ message: 'Acompanhante já possui um plano ativo.' });
        }


        // Verifica se a acompanhante já tem o plano principal (planId) assinado
        const existingPlanSubscription = await prisma.planSubscription.findFirst({
            where: {
                companionId: companion.id,
                planId: planTypeId,
                endDate: null, // Verifica se o plano está ativo
            },
        });

        if (existingPlanSubscription) {
            return res.status(200).json({
                message: 'Acompanhante já tem o plano principal assinado.',
            });
        }

        // Verifica se a acompanhante já tem os planos extras (extraPlanId) assinados
        const existingExtraSubscriptions = await prisma.planSubscription.findMany({
            where: {
                companionId: companion.id,
                isExtra: true,
                extraPlanId: { in: extras }, // Verifica os planos extras
                endDate: null, // Verifica se os planos extras estão ativos
            },
            select: { id: true, extraPlanId: true },
        });

        if (existingExtraSubscriptions.length > 0) {
            const extraPlanNames = await prisma.extraPlan.findMany({
                where: {
                    id: { in: existingExtraSubscriptions.map(plan => plan.extraPlanId) },
                },
                select: { name: true }
            });

            return res.status(400).json({
                error: `Acompanhante já possui os seguintes planos extras ativos: ${extraPlanNames.map(plan => plan.name).join(', ')}`,
            });
        }

        // Verifica se já existe um pagamento pendente para o plano principal
        const pendingPayments = await prisma.payment.findMany({
            where: {
                userId,
                status: 'pending',
                OR: [
                    { planId: planTypeId },  // Pagamento pendente para o plano principal
                    { extraPlanId: { in: extras } },  // Pagamento pendente para os planos extras
                ],
            },
        });

        if (pendingPayments.length > 0) {
            // Deleta todos os pagamentos pendentes encontrados
            for (const pendingPayment of pendingPayments) {
                await prisma.payment.delete({
                    where: { id: pendingPayment.id },
                });
                console.log(`Pagamento pendente de ID ${pendingPayment.id} excluído.`);
            }
        }

        // Busca o plano principal
        const plan = await prisma.plan.findUnique({
            where: { id: planTypeId },
        });

        if (!plan) {
            return res.status(404).json({ error: 'Plano principal não encontrado.' });
        }

        // Verifica os planos extras na tabela Plan (não extraPlan)
        const extraPlans = extras && extras.length > 0 ? await prisma.plan.findMany({
            where: {
                id: { in: extras }
            }
        }) : [];

        // Calcula o valor total (plano principal + extras)
        let totalAmount = plan.price; // Preço do plano principal
        let description = plan.name; // Nome do plano principal

        if (extraPlans.length > 0) {
            const extraTotalAmount = extraPlans.reduce((total, extra) => total + extra.price, 0);
            totalAmount += extraTotalAmount; // Soma o preço dos planos extras
            description += ` | Extras: ${extraPlans.map(extra => extra.name).join(', ')}`;
        }
        totalAmount = parseFloat(totalAmount.toFixed(2));

        // Criação do pagamento para o plano principal e extras
        const paymentResult = cardToken
            ? await createPayment(userId, planTypeId, payment_method_id, extras, totalAmount, cardToken)
            : await createPayment(userId, planTypeId, payment_method_id, extras, totalAmount);

        console.log("RESULTADO DO PAGAMENTO:", paymentResult);

        // Se o pagamento não for aprovado, não criamos os planos
        if (!paymentResult || paymentResult.status !== 'approved') {
            // Se o método de pagamento for PIX, retornamos todos os detalhes (ticket_url, qr_code, etc.)
            if (payment_method_id === 'pix') {
                return res.status(200).json({
                    message: 'Pagamento não aprovado.',
                    transactionId: paymentResult.transactionId,  // ID da transação
                    qr_code: paymentResult.qr_code,  // QR code do pagamento via PIX
                    qr_code_base64: paymentResult.qr_code_base64,  // QR code base64 para gerar 
                });
            }

            // Se for cartão de crédito, apenas o transactionId é retornado
            return res.status(200).json({
                message: 'Pagamento feito por cartão de crédito.',
                transactionId: paymentResult.transactionId,
            });
        }

        // Agora que o pagamento foi aprovado, criamos os planos (principal e extras)
        let userPlan;
        let totalPointsToAdd = 0;
        let extraPlanResults = [];

        // Verifica se a acompanhante já assinou esse plano básico antes
        const previousPlan = await prisma.planSubscription.findFirst({
            where: {
                companionId: companion.id,
                planId: planTypeId,
            },
        });

        // Criação da assinatura para o plano principal
        if (previousPlan) {
            // Se já assinou antes, apenas reativa o plano básico
            userPlan = await prisma.planSubscription.update({
                where: { id: previousPlan.id },
                data: {
                    startDate: new Date(),
                    endDate: null,
                    updatedAt: new Date(),
                },
            });

            totalPointsToAdd += planType.points || 0;
            await logActivity(companion.id, "Reativação de Plano", `Acompanhante reativou o plano ${planType.name}.`);
        } else {
            // Cria a assinatura do plano básico se nunca foi assinado antes
            userPlan = await prisma.planSubscription.create({
                data: {
                    companionId: companion.id,
                    planId: planTypeId,
                    isExtra: false,
                    startDate: new Date(),
                    endDate: null,
                },
            });

            totalPointsToAdd += planType.points || 0;
            await logActivity(companion.id, "Assinatura de Plano", `Acompanhante assinou o plano ${planType.name}.`);
        }

        // Atualiza os campos `planId` e `planTypeId` da acompanhante
        await prisma.companion.update({
            where: { id: companion.id },
            data: {
                planId: planTypeId,
                planTypeId: planTypeId,
            },
        });

        // Lógica para processar os planos extras
        if (extras && extras.length > 0) {
            const existingExtras = await prisma.planSubscription.findMany({
                where: {
                    companionId: companion.id,
                    isExtra: true,
                    extraPlanId: { in: extras },
                },
                select: { id: true, extraPlanId: true, endDate: true },
            });

            const toReactivate = existingExtras.filter(plan => plan.endDate !== null);
            const toReactivateIds = toReactivate.map(plan => plan.id);
            const existingExtraIds = existingExtras.map(plan => plan.extraPlanId);
            const newExtras = extras.filter(extraId => !existingExtraIds.includes(extraId));

            // Reativa planos extras já assinados antes
            if (toReactivateIds.length > 0) {
                await prisma.planSubscription.updateMany({
                    where: { id: { in: toReactivateIds } },
                    data: {
                        endDate: null,
                        startDate: new Date(),
                        updatedAt: new Date(),
                    },
                });

                totalPointsToAdd += toReactivate.reduce((total, plan) => total + (plan.pointsBonus || 0), 0);
                extraPlanResults.push('Reativação de planos extras: ' + toReactivate.map(p => p.extraPlanId).join(', '));
            }

            // Adiciona novos planos extras
            if (newExtras.length > 0) {
                const newExtraSubscriptions = newExtras.map(extraId => ({
                    companionId: companion.id,
                    extraPlanId: extraId,
                    isExtra: true,
                    startDate: new Date(),
                    endDate: null,
                }));

                await prisma.planSubscription.createMany({ data: newExtraSubscriptions });
                totalPointsToAdd += newExtras.reduce((total, extra) => total + (extra.pointsBonus || 0), 0);
                extraPlanResults.push('Novos planos extras: ' + newExtras.join(', '));
            }
        }

        // Atualiza os pontos totais do acompanhante
        if (totalPointsToAdd > 0) {
            await prisma.companion.update({
                where: { id: companion.id },
                data: {
                    points: { increment: totalPointsToAdd },
                },
            });
        }

        // Retornar sucesso com os detalhes do pagamento e planos
        return res.status(201).json({
            message: previousPlan ? "Plano reativado com sucesso." : "Plano principal criado com sucesso.",
            userPlan,
            addedExtras: extraPlanResults,
            ticketUrl: paymentResult.ticket_url,
            paymentId: paymentResult.paymentId,
            qr_code: paymentResult.qr_code,
            qr_code_base64: paymentResult.qr_code_base64,
        });

    } catch (error) {
        console.error('Erro ao criar plano:', error);
        return res.status(500).json({ error: 'Erro ao criar plano.' });
    }
};

// adicionar planos extras, se ja tem plano basico
exports.addUserExtras = async (req, res) => {
    try {
        const userId = req.user.id;
        const { extras, payment_method_id, cardToken = null, issuer_id, installments, email, identificationNumber, identificationType } = req.body;

        const companion = await prisma.companion.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!companion) return res.status(403).json({ error: 'Apenas acompanhantes podem adicionar planos extras.' });

        // Ajuste para buscar os planos extras
        const plan = await prisma.plan.findMany({
            where: {
                id: { in: extras },  // Verifica se o plano extra está presente no array extras
            },
            select: {
                id: true,
                name: true,
                price: true,
            }
        });

        // Verifique se algum plano extra foi encontrado
        if (plan.length === 0) {
            return res.status(400).json({ error: 'Nenhum plano extra válido encontrado.' });
        }

        // Busca os planos extras que já estão ativos
        const existingExtraPlans = await prisma.planSubscription.findMany({
            where: {
                companionId: companion.id,
                isExtra: true,
                extraPlanId: { in: extras },
                endDate: null, // Apenas planos extras ativos
            },
            select: {
                id: true,
                extraPlanId: true,
                endDate: true,
            },
        });

        // Se já assinou antes, filtra os que precisam ser reativados
        const toReactivate = existingExtraPlans.filter(plan => plan.endDate !== null);

        if (existingExtraPlans.length > 0) {
            // Busca os nomes dos planos extras reativados
            const extraPlanNames = await prisma.extraPlan.findMany({
                where: {
                    id: { in: existingExtraPlans.map(plan => plan.extraPlanId) },
                },
                select: { name: true }
            });

            return res.status(400).json({
                error: `Acompanhante já possui os seguintes planos extras ativos: ${extraPlanNames.map(plan => plan.name).join(', ')}`,
            });
        }

        const toReactivateIds = toReactivate.map(plan => plan.id);

        // Filtra os novos planos extras que ainda não foram assinados
        const alreadySubscribedIds = existingExtraPlans.map(plan => plan.extraPlanId);
        const newSubscriptions = extras.filter(extraId => !alreadySubscribedIds.includes(extraId));

        // Verifica se todos os planos extras existem
        const extraPlans = await prisma.extraPlan.findMany({
            where: { id: { in: extras } },
            select: { id: true, name: true, pointsBonus: true },
        });

        // Verifica se há planos inválidos
        const validExtraPlanIds = extraPlans.map(plan => plan.id);
        const invalidPlans = extras.filter(extraId => !validExtraPlanIds.includes(extraId));

        if (invalidPlans.length > 0) {
            return res.status(400).json({
                error: `Os seguintes planos extras não são válidos: ${invalidPlans.join(', ')}`,
            });
        }

        // Verifica se já existe um pagamento pendente para o plano principal
        const pendingPayments = await prisma.payment.findMany({
            where: {
                userId,
                status: 'pending',
                extraPlanId: { in: extras },
            },
        });

        if (pendingPayments.length > 0) {
            // Deleta todos os pagamentos pendentes encontrados
            for (const pendingPayment of pendingPayments) {
                await prisma.payment.delete({
                    where: { id: pendingPayment.id },
                });
            }
        }

        // Verifica os planos extras na tabela Plan (não extraPlan)
        const extraPlansVerify = extras && extras.length > 0 ? await prisma.plan.findMany({
            where: {
                id: { in: extras }
            }
        }) : [];

        // Calcula o valor total (plano principal + extras)
        let totalAmount = 0;
        let description = '';

        if (extraPlansVerify.length > 0) {
            const extraTotalAmount = extraPlansVerify.reduce((total, extra) => total + extra.price, 0).toFixed(2);
            totalAmount += parseFloat(extraTotalAmount);; // Soma o preço dos planos extras
            description += `Extras: ${extraPlansVerify.map(extra => extra.name).join(', ')}`;
        }

        // Criação do pagamento para o plano principal e extras
        const paymentResult = cardToken
            ? await createPayment(userId, null, payment_method_id, extras, totalAmount, cardToken, issuer_id, installments, email, identificationNumber, identificationType)
            : await createPayment(userId, null, payment_method_id, extras, totalAmount);

        console.log("RESULTADO DO PAGAMENTO:", paymentResult);

        // Se o pagamento não for aprovado, não criamos os planos
        if (!paymentResult || paymentResult.status !== 'approved') {
            if (payment_method_id === 'pix') {
                return res.status(200).json({
                    message: 'Pagamento não aprovado.',
                    transactionId: paymentResult.transactionId,
                    qr_code: paymentResult.qr_code,  // QR code do pagamento via PIX
                    qr_code_base64: paymentResult.qr_code_base64,  // QR code base64 para gerar 
                });
            }

            // Se for cartão de crédito, apenas o transactionId é retornado
            return res.status(200).json({
                message: 'Pagamento feito por cartão de crédito.',
                transactionId: paymentResult.transactionId,
            });
        }

        let totalPointsToAdd = 0;

        // Reativa planos extras já assinados antes
        if (toReactivateIds.length > 0) {
            await prisma.planSubscription.updateMany({
                where: { id: { in: toReactivateIds } },
                data: {
                    endDate: null, // Reativa
                    startDate: new Date(), // Atualiza a data de início
                    updatedAt: new Date(),
                },
            });

            const reactivatedPlanNames = extraPlans
                .filter(plan => toReactivate.some(sub => sub.extraPlanId === plan.id))
                .map(plan => plan.name)
                .join(', ');

            // Soma os pontos bônus dos planos reativados
            totalPointsToAdd += extraPlans
                .filter(plan => toReactivate.some(sub => sub.extraPlanId === plan.id))
                .reduce((total, plan) => total + (plan.pointsBonus || 0), 0);

            await logActivity(companion.id, "Reativação de Planos Extras",
                `Acompanhante reativou os planos extras: ${reactivatedPlanNames}.`);
        }

        // Adiciona novos planos extras na tabela `PlanSubscription`
        if (newSubscriptions.length > 0) {
            const newExtraSubscriptions = newSubscriptions.map(extraId => ({
                companionId: companion.id,
                extraPlanId: extraId,
                isExtra: true,
                startDate: new Date(),
                endDate: null,
            }));

            await prisma.planSubscription.createMany({ data: newExtraSubscriptions });

            const newPlanNames = extraPlans
                .filter(plan => newSubscriptions.includes(plan.id))
                .map(plan => plan.name)
                .join(', ');

            // Adiciona os pontos bônus dos novos planos extras
            totalPointsToAdd += extraPlans
                .filter(plan => newSubscriptions.includes(plan.id))
                .reduce((total, plan) => total + (plan.pointsBonus || 0), 0);

            await logActivity(companion.id, "Assinatura de Planos Extras",
                `Acompanhante adicionou os planos extras: ${newPlanNames}.`);
        }

        // Atualiza os pontos do acompanhante, somando os pontos totais
        if (totalPointsToAdd > 0) {
            await prisma.companion.update({
                where: { id: companion.id },
                data: {
                    points: { increment: totalPointsToAdd }, // Adiciona os pontos bônus
                },
            });
        }

        return res.status(200).json({
            message: 'Planos extras adicionados/reativados com sucesso.',
            reactivatedPlans: toReactivateIds.length > 0 ? toReactivateIds : null,
            newPlans: newSubscriptions.length > 0 ? newSubscriptions : null,
        });

    } catch (error) {
        console.error('Erro ao adicionar planos extras:', error.message);
        return res.status(500).json({ error: 'Erro ao adicionar planos extras.' });
    }
};

// desativar planos extras
exports.disableExtraPlans = async (req, res) => {
    const userId = req.user?.id;
    const { extraPlanIds } = req.body;
    console.log(extraPlanIds);

    if (!extraPlanIds || !Array.isArray(extraPlanIds) || extraPlanIds.length === 0) {
        return res.status(400).json({ error: 'É necessário informar pelo menos um plano extra para desativar.' });
    }

    try {
        // Busca a acompanhante vinculada ao usuário
        const companion = await prisma.companion.findUnique({
            where: { userId },
        });

        if (!companion) return res.status(403).json({ error: 'Apenas acompanhantes podem desativar planos extras.' });

        // Verifica se a acompanhante realmente possui esses planos extras ativos
        const activeExtraPlans = await prisma.planSubscription.findMany({
            where: {
                companionId: companion.id,
                endDate: null,
                isExtra: true,
                extraPlanId: { in: extraPlanIds.map(Number) },
            },
            select: { id: true, extraPlanId: true },
        });
        console.log(activeExtraPlans);

        if (activeExtraPlans.length === 0) {
            return res.status(404).json({ error: 'Nenhum dos planos extras informados está ativo ou pertence a você.' });
        }

        // Busca os detalhes dos planos extras desativados
        const extraPlansDetails = await prisma.extraPlan.findMany({
            where: {
                id: { in: activeExtraPlans.map(plan => plan.extraPlanId) },
            },
            select: {
                id: true,
                name: true,
                pointsBonus: true,
            },
        });

        const planNames = extraPlansDetails.map(plan => plan.name).join(', ');
        const pointsToRemove = extraPlansDetails.reduce((total, plan) => total + (plan.pointsBonus || 0), 0);

        // Desativar os planos extras escolhidos (definir `endDate`)
        await prisma.planSubscription.updateMany({
            where: {
                id: { in: activeExtraPlans.map(plan => plan.id) },
            },
            data: { endDate: new Date() },
        });

        // Atualiza os pontos do acompanhante, removendo os pontos dos planos extras desativados
        await prisma.companion.update({
            where: { id: companion.id },
            data: {
                points: {
                    decrement: pointsToRemove, // Subtrai os pontos correspondentes
                },
            },
        });

        // Loga a atividade com os nomes dos planos extras desativados
        await logActivity(companion.id, "Assinatura de Plano", `Acompanhante desativou os planos extras: ${planNames}.`);

        return res.status(200).json({
            message: 'Planos extras desativados com sucesso.',
            disabledPlans: extraPlansDetails,
        });

    } catch (error) {
        console.error('Erro ao desativar planos extras:', error.message);
        return res.status(500).json({ error: 'Erro ao processar a desativação dos planos extras.' });
    }
};

// desativar assinatura
exports.disablePlan = async (req, res) => {
    const userId = req.user?.id;

    // Busca a acompanhante pelo userId
    const companion = await prisma.companion.findUnique({
        where: { userId },
    });

    if (!companion) return res.status(403).json({ error: 'Apenas acompanhantes.' });

    try {
        // Verifica se a assinatura existe e pertence ao usuário autenticado
        const subscription = await prisma.planSubscription.findFirst({
            where: {
                companionId: companion.id,
                isExtra: false,
                endDate: null,
                planId: { not: null }, // Verifica se o plano não é nulo
            },
        });
        console.log(subscription);

        if (!subscription) return res.status(404).json({ error: 'Assinatura não encontrada ou já finalizada.' });

        // Valida manualmente o estado ativo
        if (subscription.endDate !== null) return res.status(400).json({ error: "Assinatura já finalizada." });

        // Recupera os pontos do PlanType associado ao plano
        const plan = await prisma.plan.findUnique({
            where: { id: subscription.planId },
            include: { planType: true }, // Inclui o PlanType para acessar os pontos
        });
        console.log(plan);

        // Verifica se o Plan e o PlanType existem
        if (!plan || !plan.planType) {
            return res.status(404).json({ error: 'Plano ou PlanType não encontrado.' });
        }

        // Finaliza a assinatura principal
        const updatedSubscription = await prisma.planSubscription.update({
            where: { id: subscription.id },
            data: { endDate: new Date() },
        });

        // Finaliza todas as assinaturas extras ativas, caso existam
        await prisma.planSubscription.updateMany({
            where: {
                companionId: companion.id,
                endDate: null,
                isExtra: true,
            },
            data: { endDate: new Date() },
        });

        // Atualiza os pontos da acompanhante, removendo os pontos do plano desativado
        await prisma.companion.update({
            where: { id: companion.id },
            data: {
                points: {
                    decrement: 0, // Subtrai os pontos do PlanType
                },
                planId: null,  // Remove o plano da acompanhante
                planTypeId: null,  // Remove o tipo de plano da acompanhante
            },
        });

        await logActivity(companion.id, "Assinatura de Plano", `Acompanhante finalizou o plano.`);

        return res.status(200).json({
            message: 'Assinatura finalizada com sucesso.',
            updatedSubscription
        });
    } catch (error) {
        console.error('Erro ao finalizar plano:', error.message);
        return res.status(500).json({ error: 'Erro ao processar a finalização do plano.' });
    }
};
