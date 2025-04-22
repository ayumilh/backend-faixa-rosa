const prisma = require('../../prisma/client');

// Listar acompanhantes
exports.listAcompanhantes = async (req, res) => {
    try {
        const acompanhantes = await prisma.companion.findMany({
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                plan: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                    },
                },
                subscriptions: {
                    select: {
                        id: true,
                        extraPlan: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                hasContact: true,
                                canHideAge: true,
                                hasStories: true,
                                hasPublicReviews: true,
                                isEnabled: true,
                            },
                        },
                        endDate: true,
                    },
                    where: {
                        endDate: null, // Garante que planos desativados (com endDate) não apareçam
                        extraPlan: {
                            // Usando isNot para garantir que extraPlan não seja null
                            isNot: null,
                        },
                    },
                },
                documents: {
                    select: {
                        id: true,
                        documentStatus: true,
                        updatedAt: true,
                    },
                },
                media: {  // Verificando se existe vídeo de comparação
                    where: {
                        mediaType: 'VIDEO', // Verificando tipo de mídia
                    },
                    select: {
                        id: true,   // Verifica se existe um vídeo
                        status: true, // Retorna o status do vídeo
                    },
                },
            },
            orderBy: {
                createdAt: 'asc'
            },
        });

        // Processa o status do documento para cada acompanhante com base na tabela Document
        const formattedAcompanhantes = acompanhantes.map((companion) => {
            let documentStatus = 'PENDING';

            if (companion.documents.length > 0) {
                const allApproved = companion.documents.every(doc => doc.documentStatus === 'APPROVED');
                const hasPending = companion.documents.some(doc => doc.documentStatus === 'PENDING');
                const hasInAnalysis = companion.documents.some(doc => doc.documentStatus === 'IN_ANALYSIS');

                if (allApproved) {
                    documentStatus = 'APPROVED';
                } else if (hasInAnalysis) {
                    documentStatus = 'IN_ANALYSIS';  // Se algum documento estiver em análise
                } else if (hasPending) {
                    documentStatus = 'PENDING';
                } else {
                    documentStatus = 'REJECTED';
                }
            }


            // Verifica se o acompanhante tem vídeo de comparação
            const hasComparisonVideo = companion.media.length > 0 ? true : false;
            const videoStatus = hasComparisonVideo ? companion.media[0].status : 'Nenhum vídeo enviado';

            return {
                id: companion.id,
                name: `${companion.user.firstName} ${companion.user.lastName}`,
                city: companion.city,
                state: companion.state,
                profileStatus: companion.profileStatus, // PENDENTE, ATIVO ou REJEITADO
                documentStatus,
                documents: companion.documents, // Lista de documentos
                plan: companion.plan ? {
                    id: companion.plan.id,
                    name: companion.plan.name,
                    price: companion.plan.price,
                } : null,
                subscriptions: companion.subscriptions,
                userName: companion.userName,
                media: videoStatus
            };
        });

        if (!acompanhantes.length) {
            return res.status(200).json({ message: 'Nenhuma acompanhante encontrada.' });
        }

        return res.status(200).json(formattedAcompanhantes);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao listar acompanhantes.', error: error.message });
    }
};

exports.detalhesAcompanhante = async (req, res) => {
    const { id } = req.params;

    try {
        const acompanhante = await prisma.companion.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: {
                    include: {
                        Consent: true,
                        reviews: true,
                        payments: true,
                        Top10: true,
                    },
                },
                plan: { include: { planType: true, extraPlans: true } },
                planType: true,
                documents: true,
                media: true,
                subscriptions: {
                    include: {
                        plan: true,
                        extraPlan: true,
                        Payment: true,
                    },
                },
                PhysicalCharacteristics: true,
                contactMethods: true,
                feedPosts: true,
                lugares: { include: { location: true } },
                denunciasFeitas: true,
                denunciasRecebidas: true,
                Story: true,
                servicesOffered: { include: { service: true } },
                servicosGerais: true,
                servicosEspeciais: true,
                weeklySchedules: true,
                unavailableDays: true,
                carrouselImages: true,
                ActivityLog: true,
                // atendimentos: true,
                Follow: true,
                extraPlans: true,
            },
        });

        if (!acompanhante) {
            return res.status(404).json({ message: 'Acompanhante não encontrada.' });
        }

        res.status(200).json(acompanhante);
    } catch (error) {
        console.error("Erro:", error);
        res.status(500).json({ message: 'Erro ao buscar detalhes da acompanhante.', error: error.message });
    }
};


// Aprovar perfil de acompanhantes 
exports.approveAcompanhantes = async (req, res) => {
    const { id } = req.params;

    const companionId = parseInt(id);
    if (isNaN(companionId)) {
        return res.status(400).json({ error: 'ID inválido. Deve ser um número.' });
    }

    if (!req.user || req.user.userType !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem aprovar documentos." });
    }

    try {
        await prisma.companion.update({
            where: { id: companionId },
            data: { profileStatus: 'ACTIVE' },
        });
        return res.status(200).json({ message: 'acompanhantes aprovado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao aprovar acompanhantes.' });
    }
}

// Rejeitar perfil de acompanhantes
exports.rejectAcompanhantes = async (req, res) => {
    const { id } = req.params;

    const companionId = parseInt(id);
    if (isNaN(companionId)) {
        return res.status(400).json({ error: 'ID inválido. Deve ser um número.' });
    }

    if (!req.user || req.user.userType !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem aprovar documentos." });
    }

    try {
        await prisma.companion.update({
            where: { id: companionId },
            data: { profileStatus: 'REJECTED' },
        });
        await prisma.media.updateMany({
            where: { companionId: companionId },
            data: { status: 'REJECTED' },
        });
        return res.status(200).json({ message: 'acompanhantes rejeitado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao rejeitar acompanhantes.' });
    }
}

// Suspender perfil de acompanhantes
exports.suspendAcompanhantes = async (req, res) => {
    const { id } = req.params;

    const companionId = parseInt(id);
    if (isNaN(companionId)) {
        return res.status(400).json({ error: 'ID inválido. Deve ser um número.' });
    }

    if (!req.user || req.user.userType !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem aprovar documentos." });
    }

    try {
        await prisma.companion.update({
            where: { id: companionId },
            data: { profileStatus: 'SUSPENDED' },
        });
        await prisma.media.updateMany({
            where: { companionId: companionId },
            data: { status: 'SUSPENDED' },
        });
        return res.status(200).json({ message: 'acompanhantes suspenso com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao suspender acompanhantes.' });
    }
}

exports.deleteAcompanhante = async (req, res) => {
    const { id } = req.params;

    try {
        const companionId = parseInt(id);
        if (isNaN(companionId)) {
            return res.status(400).json({ error: "ID inválido. Deve ser um número." });
        }

        // Busca o acompanhante com o usuário relacionado
        const companion = await prisma.companion.findUnique({
            where: { id: companionId },
            include: {
                user: true,
                documents: true,
                subscriptions: true,
                extraPlans: true,
            },
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrado." });
        }

        const userId = companion.user.id;

        await prisma.$transaction(async (tx) => {
            // Deleta Top10
            await tx.top10.deleteMany({
                where: { userId },
            });
        
            // Deleta Follows (quem segue a acompanhante)
            await tx.follow.deleteMany({
                where: { followingId: companionId },
            });
        
            // Deleta métodos de contato
            await tx.contactMethodCompanion.deleteMany({
                where: { companionId },
            });
        
            // Deleta documentos
            await tx.document.deleteMany({
                where: { companionId },
            });
        
            // Deleta assinaturas
            await tx.planSubscription.deleteMany({
                where: { companionId },
            });
        
            // Desvincula planos extras
            await tx.companion.update({
                where: { id: companionId },
                data: {
                    extraPlans: { set: [] },
                },
            });
        
            // Deleta o acompanhante
            await tx.companion.delete({
                where: { id: companionId },
            });
        
            // Deleta o usuário
            await tx.user.delete({
                where: { id: userId },
            });
        });
        

        return res.status(200).json({
            message: "Acompanhante e todos os dados associados foram removidos com sucesso.",
        });

    } catch (error) {
        console.error("Erro ao deletar acompanhante:", error);
        return res.status(500).json({ message: "Erro ao processar a exclusão do acompanhante." });
    }
};



// Atualizar plano
exports.updatePlan = async (req, res) => {
    console.log('Atualizando plano...');
    console.log(req.body);
    const { id } = req.params;
    const { planId } = req.body; // Novo plano a ser atribuído

    if (!planId || isNaN(planId)) {
        return res.status(400).json({ message: 'planId inválido ou ausente.' });
    }

    try {
        const companion = await prisma.companion.findUnique({
            where: { id: parseInt(id) },
        });

        if (!companion) {
            return res.status(404).json({ message: 'Acompanhante não encontrado.' });
        }

        await prisma.companion.update({
            where: { id: parseInt(id) },
            data: { planId: parseInt(planId) },
        });

        console.log('Plano atualizado com sucesso.');

        return res.status(200).json({ message: 'Plano atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar plano.', error });
    }
};

// Atualizar plano extra
exports.updateExtraPlanForCompanion = async (req, res) => {
    console.log("Atualizando plano extra...");
    const { id } = req.params; // ID da acompanhante
    const { extraPlanId, isChecked } = req.body;

    if (!id || !extraPlanId) {
        return res.status(400).json({ message: "ID do acompanhante e extraPlanId são obrigatórios." });
    }

    try {
        const companionId = parseInt(id);
        const extraId = parseInt(extraPlanId);

        // Verifica se a assinatura do plano extra já existe
        const existingSubscription = await prisma.planSubscription.findFirst({
            where: {
                companionId: companionId,
                extraPlanId: extraId,
                isExtra: true,
            },
        });

        if (isChecked) {
            // Se está marcado e não existe, cria
            if (!existingSubscription) {
                await prisma.planSubscription.create({
                    data: {
                        companionId: companionId,
                        extraPlanId: extraId,
                        isExtra: true,
                        startDate: new Date(),
                        subscriptionStatus: "ACTIVE",
                    },
                });
                return res.status(200).json({ message: "Plano extra atribuído com sucesso." });
            } else {
                return res.status(200).json({ message: "Plano extra já está atribuído." });
            }
        } else {
            // Se está desmarcado e existe, remove
            if (existingSubscription) {
                await prisma.planSubscription.delete({
                    where: {
                        id: existingSubscription.id,
                    },
                });
                return res.status(200).json({ message: "Plano extra removido com sucesso." });
            } else {
                return res.status(200).json({ message: "Plano extra já estava removido." });
            }
        }
    } catch (error) {
        console.error("Erro ao atualizar plano extra:", error);
        return res.status(500).json({ message: "Erro ao atualizar plano extra.", error: error.message });
    }
};



// Buscar histórico de atividades
exports.getActivityLog = async (req, res) => {
    const { id } = req.params;
    const companionId = parseInt(id);

    if (isNaN(companionId)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    try {
        const activities = await prisma.activityLog.findMany({
            where: { companionId: companionId },
            orderBy: { createdAt: "desc" }
        });

        if (!activities.length) {
            return res.status(200).json({ message: "Nenhuma atividade registrada." });
        }

        return res.status(200).json(activities);
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return res.status(500).json({ error: "Erro ao buscar histórico." });
    }
};


exports.deleteCompanionAndUser = async (req, res) => {
    const adminId = req.user?.id;
    const companionId = parseInt(req.params.id);

    try {
        const companion = await prisma.companion.findUnique({
            where: { id: companionId },
        });

        if (!companion) {
            return res.status(404).json({ error: 'Acompanhante não encontrada.' });
        }

        const userId = companion.userId;

        await prisma.$transaction(async (tx) => {
            // Deleta todas as relações da acompanhante
            await tx.review.deleteMany({ where: { companionId } });
            await tx.story.deleteMany({ where: { companionId } });
            await tx.feedPost.deleteMany({ where: { companionId } });
            await tx.document.deleteMany({ where: { companionId } });
            await tx.locationCompanion.deleteMany({ where: { companionId } });
            await tx.media.deleteMany({ where: { companionId } });
            await tx.paymentMethodCompanion.deleteMany({ where: { companionId } });
            await tx.physicalCharacteristics.deleteMany({ where: { companionId } });
            await tx.planSubscription.deleteMany({ where: { companionId } });
            await tx.ageCategoryCompanion.deleteMany({ where: { companionId } });
            await tx.serviceCompanionOffered.deleteMany({ where: { companionId } });
            await tx.servicosGeraisCompanion.deleteMany({ where: { companionId } });
            await tx.servicosEspeciaisCompanion.deleteMany({ where: { companionId } });
            await tx.timedServiceCompanion.deleteMany({ where: { companionId } });
            await tx.unavailableDates.deleteMany({ where: { companionId } });
            await tx.weeklySchedule.deleteMany({ where: { companionId } });
            await tx.activityLog.deleteMany({ where: { companionId } });
            await tx.carrouselImage.deleteMany({ where: { companionId } });
            await tx.follow.deleteMany({ where: { followingId: companionId } });

            // Apaga a acompanhante e o user
            await tx.companion.delete({ where: { id: companionId } });
            await tx.user.delete({ where: { id: userId } });
        });

        console.log(`Admin ID ${adminId} deletou a acompanhante ID ${companionId} e o usuário ID ${userId}`);
        res.status(200).json({ message: 'Acompanhante e usuário deletados com sucesso.' });

    } catch (error) {
        console.error("Erro ao deletar acompanhante via admin:", error);
        res.status(500).json({ error: 'Erro ao deletar acompanhante.' });
    }
};