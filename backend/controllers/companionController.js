const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// adicionar informações de acompanhante
exports.addCompanionInfo = async (req, res) => {
    const {
        name,
        age,
        description,
        city,
        state,
        status,
        ageCategories,
        atendimentos,
        cabelos,
        contactMethods,
        corpos,
        estaturas,
        etnias,
        lugares,
        paymentMethods,
        pubis,
        seios,
        servicosEspeciais,
        servicosGerais,
    } = req.body;

    console.log(req.body);

    const userId = req.user?.id; // ID do usuário autenticado

    try {
        // Verifica se o usuário existe e é do tipo ACOMPANHANTE
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        if (user.userType !== 'ACOMPANHANTE') {
            return res.status(403).json({ error: 'Apenas usuários do tipo ACOMPANHANTE podem adicionar informações.' });
        }

        // Validação de campos obrigatórios
        if (!name || !age || !description || !city || !state || !status) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }

        // Verifica se já existe um perfil na tabela Companion
        const existingCompanion = await prisma.companion.findUnique({
            where: { userId: userId },
        });

        if (existingCompanion) {
            return res.status(400).json({ error: 'Perfil de acompanhante já existe. Use a função de atualização.' });
        }

        // Cria o perfil de acompanhante
        const companion = await prisma.companion.create({
            data: {
                userId,
                name,
                age,
                description,
                city,
                state,
                status,
                ageCategories: {
                    create: ageCategories?.map((category) => ({ ageCategory: category })) || [],
                },
                atendimentos: {
                    create: atendimentos?.map((item) => ({ atendimento: item })) || [],
                },
                cabelos: {
                    create: cabelos?.map((item) => ({ cabelo: item })) || [],
                },
                contactMethods: {
                    create: contactMethods?.map((method) => ({ contactMethod: method })) || [],
                },
                corpos: {
                    create: corpos?.map((item) => ({ corpo: item })) || [],
                },
                estaturas: {
                    create: estaturas?.map((item) => ({ estatura: item })) || [],
                },
                etnias: {
                    create: etnias?.map((item) => ({ etnia: item })) || [],
                },
                lugares: {
                    create: lugares?.map((item) => ({ lugar: item })) || [],
                },
                paymentMethods: {
                    create: paymentMethods?.map((method) => ({ paymentMethod: method })) || [],
                },
                pubis: {
                    create: pubis?.map((item) => ({ pubis: item })) || [],
                },
                seios: {
                    create: seios?.map((item) => ({ seios: item })) || [],
                },
                servicosEspeciais: {
                    create: servicosEspeciais?.map((item) => ({ servico: item })) || [],
                },
                servicosGerais: {
                    create: servicosGerais?.map((item) => ({ servico: item })) || [],
                },
            },
        });

        return res.status(201).json({ message: 'Informações de acompanhante adicionadas com sucesso.', companion });
    } catch (error) {
        console.error('Erro ao adicionar informações de acompanhante:', error.message);
        return res.status(500).json({ error: 'Erro ao processar as informações de acompanhante.' });
    }
};


// Listar todos os acompanhantes
exports.listCompanions = async (req, res) => {
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
exports.getCompanionById = async (req, res) => {
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
exports.updateCompanion = async (req, res) => {
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
exports.deleteCompanion = async (req, res) => {
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