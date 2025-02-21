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
                    id: companionId,
                },
                select: {
                    id: true,
                    name: true,
                    description: true, // Agora a descrição será carregada corretamente
                    age: true,
                    city: true,
                    state: true,
                    profileStatus: true,
                    lastOnline: true,
                    points: true,
                    plan: true,
                    planType: true,
                    media: true,
                    user: {
                        select: {
                            email: true,
                            phone: true,
                            birthDate: true,
                        },
                    },
                    servicesOffered: {
                        include: {
                            service: true,
                        },
                    },
                    PhysicalCharacteristics: true,
                    timedServiceCompanion: {
                        include: {
                            TimedService: true, // Inclui os dados do serviço de tempo (name, description)
                        },
                    },
                    paymentMethods: {  // Obtém apenas os métodos de pagamento específicos da acompanhante
                        select: {
                            paymentMethod: true
                        },
                    },
                    lugares: {
                        include: {
                            location: true, // Inclui os dados da tabela Location
                        }
                    },
                    weeklySchedules: {
                        select: {
                            id: true,
                            dayOfWeek: true,
                            startTime: true,
                            endTime: true,
                            isActive: true,
                        }
                    }
                },
            });

            if (!companion) {
                return res.status(404).json({ message: 'Acompanhante não encontrada' });
            }

            if (!companion.user || !companion.user.birthDate) {
                return res.status(400).json({ message: 'Data de nascimento não encontrada para a acompanhante' });
            }

            // Calcular a idade corretamente
            const birthDate = new Date(companion.user.birthDate);
            const age = calculateAge(birthDate);
            companion.age = age;

            // Ajustar os serviços oferecidos para incluir nome e descrição
            companion.servicesOffered = companion.servicesOffered.map(service => ({
                id: service.id,
                companionId: service.companionId,
                serviceId: service.serviceId,
                isOffered: service.isOffered,
                price: service.price,
                name: service.service.name,
                description: service.service.description,
            }));

            // Ajustar os serviços por tempo para incluir nome e descrição
            companion.timedServiceCompanion = companion.timedServiceCompanion.map(service => ({
                id: service.id,
                companionId: service.companionId,
                timedServiceId: service.timedServiceId,
                isOffered: service.isOffered,
                price: service.price,
                name: service.TimedService?.name ?? "Nome não informado",
                description: service.TimedService?.description ?? "Descrição não informada",
            }));

            // Filtrar os métodos de pagamento para garantir que apenas os cadastrados no banco sejam exibidos
            companion.paymentMethods = companion.paymentMethods.map(method => method.paymentMethod);

            // Ajustar os dados da localização
            companion.lugares = companion.lugares.map(loc => ({
                id: loc.id,
                companionId: loc.companionId,
                locationId: loc.locationId,
                amenities: loc.amenities, // Lista de AmenityType[]
                location: loc.location ? {
                    id: loc.location.id,
                    name: loc.location.name,
                    address: loc.location.address,
                    city: loc.location.city,
                    state: loc.location.state,
                    country: loc.location.country
                } : null
            }));

            // Ajustar os horários semanais
            companion.weeklySchedules = companion.weeklySchedules.map(schedule => ({
                id: schedule.id,
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime || "Horário não informado",
                endTime: schedule.endTime || "Horário não informado",
                isActive: schedule.isActive,
            }));

            res.status(200).json(companion);
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