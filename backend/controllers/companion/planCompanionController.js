const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// listar planos
exports.listPlans = async (req, res) => {
    try {
        const plans = await prisma.plan.findMany();
        return res.status(200).json(plans);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao listar planos' });
    }
}

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

        // Cria uma nova assinatura
        const subscription = await prisma.planSubscription.create({
            data: {
                companionId: companion.id,
                planId: plan.id,
                startDate: new Date(),
                endDate: null,
            },
            include: {
                plan: true,
            },
        });

        await prisma.companion.update({
            where: { userId },
            data: {
                planId: plan.id,
                planTypeId: plan.planTypeId || null,
            },
        });

        return res.status(201).json({ message: 'Plano assinado com sucesso.', subscription });
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
        if (!planType) return res.status(404).json({ error: 'Tipo de plano não encontrado.' });


        // Busca a acompanhante vinculada ao usuário
        const companion = await prisma.companion.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!companion) return res.status(403).json({ error: 'Apenas acompanhantes podem criar planos.' });


        // Verifica se o usuário já possui um plano básico
        const existingPlan = await prisma.planSubscription.findFirst({
            where: {
                companionId: companion.id,
                isExtra: false,
                endDate: null,
            },
        });
        if (existingPlan) {
            return res.status(400).json({ error: 'Você já possui um plano básico.' });
        }

        // Cria a assinatura do plano principal
        const userPlan = await prisma.planSubscription.create({
            data: {
                companionId: companion.id,
                planId: planTypeId, // ID do plano principal
                isExtra: false, // Define como plano principal
                startDate: new Date(),
                endDate: null, // Assinatura ativa
            },
        });

        // Atualiza os campos planId e planTypeId da acompanhante
        await prisma.companion.update({
            where: { id: companion.id },
            data: {
                planId: planTypeId,
                planTypeId: planTypeId, // Se precisar armazenar o tipo de plano
            },
        });

        // Adiciona os planos extras na `PlanSubscription`
        if (extras && extras.length > 0) {
            // Busca os planos extras já ativos
            const existingExtras = await prisma.planSubscription.findMany({
                where: {
                    companionId: companion.id,
                    isExtra: true,
                    endDate: null,
                    extraPlanId: { in: extras },
                },
                select: { extraPlanId: true },
            });

            // Filtra apenas os novos planos extras que ainda não foram assinados
            const existingExtraIds = existingExtras.map(plan => plan.extraPlanId);
            const newExtras = extras.filter(extraId => !existingExtraIds.includes(extraId));

            if (newExtras.length > 0) {
                const extraSubscriptions = newExtras.map(extraId => ({
                    companionId: companion.id,
                    extraPlanId: extraId,
                    isExtra: true,
                    startDate: new Date(),
                    endDate: null,
                }));

                await prisma.planSubscription.createMany({ data: extraSubscriptions });
            }

            return res.status(201).json({
                message: 'Plano principal e extras criados com sucesso.',
                userPlan,
                addedExtras: newExtras || []
            });
        }

        return res.status(201).json({
            message: 'Plano principal criado com sucesso.',
            userPlan,
            addedExtras: []
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

        const existingExtraPlans = await prisma.planSubscription.findMany({
            where: {
                companionId: companion.id,
                isExtra: true,
                endDate: null, // Apenas planos ativos
                extraPlanId: { in: extras }, // Verifica se já existe uma assinatura ativa para esses IDs
            },
            select: { extraPlanId: true },
        });

        // Extrai os IDs dos planos extras já assinados
        const alreadySubscribedIds = existingExtraPlans.map(plan => plan.extraPlanId);

        // Filtra os planos que ainda não foram assinados
        const newSubscriptions = extras.filter(extraId => !alreadySubscribedIds.includes(extraId));

        if (newSubscriptions.length === 0) {
            return res.status(400).json({ error: 'Plano extra já assinado.' });
        }


        // Adiciona os planos extras na tabela `PlanSubscription`
        // Adiciona os novos planos extras na tabela `PlanSubscription`
        const subscriptions = newSubscriptions.map((extraId) => ({
            companionId: companion.id,
            extraPlanId: extraId,
            isExtra: true,
            startDate: new Date(),
            endDate: null,
        }));

        await prisma.planSubscription.createMany({ data: subscriptions });

        return res.status(200).json({
            message: 'Planos extras adicionados com sucesso.',
            addePlans: newSubscriptions
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

    console.log("🔍 Planos extras a desativar:", extraPlanIds);

    if (!extraPlanIds || !Array.isArray(extraPlanIds) || extraPlanIds.length === 0) return res.status(400).json({ error: 'É necessário informar pelo menos um plano extra para desativar.' });

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
            select: { id: true, planId: true, isExtra: true, endDate: true },
        });

        console.log("🔍 Planos extras ativos encontrados:", activeExtraPlans);

        if (activeExtraPlans.length === 0) return res.status(404).json({ error: 'Nenhum dos planos extras informados está ativo ou pertence a você.' });

        // Desativar os planos extras escolhidos (definir `endDate`)
        await prisma.planSubscription.updateMany({
            where: {
                id: { in: activeExtraPlans.map(plan => plan.id) },
            },
            data: { endDate: new Date() },
        });

        return res.status(200).json({
            message: 'Planos extras desativados com sucesso.',
            disabledPlans: activeExtraPlans.map(plan => plan.id),
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

        return res.status(200).json({
            message: 'Assinatura finalizada com sucesso.',
            updatedSubscription
        });
    } catch (error) {
        console.error('Erro ao finalizar plano:', error.message);
        return res.status(500).json({ error: 'Erro ao processar a finalização do plano.' });
    }
};


// FUNÇÕES DE CRUD PARA ADMINISTRADORES

// exports.updatePlan = async (req, res) => {
//     const planId = parseInt(req.query.planId);
//     const { name, price, description, isDarkMode } = req.body;

//     if (!planId || isNaN(planId)) {
//         return res.status(400).json({ error: 'O ID do plano é obrigatório.' });
//     }

//     try {
//         const updatedPlan = await prisma.plan.update({
//             where: { id: parseInt(planId) },
//             data: {
//                 name,
//                 price: price ? parseFloat(price) : undefined,
//                 description,
//                 isDarkMode: isDarkMode !== undefined ? isDarkMode : undefined,
//             },
//         });

//         return res.status(200).json({ message: 'Plano atualizado com sucesso.', plan: updatedPlan });
//     } catch (error) {
//         console.error('Erro ao atualizar plano:', error.message);
//         return res.status(500).json({ error: 'Erro ao processar a atualização do plano.' });
//     }
// };

// exports.deletePlan = async (req, res) => {
//     const { planId } = req.query;

//     if (!planId || isNaN(planId)) {
//         return res.status(400).json({ error: 'O ID do plano é obrigatório.' });
//     }

//     try {
//         await prisma.plan.delete({
//             where: { id: parseInt(planId) },
//         });

//         return res.status(200).json({ message: 'Plano deletado com sucesso.' });
//     } catch (error) {
//         console.error('Erro ao deletar plano:', error.message);
//         return res.status(500).json({ error: 'Erro ao processar a exclusão do plano.' });
//     }
// };