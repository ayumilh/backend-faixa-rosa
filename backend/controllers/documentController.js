const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.uploadDocument = async (req, res) => {
    const { companionId, type, fileFront, fileBack } = req.body;

    try {
        const document = await prisma.document.create({
            data: {
                companionId,
                type,
                fileFront,
                fileBack,
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