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
                documents: true, // Obtém os documentos associados
            },
        });

        // Processa o status do documento para cada acompanhante com base na tabela Document
        const formattedAcompanhantes = acompanhantes.map((companion) => {
            let documentStatus = 'PENDING';

            if (companion.documents.length > 0) {
                const allApproved = companion.documents.every(doc => doc.status === 'ACTIVE');
                const hasPending = companion.documents.some(doc => doc.status === 'PENDING');

                if (allApproved) {
                    documentStatus = 'VERIFIED';
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
                documentStatus: documentStatus, // Calculado dinamicamente
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

// Aprovar documento de acompanhantes
exports.approvedDocuments = async (req, res) => {
    try {
        const { id } = req.params;

        const companionId = parseInt(id);
        if (isNaN(companionId)) {
            return res.status(400).json({ error: "ID inválido. Deve ser um número." });
        }

        if (!req.user || req.user.userType !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado. Apenas administradores podem aprovar documentos." });
        }

        const companion = await prisma.companion.findUnique({ where: { id: companionId } });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrado." });
        }

        await prisma.document.updateMany({
            where: { companionId: companionId },
            data: { documentStatus: "APPROVED" },
        });

        await prisma.companion.update({
            where: { id: companionId },
            data: { documentStatus: "APPROVED" }
        });

        return res.status(200).json({ message: "Documentos verificados e aprovados com sucesso." });

    } catch (error) {
        console.error("Erro ao verificar documentos:", error);
        return res.status(500).json({ message: "Erro ao processar a verificação de documentos." });
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

// Suspender/Desativar perfil de acompanhantes
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

// Editar plano/solicitações
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