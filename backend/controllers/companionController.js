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
    const userId = req.user?.id;
    const {
        gender, genitalia, weight, height, estatura, ethnicity, eyeColor,
        hairStyle, hairLength, shoeSize, hasSilicone, hasTattoos,
        hasPiercings, smoker, pubis, bodyType, breastType
    } = req.body;

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

        if (!gender) return res.status(400).json({ error: 'O campo "gender" é obrigatório.' });

        const validData = {
            gender,
            genitalia: genitalia || null,
            weight: weight ?? null,
            height: height ?? null,
            estatura: estatura || null,
            ethnicity: ethnicity || null,
            eyeColor: eyeColor || null,
            hairStyle: hairStyle || null,
            hairLength: hairLength || null,
            shoeSize: shoeSize ?? null,
            hasSilicone: hasSilicone ?? null,
            hasTattoos: hasTattoos ?? null,
            hasPiercings: hasPiercings ?? null,
            smoker: smoker ?? null,
            pubis: pubis || null,
            bodyType: bodyType || null,
            breastType: breastType || null,
        };

        await prisma.physicalCharacteristics.upsert({
            where: { companionId: companion.id },
            update: validData,
            create: { companionId: companion.id, ...validData },
        });

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

// Adicionar Serviços
exports.updateCompanionServices = async (req, res) => {
    const userId = req.user?.id;
    const { generalServices, specialServices } = req.body; // Arrays com tipos de serviço

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

        // Remove serviços antigos
        await prisma.servicosGeraisCompanion.deleteMany({ where: { companionId: companion.id } });
        await prisma.servicosEspeciaisCompanion.deleteMany({ where: { companionId: companion.id } });

        // Insere novos serviços
        await prisma.servicosGeraisCompanion.createMany({
            data: generalServices.map(service => ({
                companionId: companion.id,
                servico: service
            }))
        });

        await prisma.servicosEspeciaisCompanion.createMany({
            data: specialServices.map(service => ({
                companionId: companion.id,
                servico: service
            }))
        });

        return res.status(200).json({ message: 'Serviços cadastrados com sucesso.' });

    } catch (error) {
        console.error('Erro ao cadastrar serviços:', error);
        return res.status(500).json({ error: 'Erro ao processar os dados.' });
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

// Atualizar Cidade e Estado
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

// Adicionar Dados Financeiros
exports.updateCompanionFinance = async (req, res) => {
    const userId = req.user?.id;
    const { paymentMethods } = req.body; // Array [{ type: "PIX" }]

    try {
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrada.' });

        await prisma.paymentMethodCompanion.deleteMany({ where: { companionId: companion.id } });

        const payments = paymentMethods.map(method => ({
            companionId: companion.id,
            paymentMethod: method
        }));

        await prisma.paymentMethodCompanion.createMany({ data: payments });

        return res.status(200).json({ message: 'Dados financeiros cadastrados com sucesso.' });

    } catch (error) {
        console.error('Erro ao cadastrar dados financeiros:', error);
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