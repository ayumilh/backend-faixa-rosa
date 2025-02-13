const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar um post no feed
exports.createFeedPost = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title, description, content, featuredImage, pricePerHour, location } = req.body;

        const companion = await prisma.companion.findUnique({ where: { userId } });
        if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrado' });

        if (!title)  return res.status(400).json({ error: 'Título é obrigatórios.' });

        const post = await prisma.feedPost.create({
            data: {
                title,
                description,
                content,
                featuredImage,
                pricePerHour,
                location,
                lastOnline: new Date(),
                companionId: companion.id
            },
        });

        return res.status(201).json({ message: 'Post criado com sucesso.', post });
    } catch (error) {
        console.error('Erro ao criar post no feed:', error);
        return res.status(500).json({ error: 'Erro ao criar post no feed.' });
    }
};

// Listar todos os posts
exports.listFeedPosts = async (req, res) => {
    try {
        const posts = await prisma.feedPost.findMany({
            include: {
                companion: { select: { name: true, city: true, state: true } },
            },
        });

        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao listar posts do feed.' });
    }
};

// Deletar um post do feed
exports.deleteFeedPost = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.feedPost.delete({
            where: { id: parseInt(id) },
        });

        return res.status(200).json({ message: 'Post excluído com sucesso.' });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao excluir post do feed.' });
    }
};
