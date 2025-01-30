const multer = require("multer");
const multerS3 = require("multer-s3");
const wasabiS3 = require("../config/wasabi");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const bucketName = process.env.WASABI_BUCKET;

// Configuração do multer para armazenar vídeos no Wasabi
const upload = multer({
    storage: multerS3({
        s3: wasabiS3,
        bucket: bucketName,
        acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const fileName = `companions/videos/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        },
    }),
    limits: { fileSize: 100 * 1024 * 1024 }, // Limite de 100MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas arquivos de vídeo são permitidos!"), false);
        }
    },
});

// Controller para atualizar o vídeo do acompanhante
exports.updateCompanionVideo = async (req, res) => {
    const userId = req.user?.id;

    if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo de vídeo enviado" });
    }

    try {
        // Obtém a URL do vídeo armazenado no Wasabi
        const videoUrl = req.file.location;

        console.log("URL do vídeo:", videoUrl);

        // Atualiza no banco de dados
        const updatedCompanion = await prisma.physicalCharacteristics.update({
            where: { userId },
            data: {
                comparisonMedia: videoUrl, // Adicione um campo `video` na model se necessário
            },
        });

        return res.status(200).json({
            message: "Vídeo atualizado com sucesso",
            videoUrl,
            updatedCompanion,
        });
    } catch (error) {
        console.error("Erro ao atualizar vídeo:", error);
        return res.status(500).json({ error: "Erro ao atualizar vídeo" });
    }
};

// Middleware de upload
exports.uploadVideoMiddleware = upload.single("media");
