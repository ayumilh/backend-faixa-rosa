const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadDocuments } = require("../../config/wasabi");
const { logActivity } = require('../../utils/activityService');

exports.uploadDocument = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { type } = req.body;

        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrada' });
        }

        const companionId = companion.id;

        const existingDocument = await prisma.document.findFirst({
            where: { companionId, type },
        });
        if (existingDocument) {
            await logActivity(companion.id, "Envio de Documento",
                `Acompanhante tentou enviar o documento tipo ${type}, mas já foi enviado anteriormente.`
            );
            return res.status(200).json({ error: `O documento ${type} já foi enviado.` })
        };

        if (!req.files || !req.files.fileFront || !req.files.fileBack) {
            return res.status(400).json({ error: "Ambas as imagens (frente e verso) são obrigatórias." });
        }

        const fileFrontUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.fileFront[0].key}`;
        const fileBackUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.fileBack[0].key}`;

        const document = await prisma.document.create({
            data: {
                companionId,
                type,
                fileFront: fileFrontUrl,
                fileBack: fileBackUrl,
                updatedAt: new Date(),
            },
        });

        // Registra no log que o documento foi enviado
        await logActivity(companion.id, "Envio de Documento",
            `Acompanhante enviou o documento tipo ${type}. Front: ${fileFrontUrl}, Back: ${fileBackUrl}`
        );


        return res.status(201).json({ message: 'Documento enviado com sucesso.', document });

    } catch (error) {
        console.error('Erro ao enviar documento:', error);
        return res.status(500).json({ error: 'Erro ao enviar documento.' });
    }
};

exports.getDocuments = async (req, res) => {
    const { companionId } = req.params;

    try {
        const documents = await prisma.document.findMany({
            where: { companionId: parseInt(companionId) },
        });

        res.status(200).json(documents);
    } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        res.status(500).json({ error: 'Erro ao buscar documentos.' });
    }
};