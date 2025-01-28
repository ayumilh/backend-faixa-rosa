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
    const userId = req.user.id;

    try {
        const userPlans = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                plan: {
                    include: {
                        planType: true, // Inclui as informações do PlanType
                    },
                },
                extraPlans: true, // Inclui os planos extras
            },
        });

        if (!userPlans) {
            return res.status(404).json({ error: 'Usuário não encontrado ou sem planos.' });
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
    const userId = req.user?.id; // ID do usuário autenticado (recuperado do middleware)

    if (!planId || isNaN(planId)) {
        return res.status(400).json({ error: 'O ID do plano é obrigatório.' });
    }
    try {
        // Verifica se o usuário é um acompanhante
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.userType !== 'ACOMPANHANTE') {
            return res.status(403).json({ error: 'Apenas acompanhantes podem assinar planos.' });
        }

        // Verifica se o plano existe
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            return res.status(404).json({ error: 'Plano não encontrado.' });
        }

        // Verifica se o acompanhante já possui uma assinatura ativa
        const existingSubscription = await prisma.planSubscription.findFirst({
            where: {
                userId: userId,
                endDate: null, // Assinatura ativa
            },
        });

        if (existingSubscription) {
            return res.status(400).json({ error: 'Você já possui uma assinatura ativa.' });
        }

        // Cria uma nova assinatura
        const subscription = await prisma.planSubscription.create({
            data: {
                userId,
                planId,
                startDate: new Date(),
                endDate: null, // Pode ser definido no futuro
            },
            include: {
                plan: true, // Inclui detalhes do plano na resposta
            },
        });

        // Atualiza o campo `planId` no usuário
        await prisma.user.update({
            where: { id: userId },
            data: {
                planId: planId,
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
    const userId = req.user.id;
    const { planTypeId, extras } = req.body;

    try {
        // Verifica se o tipo de plano existe
        const planType = await prisma.planType.findUnique({
            where: { id: planTypeId },
        });
        if (!planType) return res.status(404).json({ error: 'Tipo de plano não encontrado.' });

        // Verifica se o usuário já possui um plano básico
        const existingPlan = await prisma.plan.findFirst({
            where: { id: userId },
        });
        if (existingPlan) {
            return res.status(400).json({ error: 'Você já possui um plano básico.' });
        }

        // Cria o plano básico
        const userPlan = await prisma.plan.create({
            data: {
                userId,
                planTypeId,
                price: planType.cityChangeFee, // Exemplo de preço relacionado ao plano
                startDate: new Date(),
            },
        });

        // Adiciona os planos extras
        if (extras && extras.length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    extraPlans: {
                        connect: extras.map((extraId) => ({ id: extraId })),
                    },
                },
            });
        }

        return res.status(201).json({ message: 'Plano criado com sucesso.', userPlan });
    } catch (error) {
        console.error('Erro ao criar plano:', error);
        return res.status(500).json({ error: 'Erro ao criar plano.' });
    }
};

// adicionar planos extras, se ja tem plano basico
exports.addUserExtras = async (req, res) => {
    const userId = req.user.id;
    const { extras } = req.body;

    try {
        // Verifica se o usuário possui um plano básico
        const existingPlan = await prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true },
        });
        if (existingPlan && existingPlan.plan) {
            return res.status(400).json({ error: 'Você já possui um plano básico.' });
        }

        // Adiciona os planos extras ao usuário
        if (extras && extras.length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    extraPlans: {
                        connect: extras.map((extraId) => ({ id: extraId })),
                    },
                },
            });
        }

        return res.status(200).json({ message: 'Planos extras adicionados com sucesso.' });
    } catch (error) {
        console.error('Erro ao adicionar planos extras:', error);
        return res.status(500).json({ error: 'Erro ao adicionar planos extras.' });
    }
};

// finalizar assinatura
exports.finalizePlan = async (req, res) => {
    const subscriptionId = parseInt(req.query.subscriptionId);
    const userId = req.user?.id; // ID do usuário autenticado

    console.log('ID da assinatura:', subscriptionId);

    // Valida o ID da assinatura
    if (!subscriptionId || isNaN(subscriptionId)) {
        return res.status(400).json({ error: 'O ID da assinatura é obrigatório.' });
    }

    try {
        // Verifica se a assinatura existe e pertence ao usuário autenticado
        const subscription = await prisma.planSubscription.findFirst({
            where: {
                id: subscriptionId,
                userId: userId,
                endDate: null, // Somente assinaturas ativas
            },
        });

        if (!subscription) {
            console.error('Assinatura não encontrada ou já finalizada:', { subscriptionId, userId });
            return res.status(404).json({ error: 'Assinatura não encontrada ou já finalizada.' });
        }

        // Atualiza a assinatura para definir a data de término
        const updatedSubscription = await prisma.planSubscription.update({
            where: { id: parseInt(subscriptionId) },
            data: { endDate: new Date() },
        });

        return res.status(200).json({ message: 'Assinatura finalizada com sucesso.', updatedSubscription });
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