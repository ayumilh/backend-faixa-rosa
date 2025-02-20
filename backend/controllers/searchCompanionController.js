const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.searchCompanionCity = async (req, res) => {
    try {
        // Recebendo os parâmetros da query
        let { cidade, estado } = req.query;

        if (!cidade || !estado) {
            return res.status(400).json({ error: "Cidade e estado são obrigatórios" });
        }

        // 🔹 Removendo espaços extras e normalizando strings
        cidade = cidade.trim().toLowerCase();
        estado = estado.trim().toUpperCase();

        // Buscando acompanhantes na cidade e estado especificados
        const acompanhantes = await prisma.companion.findMany({
            where: {
                AND: [
                    {
                        city: {
                            equals: cidade,
                            mode: "insensitive", // 🔹 Faz a busca ignorando case-sensitive
                        }
                    },
                    {
                        state: {
                            equals: estado,
                            mode: "insensitive"
                        }
                    },
                    { profileStatus: "ACTIVE" }
                ]
            },
            select: {
                id: true,
                name: true,
                age: true,
                city: true,
                state: true,
                description: true,
                points: true,
                lastOnline: true,
                profileStatus: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                    },
                },
                media: {
                    select: {
                        url: true,
                        mediaType: true,
                    },
                    take: 1, // Retorna apenas a primeira mídia
                },
            },
        });

        if (acompanhantes.length === 0) {
            return res.status(404).json({ message: "Nenhuma acompanhante encontrada." });
        }

        return res.status(200).json(acompanhantes);
    } catch (error) {
        console.error("Erro ao buscar acompanhantes:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}
