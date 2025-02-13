const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todos os posts no feed
exports.listFeedPosts = async (req, res) => {
    try {
        const posts = await prisma.feedPost.findMany({
            include: {
                companion: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json(posts);
    } catch (error) {
        console.error('Erro ao listar posts no feed:', error);
        return res.status(500).json({ error: 'Erro ao listar posts no feed.' });
    }
};

// Obter detalhes de um post específico
exports.getFeedPostById = async (req, res) => {
    const { id } = req.params;
    try {
        const post = await prisma.feedPost.findUnique({
            where: { id: parseInt(id) },
            include: {
                companion: {
                    select: { name: true }
                }
            }
        });

        if (!post) return res.status(404).json({ error: 'Post não encontrado.' });

        return res.status(200).json(post);
    } catch (error) {
        console.error('Erro ao buscar post no feed:', error);
        return res.status(500).json({ error: 'Erro ao buscar post no feed.' });
    }
};

// Deletar um post do feed
exports.deleteFeedPost = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.feedPost.delete({ where: { id: parseInt(id) } });
        return res.status(200).json({ message: 'Post removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar post no feed:', error);
        return res.status(500).json({ error: 'Erro ao deletar post no feed.' });
    }
};
