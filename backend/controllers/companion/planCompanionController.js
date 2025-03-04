const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require("../../utils/activityService");

// listar planos
exports.listPlans = async (req, res) => {
    try {
        // Busca os planos e suas funcionalidades (relacionadas com planType)
        const plans = await prisma.plan.findMany({
            include: {
                planType: true,  // Incluir as funcionalidades da tabela planType
                extraPlans: true, // Incluir os planos extras
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
    const planId = parseInt(req.query.planId);
    const userId = req.user?.id;

    if (!planId || isNaN(planId)) {
        return res.status(400).json({ error: 'O ID do plano é obrigatório.' });
    }

    try {
        // Busca a acompanhante pelo userId
        const companion = await prisma.companion.findUnique({
            where: { userId },
        });

        if (!companion) {
            return res.status(403).json({ error: 'Apenas acompanhantes podem assinar planos.' });
        }

        // Verifica se o plano existe
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
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
                },
            });

            await logActivity(companion.id, "Reativação de Plano",
                `Acompanhante reativou o plano ${plan.name}.`);

            return res.status(200).json({
                message: 'Plano reativado com sucesso.',
                subscription: updatedSubscription
            });
        }

        // Verifica se a acompanhante já possui uma assinatura ativa
        const existingSubscription = await prisma.planSubscription.findFirst({
            where: {
                companionId: companion.id,
                endDate: null,
            },
        });

        if (existingSubscription) {
            return res.status(400).json({ error: 'Você já possui uma assinatura ativa.' });
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
            },
        });

        await logActivity(companion.id, "Assinatura de Plano",
            `Acompanhante assinou o plano ${plan.name}.`);

        return res.status(201).json({
            message: 'Plano assinado com sucesso.',
            subscription: newSubscription
        });
    } catch (error) {
        console.error('Erro ao assinar plano:', error);
        return res.status(500).json({ error: 'Erro ao processar a assinatura.' });
    }
};

// criar plano e adicionar extras, durante o processo de criar plano
exports.createUserPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planTypeId, extras } = req.body;

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
            select: { id: true },
        });

        if (!companion) {
            return res.status(403).json({ error: 'Apenas acompanhantes podem criar planos.' });
        }

        // Verifica se a acompanhante já assinou esse plano básico antes
        const previousPlan = await prisma.planSubscription.findFirst({
            where: {
                companionId: companion.id,
                planId: planTypeId,
            },
        });

        let userPlan;

        if (previousPlan) {
            // Se já assinou antes, apenas reativa o plano básico
            userPlan = await prisma.planSubscription.update({
                where: { id: previousPlan.id },
                data: {
                    startDate: new Date(),
                    endDate: null, // Reativa
                    updatedAt: new Date(),
                },
            });

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
            // Busca os planos extras já assinados antes
            const existingExtras = await prisma.planSubscription.findMany({
                where: {
                    companionId: companion.id,
                    isExtra: true,
                    extraPlanId: { in: extras },
                },
                select: { id: true, extraPlanId: true, endDate: true },
            });

            // Filtra os planos extras que precisam ser reativados
            const toReactivate = existingExtras.filter(plan => plan.endDate !== null);
            const toReactivateIds = toReactivate.map(plan => plan.id);

            // Identifica os novos planos extras que ainda não foram assinados
            const existingExtraIds = existingExtras.map(plan => plan.extraPlanId);
            const newExtras = extras.filter(extraId => !existingExtraIds.includes(extraId));

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

                const reactivatedExtraPlans = await prisma.extraPlan.findMany({
                    where: { id: { in: toReactivate.map(sub => sub.extraPlanId) } },
                    select: { name: true },
                });

                const reactivatedExtraList = reactivatedExtraPlans.map(plan => plan.name).join(", ");

                await logActivity(companion.id, "Reativação de Planos Extras",
                    `Acompanhante reativou os planos extras: ${reactivatedExtraList}.`);
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

                const newExtraPlans = await prisma.extraPlan.findMany({
                    where: { id: { in: newExtras } },
                    select: { name: true },
                });

                const newExtraList = newExtraPlans.map(plan => plan.name).join(", ");

                await logActivity(companion.id, "Assinatura de Planos Extras",
                    `Acompanhante adicionou os planos extras: ${newExtraList}.`);
            }
        }

        return res.status(201).json({
            message: previousPlan ? "Plano reativado com sucesso." : "Plano principal criado com sucesso.",
            userPlan,
            addedExtras: extras || [],
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
        const { extras } = req.body;

        const companion = await prisma.companion.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!companion) return res.status(403).json({ error: 'Apenas acompanhantes podem adicionar planos extras.' });

        // Busca os planos extras que já estão ativos
        const existingExtraPlans = await prisma.planSubscription.findMany({
            where: {
                companionId: companion.id,
                isExtra: true,
                extraPlanId: { in: extras },
            },
            select: {
                id: true,
                extraPlanId: true,
                endDate: true,
            },
        });

        // Se já assinou antes, filtra os que precisam ser reativados
        const toReactivate = existingExtraPlans.filter(plan => plan.endDate !== null);
        const toReactivateIds = toReactivate.map(plan => plan.id);

        // Filtra os novos planos extras que ainda não foram assinados
        const alreadySubscribedIds = existingExtraPlans.map(plan => plan.extraPlanId);
        const newSubscriptions = extras.filter(extraId => !alreadySubscribedIds.includes(extraId));

        // Verifica se todos os planos extras existem
        const extraPlans = await prisma.extraPlan.findMany({
            where: { id: { in: extras } },
            select: { id: true, name: true },
        });

        // Verifica se há planos inválidos
        const validExtraPlanIds = extraPlans.map(plan => plan.id);
        const invalidPlans = extras.filter(extraId => !validExtraPlanIds.includes(extraId));

        if (invalidPlans.length > 0) {
            return res.status(400).json({
                error: `Os seguintes planos extras não são válidos: ${invalidPlans.join(', ')}`,
            });
        }

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

            await logActivity(companion.id, "Assinatura de Planos Extras",
                `Acompanhante adicionou os planos extras: ${newPlanNames}.`);
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
            },
        });

        const planNames = extraPlansDetails.map(plan => plan.name).join(', ');

        // Desativar os planos extras escolhidos (definir `endDate`)
        await prisma.planSubscription.updateMany({
            where: {
                id: { in: activeExtraPlans.map(plan => plan.id) },
            },
            data: { endDate: new Date() },
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
            },
        });

        if (!subscription) return res.status(404).json({ error: 'Assinatura não encontrada ou já finalizada.' });

        // Valida manualmente o estado ativo
        if (subscription.endDate !== null) return res.status(400).json({ error: "Assinatura já finalizada." });

        // Finaliza a assinatura principal
        const updatedSubscription = await prisma.planSubscription.update({
            where: { id: subscription.id },
            data: { endDate: new Date() },
        });

        await prisma.planSubscription.updateMany({
            where: {
                companionId: companion.id,
                endDate: null,
                isExtra: true,
            },
            data: { endDate: new Date() },
        });


        await prisma.companion.update({
            where: { id: companion.id },
            data: {
                planId: null,
                planTypeId: null,
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