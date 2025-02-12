const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Aprovar documento
exports.approvedDocuments = async (req, res) => {
    try {
        const { id } = req.params;

        const companionId = parseInt(id);
        if (isNaN(companionId)) {
            return res.status(400).json({ error: "ID inválido. Deve ser um número." });
        }

        if (!req.user || req.user.userType !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado. Apenas administradores podem aprovar documentos." });
        }

        const companion = await prisma.companion.findUnique({ where: { id: companionId } });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrado." });
        }

        await prisma.document.updateMany({
            where: { companionId },
            data: { documentStatus: "APPROVED", updatedAt: new Date() },
        });

        const updatedDocuments = await prisma.document.findMany({
            where: { companionId },
            select: { documentStatus: true },
        });

       const allApproved = updatedDocuments.every(doc => doc.documentStatus === "APPROVED");

       const updatedCompanion = await prisma.companion.update({
           where: { id: companionId },
           data: { documentStatus: allApproved ? "APPROVED" : "PENDING" }, 
           include: { documents: true },
       });

       return res.status(200).json({
           message: "Documentos aprovados com sucesso.",
           companion: updatedCompanion,
       });
    } catch (error) {
        console.error("Erro ao verificar documentos:", error);
        return res.status(500).json({ message: "Erro ao processar a verificação de documentos." });
    }
};

// rejeitar documento
exports.rejectDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const companionId = parseInt(id);
        if (isNaN(companionId)) {
            return res.status(400).json({ error: "ID inválido. Deve ser um número." });
        }

        // 🔥 Verifica se o usuário é ADMIN
        if (!req.user || req.user.userType !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado. Apenas administradores podem rejeitar documentos." });
        }

        // 🔥 Verifica se a acompanhante existe
        const companion = await prisma.companion.findUnique({ where: { id: companionId } });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // 🔥 Rejeita os documentos da acompanhante
        await prisma.document.updateMany({
            where: { companionId: companionId },
            data: { documentStatus: "REJECTED" },
        });

        // 🔥 Atualiza o status da acompanhante para "REJECTED"
        await prisma.companion.update({
            where: { id: companionId },
            data: { documentStatus: "REJECTED" }
        });

        return res.status(200).json({ message: "Documentos rejeitados com sucesso." });

    } catch (error) {
        console.error("Erro ao rejeitar documentos:", error);
        return res.status(500).json({ message: "Erro ao processar a rejeição de documentos." });
    }
};