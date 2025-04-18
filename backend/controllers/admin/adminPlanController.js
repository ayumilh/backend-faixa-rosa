const prisma = require('../../prisma/client');

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
        // Busca os acompanhantes que têm pelo menos um plano principal ativo
        const activeCompanions = await prisma.companion.findMany({
            where: {
                subscriptions: {
                    some: {
                        isExtra: false,  // Apenas planos principais
                        endDate: null,   // Ainda está ativo
                        startDate: { lte: new Date() } // Começou antes ou na data atual
                    },
                },
            },
            include: {
                plan: {
                    include: {
                        planType: true, // Inclui informações do tipo do plano principal
                    },
                },
                subscriptions: {
                    include: {
                        plan: true, // Inclui detalhes do plano principal
                        extraPlan: true, // Inclui detalhes dos planos extras
                    },
                },
            },
        });

        // Se não houver acompanhantes ativas, retorna uma mensagem amigável
        if (activeCompanions.length === 0) {
            return res.status(200).json({ message: "Nenhuma acompanhante com plano ativo." });
        }

        return res.status(200).json(activeCompanions);
    } catch (error) {
        console.error("Erro ao buscar acompanhantes com planos ativos:", error);
        return res.status(500).json({ error: "Erro ao buscar acompanhantes com planos ativos." });
    }
};


exports.getCancelledCompanions = async (req, res) => {
    try {
        // Busca os acompanhantes que possuem pelo menos uma assinatura principal cancelada
        const cancelledCompanions = await prisma.companion.findMany({
            where: {
                subscriptions: {
                    some: {
                        isExtra: false,
                        endDate: { not: null },
                    },
                },
            },
            include: {
                subscriptions: true, // opcional: inclui os detalhes das assinaturas
            },
        });

        return res.status(200).json(cancelledCompanions);
    } catch (error) {
        console.error('Erro ao buscar acompanhantes com planos cancelados:', error);
        return res.status(500).json({ error: 'Erro ao buscar acompanhantes com planos cancelados.' });
    }
};



// Cancelar a assinatura principal de um usuário
exports.disableUserPlan = async (req, res) => {
    const { companionId } = req.params;
    const id = parseInt(companionId);

    try {
        // Atualiza a assinatura principal (define o endDate)
        await prisma.planSubscription.updateMany({
            where: { companionId: id, isExtra: false, endDate: null },
            data: { endDate: new Date() },
        });

        // Verifica se o Companion existe
        const companionRecord = await prisma.companion.findUnique({
            where: { userId: id },
        });

        if (companionRecord) {
            // Remove o plano associado do Companion
            await prisma.companion.update({
                where: { userId: id },
                data: { planId: null, planTypeId: null },
            });
        } else {
            console.warn(`Companion com id ${id} não encontrado.`);
        }

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



/**
 * =============================
 * NOTIFICAÇÕES DE RENOVAÇÃO
 * =============================
 */

// 🔹 Notificar usuários sobre renovação de planos
exports.sendRenewalNotifications = async (req, res) => {
    try {
        const subscriptions = await prisma.planSubscription.findMany({
            where: {
                endDate: { not: null },
            },
            include: { plan: true, companion: { include: { user: true } } },
        });

        const notifications = subscriptions.map((sub) => {
            return {
                to: sub.companion.user.email,
                subject: "Renovação de Assinatura",
                message: `Sua assinatura do plano ${sub.plan.name} vence em breve. Renove agora para evitar interrupções!`,
            };
        });

        return res.status(200).json({ message: "Notificações enviadas com sucesso.", notifications });
    } catch (error) {
        console.error("Erro ao enviar notificações de renovação:", error);
        return res.status(500).json({ error: "Erro ao enviar notificações." });
    }
};

exports.getExpiringSubscriptions = async (req, res) => {
    try {
        // Data de hoje
        const today = new Date();

        // Data limite (7 dias a partir de hoje, pode ajustar conforme sua necessidade)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Consulta assinaturas que têm endDate entre hoje e 7 dias à frente
        const expiringSubscriptions = await prisma.planSubscription.findMany({
            where: {
                endDate: {
                    not: null,   // endDate não é nulo
                    gte: today,  // maior ou igual a hoje
                    lte: nextWeek // menor ou igual a daqui 7 dias
                }
            },
            include: {
                plan: true,
                extraPlan: true,
                companion: {
                    include: {
                        user: true // Inclui dados do usuário (email, firstName, etc.)
                    }
                }
            }
        });

        return res.status(200).json(expiringSubscriptions);
    } catch (error) {
        console.error("Erro ao buscar assinaturas próximas de vencer:", error);
        return res.status(500).json({ error: "Erro ao buscar assinaturas próximas de vencer." });
    }
};

/**
 * =============================
 * GERENCIAMENTO DE DESCONTOS E CUPONS
 * =============================
 */

// 🔹 Criar um novo cupom de desconto
exports.createCoupon = async (req, res) => {
    try {
        const { code, discount, expirationDate } = req.body;

        const newCoupon = await prisma.coupon.create({
            data: {
                code,
                discount: parseFloat(discount),
                expirationDate: new Date(expirationDate),
            },
        });

        return res.status(201).json({ message: "Cupom criado com sucesso.", newCoupon });
    } catch (error) {
        console.error("Erro ao criar cupom:", error);
        return res.status(500).json({ error: "Erro ao criar cupom." });
    }
};

// 🔹 Aplicar cupom de desconto a um pagamento
exports.applyCoupon = async (req, res) => {
    try {
        const { couponCode, paymentId } = req.body;

        const coupon = await prisma.coupon.findUnique({
            where: { code: couponCode },
        });

        if (!coupon || new Date(coupon.expirationDate) < new Date()) {
            return res.status(400).json({ error: "Cupom inválido ou expirado." });
        }

        await prisma.payment.update({
            where: { id: paymentId },
            data: { amount: { decrement: coupon.discount } },
        });

        return res.status(200).json({ message: "Cupom aplicado com sucesso." });
    } catch (error) {
        console.error("Erro ao aplicar cupom:", error);
        return res.status(500).json({ error: "Erro ao aplicar cupom." });
    }
};