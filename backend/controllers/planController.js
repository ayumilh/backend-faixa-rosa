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

// assinar plano
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
            where: { id: parseInt(planId) },
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

        return res.status(201).json({ message: 'Plano assinado com sucesso.', subscription });
    } catch (error) {
        console.error('Erro ao assinar plano:', error);
        return res.status(500).json({ error: 'Erro ao processar a assinatura.' });
    }
};

// finalizar plano
exports.finalizePlan = async (req, res) => {
    const subscriptionId = parseInt(req.query.subscriptionId);
    const userId = req.user?.id; // ID do usuário autenticado

    console.log('ID da assinatura:', subscriptionId);

    // Valida o ID da assinatura
    if (!subscriptionId || isNaN(subscriptionId)) {
        return res.status(400).json({ error: 'O ID da assinatura é obrigatório e deve ser um número válido.' });
    }

    try {
        // Verifica se a assinatura existe e pertence ao usuário autenticado
        const subscription = await prisma.planSubscription.findFirst({
            where: {
                id: parseInt(subscriptionId),
                userId: userId,
                endDate: null, // Somente assinaturas ativas
            },
        });

        if (!subscription) {
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
