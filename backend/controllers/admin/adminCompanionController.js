const prisma = require('../../prisma/client');

// Listar acompanhantes
exports.listAcompanhantes = async (req, res) => {
    try {
        const acompanhantes = await prisma.companion.findMany({
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                plan: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                    },
                },
                documents: {
                    select: {
                        id: true,
                        documentStatus: true,
                        updatedAt: true,
                    },
                },
                media: {  // Verificando se existe vídeo de comparação
                    where: {
                        mediaType: 'VIDEO', // Verificando tipo de mídia
                    },
                    select: {
                        id: true,   // Verifica se existe um vídeo
                        status: true, // Retorna o status do vídeo
                    },
                },
            },
            orderBy: {
                createdAt: 'asc'
            },
        });

        console.log(acompanhantes); // Log para verificar os dados retornados

        // Processa o status do documento para cada acompanhante com base na tabela Document
        const formattedAcompanhantes = acompanhantes.map((companion) => {
            let documentStatus = 'PENDING';

            if (companion.documents.length > 0) {
                const allApproved = companion.documents.every(doc => doc.documentStatus === 'APPROVED');
                const hasPending = companion.documents.some(doc => doc.documentStatus === 'PENDING');
                const hasInAnalysis = companion.documents.some(doc => doc.documentStatus === 'IN_ANALYSIS');

                if (allApproved) {
                    documentStatus = 'APPROVED';
                } else if (hasInAnalysis) {
                    documentStatus = 'IN_ANALYSIS';  // Se algum documento estiver em análise
                } else if (hasPending) {
                    documentStatus = 'PENDING';
                } else {
                    documentStatus = 'REJECTED';
                }
            }


            // Verifica se o acompanhante tem vídeo de comparação
            const hasComparisonVideo = companion.media.length > 0 ? true : false;
            const videoStatus = hasComparisonVideo ? companion.media[0].status : 'Nenhum vídeo enviado';

            return {
                id: companion.id,
                name: `${companion.user.firstName} ${companion.user.lastName}`,
                city: companion.city,
                state: companion.state,
                profileStatus: companion.profileStatus, // PENDENTE, ATIVO ou REJEITADO
                documentStatus,
                documents: companion.documents, // Lista de documentos
                plan: companion.plan ? {
                    id: companion.plan.id,
                    name: companion.plan.name,
                    price: companion.plan.price,
                } : null,
                userName: companion.userName, // Agora acessando 'userName' do modelo 'User'
                media: videoStatus
            };
        });

        if (!acompanhantes.length) {
            return res.status(200).json({ message: 'Nenhuma acompanhante encontrada.' });
        }

        return res.status(200).json(formattedAcompanhantes);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao listar acompanhantes.', error: error.message });
    }
};


// Aprovar perfil de acompanhantes 
exports.approveAcompanhantes = async (req, res) => {
    const { id } = req.params;

    const companionId = parseInt(id);
    if (isNaN(companionId)) {
        return res.status(400).json({ error: 'ID inválido. Deve ser um número.' });
    }

    if (!req.user || req.user.userType !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem aprovar documentos." });
    }

    try {
        await prisma.companion.update({
            where: { id: companionId },
            data: { profileStatus: 'ACTIVE' },
        });
        return res.status(200).json({ message: 'acompanhantes aprovado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao aprovar acompanhantes.' });
    }
}

// Rejeitar perfil de acompanhantes
exports.rejectAcompanhantes = async (req, res) => {
    const { id } = req.params;

    const companionId = parseInt(id);
    if (isNaN(companionId)) {
        return res.status(400).json({ error: 'ID inválido. Deve ser um número.' });
    }

    if (!req.user || req.user.userType !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem aprovar documentos." });
    }

    try {
        await prisma.companion.update({
            where: { id: companionId },
            data: { profileStatus: 'REJECTED' },
        });
        await prisma.media.updateMany({
            where: { companionId: companionId },
            data: { status: 'REJECTED' },
        });
        return res.status(200).json({ message: 'acompanhantes rejeitado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao rejeitar acompanhantes.' });
    }
}

// Suspender perfil de acompanhantes
exports.suspendAcompanhantes = async (req, res) => {
    const { id } = req.params;

    const companionId = parseInt(id);
    if (isNaN(companionId)) {
        return res.status(400).json({ error: 'ID inválido. Deve ser um número.' });
    }

    if (!req.user || req.user.userType !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem aprovar documentos." });
    }

    try {
        await prisma.companion.update({
            where: { id: companionId },
            data: { profileStatus: 'SUSPENDED' },
        });
        await prisma.media.updateMany({
            where: { companionId: companionId },
            data: { status: 'SUSPENDED' },
        });
        return res.status(200).json({ message: 'acompanhantes suspenso com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao suspender acompanhantes.' });
    }
}

exports.deleteAcompanhante = async (req, res) => {
    const { id } = req.params;

    try {
        // Converte o ID para número e verifica se é válido
        const companionId = parseInt(id);
        if (isNaN(companionId)) {
            return res.status(400).json({ error: "ID inválido. Deve ser um número." });
        }

        // Verifica se o usuário existe
        const companion = await prisma.companion.findUnique({
            where: { id: companionId },
            include: {
                documents: true, // Verifica documentos vinculados
                subscriptions: true, // Nome correto para assinaturas de planos
                extraPlans: true, // Se houver planos extras vinculados
            },
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrado." });
        }

        // Remove primeiro os documentos vinculados
        await prisma.document.deleteMany({
            where: { companionId },
        });

        // Remove as assinaturas de planos vinculadas
        await prisma.planSubscription.deleteMany({
            where: { companionId },
        });

        // Remove os planos extras vinculados (caso existam)
        await prisma.extraPlan.deleteMany({
            where: { companions: { some: { id: companionId } } },
        });

        // Remove o acompanhante
        await prisma.companion.delete({
            where: { id: companionId },
        });

        return res.status(200).json({ message: "Acompanhante e todos os dados associados foram removidos com sucesso." });

    } catch (error) {
        console.error("Erro ao deletar acompanhante:", error);
        return res.status(500).json({ message: "Erro ao processar a exclusão do acompanhante." });
    }
};


// Atualizar plano
exports.updatePlan = async (req, res) => {
    const { id } = req.params;
    const { planId } = req.body; // Novo plano a ser atribuído

    try {
        const companion = await prisma.companion.findUnique({
            where: { id: parseInt(id) },
        });

        if (!companion) {
            return res.status(404).json({ message: 'Acompanhante não encontrado.' });
        }

        await prisma.companion.update({
            where: { id: parseInt(id) },
            data: { planId: parseInt(planId) },
        });

        return res.status(200).json({ message: 'Plano atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar plano.', error });
    }
};

// Atualizar plano extra
exports.updateExtraPlanForCompanion = async (req, res) => {
    const { companionId } = req.params; // ID da acompanhante
    const { extraPlanId, isEnabled, duration, pointsBonus } = req.body; // Novos dados para atualizar o plano extra

    try {
        // Verifica se a acompanhante existe
        const companion = await prisma.companion.findUnique({
            where: { id: parseInt(companionId) },
            include: { extraPlans: true }, // Inclui os planos extras atuais da acompanhante
        });

        if (!companion) {
            return res.status(404).json({ message: 'Acompanhante não encontrada.' });
        }

        // Verifica se o plano extra existe
        const extraPlan = await prisma.extraPlan.findUnique({
            where: { id: parseInt(extraPlanId) },
        });

        if (!extraPlan) {
            return res.status(404).json({ message: 'Plano extra não encontrado.' });
        }

        // Atualiza o plano extra da acompanhante
        const updatedExtraPlan = await prisma.companion.update({
            where: { id: parseInt(companionId) },
            data: {
                extraPlans: {
                    update: {
                        where: { id: parseInt(extraPlanId) },
                        data: {
                            isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : undefined,
                            duration: duration !== undefined ? parseInt(duration) : undefined,
                            pointsBonus: pointsBonus !== undefined ? parseInt(pointsBonus) : undefined,
                        },
                    },
                },
            },
        });

        return res.status(200).json({
            message: 'Plano extra da acompanhante atualizado com sucesso.',
            updatedExtraPlan,
        });
    } catch (error) {
        console.error('Erro ao atualizar plano extra:', error);
        return res.status(500).json({ message: 'Erro ao atualizar plano extra.', error });
    }
};



// Buscar histórico de atividades
exports.getActivityLog = async (req, res) => {
    const { id } = req.params;
    const companionId = parseInt(id);

    if (isNaN(companionId)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    try {
        const activities = await prisma.activityLog.findMany({
            where: { companionId: companionId },
            orderBy: { createdAt: "desc" }
        });

        if (!activities.length) {
            return res.status(200).json({ message: "Nenhuma atividade registrada." });
        }

        return res.status(200).json(activities);
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return res.status(500).json({ error: "Erro ao buscar histórico." });
    }
};