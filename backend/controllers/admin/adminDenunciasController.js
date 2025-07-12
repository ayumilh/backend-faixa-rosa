import prisma from '../../prisma/client.js';

//  Listar todas as denúncias
export async function listDenuncias(req, res) {
    try {
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
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json(denuncias);
    } catch (error) {
        console.error('Erro ao listar denúncias:', error);
        return res.status(500).json({ error: 'Erro ao listar denúncias.', details: error.message });
    }
};

//  Obter detalhes de uma denúncia específica
export async function getDenunciaById(req, res) {
    const { id } = req.params;

    try {
        const denuncia = await prisma.denuncia.findUnique({
            where: { id: parseInt(id) },
            include: {
                // Se o denunciante for um acompanhante
                denuncianteCompanion: {
                    select: { id: true, name: true, city: true, state: true, profileStatus: true, documentStatus: true }
                },
                // Se o denunciante for um contratante
                denuncianteContractor: {
                    select: { id: true, name: true, age: true, profileStatus: true, documentStatus: true }
                },
                // Se o denunciado for um acompanhante
                denunciadoCompanion: {
                    select: { id: true, name: true, city: true, state: true, profileStatus: true, documentStatus: true }
                },
                // Se o denunciado for um contratante
                denunciadoContractor: {
                    select: { id: true, name: true, age: true, profileStatus: true, documentStatus: true }
                }
            }
        });

        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }

        return res.status(200).json(denuncia);
    } catch (error) {
        console.error('Erro ao buscar denúncia:', error);
        return res.status(500).json({ error: 'Erro ao buscar denúncia.' });
    }
};

// Atualizar o status de uma denúncia
export async function updateDenunciaStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    // Verifica se o status é válido
    const validStatuses = ["PENDING", "ACCEPTED", "REJECTED"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Os valores permitidos são: PENDING, ACCEPTED, REJECTED.' });
    }

    try {
        // Primeiro, verifica se a denúncia existe
        const existingDenuncia = await prisma.denuncia.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingDenuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }

        // Se a denúncia existir, atualiza o status
        const denuncia = await prisma.denuncia.update({
            where: { id: parseInt(id) },
            data: { denunciaStatus: status }  // Usando o nome correto do campo
        });

        return res.status(200).json({ message: `Denúncia atualizada para ${status}.`, denuncia });

    } catch (error) {
        console.error('Erro ao atualizar status da denúncia:', error);
        return res.status(500).json({ error: 'Erro ao atualizar status da denúncia.', details: error.message });
    }
};


// Deletar uma denúncia (somente admin)
export async function deleteDenuncia(req, res) {
    const { id } = req.params;

    try {
        const denuncia = await prisma.denuncia.findUnique({
            where: { id: parseInt(id) }
        });

        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }

        await prisma.denuncia.delete({
            where: { id: parseInt(id) }
        });

        return res.status(200).json({ message: 'Denúncia deletada com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar denúncia:', error);
        return res.status(500).json({ error: 'Erro ao deletar denúncia.' });
    }
};
