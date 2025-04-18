const prisma = require('../../prisma/client');
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { wasabiS3, bucketName } = require("../../config/wasabi");

// Listar todos os stories (ativos e expirados)**
exports.listAllStories = async (req, res) => {
    try {
        const stories = await prisma.story.findMany({
            include: {
                companion: {
                    select: { name: true, id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json(stories);
    } catch (error) {
        console.error('Erro ao listar stories:', error);
        return res.status(500).json({ error: 'Erro ao listar stories.' });
    }
};

// Listar apenas stories ativos (que ainda não expiraram)**
exports.listActiveStories = async (req, res) => {
    try {
        const stories = await prisma.story.findMany({
            where: { expiresAt: { gt: new Date() } }, // Apenas stories não expirados
            include: {
                companion: {
                    select: { name: true, id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json(stories);
    } catch (error) {
        console.error('Erro ao listar stories ativos:', error);
        return res.status(500).json({ error: 'Erro ao listar stories ativos.' });
    }
};

// Excluir um story específico (com remoção da mídia no Wasabi)**
exports.deleteStoryAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar o story antes de excluir
        const story = await prisma.story.findUnique({
            where: { id: parseInt(id) },
            select: { url: true }
        });

        if (!story) return res.status(404).json({ error: "Story não encontrado." });

        // Extrair o nome do arquivo da URL armazenada no banco
        const fileName = story.url.split(".com/")[1];

        // Criar o comando para deletar no Wasabi
        const deleteParams = { Bucket: bucketName, Key: fileName };
        await wasabiS3.send(new DeleteObjectCommand(deleteParams));

        // Excluir o story no banco de dados
        await prisma.story.delete({ where: { id: parseInt(id) } });

        return res.status(200).json({ message: 'Story excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir story:', error);
        return res.status(500).json({ error: 'Erro ao excluir story.' });
    }
};

// Limpar automaticamente stories expirados**
exports.cleanExpiredStories = async (req, res) => {
    try {
        const expiredStories = await prisma.story.findMany({
            where: { expiresAt: { lt: new Date() } }, // Buscar stories expirados
            select: { id: true, url: true }
        });

        if (expiredStories.length === 0) {
            return res.status(200).json({ message: "Nenhum story expirado encontrado." });
        }

        // Deletar arquivos no Wasabi
        for (let story of expiredStories) {
            const fileName = story.url.split(".com/")[1];
            const deleteParams = { Bucket: bucketName, Key: fileName };
            await wasabiS3.send(new DeleteObjectCommand(deleteParams));
        }

        // Deletar stories no banco de dados
        await prisma.story.deleteMany({ where: { expiresAt: { lt: new Date() } } });

        return res.status(200).json({ message: 'Stories expirados removidos com sucesso.' });
    } catch (error) {
        console.error('Erro ao limpar stories expirados:', error);
        return res.status(500).json({ error: 'Erro ao limpar stories expirados.' });
    }
};
