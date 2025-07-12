import prisma from '../prisma/client.js';

// Função utilitária para buscar usuário (Companion ou Contractor)
async function buscarUsuario(userId) {
    const companion = await prisma.companion.findUnique({
        where: { userId },
        select: { id: true }
    });

    const contractor = await prisma.contractor.findUnique({
        where: { userId },
        select: { id: true }
    });

    return {
        companionId: companion?.id || null,
        contractorId: contractor?.id || null,
    };
};

// Criar denúncia
export async function createDenuncia(req, res) {
    try {
        const userId = req.user?.id;
        const { denunciadoId, motivo, descricao } = req.body;

        console.log("Dados da denúncia:", {
            userId,
            denunciadoId,
            motivo,
            descricao
        });

        if (!denunciadoId || !motivo) {
            return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
        }

        if (userId === denunciadoId) {
            return res.status(400).json({ error: 'Você não pode denunciar a si mesmo.' });
        }

        const denunciante = await buscarUsuario(userId);
        const denunciado = await buscarUsuario(denunciadoId);

        if (!denunciante.companionId && !denunciante.contractorId) {
            return res.status(403).json({ error: 'Somente usuários registrados podem fazer denúncias.' });
        }

        if (!denunciado.companionId && !denunciado.contractorId) {
            return res.status(404).json({ error: 'Denunciado não encontrado.' });
        }

        const denuncia = await prisma.denuncia.create({
            data: {
                denuncianteCompanionId: denunciante.companionId,
                denuncianteContractorId: denunciante.contractorId,
                denunciadoCompanionId: denunciado.companionId,
                denunciadoContractorId: denunciado.contractorId,
                motivo,
                descricao,
                denunciaStatus: 'PENDING',
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Denúncia registrada com sucesso.',
            data: denuncia,
        });

    } catch (error) {
        console.error("Erro ao criar denúncia:", error);
        return res.status(500).json({ error: 'Erro ao criar denúncia.', details: error.message });
    }
};

// Listar denúncias (admin)
export async function listDenuncias(req, res) {
    try {
        const { page = 1, limit = 20, status = '' } = req.query;

        const denuncias = await prisma.denuncia.findMany({
            where: status ? { denunciaStatus: status } : {},
            skip: (page - 1) * limit,
            take: parseInt(limit),
            include: {
                denuncianteCompanion: { select: { id: true, name: true, city: true, state: true } },
                denuncianteContractor: { select: { id: true, name: true, age: true } },
                denunciadoCompanion: { select: { id: true, name: true, city: true, state: true } },
                denunciadoContractor: { select: { id: true, name: true, age: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.denuncia.count({
            where: status ? { denunciaStatus: status } : {},
        });

        // 🔥 Mapeando para adicionar os nomes diretamente no objeto
        const denunciasFormatadas = denuncias.map((d) => ({
            ...d,
            denuncianteNome:
                d.denuncianteCompanion?.name ||
                d.denuncianteContractor?.name ||
                '—',
            denunciadoNome:
                d.denunciadoCompanion?.name ||
                d.denunciadoContractor?.name ||
                '—',
            denuncianteLocal:
                d.denuncianteCompanion
                    ? `${d.denuncianteCompanion.city}/${d.denuncianteCompanion.state}`
                    : d.denuncianteContractor
                    ? `Idade: ${d.denuncianteContractor.age}`
                    : '—',
            denunciadoLocal:
                d.denunciadoCompanion
                    ? `${d.denunciadoCompanion.city}/${d.denunciadoCompanion.state}`
                    : d.denunciadoContractor
                    ? `Idade: ${d.denunciadoContractor.age}`
                    : '—',
        }));

        return res.status(200).json({
            success: true,
            data: denunciasFormatadas,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Erro ao listar denúncias:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar denúncias.',
            error: error.message,
        });
    }
};

// Atualizar status da denúncia
export async function updateDenunciaStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, observacoes } = req.body;

        const denuncia = await prisma.denuncia.findUnique({
            where: { id: parseInt(id) },
        });

        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }

        const denunciaAtualizada = await prisma.denuncia.update({
            where: { id: parseInt(id) },
            data: {
                denunciaStatus: status,
                observacoes: observacoes || undefined,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Status da denúncia atualizado com sucesso.',
            data: denunciaAtualizada,
        });
    } catch (error) {
        console.error('Erro ao atualizar denúncia:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao atualizar denúncia.',
            error: error.message,
        });
    }
};

// Remover denúncia (opcional)
export async function removerDenuncia(req, res) {
    try {
        const id = parseInt(req.params.id, 10);

        const denuncia = await prisma.denuncia.findUnique({
            where: { id }
        });

        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }

        await prisma.denuncia.delete({
            where: { id }
        });

        return res.status(200).json({ message: 'Denúncia removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover denúncia:', error);
        return res.status(500).json({ error: 'Erro ao remover denúncia.', details: error.message });
    }
};
