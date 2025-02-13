const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { wasabiS3, bucketName } = require("../../config/wasabi");

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
        // Buscar post antes de excluir
        const post = await prisma.feedPost.findUnique({
            where: { id: parseInt(id) },
            select: { mediaUrl: true }
        });

        if (!post) {
            return res.status(404).json({ error: "Post não encontrado." });
        }

        // Extrair o nome do arquivo da URL no Wasabi
        const fileName = post.mediaUrl.split(".com/")[1]; // Obtém o caminho do arquivo

        // Criar o comando para deletar do Wasabi
        const deleteParams = {
            Bucket: bucketName,
            Key: fileName,
        };

        // Excluir mídia no Wasabi
        await wasabiS3.send(new DeleteObjectCommand(deleteParams));

        // Excluir o post no banco de dados
        await prisma.feedPost.delete({ where: { id: parseInt(id) } });

        return res.status(200).json({ message: "Post removido com sucesso." });

    } catch (error) {
        return res.status(500).json({ error: "Erro ao deletar post no feed." });
    }
};
