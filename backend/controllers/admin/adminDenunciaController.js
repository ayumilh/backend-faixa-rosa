const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 📌 Listar todas as denúncias
 */
exports.listDenuncias = async (req, res) => {
    try {
        const denuncias = await prisma.denuncia.findMany({
            include: {
                denunciante: {
                    select: { firstName: true, lastName: true, email: true }
                },
                denunciado: {
                    select: { id: true, name: true, city: true, state: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json(denuncias);
    } catch (error) {
        console.error('Erro ao listar denúncias:', error);
        return res.status(500).json({ error: 'Erro ao listar denúncias.' });
    }
};

/**
 * 📌 Obter detalhes de uma denúncia específica
 */
exports.getDenunciaById = async (req, res) => {
    const { id } = req.params;

    try {
        const denuncia = await prisma.denuncia.findUnique({
            where: { id: parseInt(id) },
            include: {
                denunciante: {
                    select: { firstName: true, lastName: true, email: true }
                },
                denunciado: {
                    select: { id: true, name: true, city: true, state: true }
                }
            }
        });

        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }

        return res.status(200).json(denuncia);
    } catch (error) {
        console.error('Erro ao buscar denúncia:', error);
        return res.status(500).json({ error: 'Erro ao buscar denúncia.' });
    }
};

/**
 * 📌 Aprovar uma denúncia e suspender o acompanhante denunciado
 */
exports.approveDenuncia = async (req, res) => {
    const { id } = req.params;

    try {
        const denuncia = await prisma.denuncia.findUnique({
            where: { id: parseInt(id) },
            include: { denunciado: true }
        });

        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }

        await prisma.companion.update({
            where: { id: denuncia.denunciadoId },
            data: { profileStatus: 'SUSPENDED' }
        });

        await prisma.denuncia.update({
            where: { id: parseInt(id) },
            data: { status: 'APPROVED' }
        });

        return res.status(200).json({ message: 'Denúncia aprovada e acompanhante suspenso.' });
    } catch (error) {
        console.error('Erro ao aprovar denúncia:', error);
        return res.status(500).json({ error: 'Erro ao aprovar denúncia.' });
    }
};

/**
 * 📌 Rejeitar uma denúncia sem punição ao denunciado
 */
exports.rejectDenuncia = async (req, res) => {
    const { id } = req.params;

    try {
        const denuncia = await prisma.denuncia.findUnique({
            where: { id: parseInt(id) }
        });

        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }

        await prisma.denuncia.update({
            where: { id: parseInt(id) },
            data: { status: 'REJECTED' }
        });

        return res.status(200).json({ message: 'Denúncia rejeitada.' });
    } catch (error) {
        console.error('Erro ao rejeitar denúncia:', error);
        return res.status(500).json({ error: 'Erro ao rejeitar denúncia.' });
    }
};

/**
 * 📌 Deletar uma denúncia (somente admin)
 */
exports.deleteDenuncia = async (req, res) => {
    const { id } = req.params;

    try {
        const denuncia = await prisma.denuncia.findUnique({
            where: { id: parseInt(id) }
        });

        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }

        await prisma.denuncia.delete({
            where: { id: parseInt(id) }
        });

        return res.status(200).json({ message: 'Denúncia deletada com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar denúncia:', error);
        return res.status(500).json({ error: 'Erro ao deletar denúncia.' });
    }
};
