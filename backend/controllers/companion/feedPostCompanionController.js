const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { uploadFeedSingle, wasabiS3, bucketName } = require("../../config/wasabi");

// Criar um post no feed
exports.createFeedPost = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Usuário não autenticado." });

        // Buscar acompanhante pelo userId
        const companion = await prisma.companion.findFirst({ where: { userId } });
        if (!companion) return res.status(404).json({ error: "Acompanhante não encontrado." });

        // Middleware de Upload (Apenas para Feed)
        uploadFeedSingle(req, res, async (err) => {
            if (err) return res.status(400).json({ error: err.message });

            if (!req.file) return res.status(400).json({ error: "Arquivo de mídia obrigatório." });

            // Montar a URL correta no Wasabi manualmente
            const wasabiUrl = `https://${bucketName}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.file.key}`;
            const mediaType = req.file.mimetype.startsWith("image/") ? "image" : "video";

            // Criar o post no Feed
            const post = await prisma.feedPost.create({
                data: {
                    title: req.body.title || "",
                    description: req.body.description || "",
                    mediaUrl: wasabiUrl,
                    mediaType,
                    lastOnline: new Date(),
                    companionId: companion.id
                },
            });

            return res.status(201).json({ message: "Post criado com sucesso.", post });
        });

    } catch (error) {
        console.error("Erro ao criar post no feed:", error);
        return res.status(500).json({ error: "Erro ao criar post no feed." });
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
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const companion = await prisma.companion.findFirst({ where: { userId } });
        if (!companion) return res.status(404).json({ error: "Acompanhante não encontrado." });

        const post = await prisma.feedPost.findUnique({
            where: { id: parseInt(id) },
            select: { mediaUrl: true }
        });

        if (!post) return res.status(404).json({ error: "Post não encontrado." });

        // Extrair o nome do arquivo da URL armazenada no banco
        const fileName = post.mediaUrl.split(".com/")[1];

        // Criar o comando para deletar no Wasabi
        const deleteParams = {
            Bucket: bucketName,
            Key: fileName,
        };

        try {
            await wasabiS3.send(new DeleteObjectCommand(deleteParams));
        } catch (wasabiError) {
            return res.status(500).json({ error: "Erro ao deletar mídia do Wasabi." });
        }

        // Deletar o post no banco de dados
        await prisma.feedPost.delete({ where: { id: parseInt(id) } });

        return res.status(200).json({ message: "Post excluído com sucesso." });

    } catch (error) {
        return res.status(500).json({ error: "Erro ao excluir post do feed." });
    }
};
