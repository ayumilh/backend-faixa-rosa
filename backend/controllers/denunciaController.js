const prisma = require('../prisma/client'); 

// Criar uma denúncia    --- testar contratante denunciando
exports.createDenuncia = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { denunciadoId, motivo, descricao } = req.body;

        if (!denunciadoId || !motivo || !descricao) {
            return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
        }

        // Buscar o denunciante (pode ser Companion ou Contractor)
        const denuncianteCompanion = await prisma.companion.findUnique({
            where: { userId },
            select: { id: true }
        });

        const denuncianteContractor = await prisma.contractor.findUnique({
            where: { userId },
            select: { id: true }
        });

        if (!denuncianteCompanion && !denuncianteContractor) {
            return res.status(403).json({ error: 'Somente usuários registrados podem fazer denúncias.' });
        }

        // Buscar o denunciado (pode ser Companion ou Contractor)
        const denunciadoCompanion = await prisma.companion.findUnique({
            where: { userId: denunciadoId },
            select: { id: true }
        });

        const denunciadoContractor = await prisma.contractor.findUnique({
            where: { userId: denunciadoId },
            select: { id: true }
        });

        if (!denunciadoCompanion && !denunciadoContractor) {
            return res.status(404).json({ error: 'Denunciado não encontrado.' });
        }

        // Criar a denúncia com os IDs corretos
        const denuncia = await prisma.denuncia.create({
            data: {
                denuncianteCompanionId: denuncianteCompanion ? denuncianteCompanion.id : null,
                denuncianteContractorId: denuncianteContractor ? denuncianteContractor.id : null,
                denunciadoCompanionId: denunciadoCompanion ? denunciadoCompanion.id : null,
                denunciadoContractorId: denunciadoContractor ? denunciadoContractor.id : null,
                motivo,
                descricao,
                denunciaStatus: 'PENDING',
                createdAt: new Date(),
            },
        });

        return res.status(201).json({ message: 'Denúncia registrada com sucesso.', denuncia });

    } catch (error) {
        console.error("Erro ao criar denúncia:", error);
        return res.status(500).json({ error: 'Erro ao criar denúncia.', details: error.message });
    }
};



// Listar todas as denúncias
exports.listDenuncias = async (req, res) => {
    try {
        // Buscar todas as denúncias com os relacionamentos corretos
        const denuncias = await prisma.denuncia.findMany({
            include: {
                denuncianteCompanion: {
                    select: { id: true, name: true, city: true, state: true, profileStatus: true, documentStatus: true }
                },
                denuncianteContractor: {
                    select: { id: true, name: true, age: true, profileStatus: true, documentStatus: true }
                },
                denunciadoCompanion: {
                    select: { id: true, name: true, city: true, state: true, profileStatus: true, documentStatus: true }
                },
                denunciadoContractor: {
                    select: { id: true, name: true, age: true, profileStatus: true, documentStatus: true }
                }
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        return res.status(200).json(denuncias);
    } catch (error) {
        console.error('Erro ao listar denúncias:', error);
        return res.status(500).json({ error: 'Erro ao listar denúncias.', details: error.message });
    }
};


// Resolver uma denúncia (Excluir)
exports.removerDenuncia = async (req, res) => {
    try {
        // Pegando o ID da denúncia e convertendo para inteiro
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido.' });
        }

        // Verifica se a denúncia existe antes de deletar
        const denunciaExistente = await prisma.denuncia.findUnique({
            where: { id }
        });

        if (!denunciaExistente) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }

        // Remove a denúncia do banco de dados
        await prisma.denuncia.delete({
            where: { id }
        });

        return res.status(200).json({ message: 'Denúncia resolvida e removida.' });
    } catch (error) {
        console.error('Erro ao remover denúncia:', error);
        return res.status(500).json({ error: 'Erro ao remover denúncia.', details: error.message });
    }
};

