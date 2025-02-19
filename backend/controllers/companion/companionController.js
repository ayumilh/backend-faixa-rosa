const { PrismaClient, LocationType } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require('joi');
const { uploadSingleVideo, uploadDocuments } = require("../../config/wasabi");

// Listar todos os acompanhantes
exports.listCompanions = async (req, res) => {
    try {
        const companions = await prisma.companion.findMany({
            include: {
                paymentMethods: true,
            },
        });

        return res.status(200).json(companions);
    } catch (error) {
        console.error('Erro ao listar acompanhantes:', error);
        return res.status(500).json({ error: 'Erro ao listar acompanhantes' });
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

// Atualizar informações de um acompanhante
exports.updateCompanion = async (req, res) => {
    const userId = req.user?.id;
    const { name, description, city, state } = req.body;

    try {
        // Verifica se o acompanhante existe
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrada' });
        }

        // Atualiza o registro
        const updatedCompanion = await prisma.companion.update({
            where: { userId },
            data: {
                name,
                description,
                city,
                state,
            },
        });

        return res.status(200).json({ message: 'Acompanhante atualizado com sucesso', updatedCompanion });
    } catch (error) {
        console.error('Erro ao atualizar acompanhante:', error);
        return res.status(500).json({ error: 'Erro ao atualizar acompanhante' });
    }
};

// Atualizar descrição do perfil
exports.updateCompanionDescriptionProfile = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Se a requisição for `application/json`, os dados estão em `req.body`
        let data = req.body;

        // Se for `multipart/form-data`, os dados vêm no `req.body`, mas podem precisar de parsing
        if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
            data = JSON.parse(JSON.stringify(req.body)); // Garante que os valores vêm como strings
        }

        const schema = Joi.object({
            description: Joi.string().allow(null, ""),
            gender: Joi.string().required(),
            genitalia: Joi.string().allow(null, ""),
            weight: Joi.number().precision(2).positive().allow(null, 0),
            height: Joi.number().integer().positive().allow(null, 0),
            ethnicity: Joi.string().allow(null, ""),
            eyeColor: Joi.string().allow(null, ""),
            hairStyle: Joi.string().allow(null, ""),
            hairLength: Joi.string().allow(null, ""),
            shoeSize: Joi.string().allow(null, ""),
            hasSilicone: Joi.boolean().truthy("true").falsy("false").default(false),
            hasTattoos: Joi.boolean().truthy("true").falsy("false").default(false),
            hasPiercings: Joi.boolean().truthy("true").falsy("false").default(false),
            smoker: Joi.boolean().truthy("true").falsy("false").default(false),
            hasComparisonMedia: Joi.boolean().truthy("true").falsy("false").default(false),
        });

        const { error, value } = schema.validate(data, { convert: true });

        if (error) return res.status(400).json({ error: error.details[0].message });

        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

        const validData = {
            gender: value.gender,
            genitalia: value.genitalia || null,
            weight: value.weight || null,
            height: value.height || null,
            ethnicity: value.ethnicity || null,
            eyeColor: value.eyeColor || null,
            hairStyle: value.hairStyle || null,
            hairLength: value.hairLength || null,
            shoeSize: value.shoeSize || null,
            hasSilicone: value.hasSilicone,
            hasTattoos: value.hasTattoos,
            hasPiercings: value.hasPiercings,
            smoker: value.smoker,
            hasComparisonMedia: value.hasComparisonMedia,
        };

        await prisma.physicalCharacteristics.upsert({
            where: { companionId: companion.id },
            update: validData,
            create: { ...validData, companionId: companion.id },
        });

        // ✅ Processa o vídeo se houver
        if (req.file) {
            const videoUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.file.key}`;

            await prisma.media.create({
                data: {
                    companionId: companion.id,
                    url: videoUrl,
                    mediaType: "VIDEO",
                },
            });

            return res.status(200).json({
                message: "Vídeo enviado com sucesso. Aguarde a aprovação do admin.",
                videoUrl: videoUrl
            });
        }

        return res.status(200).json({
            message: "Descrição do perfil atualizada com sucesso.",
        });

    } catch (error) {
        console.error("Erro ao processar características físicas e vídeo:", error);
        return res.status(500).json({ error: "Erro ao processar os dados." });
    }
};
exports.getCompanionDescriptionProfile = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Verifica se a acompanhante existe e inclui as relações corretas
        const companion = await prisma.companion.findUnique({
            where: { userId },
            include: {
                PhysicalCharacteristics: true, // Certifique-se de que este é o nome correto no seu schema
                media: {
                    where: { mediaType: "VIDEO" },
                    select: { id: true, url: true, createdAt: true }
                }
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Formata a resposta corretamente
        const response = {
            id: companion.id,
            name: companion.name,
            age: companion.age,
            description: companion.description,
            characteristics: companion.PhysicalCharacteristics || null,
            video: companion.media.length > 0 ? companion.media[0] : null
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error("Erro ao buscar perfil da acompanhante:", error);
        return res.status(500).json({ error: "Erro ao processar os dados." });
    }
};
// Adicionar Características Físicas
// exports.addPhysicalCharacteristics = async (req, res) => {
//     const userId = req.user?.id;

//     const {
//         gender, genitalia, weight, height, estatura, ethnicity, eyeColor,
//         hairStyle, hairLength, shoeSize, hasSilicone, hasTattoos,
//         hasPiercings, smoker, pubis, bodyType, breastType, description
//     } = req.body;

//     if (!gender) {
//         return res.status(400).json({ error: "O campo 'gender' é obrigatório." });
//     }


//     try {
//         const companion = await prisma.companion.findUnique({ where: { userId } });

//         if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

//         const validData = {
//             gender,
//             genitalia: genitalia || undefined,
//             weight: weight || undefined,
//             height: height || undefined,
//             estatura: estatura || undefined,
//             ethnicity: ethnicity || undefined,
//             eyeColor: eyeColor || undefined,
//             hairStyle: hairStyle || undefined,
//             hairLength: hairLength || undefined,
//             shoeSize: shoeSize || undefined,
//             hasSilicone: hasSilicone ?? undefined,
//             hasTattoos: hasTattoos ?? undefined,
//             hasPiercings: hasPiercings ?? undefined,
//             smoker: smoker ?? undefined,
//             pubis: pubis || undefined,
//             bodyType: bodyType || undefined,
//             breastType: breastType || undefined,
//             description: description || undefined,
//             companionId: companion.id
//         };

//         const existingCharacteristics = await prisma.physicalCharacteristics.findUnique({
//             where: { companionId: companion.id }
//         });

//         if (existingCharacteristics) {
//             await prisma.physicalCharacteristics.update({
//                 where: { companionId: companion.id },
//                 data: validData
//             });
//         } else {
//             await prisma.physicalCharacteristics.create({
//                 data: validData
//             });
//         }

//         return res.status(200).json({ message: 'Características físicas cadastradas com sucesso.' });

//     } catch (error) {
//         console.error('Erro ao cadastrar características físicas:', error);
//         return res.status(500).json({ error: 'Erro ao processar os dados.' });
//     }
// };
// Adicionar Mídia de Comparação (Vídeo obrigatório)
// exports.uploadCompanionMedia = async (req, res) => {
//     try {
//         const userId = req.user?.id;

//         if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo de vídeo enviado.' });

//         const videoUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.file.key}`;

//         const companion = await prisma.companion.findUnique({ where: { userId } });

//         if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

//         const newMedia = await prisma.media.create({
//             data: {
//                 companionId: companion.id,
//                 url: videoUrl,
//                 mediaType: "VIDEO",
//             },
//         });

//         return res.status(200).json({
//             message: "Vídeo enviado e armazenado com sucesso.",
//             videoUrl,
//             media: newMedia,
//         });
//     } catch (error) {
//         console.error('Erro ao adicionar vídeo de comparação:', error);
//         return res.status(500).json({ error: 'Erro ao processar o vídeo.' });
//     }
// };


// Adicionar Contato
exports.updateCompanionContact = async (req, res) => {
    const userId = req.user?.id;
    const {
        whatsappNumber,
        whatsappMessage,
        telegramUsername,
        telegramMessage,
        phoneNumber,
    } = req.body;

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrada.' });
        }

        await prisma.contactMethodCompanion.deleteMany({
            where: { companionId: companion.id },
        });

        await prisma.contactMethodCompanion.create({
            data: {
                companionId: companion.id,
                whatsappNumber,
                whatsappMessage,
                telegramUsername,
                telegramMessage,
                phoneNumber
            },
        });

        return res
            .status(200)
            .json({ message: 'Dados de contato atualizados com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar contato:', error);
        return res.status(500).json({ error: 'Erro ao processar os dados.', details: error.message });
    }
};
exports.getCompanionContact = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Verifica se a acompanhante existe e busca os contatos corretamente
        const companion = await prisma.companion.findUnique({
            where: { userId },
            include: {
                contactMethods: true // Use o nome correto da relação no Prisma
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Se não houver contato cadastrado, retorna um objeto vazio
        const contact = companion.contactMethods[0] || {};

        return res.status(200).json({
            message: "Dados de contato recuperados com sucesso.",
            contact: {
                whatsappNumber: contact.whatsappNumber || null,
                whatsappMessage: contact.whatsappMessage || null,
                telegramUsername: contact.telegramUsername || null,
                telegramMessage: contact.telegramMessage || null,
                phoneNumber: contact.phoneNumber || null
            }
        });

    } catch (error) {
        console.error("Erro ao buscar dados de contato:", error);
        return res.status(500).json({ error: "Erro ao processar os dados." });
    }
};


// Adicionar Serviços e Preços
exports.updateCompanionServicesAndPrices = async (req, res) => {
    const userId = req.user?.id;
    const { services } = req.body;

    if (!Array.isArray(services) || services.length === 0) {
        return res.status(400).json({ error: "Lista de serviços inválida ou vazia." });
    }

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        console.log("📌 Serviços recebidos para atualização:", JSON.stringify(services, null, 2));

        // Obtém os IDs dos serviços a serem atualizados
        const requestedServiceIds = services.map(s => s.id).filter(id => id !== null && id !== undefined);

        if (requestedServiceIds.length === 0) {
            return res.status(400).json({ error: "Nenhum ID de serviço válido foi enviado." });
        }

        // Busca os serviços existentes no banco
        const validServices = await prisma.serviceOffered.findMany({
            where: { id: { in: requestedServiceIds } }
        });

        const validServiceIds = validServices.map(s => s.id);
        const invalidServices = requestedServiceIds.filter(id => !validServiceIds.includes(id));

        // Se houver serviços inválidos, retorna erro
        if (invalidServices.length > 0) {
            return res.status(400).json({
                error: "Os seguintes serviços não existem no banco de dados.",
                invalidServiceIds: invalidServices
            });
        }

        // Busca serviços já cadastrados para esse acompanhante
        const existingServices = await prisma.serviceCompanionOffered.findMany({
            where: { companionId: companion.id }
        });

        const existingServiceMap = new Map(existingServices.map(s => [s.serviceId, s]));

        // Processa cada serviço recebido no payload
        for (const service of services) {
            const isOffered = service.isOffered ?? false;
            const price = service.price ?? null;

            if (existingServiceMap.has(service.id)) {
                // Se já existe, atualiza
                await prisma.serviceCompanionOffered.update({
                    where: { id: existingServiceMap.get(service.id).id },
                    data: { isOffered, price }
                });
                console.log(`🔄 Serviço ID ${service.id} atualizado -> isOffered: ${isOffered}, price: ${price}`);
            } else {
                // Se não existe, cria um novo
                await prisma.serviceCompanionOffered.create({
                    data: {
                        companionId: companion.id,
                        serviceId: service.id,
                        isOffered,
                        price
                    }
                });
                console.log(`🆕 Serviço ID ${service.id} adicionado -> isOffered: ${isOffered}, price: ${price}`);
            }
        }

        console.log("✅ Atualização concluída com sucesso!");
        return res.status(200).json({ message: "Serviços e preços atualizados com sucesso." });

    } catch (error) {
        console.error("❌ Erro ao atualizar serviços e preços:", error);
        return res.status(500).json({ error: "Erro ao processar os dados.", details: error.message });
    }
};
exports.getCompanionServicesAndPrices = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Verifica se a acompanhante existe
        const companion = await prisma.companion.findUnique({
            where: { userId }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Busca todos os serviços disponíveis na tabela ServiceOffered
        const allServices = await prisma.serviceOffered.findMany();

        // Busca os serviços que essa acompanhante oferece na tabela ServiceCompanionOffered
        const companionServices = await prisma.serviceCompanionOffered.findMany({
            where: { companionId: companion.id }
        });

        // Mapeia os serviços oferecidos para um objeto de referência (para facilitar a verificação)
        const companionServicesMap = new Map(
            companionServices.map(service => [service.serviceId, service])
        );

        // Formata a resposta, verificando quais serviços a acompanhante oferece
        const formattedServices = allServices.map(service => {
            const companionService = companionServicesMap.get(service.id);
            return {
                id: service.id,
                name: service.name,
                description: service.description,
                isOffered: companionService ? companionService.isOffered : false, // Pega o valor correto do banco
                price: companionService ? companionService.price : null // Se não existir, assume null
            };
        });

        return res.status(200).json({
            message: "Lista de serviços recuperada com sucesso.",
            services: formattedServices
        });

    } catch (error) {
        console.error("Erro ao buscar serviços e preços:", error);
        return res.status(500).json({ error: "Erro ao processar os dados.", details: error.message });
    }
};


// Adicionar Horários
exports.updateWeeklySchedule = async (req, res) => {
    const userId = req.user?.id;
    const { schedule } = req.body;

    try {
        // Busca o acompanhante pelo userId
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrada.' });
        }

        // Percorre a lista de horários e faz update ou insert
        for (const day of schedule) {
            await prisma.weeklySchedule.upsert({
                where: {
                    companionId_dayOfWeek: {
                        companionId: companion.id,  // Pegue do request
                        dayOfWeek: day.dayOfWeek
                    }
                },
                update: {
                    startTime: day.startTime,
                    endTime: day.endTime,
                    isActive: day.isActive
                },
                create: {
                    companionId: companion.id,
                    dayOfWeek: day.dayOfWeek,
                    startTime: day.startTime,
                    endTime: day.endTime,
                    isActive: day.isActive
                }
            });
        }

        return res.status(200).json({ message: 'Horários semanais atualizados com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar horários semanais:', error);
        return res.status(500).json({ error: 'Erro ao processar os dados.', details: error.message });
    }
};

exports.getWeeklySchedule = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Verifica se a acompanhante existe e busca os horários corretamente
        const companion = await prisma.companion.findUnique({
            where: { userId },
            include: {
                weeklySchedules: true // Use o nome correto da relação no Prisma
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Formata a resposta para um array organizado por dia da semana
        const schedule = companion.weeklySchedules.map(day => ({
            id: day.id,
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime || "Não definido",
            endTime: day.endTime || "Não definido",
            isActive: day.isActive
        }));

        return res.status(200).json({
            message: "Horários semanais recuperados com sucesso.",
            schedule
        });

    } catch (error) {
        console.error("Erro ao buscar horários semanais:", error);
        return res.status(500).json({ error: "Erro ao processar os dados." });
    }
};


// dias indisponíveis
exports.updateUnavailableDates = async (req, res) => {
    const userId = req.user?.id;
    const { unavailableDates } = req.body;

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrada.' });
        }

        await prisma.unavailableDates.deleteMany({
            where: { companionId: companion.id },
        });

        const datesData = unavailableDates.map((date) => ({
            companionId: companion.id,
            date: new Date(date),
        }));

        await prisma.unavailableDates.createMany({ data: datesData });

        return res.status(200).json({ message: 'Datas indisponíveis atualizadas com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar datas indisponíveis:', error);
        return res.status(500).json({
            error: 'Erro ao processar os dados.',
            details: error.message,
        });
    }
};
exports.getUnavailableDates = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Verifica se a acompanhante existe e busca as datas indisponíveis corretamente
        const companion = await prisma.companion.findUnique({
            where: { userId },
            include: {
                unavailableDays: true // Use o nome correto da relação no Prisma
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Formata as datas para um array de strings no formato YYYY-MM-DD
        const unavailableDates = companion.unavailableDays.map(date => date.date.toISOString().split("T")[0]);

        return res.status(200).json({
            message: "Datas indisponíveis recuperadas com sucesso.",
            unavailableDates
        });

    } catch (error) {
        console.error("Erro ao buscar datas indisponíveis:", error);
        return res.status(500).json({ error: "Erro ao processar os dados." });
    }
};


// Atualizar Localização e Locais Atendidos
exports.updateLocationManagement = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { city, state, locations, amenities } = req.body;

        // Verifica se a acompanhante existe
        const companion = await prisma.companion.findUnique({ where: { userId } });
        if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

        // Atualiza cidade e estado da acompanhante
        if (city && state) {
            await prisma.companion.update({
                where: { id: companion.id },
                data: { city, state }
            });
        }

        // Atualiza os locais atendidos (se houver)
        let locationCompanionIds = [];
        if (locations && locations.length > 0) {
            // Deleta locais anteriores
            await prisma.locationCompanion.deleteMany({ where: { companionId: companion.id } });

            // Converte os nomes enviados para ENUMs válidos
            const validLocations = locations.map(loc => loc.name).filter(name => Object.values(LocationType).includes(name));

            if (validLocations.length !== locations.length) {
                return res.status(400).json({ error: 'Alguns locais enviados não são válidos no enum LocationType.' });
            }

            // Busca os locais no banco de dados usando ENUM
            const locationRecords = await prisma.location.findMany({
                where: { name: { in: validLocations } }
            });

            // Verifica se todos os locais existem no banco
            const foundLocationIds = locationRecords.map(loc => loc.id);
            const missingLocations = validLocations.filter(name => !locationRecords.find(loc => loc.name === name));

            if (missingLocations.length > 0) {
                return res.status(400).json({ error: `Os seguintes locais não existem no banco: ${missingLocations.join(', ')}` });
            }

            // Cria as associações entre a acompanhante e os locais encontrados
            const locationData = foundLocationIds.map(locationId => ({
                companionId: companion.id,
                locationId
            }));

            // Inserir novos registros e capturar os IDs criados
            await prisma.locationCompanion.createMany({ data: locationData });

            // Buscar os registros criados para atualizar as comodidades
            const updatedLocationCompanions = await prisma.locationCompanion.findMany({
                where: { companionId: companion.id }
            });
            locationCompanionIds = updatedLocationCompanions.map(loc => loc.id);
        }

        // Atualiza as comodidades da acompanhante nos locais atendidos
        if (amenities && amenities.length > 0 && locationCompanionIds.length > 0) {
            await Promise.all(locationCompanionIds.map(async (locationCompanionId) => {
                await prisma.locationCompanion.update({
                    where: { id: locationCompanionId },
                    data: { amenities }
                });
            }));
        }

        return res.status(200).json({ message: 'Localização, locais atendidos e comodidades atualizados com sucesso.' });

    } catch (error) {
        console.error('Erro ao atualizar localização, locais atendidos e comodidades:', error);
        return res.status(500).json({ error: 'Erro ao processar os dados.', details: error.message });
    }
};
exports.getLocationManagement = async (req, res) => {
    const userId = req.user?.id;

    try {
        // Verifica se a acompanhante existe
        const companion = await prisma.companion.findUnique({
            where: { userId },
            select: {
                id: true,
                city: true,
                state: true
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Busca os locais atendidos da acompanhante, incluindo o nome do local e amenities
        const attendedLocations = await prisma.locationCompanion.findMany({
            where: { companionId: companion.id },
            include: {
                location: true // Inclui os detalhes da relação Location
            }
        });

        // Formata a resposta para incluir os locais atendidos
        const formattedLocations = attendedLocations.map(loc => ({
            id: loc.locationId,
            name: loc.location?.name
        }));

        // Extrai todas as comodidades associadas à acompanhante (sem repetir)
        const allAmenities = [...new Set(attendedLocations.flatMap(loc => loc.amenities || []))];

        return res.status(200).json({
            city: companion.city,
            state: companion.state,
            attendedLocations: formattedLocations,
            amenities: allAmenities
        });

    } catch (error) {
        console.error("Erro ao recuperar locais atendidos:", error);
        return res.status(500).json({ error: "Erro ao processar os dados.", details: error.message });
    }
};


// Atualizar Cidade onde a acompanhante atende
// exports.updateCompanionLocation = async (req, res) => {
//     const userId = req.user?.id;
//     const { city, state } = req.body;

//     try {
//         await prisma.companion.update({
//             where: { userId },
//             data: { city, state }
//         });

//         return res.status(200).json({ message: 'Localização atualizada com sucesso.' });

//     } catch (error) {
//         console.error('Erro ao atualizar localização:', error);
//         return res.status(500).json({ error: 'Erro ao processar os dados.' });
//     }
// };
// Atualizar Locais Atendidos
// exports.updateAttendedLocations = async (req, res) => {
//     const userId = req.user?.id;
//     const { locations } = req.body;

//     try {
//         const companion = await prisma.companion.findUnique({ where: { userId } });

//         if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

//         await prisma.locationCompanion.deleteMany({ where: { companionId: companion.id } });

//         const locationRecords = await prisma.location.findMany({
//             where: {
//                 name: { in: locations.map(loc => loc.name) }
//             }
//         });

//         // Se algum local enviado não existir no banco, retorna erro
//         const foundLocationIds = locationRecords.map(loc => loc.id);
//         const foundLocationNames = locationRecords.map(loc => loc.name);
//         const missingLocations = locations.map(loc => loc.name).filter(name => !foundLocationNames.includes(name));

//         if (missingLocations.length > 0) {
//             return res.status(400).json({ error: `Os seguintes locais não existem no banco: ${missingLocations.join(', ')}` });
//         }

//         const locationData = foundLocationIds.map(locationId => ({
//             companionId: companion.id,
//             locationId
//         }));

//         await prisma.locationCompanion.createMany({ data: locationData });

//         return res.status(200).json({ message: 'Locais atendidos atualizados com sucesso.' });

//     } catch (error) {
//         console.error('Erro ao atualizar locais atendidos:', error);
//         return res.status(500).json({ error: 'Erro ao processar os dados.', details: error.message });
//     }
// };


// Adicionar Dados Financeiros e Serviços Oferecidos
exports.updateCompanionFinanceAndServices = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { paymentMethods, timedServices } = req.body;

        console.log("Recebendo dados do frontend:", JSON.stringify(req.body, null, 2));

        // Busca o Companion no banco
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) return res.status(404).json({ error: "Acompanhante não encontrada." });

        // Atualiza os métodos de pagamento
        await prisma.paymentMethodCompanion.deleteMany({ where: { companionId: companion.id } });

        const acceptedPaymentMethods = paymentMethods.filter(method => method.aceito);

        if (acceptedPaymentMethods.length > 0) {
            await prisma.paymentMethodCompanion.createMany({
                data: acceptedPaymentMethods.map(method => ({
                    companionId: companion.id,
                    paymentMethod: method.nome
                }))
            });
        }

        console.log(`Métodos de pagamento atualizados. Métodos aceitos: ${acceptedPaymentMethods.map(m => m.nome).join(', ')}`);

        // Atualizar os serviços corretamente
        for (const service of timedServices) {
            const existingService = await prisma.timedServiceCompanion.findFirst({
                where: {
                    companionId: companion.id,
                    timedServiceId: service.id
                }
            });

            const isOffered = service.isOffered;

            console.log(`Atualizando serviço ID: ${service.id} -> isOffered: ${isOffered}, price: ${service.price}`);

            if (existingService) {
                await prisma.timedServiceCompanion.update({
                    where: { id: existingService.id },
                    data: {
                        isOffered: isOffered,
                        price: service.price ?? null
                    }
                });
            } else {
                await prisma.timedServiceCompanion.create({
                    data: {
                        companionId: companion.id,
                        timedServiceId: service.id,
                        isOffered: isOffered,
                        price: service.price ?? null
                    }
                });
            }
        }

        console.log("Atualização concluída com sucesso!");
        return res.status(200).json({ message: "Dados financeiros e serviços atualizados com sucesso." });

    } catch (error) {
        console.error("Erro ao atualizar dados financeiros e horários:", error);
        return res.status(500).json({ error: "Erro ao processar os dados.", details: error.message });
    }
};
exports.getCompanionFinanceAndServices = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Verifica se a acompanhante existe
        const companion = await prisma.companion.findUnique({
            where: { userId },
            include: {
                paymentMethods: true,
                timedServiceCompanion: {
                    include: { TimedService: true }
                }
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Busca TODOS os horários disponíveis na tabela TimedService
        const allTimedServices = await prisma.timedService.findMany();

        // Mapeia os horários que a acompanhante já oferece
        const companionTimedServicesMap = new Map(
            companion.timedServiceCompanion.map(ts => [ts.timedServiceId, ts])
        );

        // Lista fixa de métodos de pagamento aceitos no sistema
        const allPaymentMethods = ["PIX", "CARTAO_CREDITO", "DEBITO", "DINHEIRO"];

        // Garante que os métodos de pagamento estejam formatados corretamente
        const paymentMethods = allPaymentMethods.map(method => ({
            nome: method,
            aceito: companion.paymentMethods.some(pm => pm.paymentMethod === method)
        }));

        // Ajuste: Forçar `isOffered: false` para serviços que não estão na tabela `timedServiceCompanion`
        const timedServices = allTimedServices.map(timedService => {
            const companionService = companionTimedServicesMap.get(timedService.id);

            return {
                id: timedService.id,
                name: timedService.name,
                description: timedService.description,
                defaultPrice: timedService.defaultPrice ?? null,
                isOffered: companionService ? companionService.isOffered : false, // Agora só será true se realmente estiver no banco
                price: companionService?.price ?? null
            };
        });

        console.log("Dados carregados com sucesso:", { paymentMethods, timedServices });

        return res.status(200).json({
            paymentMethods,
            timedServices
        });

    } catch (error) {
        console.error("Erro ao buscar dados financeiros e serviços:", error);
        return res.status(500).json({ error: "Erro ao processar os dados.", details: error.message });
    }
};
