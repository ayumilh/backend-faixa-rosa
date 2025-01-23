const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.listPlans = async (req, res) => {
    try {
        const plans = await prisma.plan.findMany();
        return res.status(200).json(plans);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao listar planos' });
    }
}

exports.subscribeToPlan = async (req, res) => {
    const planId = parseInt(req.query.planId);
    const userId = req.user?.id; // ID do usuário autenticado (recuperado do middleware)

    console.log('ID do plano:', planId);

    // Validação do planId
    if (!planId || isNaN(planId)) {
        return res.status(400).json({ error: 'O ID do plano é obrigatório.' });
    }
    try {
        // Verifica se o usuário é um acompanhante
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        console.log('Usuário:', user);

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
