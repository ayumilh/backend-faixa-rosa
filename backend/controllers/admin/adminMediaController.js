const prisma = require('../../prisma/client');
// Aprovar media
exports.approvedMedia = async (req, res) => {
    try {
        const { id } = req.params;

        const companionId = parseInt(id);
        if (isNaN(companionId)) {
            return res.status(400).json({ error: "ID inválido. Deve ser um número." });
        }

        if (!req.user || req.user.userType !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado. Apenas administradores podem aprovar Mídia." });
        }

        const companion = await prisma.companion.findUnique({ where: { id: companionId } });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrado." });
        }

        // Encontrar a mídia correspondente ao acompanhante, com o status 'IN_ANALYSIS'
        const media = await prisma.media.findFirst({
            where: {
                companionId: companionId
            },
        });
        console.log("media", media);

        // Se não encontrar mídia ou a mídia já estiver aprovada
        if (!media) {
            return res.status(200).json({ error: "Mídia não encontrada ou já está em análise." });
        }

        // Verifique se a mídia já foi aprovada
        if (media.status === "APPROVED") {
            return res.status(200).json({ message: "Esta mídia já foi aprovada." });
        }

        // Atualiza o status da mídia para "APPROVED"
        await prisma.media.update({
            where: { id: media.id },
            data: {
                status: "APPROVED",
            },
        });

        return res.status(200).json({ message: "Mídia aprovada com sucesso." });
    } catch (error) {
        console.error("Erro ao verificar mídia:", error);
        return res.status(500).json({ message: "Erro ao processar a verificação de mídia." });
    }
};

// Rejeitar media
exports.rejectMedia = async (req, res) => {
    try {
        const { id } = req.params;

        const companionId = parseInt(id);
        if (isNaN(companionId)) {
            return res.status(400).json({ error: "ID inválido. Deve ser um número." });
        }

        // Verifica se o usuário é ADMIN
        if (!req.user || req.user.userType !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado. Apenas administradores podem rejeitar Mídia." });
        }

        // Verifica se a acompanhante existe
        const companion = await prisma.companion.findUnique({ where: { id: companionId } });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Encontrar a mídia correspondente ao acompanhante
        const media = await prisma.media.findFirst({
            where: {
                companionId: companionId, // Filtra pela ID do acompanhante
            },
        });

        if (!media) {
            return res.status(404).json({ error: "Mídia não encontrada." });
        }

        // Se a mídia já estiver rejeitada, retorne a mensagem informando
        if (media.status === "REJECTED") {
            return res.status(200).json({ message: "Esta mídia já foi rejeitada." });
        }

        // Atualiza o status da mídia para "REJECTED"
        await prisma.media.update({
            where: { id: media.id },
            data: {
                status: "REJECTED",
            },
        });

        return res.status(200).json({ message: "Mídia rejeitada com sucesso." });

    } catch (error) {
        console.error("Erro ao rejeitar Mídia:", error);
        return res.status(500).json({ message: "Erro ao processar a rejeição de Mídia." });
    }
};

// suspender media
exports.suspendMedia = async (req, res) => {
    try {
        const { id } = req.params;

        const companionId = parseInt(id);
        if (isNaN(companionId)) {
            return res.status(400).json({ error: "ID inválido. Deve ser um número." });
        }

        // Verifica se o usuário é ADMIN
        if (!req.user || req.user.userType !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado. Apenas administradores podem suspender Mídia." });
        }

        // Verifica se a acompanhante existe
        const companion = await prisma.companion.findUnique({ where: { id: companionId } });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrado." });
        }

        // Encontrar a mídia correspondente ao acompanhante
        const media = await prisma.media.findFirst({
            where: {
                companionId: companionId, // Busca a mídia pelo ID do acompanhante
            },
        });

        if (!media) {
            return res.status(404).json({ error: "Mídia não encontrada." });
        }

        // Se a mídia já estiver suspensa, retorne uma mensagem dizendo isso
        if (media.status === "SUSPENDED") {
            return res.status(200).json({ message: "Esta mídia já está suspensa." });
        }

        // Atualiza o status da mídia para "SUSPENDED"
        await prisma.media.update({
            where: { id: media.id },
            data: {
                status: "SUSPENDED",
            },
        });

        return res.status(200).json({ message: "Mídia suspensa com sucesso." });

    } catch (error) {
        console.error("Erro ao suspender Mídia:", error);
        return res.status(500).json({ message: "Erro ao suspender a mídia." });
    }
};
