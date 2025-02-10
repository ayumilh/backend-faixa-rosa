const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadDocuments } = require("../config/wasabi");

exports.uploadDocument = async (req, res) => {
    try {
        const userId = req.user?.id; // Obtém o ID do usuário autenticado
        const { type } = req.body;

        // Busca o acompanhante associado ao userId
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrada' });
        }

        const companionId = companion.id; // Obtém o companionId correto

        // Verifica se os arquivos foram enviados corretamente
        if (!req.files || !req.files.fileFront || !req.files.fileBack) {
            return res.status(400).json({ error: "Ambas as imagens (frente e verso) são obrigatórias." });
        }

        // Obtém as URLs das imagens enviadas para a Wasabi
        const fileFrontUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.fileFront[0].key}`;
        const fileBackUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.fileBack[0].key}`;

        console.log("Frente:", fileFrontUrl);
        console.log("Verso:", fileBackUrl);

        // Salva os links no banco de dados
        const document = await prisma.document.create({
            data: {
                companionId, // Associa o documento ao companionId correto
                type,
                fileFront: fileFrontUrl,
                fileBack: fileBackUrl,
                updatedAt: new Date(), // Atualiza manualmente
            },
        });

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