const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.searchCompanionCity = async (req, res) => {
    try {
        // Recebendo os parâmetros da query
        let { cidade, estado } = req.query;

        if (!cidade || !estado) {
            return res.status(400).json({ error: "Cidade e estado são obrigatórios" });
        }

        // Removendo espaços extras e normalizando strings
        cidade = cidade.trim().toLowerCase();
        estado = estado.trim().toUpperCase();

        // Buscando acompanhantes na cidade e estado especificados
        const acompanhantes = await prisma.companion.findMany({
            where: {
                AND: [
                    {
                        city: {
                            equals: cidade,
                            mode: "insensitive",
                        }
                    },
                    {
                        state: {
                            equals: estado,
                            mode: "insensitive"
                        }
                    },
                    // { profileStatus: "ACTIVE" }
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
                        birthDate: true,
                    },
                },
                media: {
                    select: {
                        url: true,
                        mediaType: true,
                    },
                    take: 1, // Retorna apenas a primeira mídia
                },
                plan: {  // Trazendo informações sobre o plano do acompanhante
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        description: true,
                    },
                },
                planType: {  // Trazendo informações sobre o tipo de plano
                    select: {
                        id: true,
                        name: true,
                        size: true,
                    },
                },
            },
        });

        // Calculando a idade com base na data de nascimento
        const acompanhantesComIdade = acompanhantes.map(companion => {
            const birthDate = new Date(companion.user.birthDate);
            const age = new Date().getFullYear() - birthDate.getFullYear();
            const ageDate = new Date(new Date().setFullYear(birthDate.getFullYear()));

            // Se a data de nascimento ainda não passou este ano, subtrai um ano da idade
            companion.age = ageDate > new Date() ? age - 1 : age;
            return companion;
        });

        if (acompanhantesComIdade.length === 0) {
            return res.status(200).json(acompanhantesComIdade || []);
        }

        return res.status(200).json(acompanhantesComIdade);
    } catch (error) {
        console.error("Erro ao buscar acompanhantes:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
}


exports.searchCompanionProfile = async (req, res) => {
    const companionId = parseInt(req.query.id, 10);

    if (req.method === 'GET') {
        try {
            // Busque as informações da acompanhante no banco de dados
            const companion = await prisma.companion.findUnique({
                where: {
                    id: companionId, // Converte o id para um número inteiro
                },
                include: {
                    plan: true, // Inclui os dados do plano
                    planType: true, // Inclui os dados do tipo de plano
                    media: true, // Inclui as mídias (imagens/vídeos)
                    user: {
                        select: {
                            email: true, // Inclui o email do usuário
                            phone: true, // Inclui o telefone do usuário
                            birthDate: true, // Inclui a data de nascimento do usuário
                        },
                    },
                    servicesOffered: true, // Inclui os serviços oferecidos
                },
            });

            if (!companion) {
                return res.status(404).json({ message: 'Acompanhante não encontrada' });
            }

            // Verifique se o campo birthDate existe dentro de user
            if (!companion.user || !companion.user.birthDate) {
                return res.status(400).json({ message: 'Data de nascimento não encontrada para a acompanhante' });
            }

            // Calcular a idade corretamente usando a birthDate do usuário
            const birthDate = new Date(companion.user.birthDate); // Certifique-se que birthDate é um objeto Date válido
            const age = calculateAge(birthDate);

            companion.age = age; // Atribua a idade calculada ao objeto companion

            res.status(200).json(companion); // Retorna os dados da acompanhante
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar os dados da acompanhante' });
        }
    } else {
        res.status(405).json({ message: 'Método não permitido' });
    }
};

// Função para calcular a idade com base na data de nascimento
function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--; // Se ainda não fez aniversário neste ano
    }

    return age;
}


