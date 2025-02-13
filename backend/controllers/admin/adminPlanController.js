const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar um novo plano    ---- criar o planType (tabela de funcionalidades) do plano e criar const de atualizar funcionalidades ao plano
exports.createPlan = async (req, res) => {
    try {
        const { name, price, description, isBasic, planTypeId } = req.body;

        const newPlan = await prisma.plan.create({
            data: {
                name,
                price: parseFloat(price),
                description,
                isBasic: Boolean(isBasic),
                planTypeId: planTypeId ? parseInt(planTypeId) : null,
            },
        });

        return res.status(201).json({ message: 'Plano criado com sucesso.', newPlan });
    } catch (error) {
        console.error('Erro ao criar plano:', error);
        return res.status(500).json({ error: 'Erro ao criar plano.' });
    }
};

// Atualizar um plano existente  
exports.updatePlan = async (req, res) => {
    const { id } = req.params;
    const { name, price, description, isBasic } = req.body;

    try {
        const updatedPlan = await prisma.plan.update({
            where: { id: parseInt(id) },
            data: {
                name,
                price: price ? parseFloat(price) : undefined,
                description,
                isBasic: isBasic !== undefined ? Boolean(isBasic) : undefined,
            },
        });

        return res.status(200).json({ message: 'Plano atualizado com sucesso.', updatedPlan });
    } catch (error) {
        console.error('Erro ao atualizar plano:', error);
        return res.status(500).json({ error: 'Erro ao atualizar plano.' });
    }
};

// Deletar um plano
exports.deletePlan = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.plan.delete({ where: { id: parseInt(id) } });
        return res.status(200).json({ message: 'Plano deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar plano:', error);
        return res.status(500).json({ error: 'Erro ao deletar plano.' });
    }
};

// Listar todos os planos
exports.listPlans = async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({
            include: { planType: true },
        });
        return res.status(200).json(plans);
    } catch (error) {
        console.error('Erro ao listar planos:', error);
        return res.status(500).json({ error: 'Erro ao listar planos.' });
    }
};

/**
 * =============================
 * GERENCIAMENTO DE PLANOS EXTRAS
 * =============================
 */

// Criar um novo plano extra
exports.createExtraPlan = async (req, res) => {
    try {
        const { name, description, isTemporary, duration, pointsBonus } = req.body;

        const newExtraPlan = await prisma.extraPlan.create({
            data: {
                name,
                description,
                isTemporary: Boolean(isTemporary),
                duration: duration ? parseInt(duration) : null,
                pointsBonus: pointsBonus ? parseInt(pointsBonus) : 0,
            },
        });

        return res.status(201).json({ message: 'Plano extra criado com sucesso.', newExtraPlan });
    } catch (error) {
        console.error('Erro ao criar plano extra:', error);
        return res.status(500).json({ error: 'Erro ao criar plano extra.' });
    }
};

// Atualizar um plano extra
exports.updateExtraPlan = async (req, res) => {
    const { id } = req.params;
    const { name, description, isTemporary, duration, pointsBonus } = req.body;

    try {
        const updatedExtraPlan = await prisma.extraPlan.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                isTemporary: Boolean(isTemporary),
                duration: duration ? parseInt(duration) : null,
                pointsBonus: pointsBonus ? parseInt(pointsBonus) : 0,
            },
        });

        return res.status(200).json({ message: 'Plano extra atualizado com sucesso.', updatedExtraPlan });
    } catch (error) {
        console.error('Erro ao atualizar plano extra:', error);
        return res.status(500).json({ error: 'Erro ao atualizar plano extra.' });
    }
};

// Deletar um plano extra
exports.deleteExtraPlan = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.extraPlan.delete({ where: { id: parseInt(id) } });
        return res.status(200).json({ message: 'Plano extra deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar plano extra:', error);
        return res.status(500).json({ error: 'Erro ao deletar plano extra.' });
    }
};

// Listar todos os planos extras
exports.listExtraPlans = async (req, res) => {
    try {
        const extraPlans = await prisma.extraPlan.findMany();
        return res.status(200).json(extraPlans);
    } catch (error) {
        console.error('Erro ao listar planos extras:', error);
        return res.status(500).json({ error: 'Erro ao listar planos extras.' });
    }
};

/**
 * =============================
 * GERENCIAMENTO DE ASSINATURAS
 * =============================
 */

// Listar todas as assinaturas ativas
exports.listActiveSubscriptions = async (req, res) => {
    try {
        const subscriptions = await prisma.planSubscription.findMany({
            where: { endDate: null },
            include: { plan: true, extraPlan: true, companion: true },
        });

        return res.status(200).json(subscriptions);
    } catch (error) {
        console.error('Erro ao listar assinaturas ativas:', error);
        return res.status(500).json({ error: 'Erro ao listar assinaturas ativas.' });
    }
};

// Cancelar a assinatura principal de um usuário
exports.disableUserPlan = async (req, res) => {
    const { companionId } = req.params;

    try {
        await prisma.planSubscription.updateMany({
            where: { companionId: parseInt(companionId), isExtra: false, endDate: null },
            data: { endDate: new Date() },
        });

        return res.status(200).json({ message: 'Assinatura principal cancelada com sucesso.' });
    } catch (error) {
        console.error('Erro ao cancelar assinatura principal:', error);
        return res.status(500).json({ error: 'Erro ao cancelar assinatura principal.' });
    }
};

// Cancelar um plano extra específico de um usuário
exports.disableUserExtraPlan = async (req, res) => {
    const { companionId, extraPlanId } = req.params;

    try {
        await prisma.planSubscription.updateMany({
            where: { companionId: parseInt(companionId), extraPlanId: parseInt(extraPlanId), endDate: null },
            data: { endDate: new Date() },
        });

        return res.status(200).json({ message: 'Plano extra cancelado com sucesso.' });
    } catch (error) {
        console.error('Erro ao cancelar plano extra:', error);
        return res.status(500).json({ error: 'Erro ao cancelar plano extra.' });
    }
};
