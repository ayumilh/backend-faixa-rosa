const { PrismaClient, LocationType } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require('joi');
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { uploadSingleVideo, uploadDocuments, wasabiS3, bucketName } = require("../../config/wasabi");

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
        let data = req.body;

        if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
            data = JSON.parse(JSON.stringify(req.body));
        }

        // Esquema Joi para validar apenas os campos enviados (todos opcionais)
        const schema = Joi.object({
            description: Joi.string().allow(null, ""),
            gender: Joi.string().optional(),
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

        // Obtém os dados do acompanhante e o vídeo já salvo
        const companion = await prisma.companion.findUnique({
            where: { userId },
            include: {
                media: {
                    where: { mediaType: "VIDEO" },
                    select: { id: true, url: true }
                },
                PhysicalCharacteristics: true // 🔥 Inclui as características físicas já registradas
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // SE FOR ENVIADO UM NOVO VÍDEO, DELETAMOS O ANTIGO
        if (req.file && companion.media.length > 0) {
            const existingVideo = companion.media[0];
            const fileName = existingVideo.url.split(".com/")[1];

            if (fileName) {
                try {
                    console.log(`Deletando vídeo antigo: ${fileName}`);

                    await wasabiS3.send(new DeleteObjectCommand({
                        Bucket: bucketName,
                        Key: fileName,
                    }));

                    console.log(`Vídeo deletado com sucesso: ${fileName}`);
                } catch (deleteError) {
                    console.error("Erro ao deletar vídeo antigo:", deleteError);
                    return res.status(500).json({ error: "Erro ao excluir vídeo antigo." });
                }

                // Remove a referência do banco de dados
                await prisma.media.delete({
                    where: { id: existingVideo.id },
                });
            }
        }

        // UPLOAD DO NOVO VÍDEO SE FOR ENVIADO
        if (req.file) {
            const videoUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.file.key}`;

            await prisma.media.create({
                data: {
                    companionId: companion.id,
                    url: videoUrl,
                    mediaType: "VIDEO",
                },
            });

            // 🔥 Atualiza o campo `hasComparisonMedia` na tabela `physicalCharacteristics`
            await prisma.physicalCharacteristics.upsert({
                where: { companionId: companion.id },
                update: { hasComparisonMedia: true },
                create: { companionId: companion.id, hasComparisonMedia: true },
            });

            return res.status(200).json({
                message: "Vídeo atualizado com sucesso. Aguarde a aprovação do admin.",
                videoUrl,
            });
        }

        // 🔥 ATUALIZA DADOS FÍSICOS DA ACOMPANHANTE (SEM FORÇAR CAMPOS)
        const physicalData = {
            gender: value.gender || companion.physicalCharacteristics?.gender,
            genitalia: value.genitalia || companion.physicalCharacteristics?.genitalia,
            weight: value.weight || companion.physicalCharacteristics?.weight,
            height: value.height || companion.physicalCharacteristics?.height,
            ethnicity: value.ethnicity || companion.physicalCharacteristics?.ethnicity,
            eyeColor: value.eyeColor || companion.physicalCharacteristics?.eyeColor,
            hairStyle: value.hairStyle || companion.physicalCharacteristics?.hairStyle,
            hairLength: value.hairLength || companion.physicalCharacteristics?.hairLength,
            shoeSize: value.shoeSize || companion.physicalCharacteristics?.shoeSize,
            hasSilicone: value.hasSilicone,
            hasTattoos: value.hasTattoos,
            hasPiercings: value.hasPiercings,
            smoker: value.smoker,
            hasComparisonMedia: value.hasComparisonMedia,
        };

        // Atualiza ou cria os dados físicos
        await prisma.physicalCharacteristics.upsert({
            where: { companionId: companion.id },
            update: physicalData,
            create: { ...physicalData, companionId: companion.id },
        });

        // 🔥 ATUALIZA SOMENTE OS DADOS DA COMPANION SE FOR ENVIADO
        const updateData = {};
        if (data.description) updateData.description = data.description;

        if (Object.keys(updateData).length > 0) {
            await prisma.companion.update({
                where: { id: companion.id },
                data: updateData,
            });

            return res.status(200).json({ message: "Perfil atualizado com sucesso." });
        }

        return res.status(400).json({ error: "Nenhuma atualização foi enviada." });

    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        return res.status(500).json({ error: "Erro ao processar os dados." });
    }
};

exports.getCompanionDescriptionProfile = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Busca a acompanhante e suas características físicas e mídias
        const companion = await prisma.companion.findUnique({
            where: { userId },
            include: {
                PhysicalCharacteristics: true, // Garante que está incluindo as características físicas
                media: {
                    where: { mediaType: "VIDEO" },
                    select: { id: true, url: true, createdAt: true }
                }
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Formata a resposta
        const response = {
            id: companion.id,
            name: companion.name,
            age: companion.age,
            description: companion.description, // Description vem da tabela `companion`
            characteristics: companion.PhysicalCharacteristics || null, // Garante que os dados vêm corretamente
            video: companion.media.length > 0 ? companion.media[0] : null
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error("Erro ao buscar perfil da acompanhante:", error);
        return res.status(500).json({ error: "Erro ao processar os dados." });
    }
};



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

        console.log("Atualização concluída com sucesso!");
        return res.status(200).json({ message: "Serviços e preços atualizados com sucesso." });

    } catch (error) {
        console.error("Erro ao atualizar serviços e preços:", error);
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
                    id: (
                        await prisma.weeklySchedule.findFirst({
                            where: {
                                companionId: companion.id,
                                dayOfWeek: day.dayOfWeek
                            },
                            select: { id: true }
                        })
                    )?.id || 0 // Usa 0 para forçar a criação caso não exista
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
