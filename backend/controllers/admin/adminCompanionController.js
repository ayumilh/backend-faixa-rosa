const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
            },
        });

        // Processa o status do documento para cada acompanhante com base na tabela Document
        const formattedAcompanhantes = acompanhantes.map((companion) => {
            let documentStatus = 'PENDING';

            if (companion.documents.length > 0) {
                const allApproved = companion.documents.every(doc => doc.documentStatus === 'APPROVED');
                const hasPending = companion.documents.some(doc => doc.documentStatus === 'PENDING');

                if (allApproved) {
                    documentStatus = 'APPROVED';
                } else if (hasPending) {
                    documentStatus = 'PENDING';
                } else {
                    documentStatus = 'REJECTED';
                }
            }

            return {
                id: companion.id,
                name: `${companion.user.firstName} ${companion.user.lastName}`,
                city: companion.city,
                state: companion.state,
                profileStatus: companion.profileStatus, // PENDENTE, ATIVO ou REJEITADO
                documents: companion.documents, // Lista de documentos
                plan: companion.plan ? {
                    id: companion.plan.id,
                    name: companion.plan.name,
                    price: companion.plan.price,
                } : null,
            };
        });

        return res.status(200).json(formattedAcompanhantes);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao listar acompanhantes.' });
    }
};

// Aprovar perfil de acompanhantes 
exports.approveAcompanhantes = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.companion.update({
            where: { userId: parseInt(id) },
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
    try {
        await prisma.companion.update({
            where: { userId: parseInt(id) },
            data: { profileStatus: 'REJECTED' },
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
    try {
        await prisma.companion.update({
            where: { userId: parseInt(id) },
            data: { profileStatus: 'SUSPENDED' },
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
                subscriptions: true, // 🔥 Nome correto para assinaturas de planos
                extraPlans: true, // Se houver planos extras vinculados
            },
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrado." });
        }

        // 🔥 Remove primeiro os documentos vinculados
        await prisma.document.deleteMany({
            where: { companionId },
        });

        // 🔥 Remove as assinaturas de planos vinculadas
        await prisma.planSubscription.deleteMany({
            where: { companionId },
        });

        // 🔥 Remove os planos extras vinculados (caso existam)
        await prisma.extraPlan.deleteMany({
            where: { companions: { some: { id: companionId } } },
        });

        // 🔥 Remove o acompanhante
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
            where: { userId: parseInt(id) },
        });

        if (!companion) {
            return res.status(404).json({ message: 'Acompanhante não encontrado.' });
        }

        await prisma.companion.update({
            where: { userId: parseInt(id) },
            data: { planId: parseInt(planId) },
        });

        return res.status(200).json({ message: 'Plano atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar plano.', error });
    }
};


// Monitorar postagens (simples exemplo)
exports.monitorPosts = async (req, res) => {
    const { id } = req.params;
    try {
        const posts = await prisma.post.findMany({
            where: { userId: parseInt(id) },
        });
        return res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao monitorar postagens.' });
    }
}