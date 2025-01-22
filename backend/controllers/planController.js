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
    const { planId } = req.body;
    const userId = req.user.id;

    try {
        // Verifica se o plano existe
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            return res.status(404).json({ error: 'Plano não encontrado' });
        }

        // Verifica se o usuário já possui uma assinatura ativa
        const existingSubscription = await prisma.planSubscription.findFirst({
            where: {
                userId: userId,
                endDate: null, // Assinatura ativa (sem data de término definida)
            },
        });

        if (existingSubscription) {
            return res.status(400).json({ error: 'Você já possui uma assinatura ativa' });
        }

        // Cria uma nova assinatura
        const subscription = await prisma.planSubscription.create({
            data: {
                userId,
                planId,
                startDate: new Date(),
                endDate: null, // Pode ser definido no futuro (ex.: após expiração)
            },
            include: {
                plan: true, // Inclui informações do plano relacionado
            },
        });

        return res.status(201).json({ message: 'Plano selecionado com sucesso', subscription });
    } catch (error) {
        console.error('Erro ao selecionar plano:', error);
        return res.status(500).json({ error: 'Erro ao selecionar plano' });
    }
};
