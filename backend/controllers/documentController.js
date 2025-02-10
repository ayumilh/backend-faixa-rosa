const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadDocuments } = require("../config/wasabi");

exports.uploadDocument = async (req, res) => {
    const { companionId, type } = req.body;

    if (!req.files || !req.files.fileFront || !req.files.fileBack) {
        return res.status(400).json({ error: "Ambas as imagens (frente e verso) são obrigatórias." });
    }

    const fileFrontUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.fileFront[0].key}`;
    const fileBackUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.fileBack[0].key}`;
  
    console.log("Verso:", fileBackUrl);
    console.log("Frente:", fileFrontUrl);
    
    try {      

        const document = await prisma.document.create({
            data: {
                companionId,
                type,
                fileFront: fileFrontUrl,
                fileBack: fileBackUrl,
            },
        });

        res.status(201).json({ message: 'Documento enviado com sucesso.', document });
    } catch (error) {
        console.error('Erro ao enviar documento:', error);
        res.status(500).json({ error: 'Erro ao enviar documento.' });
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