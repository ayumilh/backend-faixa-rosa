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

// Obter detalhes de um post no feed
exports.getPostsByCompanion = async (req, res) => {
    const { id } = req.params;

    const companionId = parseInt(id);
    if (isNaN(companionId)) {
        return res.status(400).json({ error: 'ID inválido. Deve ser um número.' });
    }

    if (!req.user || req.user.userType !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar postagens." });
    }

    try {
        const posts = await prisma.feedPost.findMany({
            where: { companionId },
            include: {
                companion: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        if (!posts || posts.length === 0) {
            return res.status(200).json({ message: "Nenhuma postagem encontrada para este anunciante." });
        }

        return res.status(200).json(posts);
    } catch (error) {
        console.error("Erro ao buscar postagens do anunciante:", error);
        return res.status(500).json({ error: "Erro ao buscar postagens do anunciante." });
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
