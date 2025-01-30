const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

// Adicionar Características Físicas
exports.addPhysicalCharacteristics = async (req, res) => {
    console.log("Recebendo dados no body:", req.body);
    const userId = req.user?.id;
    const {
        gender, genitalia, weight, height, estatura, ethnicity, eyeColor,
        hairStyle, hairLength, shoeSize, hasSilicone, hasTattoos,
        hasPiercings, smoker, pubis, bodyType, breastType
    } = req.body;

    if (!gender) {
        return res.status(400).json({ error: "O campo 'gender' é obrigatório." });
    }


    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

        const validData = {
            gender,
            genitalia: genitalia || undefined,
            weight: weight || undefined,
            height: height || undefined,
            estatura: estatura || undefined,
            ethnicity: ethnicity || undefined,
            eyeColor: eyeColor || undefined,
            hairStyle: hairStyle || undefined,
            hairLength: hairLength || undefined,
            shoeSize: shoeSize || undefined,
            hasSilicone: hasSilicone ?? undefined,
            hasTattoos: hasTattoos ?? undefined,
            hasPiercings: hasPiercings ?? undefined,
            smoker: smoker ?? undefined,
            pubis: pubis || undefined,
            bodyType: bodyType || undefined,
            breastType: breastType || undefined,
            companionId: companion.id
        };

        const existingCharacteristics = await prisma.physicalCharacteristics.findUnique({
            where: { companionId: companion.id }
        });

        if (existingCharacteristics) {
            await prisma.physicalCharacteristics.update({
                where: { companionId: companion.id },
                data: validData
            });
        } else {
            await prisma.physicalCharacteristics.create({
                data: validData
            });
        }

        return res.status(200).json({ message: 'Características físicas cadastradas com sucesso.' });

    } catch (error) {
        console.error('Erro ao cadastrar características físicas:', error);
        return res.status(500).json({ error: 'Erro ao processar os dados.' });
    }
};

// Adicionar Mídia de Comparação (Vídeo obrigatório)
exports.uploadCompanionMedia = async (req, res) => {
    const userId = req.user?.id;
    const { videoUrl } = req.body; // URL do vídeo

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

        await prisma.media.create({
            data: {
                companionId: companion.id,
                url: videoUrl,
                mediaType: 'VIDEO',
            },
        });

        return res.status(200).json({ message: 'Vídeo de comparação adicionado com sucesso.' });

    } catch (error) {
        console.error('Erro ao adicionar vídeo de comparação:', error);
        return res.status(500).json({ error: 'Erro ao processar o vídeo.' });
    }
};

// Adicionar Contato
exports.updateCompanionContact = async (req, res) => {
    const userId = req.user?.id;
    const { contactMethods } = req.body; // Array [{ type: "WHATSAPP", details: "5511999999999" }]

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

        // Remove contatos antigos e insere novos
        await prisma.contactMethodCompanion.deleteMany({ where: { companionId: companion.id } });

        const contacts = contactMethods.map(contact => ({
            companionId: companion.id,
            contactMethod: contact.type,
            details: contact.details
        }));

        await prisma.contactMethodCompanion.createMany({ data: contacts });

        return res.status(200).json({ message: 'Dados de contato atualizados com sucesso.' });

    } catch (error) {
        console.error('Erro ao cadastrar contato:', error);
        return res.status(500).json({ error: 'Erro ao processar os dados.' });
    }
};

// Adicionar Serviços e Preços
exports.updateCompanionServicesAndPrices = async (req, res) => {
    console.log("Recebendo dados no body:", req.body);
    const userId = req.user?.id;
    const { services } = req.body;

    // Verifica se 'services' foi enviado corretamente e não está vazio
    if (!Array.isArray(services) || services.length === 0) {
        return res.status(400).json({ error: "Lista de serviços inválida ou vazia." });
    }

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Obtém apenas os IDs dos serviços recebidos
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

        // Remove os serviços antigos antes de inserir os novos
        await prisma.serviceCompanionOffered.deleteMany({ where: { companionId: companion.id } });

        // Insere os novos serviços e preços
        const serviceData = services
            .filter(s => validServiceIds.includes(s.id)) // Apenas serviços válidos
            .map(service => ({
                companionId: companion.id,
                serviceId: service.id,
                isOffered: service.isOffered ?? false, // Se não vier, assume false
                price: service.price ?? null, // Se não vier, assume null
            }));

        if (serviceData.length > 0) {
            await prisma.serviceCompanionOffered.createMany({ data: serviceData });
        }

        return res.status(200).json({ message: "Serviços e preços atualizados com sucesso." });
    } catch (error) {
        console.error("Erro ao atualizar serviços e preços:", error);
        return res.status(500).json({ error: "Erro ao processar os dados.", details: error.message });
    }
};


// Adicionar Horários
exports.updateCompanionSchedule = async (req, res) => {
    const userId = req.user?.id;
    const { schedule } = req.body; // Array [{ dayOfWeek: "Segunda", startTime: "10:00", endTime: "18:00" }]

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

        // Remove horários antigos e insere novos
        await prisma.scheduleCompanion.deleteMany({ where: { companionId: companion.id } });

        const schedules = schedule.map(horario => ({
            companionId: companion.id,
            dayOfWeek: horario.dayOfWeek,
            startTime: horario.startTime,
            endTime: horario.endTime
        }));

        await prisma.scheduleCompanion.createMany({ data: schedules });

        return res.status(200).json({ message: 'Horários cadastrados com sucesso.' });

    } catch (error) {
        console.error('Erro ao cadastrar horários:', error);
        return res.status(500).json({ error: 'Erro ao processar os dados.' });
    }
};

// Atualizar Cidade e Estado onde a acompanhante atende
exports.updateCompanionLocation = async (req, res) => {
    const userId = req.user?.id;
    const { city, state } = req.body;

    try {
        await prisma.companion.update({
            where: { userId },
            data: { city, state }
        });

        return res.status(200).json({ message: 'Localização atualizada com sucesso.' });

    } catch (error) {
        console.error('Erro ao atualizar localização:', error);
        return res.status(500).json({ error: 'Erro ao processar os dados.' });
    }
};

// Atualizar Locais Atendidos
exports.updateAttendedLocations = async (req, res) => {
    const userId = req.user?.id;
    const { locations } = req.body; 

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrada.' });
        }

        await prisma.locationCompanion.deleteMany({ where: { companionId: companion.id } });

        const locationRecords = await prisma.location.findMany({
            where: {
                name: { in: locations.map(loc => loc.name) }
            }
        });

        // Se algum local enviado não existir no banco, retorna erro
        const foundLocationIds = locationRecords.map(loc => loc.id);
        const foundLocationNames = locationRecords.map(loc => loc.name);
        const missingLocations = locations.map(loc => loc.name).filter(name => !foundLocationNames.includes(name));

        if (missingLocations.length > 0) {
            return res.status(400).json({ error: `Os seguintes locais não existem no banco: ${missingLocations.join(', ')}` });
        }

        const locationData = foundLocationIds.map(locationId => ({
            companionId: companion.id,
            locationId
        }));

        await prisma.locationCompanion.createMany({ data: locationData });

        return res.status(200).json({ message: 'Locais atendidos atualizados com sucesso.' });

    } catch (error) {
        console.error('Erro ao atualizar locais atendidos:', error);
        return res.status(500).json({ error: 'Erro ao processar os dados.', details: error.message });
    }
};

// Adicionar Dados Financeiros e Serviços Oferecidos
exports.updateCompanionFinanceAndServices = async (req, res) => {
    console.log("Recebendo dados no body:", req.body);
    const userId = req.user?.id;
    const { paymentMethods, services } = req.body;

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrada.' });
        }

        // Atualizar formas de pagamento
        if (paymentMethods) {
            await prisma.paymentMethodCompanion.deleteMany({ where: { companionId: companion.id } });

            const paymentData = paymentMethods.map((method) => ({
                companionId: companion.id,
                paymentMethod: method,
            }));

            await prisma.paymentMethodCompanion.createMany({ data: paymentData });
        }

        // Atualizar serviços oferecidos
        if (services) {
            await prisma.serviceCompanionOffered.deleteMany({ where: { companionId: companion.id } });

            const serviceData = services.map((service) => ({
                companionId: companion.id,
                serviceId: service.id, // Relaciona com a tabela Service
                isOffered: service.isOffered, // Indica se o serviço é oferecido ou não
                price: service.price || null, // Preço opcional
            }));

            await prisma.serviceCompanionOffered.createMany({ data: serviceData });
        }

        return res.status(200).json({ message: 'Dados financeiros e serviços atualizados com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar dados financeiros e serviços:', error);
        return res.status(500).json({ error: 'Erro ao processar os dados.' });
    }
};

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