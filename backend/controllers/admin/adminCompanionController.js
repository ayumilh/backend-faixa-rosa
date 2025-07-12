import prisma from '../../prisma/client.js';

// Listar acompanhantes
export async function listAcompanhantes(req, res) {
    try {
        const acompanhantes = await prisma.companion.findMany({
            include: {
                appUser: {
                    select: {
                        firstName: true,
                        lastName: true,
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
                        OR: [
                            { endDate: null },
                            { endDate: { gt: new Date() } }, // considera planos ativos temporários
                        ],
                        extraPlan: {
                            isNot: null,
                        },
                    },
                },
                documents: {
                    select: {
                        id: true,
                        documentStatus: true,
                        updatedAt: true,
                        fileFront: true,
                        fileBack: true,
                        type: true,
                    },
                },
                media: {
                    where: {
                        mediaType: 'VIDEO',
                    },
                    select: {
                        id: true,
                        status: true,
                        url: true,
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
            const videoStatus = hasComparisonVideo
                ? {
                    status: companion.media[0].status,
                    url: companion.media[0].url,
                }
                : {
                    status: 'Nenhum vídeo enviado',
                    url: null,
                };

            return {
                id: companion.id,
                name: `${companion.appUser.firstName} ${companion.appUser.lastName}`,
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

export async function detalhesAcompanhante(req, res){
    const { id } = req.params;

    try {
        const acompanhante = await prisma.companion.findUnique({
            where: { id: parseInt(id) },
            include: {
                appUser: {
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
export async function approveAcompanhantes(req, res) {
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
export async function rejectAcompanhantes(req, res) {
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
export async function suspendAcompanhantes(req, res) {
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

export async function deleteAcompanhante(req, res) {
    const { id } = req.params;

    try {
        // Converte o ID para número e verifica se é válido
        const companionId = parseInt(id);
        if (isNaN(companionId)) {
            return res.status(400).json({ error: "ID inválido. Deve ser um número." });
        }

        // Verifica se o usuário existe
        const companion = await prisma.companion.findUnique({
            where: { id: companionId },
            include: {
                documents: true, // Verifica documentos vinculados
                subscriptions: true, // Nome correto para assinaturas de planos
                extraPlans: true, // Se houver planos extras vinculados
            },
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrado." });
        }

        // Remove primeiro os documentos vinculados
        await prisma.document.deleteMany({
            where: { companionId },
        });

        // Remove as assinaturas de planos vinculadas
        await prisma.planSubscription.deleteMany({
            where: { companionId },
        });

        // Remove os planos extras vinculados (caso existam)
        await prisma.extraPlan.deleteMany({
            where: { companions: { some: { id: companionId } } },
        });

        // Remove o acompanhante
        await prisma.companion.delete({
            where: { id: companionId },
        });

        return res.status(200).json({ message: "Acompanhante e todos os dados associados foram removidos com sucesso." });

    } catch (error) {
        console.error("Erro ao deletar acompanhante:", error);
        return res.status(500).json({ message: "Erro ao processar a exclusão do acompanhante." });
    }
};

// Atualizar plano
export async function updatePlan(req, res) {
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

        const plan = await prisma.plan.findUnique({
            where: { id: parseInt(planId) },
            include: { planType: true },
        });

        if (!plan || !plan.planType) {
            return res.status(404).json({ message: 'Plano ou tipo de plano não encontrado.' });
        }

        await prisma.companion.update({
            where: { id: parseInt(id) },
            data: {
                planId: plan.id,
                planTypeId: plan.planTypeId,
                points: {
                    increment: plan.planType.points || 0,
                }
            },
        });

        console.log('Plano atualizado com sucesso.');

        return res.status(200).json({ message: 'Plano atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar plano.', error });
    }
};

export async function updateExtraPlanForCompanion(req, res) {
    const { id } = req.params;
    const { extraPlanId, isChecked } = req.body;

    console.log("==> ExtraPlanId recebido:", extraPlanId);
    console.log("==> isChecked:", isChecked);
    console.log("==> ID do acompanhante:", id);

    if (!id || !extraPlanId) {
        return res.status(400).json({ message: "ID do acompanhante e extraPlanId são obrigatórios." });
    }

    try {
        const companionId = parseInt(id);
        const extraId = parseInt(extraPlanId);

        const extraPlan = await prisma.extraPlan.findUnique({ where: { id: extraId } });

        console.log("🔍 Plano extra encontrado no banco:", extraPlan);

        if (!extraPlan) {
            return res.status(404).json({ message: "Plano extra não encontrado." });
        }

        if (isChecked) {
            // 1. Verificar se existe assinatura
            const existingSubscription = await prisma.planSubscription.findFirst({
                where: {
                    companionId,
                    extraPlanId: extraId,
                    isExtra: true,
                },
            });

            console.log("Assinatura existente:", existingSubscription);

            const now = new Date();
            const endDate = extraPlan.isTemporary
                ? new Date(now.getTime() + (extraPlan.duration || 60) * 60 * 1000) // duração de 60 minutos padrão
                : null;

            // 2. Upsert da assinatura
            const upserted = await prisma.planSubscription.upsert({
                where: {
                    companionId_extraPlanId: {
                        companionId,
                        extraPlanId: extraId,
                    },
                },
                update: {
                    subscriptionStatus: "ACTIVE",
                    startDate: new Date(),
                    endDate: endDate,
                    isExtra: true,
                },
                create: {
                    companionId,
                    extraPlanId: extraId,
                    isExtra: true,
                    startDate: new Date(),
                    subscriptionStatus: "ACTIVE",
                },
            });

            console.log("Subscription upserted:", upserted);

            // 3. Verificar se já está conectado no many-to-many
            const isAlreadyConnected = await prisma.companion.findFirst({
                where: {
                    id: companionId,
                    extraPlans: {
                        some: { id: extraId },
                    },
                },
            });

            console.log("🔗 Já está conectado no extraPlans:", !!isAlreadyConnected);

            if (!isAlreadyConnected) {
                const updated = await prisma.companion.update({
                    where: { id: companionId },
                    data: {
                        extraPlans: {
                            connect: { id: extraId },
                        },
                        ...(extraPlan.pointsBonus
                            ? {
                                points: {
                                    increment: extraPlan.pointsBonus,
                                },
                            }
                            : {}),
                    },
                });

                console.log("Companion atualizado com plano extra:", updated);
            }

            return res.status(200).json({ message: "Plano extra atribuído com sucesso." });
        } else {
            const existingSubscription = await prisma.planSubscription.findFirst({
                where: {
                    companionId,
                    extraPlanId: extraId,
                    isExtra: true,
                },
            });

            console.log("🗑 Assinatura para remover:", existingSubscription);

            if (existingSubscription) {
                await prisma.$transaction([
                    prisma.planSubscription.delete({
                        where: { id: existingSubscription.id },
                    }),
                    prisma.companion.update({
                        where: { id: companionId },
                        data: {
                            extraPlans: {
                                disconnect: { id: extraId },
                            },
                            ...(extraPlan.pointsBonus
                                ? {
                                    points: {
                                        decrement: extraPlan.pointsBonus,
                                    },
                                }
                                : {}),
                        },
                    }),
                ]);

                console.log("❌ Plano extra removido com sucesso");
                return res.status(200).json({ message: "Plano extra removido com sucesso." });
            } else {
                return res.status(200).json({ message: "Plano extra já estava removido." });
            }
        }
    } catch (error) {
        console.error("❌ Erro ao atualizar plano extra:", error);
        return res.status(500).json({
            message: "Erro ao atualizar plano extra.",
            error: error.message,
        });
    }
};


// Buscar histórico de atividades
export async function getActivityLog(req, res) {
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


export async function deleteCompanionAndUser(req, res) {
    const { id } = req.params;

    try {
        const companionId = parseInt(id);
        if (isNaN(companionId)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const companion = await prisma.companion.findUnique({
            where: { id: companionId },
            include: {
                appUser: true
            }
        });

        if (!companion) {
            return res.status(404).json({ error: "Acompanhante não encontrada" });
        }

        const userId = companion.appUser.id;

        await prisma.$transaction(async (tx) => {
            await tx.story.deleteMany({ where: { companionId } });
            await tx.feedPost.deleteMany({ where: { companionId } });
            await tx.review.deleteMany({ where: { companionId } });
            await tx.activityLog.deleteMany({ where: { companionId } });
            await tx.carrouselImage.deleteMany({ where: { companionId } });
            await tx.media.deleteMany({ where: { companionId } });
            await tx.contactMethodCompanion.deleteMany({ where: { companionId } });
            await tx.paymentMethodCompanion.deleteMany({ where: { companionId } });
            await tx.physicalCharacteristics.deleteMany({ where: { companionId } });
            await tx.ageCategoryCompanion.deleteMany({ where: { companionId } });
            await tx.serviceCompanionOffered.deleteMany({ where: { companionId } });
            await tx.servicosGeraisCompanion.deleteMany({ where: { companionId } });
            await tx.servicosEspeciaisCompanion.deleteMany({ where: { companionId } });
            await tx.locationCompanion.deleteMany({ where: { companionId } });
            await tx.unavailableDates.deleteMany({ where: { companionId } });
            await tx.weeklySchedule.deleteMany({ where: { companionId } });
            await tx.timedServiceCompanion.deleteMany({ where: { companionId } });
            await tx.planSubscription.deleteMany({ where: { companionId } });
            await tx.document.deleteMany({ where: { companionId } });
            await tx.follow.deleteMany({ where: { followingId: companionId } });

            // Desvincula os planos extras
            await tx.companion.update({
                where: { id: companionId },
                data: {
                    extraPlans: { set: [] },
                },
            });

            // Remove o Top10
            await tx.top10.deleteMany({ where: { userId } });

            // 🆕 Remove os pagamentos vinculados ao usuário
            await tx.payment.deleteMany({ where: { userId } });

            // Deleta o companion
            await tx.companion.delete({ where: { id: companionId } });

            // Deleta o usuário
            await tx.appUser.delete({ where: { id: userId } });
        });


        return res.status(200).json({ message: "Acompanhante deletada com sucesso." });

    } catch (error) {
        console.error("Erro ao deletar acompanhante via admin:", error);
        return res.status(500).json({ error: "Erro interno ao deletar acompanhante." });
    }
};
