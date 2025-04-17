const { PrismaClient, LocationType } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require('joi');
const { DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { logActivity } = require("../../utils/activityService");
const { uploadSingleVideo, uploadProfileAndBanner, uploadDocuments, wasabiS3, bucketName } = require("../../config/wasabi");

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

        await logActivity(companion.id, "Atualização de Perfil", "Acompanhante atualizou suas informações.");

        return res.status(200).json({ message: 'Acompanhante atualizado com sucesso', updatedCompanion });
    } catch (error) {
        console.error('Erro ao atualizar acompanhante:', error);
        return res.status(500).json({ error: 'Erro ao atualizar acompanhante' });
    }
};


const checkFileExists = async (imageKey) => {
    try {
        console.log(`Verificando a existência do arquivo com a chave: ${imageKey}`);
        const data = await wasabiS3.send(new HeadObjectCommand({
            Bucket: process.env.WASABI_BUCKET, // Nome do seu bucket
            Key: imageKey, // Caminho completo do arquivo dentro do bucket (chave)
        }));
        return data; // Arquivo existe
    } catch (err) {
        console.error("Erro ao verificar arquivo:", err);
        if (err.name === "NotFound") {
            console.log("Arquivo não encontrado.");
        }
        return null; // Arquivo não encontrado
    }
};

// Função para excluir imagens antigas do Wasabi
const deleteImageFromWasabi = async (imageUrl) => {
    // Extrair a chave do arquivo da URL
    const imageKey = imageUrl.replace("https://s3.us-central-1.wasabisys.com/", "");

    if (imageKey) {
        try {
            console.log(`Verificando a existência do arquivo ${imageKey} antes de deletá-lo.`);
            // Verificar se o arquivo realmente existe antes de deletar
            const fileExists = await checkFileExists(imageKey);
            if (fileExists) {
                console.log(`Deletando imagem do bucket ${process.env.WASABI_BUCKET} com chave ${imageKey}`);
                await wasabiS3.send(new DeleteObjectCommand({
                    Bucket: process.env.WASABI_BUCKET,
                    Key: imageKey,
                }));
                console.log(`Imagem removida: ${imageKey}`);
            } else {
                console.log(`Arquivo não encontrado, não será deletado: ${imageKey}`);
            }
        } catch (deleteError) {
            console.error("Erro ao deletar imagem:", deleteError);
            throw new Error("Erro ao excluir a imagem.");
        }
    } else {
        console.error("Erro: A chave do arquivo não está definida corretamente.");
    }
};

exports.updateProfileAndBanner = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Buscar o companion baseado no userId
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) {
            return res.status(401).json({ error: "Usuário não autenticado ou acompanhante não encontrado." });
        }

        // Pegar as URLs dos arquivos que o multerS3 retornou
        let profileImageUrl = null;
        let bannerImageUrl = null;
        let oldProfileImageUrl = companion.profileImage;
        let oldBannerImageUrl = companion.bannerImage;

        if (req.files.profileImage) {
            profileImageUrl = req.files.profileImage[0].location;
        }
        if (req.files.bannerImage) {
            bannerImageUrl = req.files.bannerImage[0].location;
        }

        // Verifique se o nome do bucket está correto
        const bucketName = process.env.WASABI_BUCKET;
        if (!bucketName) {
            console.error("Erro: O nome do bucket não está configurado corretamente.");
            return res.status(500).json({ error: "Nome do bucket não configurado corretamente." });
        }

        // Deletar imagens antigas, se forem diferentes da nova imagem
        if (oldProfileImageUrl && oldProfileImageUrl !== profileImageUrl) {
            console.log(`Deletando imagem antiga de perfil: ${oldProfileImageUrl}`);
            await deleteImageFromWasabi(oldProfileImageUrl);  // Deletar o arquivo antigo de perfil
            await prisma.companion.update({
                where: { id: companion.id },
                data: { profileImage: null }, // Remover a referência da imagem antiga
            });
        }

        if (oldBannerImageUrl && oldBannerImageUrl !== bannerImageUrl) {
            console.log(`Deletando imagem antiga de banner: ${oldBannerImageUrl}`);
            await deleteImageFromWasabi(oldBannerImageUrl);  // Deletar o arquivo antigo de banner
            await prisma.companion.update({
                where: { id: companion.id },
                data: { bannerImage: null }, // Remover a referência da imagem antiga
            });
        }

        // Atualiza no banco de dados as imagens de perfil e banner
        const updatedCompanion = await prisma.companion.update({
            where: { id: companion.id },
            data: {
                profileImage: profileImageUrl || oldProfileImageUrl,  // Não remover a imagem de perfil se não houver uma nova
                bannerImage: bannerImageUrl || oldBannerImageUrl,   // Não remover a imagem de banner se não houver uma nova
            },
        });

        // Registrar a atividade de atualização de imagens (opcional)
        await logActivity(companion.id, "Atualização de Imagens", "Acompanhante atualizou suas imagens de perfil e banner.");

        return res.status(200).json({
            message: "Imagens de perfil e banner atualizadas com sucesso!",
            companion: updatedCompanion,
        });
    } catch (error) {
        console.error("Erro ao atualizar imagens de perfil e banner:", error);
        return res.status(500).json({ error: "Erro interno ao atualizar as imagens." });
    }
};
exports.getCompanionMedia = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Buscar o acompanhante baseado no userId
        const companion = await prisma.companion.findUnique({
            where: { userId },
            include: {
                documents: true,
                subscriptions: {
                    select: { startDate: true }
                },
                carrouselImages: {
                    orderBy: {
                        order: 'asc'
                    },
                    select: {
                        imageUrl: true,
                        order: true
                    }
                }
            },
        });

        if (!companion) return res.status(404).json({ error: "Acompanhante não encontrado." });

    // Buscar o plano associado ao companion
    const plan = await prisma.plan.findUnique({
        where: { id: companion.planId },
        select: { name: true }
      });
  
      const planName = plan ? plan.name : null;

        const documentStatuses = companion.documents.map(doc => doc.documentStatus);

        const documentStatus = documentStatuses.length > 0 ? documentStatuses[0] : "PENDING";

        // Formata as imagens do carrossel
        const carouselImages = companion.carrouselImages.map(img => ({
            imageUrl: img.imageUrl,
            order: img.order
        }));

        // Coletar as URLs das imagens e indicar se os documentos estão validados
        const media = {
            profileImage: companion.profileImage, // URL da imagem de perfil
            bannerImage: companion.bannerImage,   // URL da imagem de banner
            documentsValidated: documentStatus, // True se todos os documentos estiverem aprovados
            startDate: companion.subscriptions.length > 0 ? companion.subscriptions[0].startDate : null,
            carrouselImages: carouselImages, // Imagens do carrossel
            planName
        };

        return res.status(200).json({ media });
    } catch (error) {
        console.error("Erro ao obter mídia do acompanhante:", error);
        return res.status(500).json({ error: "Erro interno ao obter a mídia." });
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
            description: Joi.string().allow(null, "").optional(),  // Tornando opcional
            gender: Joi.string().allow(null, "").optional(),  // Tornando opcional
            genitalia: Joi.string().allow(null, "").optional(),  // Tornando opcional
            weight: Joi.number().precision(2).positive().allow(null, 0).optional(),  // Tornando opcional
            height: Joi.number().integer().positive().allow(null, 0).optional(),  // Tornando opcional
            ethnicity: Joi.string().allow(null, "").optional(),  // Tornando opcional
            eyeColor: Joi.string().allow(null, "").optional(),  // Tornando opcional
            hairStyle: Joi.string().allow(null, "").optional(),  // Tornando opcional
            hairLength: Joi.string().allow(null, "").optional(),  // Tornando opcional
            shoeSize: Joi.string().allow(null, "").optional(),  // Tornando opcional
            hasSilicone: Joi.boolean().truthy("true").falsy("false").default(false).optional(),  // Tornando opcional
            hasTattoos: Joi.boolean().truthy("true").falsy("false").default(false).optional(),  // Tornando opcional
            hasPiercings: Joi.boolean().truthy("true").falsy("false").default(false).optional(),  // Tornando opcional
            smoker: Joi.boolean().truthy("true").falsy("false").default(false).optional(),  // Tornando opcional
            hasComparisonMedia: Joi.boolean().truthy("true").falsy("false").default(false).optional(),  // Tornando opcional
            atendimentos: Joi.array().items(Joi.string().valid('HOMENS', 'MULHERES', 'CASAIS', 'DEFICIENTES_FISICOS')).allow(null).optional(),  // Tornando opcional
            userName: Joi.string().allow(null, "").optional(),  // Tornando opcional
            canHideAge: Joi.boolean().optional(),  // Tornando opcional
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
                PhysicalCharacteristics: true,
                subscriptions: {
                    where: { isExtra: true, endDate: null }, // Apenas planos extras ativos
                    include: {
                        extraPlan: true,  // Inclui os detalhes do plano extra
                    }
                },
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Alterando a visibilidade da idade conforme o valor de `canHideAge`
        if (data.canHideAge !== undefined) {
            await prisma.companion.update({
                where: { id: companion.id },
                data: {
                    isAgeHidden: data.canHideAge,
                },
            });
            await logActivity(companion.id, "Atualização de Perfil", `Acompanhante atualizou a visibilidade da idade para ${data.canHideAge ? "ocultar" : "exibir"}.`);
        }

        let videoUrl = null;

        // Se um vídeo foi enviado, verificar se é o mesmo já salvo
        if (req.file) {
            videoUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.file.key}`;

            // Se já houver um vídeo salvo, comparar URLs
            if (companion.media.length > 0) {
                const existingVideo = companion.media[0];

                if (existingVideo.url !== videoUrl) {
                    // Se for um vídeo diferente, excluir o antigo
                    const fileName = existingVideo.url.split(".com/")[1];

                    try {
                        await wasabiS3.send(new DeleteObjectCommand({
                            Bucket: bucketName,
                            Key: fileName,
                        }));

                        // Remove a referência do banco de dados
                        await prisma.media.delete({
                            where: { id: existingVideo.id },
                        });

                        console.log(`Vídeo antigo removido: ${fileName}`);
                    } catch (deleteError) {
                        console.error("Erro ao deletar vídeo antigo:", deleteError);
                        return res.status(500).json({ error: "Erro ao excluir vídeo antigo." });
                    }

                    // Insere o novo vídeo
                    await prisma.media.create({
                        data: {
                            companionId: companion.id,
                            url: videoUrl,
                            status: "IN_ANALYSIS",
                            mediaType: "VIDEO",
                        },
                    });

                    console.log(`Novo vídeo cadastrado para o acompanhante ID ${companion.id}`);
                } else {
                    console.log("O vídeo enviado é o mesmo que já está salvo, evitando reprocessamento.");
                }
            } else {
                // Se não houver um vídeo salvo, cadastrar o novo
                await prisma.media.create({
                    data: {
                        companionId: companion.id,
                        url: videoUrl,
                        status: "IN_ANALYSIS",
                        mediaType: "VIDEO",
                    },
                });

                console.log(`Primeiro vídeo cadastrado para o acompanhante ID ${companion.id}`);
            }

            // Atualiza o campo `hasComparisonMedia`
            await prisma.physicalCharacteristics.upsert({
                where: { companionId: companion.id },
                update: { hasComparisonMedia: true },
                create: { companionId: companion.id, hasComparisonMedia: true },
            });
        }

        // Atualiza os dados físicos e demais dados do acompanhante (se necessário)
        const physicalData = {
            gender: value.gender ?? companion.PhysicalCharacteristics?.gender ?? null,
            genitalia: value.genitalia ?? companion.PhysicalCharacteristics?.genitalia ?? null,
            weight: value.weight ?? companion.PhysicalCharacteristics?.weight ?? 0,
            height: value.height ?? companion.PhysicalCharacteristics?.height ?? 0,
            ethnicity: value.ethnicity ?? companion.PhysicalCharacteristics?.ethnicity ?? null,
            eyeColor: value.eyeColor ?? companion.PhysicalCharacteristics?.eyeColor ?? null,
            hairStyle: value.hairStyle ?? companion.PhysicalCharacteristics?.hairStyle ?? null,
            hairLength: value.hairLength ?? companion.PhysicalCharacteristics?.hairLength ?? null,
            shoeSize: value.shoeSize ?? companion.PhysicalCharacteristics?.shoeSize ?? "",
            hasSilicone: value.hasSilicone ?? false,
            hasTattoos: value.hasTattoos ?? false,
            hasPiercings: value.hasPiercings ?? false,
            smoker: value.smoker ?? false,
            hasComparisonMedia: videoUrl ? true : value.hasComparisonMedia ?? false,
        };

        await prisma.physicalCharacteristics.upsert({
            where: { companionId: companion.id },
            update: physicalData,
            create: { ...physicalData, companionId: companion.id },
        });

        let changesSummary = [];

        // Verificando e registrando alterações no campo 'description'
        if (data.description && data.description !== companion.description) {
            changesSummary.push(`Descrição alterada de "${companion.description}" para "${data.description}"`);
        }

        // Verificando e registrando alterações nos 'atendimentos'
        if (data.atendimentos && JSON.stringify(data.atendimentos) !== JSON.stringify(companion.atendimentos)) {
            changesSummary.push(`Atendimentos alterados para: ${data.atendimentos.join(', ')}`);
        }

        // Verificando e registrando alterações no 'userName'
        if (data.userName && data.userName !== companion.userName) {
            changesSummary.push(`Nome de usuário alterado de "${companion.userName}" para "${data.userName}"`);
        }

        // Atualiza o perfil do acompanhante
        if (changesSummary.length > 0) {
            await prisma.companion.update({
                where: { id: companion.id },
                data: {
                    description: data.description ?? companion.description,
                    atendimentos: data.atendimentos ?? companion.atendimentos,
                    profileStatus: "IN_ANALYSIS",
                    userName: data.userName ?? companion.userName,
                },
            });

            // Registrar no log as alterações feitas
            await logActivity(companion.id, "Atualização de Perfil", `Acompanhante atualizou o perfil. Alterações: ${changesSummary.join(', ')}`);
            return res.status(200).json({ message: "Perfil atualizado com sucesso." });
        }

        return res.status(200).json({ message: "Nenhuma alteração necessária." });

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
                },
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada." });
        }

        // Formata a resposta
        const response = {
            id: companion.id,
            name: companion.name,
            userName: companion.userName,
            age: companion.age,
            description: companion.description, // Description vem da tabela `companion`
            characteristics: companion.PhysicalCharacteristics || null, // Garante que os dados vêm corretamente
            video: companion.media.length > 0 ? companion.media[0] : null,
            atendimentos: companion.atendimentos
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
        phoneNumber,
        whatsappCountryCode,
        phoneCountryCode,
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
                whatsappCountryCode,
                telegramUsername,
                phoneNumber,
                phoneCountryCode,
            },
        });

        await logActivity(companion.id, "Atualização de Contato",
            `Acompanhante atualizou seus contatos: ${whatsappNumber ? `WhatsApp: ${whatsappNumber}` : ""} ${telegramUsername ? `Telegram: ${telegramUsername}` : ""} ${phoneNumber ? `Telefone: ${phoneNumber}` : ""}`
        );


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
                phoneNumber: contact.phoneNumber || null,
                phoneCountryCode: contact.phoneCountryCode || null,
                whatsappCountryCode: contact.whatsappCountryCode || null
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
                await prisma.serviceCompanionOffered.update({
                    where: { id: existingServiceMap.get(service.id).id },
                    data: { isOffered, price }
                });
            } else {
                await prisma.serviceCompanionOffered.create({
                    data: {
                        companionId: companion.id,
                        serviceId: service.id,
                        isOffered,
                        price
                    }
                });
            }
        }

        await logActivity(companion.id, "Atualização de Serviços e Preços",
            `Acompanhante atualizou os serviços oferecidos e preços: ${services.map(s => `${s.name} - R$${s.price ?? "Não definido"}`).join(", ")}`
        );

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

        const companionId = companion.id;

        // Armazena os horários antes da atualização para log
        const oldSchedules = await prisma.weeklySchedule.findMany({
            where: { companionId },
            select: {
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                isActive: true
            }
        });

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

        // Coleta os novos horários após a atualização para gerar log
        const updatedSchedules = await prisma.weeklySchedule.findMany({
            where: { companionId },
            select: {
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                isActive: true
            }
        });

        // Criar descrição detalhada das mudanças
        const addedSchedules = updatedSchedules.filter(updated =>
            !oldSchedules.some(old => old.dayOfWeek === updated.dayOfWeek)
        );
        const removedSchedules = oldSchedules.filter(old =>
            !updatedSchedules.some(updated => updated.dayOfWeek === old.dayOfWeek)
        );

        let scheduleUpdateDescription = '';
        if (addedSchedules.length > 0) {
            scheduleUpdateDescription += `Horários adicionados: ${addedSchedules.map(s => `${s.dayOfWeek}: ${s.startTime} - ${s.endTime}`).join(", ")}. `;
        }
        if (removedSchedules.length > 0) {
            scheduleUpdateDescription += `Horários removidos: ${removedSchedules.map(s => `${s.dayOfWeek}: ${s.startTime} - ${s.endTime}`).join(", ")}. `;
        }

        // Log detalhado das mudanças
        await logActivity(companion.id, "Atualização de Horários",
            `Acompanhante atualizou seus horários semanais: ${scheduleUpdateDescription}`
        );

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

        await logActivity(companion.id, "Atualização de Indisponibilidade",
            `Acompanhante atualizou seus dias indisponíveis para: ${unavailableDates.join(", ")}`
        );

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

        // Armazena locais antigos para log
        let oldLocations = [];
        if (locations && locations.length > 0) {
            oldLocations = await prisma.locationCompanion.findMany({
                where: { companionId: companion.id },
                include: { location: true }
            });
            oldLocations = oldLocations.map(loc => loc.location.name);
        }

        // Armazena comodidades antigas para log
        let oldAmenities = [];
        if (locations && locations.length > 0) {
            oldAmenities = await prisma.locationCompanion.findMany({
                where: { companionId: companion.id },
                select: { amenities: true }
            });

            // Extrair os nomes das comodidades para comparação
            oldAmenities = oldAmenities.map(loc => loc.amenities).flat();
        }

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
                    data: { amenities: { set: amenities } } // Atualizando o campo `enum` diretamente
                });
            }));
        }

        // Obter locais após atualização
        const updatedLocations = await prisma.locationCompanion.findMany({
            where: { companionId: companion.id },
            include: { location: true }
        });
        const updatedLocationNames = updatedLocations.map(loc => loc.location.name);

        // Obter comodidades após atualização
        const updatedAmenities = await prisma.locationCompanion.findMany({
            where: { companionId: companion.id },
            select: { amenities: true } // Apenas os campos `enum`
        });
        const updatedAmenitiesList = updatedAmenities.map(loc => loc.amenities).flat();

        // Criar uma descrição detalhada das mudanças nos locais
        const addedLocations = updatedLocationNames.filter(loc => !oldLocations.includes(loc));
        const removedLocations = oldLocations.filter(loc => !updatedLocationNames.includes(loc));

        let locationUpdateDescription = '';
        if (addedLocations.length > 0) {
            locationUpdateDescription += `Locais adicionados: ${addedLocations.join(', ')}. `;
        }
        if (removedLocations.length > 0) {
            locationUpdateDescription += `Locais removidos: ${removedLocations.join(', ')}. `;
        }

        // Criar uma descrição detalhada das mudanças nas comodidades
        const addedAmenities = updatedAmenitiesList.filter(amenity => !oldAmenities.includes(amenity));
        const removedAmenities = oldAmenities.filter(amenity => !updatedAmenitiesList.includes(amenity));

        let amenitiesUpdateDescription = '';
        if (addedAmenities.length > 0) {
            amenitiesUpdateDescription += `Comodidades adicionadas: ${addedAmenities.join(', ')}. `;
        }
        if (removedAmenities.length > 0) {
            amenitiesUpdateDescription += `Comodidades removidas: ${removedAmenities.join(', ')}. `;
        }

        // Log detalhado das mudanças
        await logActivity(companion.id, "Atualização de Localização",
            `Acompanhante atualizou a cidade para ${city}, estado para ${state}. ${locationUpdateDescription} ${amenitiesUpdateDescription}`
        );

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

        // Busca o Companion no banco
        const companion = await prisma.companion.findUnique({ where: { userId } });

        if (!companion) return res.status(404).json({ error: "Acompanhante não encontrada." });

        let paymentMethodsChanges = [];
        let servicesChanges = [];

        // Atualiza os métodos de pagamento
        await prisma.paymentMethodCompanion.deleteMany({ where: { companionId: companion.id } });

        const acceptedPaymentMethods = paymentMethods.filter(method => method.aceito);

        if (acceptedPaymentMethods.length > 0) {
            // Adiciona os métodos de pagamento aceitos
            const createdMethods = await prisma.paymentMethodCompanion.createMany({
                data: acceptedPaymentMethods.map(method => ({
                    companionId: companion.id,
                    paymentMethod: method.nome
                }))
            });

            paymentMethodsChanges = acceptedPaymentMethods.map(method => `Método de pagamento ${method.nome} ${method.aceito ? 'adicionado' : 'removido'}.`);
        }

        // Atualizar os serviços corretamente
        for (const service of timedServices) {
            const existingService = await prisma.timedServiceCompanion.findFirst({
                where: {
                    companionId: companion.id,
                    timedServiceId: service.id
                }
            });

            const isOffered = service.isOffered;

            if (existingService) {
                // Se o serviço já existe, atualiza as informações
                await prisma.timedServiceCompanion.update({
                    where: { id: existingService.id },
                    data: {
                        isOffered: isOffered,
                        price: service.price ?? null
                    }
                });

                servicesChanges.push(`Serviço ${service.id} atualizado para ${isOffered ? 'oferecido' : 'não oferecido'} com preço ${service.price ?? 'não definido'}.`);
            } else {
                // Caso o serviço não exista, cria um novo
                await prisma.timedServiceCompanion.create({
                    data: {
                        companionId: companion.id,
                        timedServiceId: service.id,
                        isOffered: isOffered,
                        price: service.price ?? null
                    }
                });

                servicesChanges.push(`Serviço ${service.id} adicionado com o status ${isOffered ? 'oferecido' : 'não oferecido'} e preço ${service.price ?? 'não definido'}.`);
            }
        }

        // Log detalhado das mudanças
        const activityDescription = `
            Atualização de métodos de pagamento:
            ${paymentMethodsChanges.join(', ')}

            Atualização de serviços oferecidos:
            ${servicesChanges.join(', ')}
        `;

        await logActivity(companion.id, "Atualização Financeira e Serviços", activityDescription);

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


// Atualizar cidade
async function changeCityForCompanion(req, res) {
    const { newCity } = req.body;  // A nova cidade que a acompanhante quer trocar

    if (!newCity) {
        return res.status(400).json({ error: 'A nova cidade é obrigatória.' });
    }

    try {
        // Verificar se o usuário está logado e obter as informações do acompanhante
        const userId = req.user.id;
        const companion = await prisma.companion.findUnique({
            where: { userId },
        });

        if (!companion) {
            return res.status(403).json({ error: 'Somente acompanhantes podem trocar de cidade.' });
        }

        // Buscar a taxa de troca de cidade definida pelo admin
        const cityChangeConfig = await prisma.cityChangeConfig.findFirst();

        if (!cityChangeConfig) {
            return res.status(500).json({ error: 'Configuração de taxa de troca de cidade não encontrada.' });
        }

        const cityChangeFee = cityChangeConfig.value;

        // Realizar a cobrança (pode ser um pagamento real ou apenas registrar o valor como "pago")
        // Aqui estamos assumindo que a cobrança será feita e o pagamento será registrado
        await prisma.payment.create({
            data: {
                userId: userId,
                planId: companion.planId, // Ou algum plano associado, se necessário
                amount: cityChangeFee,
                status: 'PENDING', // O status pode ser alterado após confirmação do pagamento
                transactionId: 'city-change-' + new Date().getTime(), // Gerar um ID de transação
            },
        });

        // Atualizar a cidade da acompanhante
        await prisma.companion.update({
            where: { id: companion.id },
            data: {
                city: newCity,
            },
        });

        // Logar a atividade
        await logActivity(companion.id, "Troca de Cidade", `Acompanhante trocou para a cidade: ${newCity}.`);

        return res.status(200).json({
            message: `Cidade trocada com sucesso para ${newCity}. Taxa cobrada: R$ ${cityChangeFee}`,
        });
    } catch (error) {
        console.error('Erro ao trocar cidade:', error.message);
        return res.status(500).json({ error: 'Erro ao processar a troca de cidade.' });
    }
}
