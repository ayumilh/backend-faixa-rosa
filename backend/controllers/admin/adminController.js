const prisma = require('@prisma/client');
const { PrismaClient } = prisma;
const db = new PrismaClient();

// Listar acompanhantes
exports.listAcompanhantes = async (req, res) => {
    try {
        const acompanhantes = await db.companion.findMany({
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


// Aprovar acompanhantes
exports.approveAcompanhantes = async (req, res) => {
    const { id } = req.params;
    try {
        await db.companion.update({
            where: { userId: parseInt(id) },
            data: { profileStatus: 'ACTIVE' },
        });
        return res.status(200).json({ message: 'acompanhantes aprovado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao aprovar acompanhantes.' });
    }
}

// Rejeitar acompanhantes
exports.rejectAcompanhantes = async (req, res) => {
    const { id } = req.params;
    try {
        await db.companion.update({
            where: { userId: parseInt(id) },
            data: { profileStatus: 'REJECTED' },
        });
        return res.status(200).json({ message: 'acompanhantes rejeitado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao rejeitar acompanhantes.' });
    }
}

// Editar plano/solicitações
exports.updatePlan = async (req, res) => {
    const { id } = req.params;
    const { planId } = req.body; // Novo plano a ser atribuído

    try {
        const companion = await db.companion.findUnique({
            where: { userId: parseInt(id) },
        });

        if (!companion) {
            return res.status(404).json({ message: 'Acompanhante não encontrado.' });
        }

        await db.companion.update({
            where: { userId: parseInt(id) },
            data: { planId: parseInt(planId) },
        });

        return res.status(200).json({ message: 'Plano atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar plano.', error });
    }
};

// Verificar documentos
exports.verifyDocuments = async (req, res) => {
    const { id } = req.params;
    try {
        await db.document.updateMany({
            where: { userId: parseInt(id) },
            data: { documentStatus: 'VERIFIED' },
        });
        return res.status(200).json({ message: 'Documentos verificados com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao verificar documentos.' });
    }
}

// Suspender/Desativar acompanhantes
exports.suspendAcompanhantes = async (req, res) => {
    const { id } = req.params;
    try {
        await db.companion.update({
            where: { userId: parseInt(id) },
            data: { profileStatus: 'SUSPENDED' },
        });
        return res.status(200).json({ message: 'acompanhantes suspenso com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao suspender acompanhantes.' });
    }
}

// Monitorar postagens (simples exemplo)
exports.monitorPosts = async (req, res) => {
    const { id } = req.params;
    try {
        const posts = await db.post.findMany({
            where: { userId: parseInt(id) },
        });
        return res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao monitorar postagens.' });
    }
}