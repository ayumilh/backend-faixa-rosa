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

        // Registra a assinatura do plano
        const subscription = await prisma.planSubscription.create({
            data: {
                userId,
                planId,
                startDate: new Date(),
            },
        });

        return res.status(201).json({ message: 'Plano selecionado com sucesso', subscription });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao selecionar plano' });
    }
}