const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar um novo acompanhante
async function createCompanion(req, res) {
    const { name, age, description, city, state, paymentMethods } = req.body;
    const userId = req.user.id; // Usuário autenticado (pego do middleware)

    try {
        // Verifica se o usuário tem permissão
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.userType !== 'ACOMPANHANTE') {
            return res.status(403).json({ error: 'Você não tem permissão para criar um acompanhante' });
        }

        // Cria o registro de acompanhante
        const companion = await prisma.companion.create({
            data: {
                userId,
                name,
                age,
                description,
                city,
                state,
                paymentMethods: {
                    create: paymentMethods.map((method) => ({ paymentMethod: method })),
                },
            },
        });

        return res.status(201).json({ message: 'Acompanhante criado com sucesso', companion });
    } catch (error) {
        console.error('Erro ao criar acompanhante:', error);
        return res.status(500).json({ error: 'Erro ao criar acompanhante' });
    }
}

// Listar todos os acompanhantes
async function listCompanions(req, res) {
    try {
        const companions = await prisma.companion.findMany({
            include: {
                paymentMethods: true, // Incluir métodos de pagamento
            },
        });

        return res.status(200).json(companions);
    } catch (error) {
        console.error('Erro ao listar acompanhantes:', error);
        return res.status(500).json({ error: 'Erro ao listar acompanhantes' });
    }
}

// Obter detalhes de um acompanhante específico
async function getCompanionById(req, res) {
    const { id } = req.params;

    try {
        const companion = await prisma.companion.findUnique({
            where: { id: parseInt(id) },
            include: {
                paymentMethods: true, // Incluir métodos de pagamento
            },
        });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrado' });
        }

        return res.status(200).json(companion);
    } catch (error) {
        console.error('Erro ao obter acompanhante:', error);
        return res.status(500).json({ error: 'Erro ao obter acompanhante' });
    }
}

// Atualizar informações de um acompanhante
async function updateCompanion(req, res) {
    const { id } = req.params;
    const { name, age, description, city, state, paymentMethods } = req.body;

    try {
        // Verifica se o acompanhante existe
        const companion = await prisma.companion.findUnique({ where: { id: parseInt(id) } });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrado' });
        }

        // Atualiza o registro
        const updatedCompanion = await prisma.companion.update({
            where: { id: parseInt(id) },
            data: {
                name,
                age,
                description,
                city,
                state,
                paymentMethods: {
                    deleteMany: {}, // Remove todos os métodos de pagamento antigos
                    create: paymentMethods.map((method) => ({ paymentMethod: method })), // Adiciona os novos
                },
            },
        });

        return res.status(200).json({ message: 'Acompanhante atualizado com sucesso', updatedCompanion });
    } catch (error) {
        console.error('Erro ao atualizar acompanhante:', error);
        return res.status(500).json({ error: 'Erro ao atualizar acompanhante' });
    }
}

// Excluir um acompanhante
async function deleteCompanion(req, res) {
    const { id } = req.params;

    try {
        // Verifica se o acompanhante existe
        const companion = await prisma.companion.findUnique({ where: { id: parseInt(id) } });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrado' });
        }

        // Remove o registro
        await prisma.companion.delete({ where: { id: parseInt(id) } });

        return res.status(200).json({ message: 'Acompanhante excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir acompanhante:', error);
        return res.status(500).json({ error: 'Erro ao excluir acompanhante' });
    }
}

module.exports = {
    createCompanion,
    listCompanions,
    getCompanionById,
    updateCompanion,
    deleteCompanion,
};
