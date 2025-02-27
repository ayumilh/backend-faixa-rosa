const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar contratantes
exports.listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                userType: 'CONTRATANTE'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                cpf: true,
                userType: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json(users);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
};


// Obter detalhes de um usuário específico
exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                cpf: true,
                userType: true,
                createdAt: true,
                updatedAt: true,
                companion: { // Caso o usuário seja acompanhante
                    select: {
                        id: true,
                        name: true,
                        profileStatus: true,
                        documentStatus: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        return res.status(500).json({ error: 'Erro ao obter usuário.' });
    }
};

// Atualizar status de um usuário (Ativar, Suspender, Bloquear)
exports.updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { profileVisibility } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { profileVisibility },
        });

        return res.status(200).json({
            message: `Usuário ${profileVisibility ? 'ativado' : 'suspenso'} com sucesso.`,
            user: updatedUser,
        });
    } catch (error) {
        console.error('Erro ao atualizar status do usuário:', error);
        return res.status(500).json({ error: 'Erro ao atualizar status do usuário.' });
    }
};

// Deletar usuário e dados vinculados
exports.deleteCompanionData = async (req, res) => {
    const { id } = req.params;

    try {
        // Verifica se o usuário existe e inclui as informações do companion
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: {
                companion: {
                    include: {
                        documents: true,             // Inclui todos os documentos associados ao companion
                        subscriptions: true,         // Inclui as assinaturas de plano
                        servicesOffered: true,       // Inclui serviços oferecidos
                        feedPosts: true,             // Inclui postagens no feed
                        weeklySchedules: true,       // Inclui os horários de trabalho
                        unavailableDays: true,       // Inclui os dias de indisponibilidade
                        reviews: true,               // Inclui as avaliações feitas
                    }
                },
            }
        });

        if (!user || !user.companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrado.' });
        }

        // Deleta as referências nas tabelas relacionadas com chave estrangeira
        if (user.companion.documents.length > 0) {
            await prisma.document.deleteMany({ where: { companionId: user.companion.id } });
        }
        if (user.companion.subscriptions.length > 0) {
            await prisma.planSubscription.deleteMany({ where: { companionId: user.companion.id } });
        }
        if (user.companion.servicesOffered.length > 0) {
            await prisma.companionService.deleteMany({ where: { companionId: user.companion.id } });
        }
        if (user.companion.feedPosts.length > 0) {
            await prisma.feedPost.deleteMany({ where: { companionId: user.companion.id } });
        }
        if (user.companion.weeklySchedules.length > 0) {
            await prisma.weeklySchedule.deleteMany({ where: { companionId: user.companion.id } });
        }
        if (user.companion.unavailableDays.length > 0) {
            await prisma.unavailableDates.deleteMany({ where: { companionId: user.companion.id } });
        }

        // Remover as referências no ActivityLog
        await prisma.activityLog.deleteMany({
            where: { companionId: user.companion.id }
        });

        // Remover as referências no ContactMethodCompanion se existir
        await prisma.contactMethodCompanion.deleteMany({
            where: { companionId: user.companion.id }
        });

        // Deletando o companion depois de remover todos os dados associados
        await prisma.companion.delete({ where: { id: user.companion.id } });

        return res.status(200).json({ message: 'Dados do acompanhante deletados com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar dados do acompanhante:', error);
        return res.status(500).json({ error: 'Erro ao deletar dados do acompanhante.' });
    }
};

