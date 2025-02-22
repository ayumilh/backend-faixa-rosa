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
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Verifica se o usuário existe
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: { companion: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Se for acompanhante, remover dados vinculados
        if (user.companion) {
            await prisma.planSubscription.deleteMany({ where: { companionId: user.companion.id } });
            await prisma.document.deleteMany({ where: { companionId: user.companion.id } });
            await prisma.companion.delete({ where: { id: user.companion.id } });
        }

        // Excluir usuário
        await prisma.user.delete({ where: { id: parseInt(id) } });

        return res.status(200).json({ message: 'Usuário deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        return res.status(500).json({ error: 'Erro ao deletar usuário.' });
    }
};
