const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todas as mídias
exports.listMidias = async (req, res) => {
    try {
        const midias = await prisma.media.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json(midias);
    } catch (error) {
        console.error('Erro ao listar mídias:', error);
        return res.status(500).json({ error: 'Erro ao listar mídias.' });
    }
};

// Obter detalhes de uma mídia por ID
exports.getMidiaById = async (req, res) => {
    const { id } = req.params;
    try {
        const midia = await prisma.media.findUnique({
            where: { id: parseInt(id) }
        });

        if (!midia) return res.status(404).json({ error: 'Mídia não encontrada.' });

        return res.status(200).json(midia);
    } catch (error) {
        console.error('Erro ao buscar mídia:', error);
        return res.status(500).json({ error: 'Erro ao buscar mídia.' });
    }
};

// Deletar uma mídia por ID
exports.deleteMidia = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.media.delete({ where: { id: parseInt(id) } });
        return res.status(200).json({ message: 'Mídia removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar mídia:', error);
        return res.status(500).json({ error: 'Erro ao deletar mídia.' });
    }
};
