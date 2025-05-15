const prisma = require('../prisma/client');

exports.searchCompanionCity = async (req, res) => {
    try {
        // Recebendo os parâmetros da query
        let { cidade, estado, userName, planos } = req.query;

        // Caso o parâmetro planos seja true, vamos buscar apenas os planos
        if (planos === "true") {
            if (!userName) {
                return res.status(400).json({ error: "O parâmetro userName é obrigatório quando 'planos=true'." });
            }

            // Buscar o companion pelo userName
            const companion = await prisma.companion.findUnique({
                where: { userName: userName.trim() },
                select: {
                    id: true,
                    userName: true,
                    isAgeHidden: true,
                    plan: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            description: true,
                            planType: {
                                select: {
                                    id: true,
                                    name: true,
                                    size: true,
                                },
                            },
                        },
                    },
                    carrouselImages: {
                        select: {
                            id: true,
                            imageUrl: true,
                            order: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                        orderBy: {
                            order: "asc",
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
                    timedServiceCompanion: {
                        include: { TimedService: true }
                    },
                    contactMethods: {
                        select: {
                            whatsappNumber: true,
                            whatsappCountryCode: true,
                            whatsappMessage: true,
                            telegramUsername: true,
                            phoneNumber: true,
                            phoneCountryCode: true
                        }
                    },
                },
            });

            // Verifica se o acompanhante foi encontrado e possui planos
            if (!companion || !companion.plan) {
                return res.status(200).json({ error: "Nenhum plano encontrado para o usuário especificado." });
            }

            // Buscar e contar total de postagens (imagem ou vídeo) da acompanhante
            const [mediaCount, carrouselCount, feedCount] = await Promise.all([
                prisma.media.count({ where: { companionId: companion.id } }),
                prisma.carrouselImage.count({ where: { companionId: companion.id } }),
                prisma.feedPost.count({ where: { companionId: companion.id } }),
            ]);

            const totalReviews = await prisma.review.count({
                where: {
                    companionId: companion.id,
                },
            });

            // Soma total de todas as postagens
            const totalPosts = mediaCount + carrouselCount + feedCount;

            // Inclui no objeto de resposta
            companion.totalPosts = totalPosts;
            companion.totalReviews = totalReviews;

            // Busca TODOS os horários disponíveis na tabela TimedService
            const allTimedServices = await prisma.timedService.findMany();

            // Mapeia os horários que a acompanhante já oferece
            const companionTimedServicesMap = new Map(
                companion.timedServiceCompanion.map(ts => [ts.timedServiceId, ts])
            );

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

            // Retorna os planos do acompanhante
            return res.status(200).json({
                plan: companion.plan,
                subscriptions: companion.subscriptions,
                timedServices,
                carrouselImages: companion.carrouselImages,
                totalPosts: companion.totalPosts,
                totalReviews: companion.totalReviews,
                contact: companion.contactMethods?.[0] || null,
            });
        }

        // Montando os filtros dinamicamente com base na presença dos parâmetros
        const filters = {};

        if (cidade) {
            filters.city = {
                equals: cidade.trim().toLowerCase(),
                mode: "insensitive",
            };
        }

        if (estado) {
            filters.state = {
                equals: estado.trim().toUpperCase(),
                mode: "insensitive",
            };
        }

        if (userName) {
            filters.userName = {
                equals: userName.trim(),
                mode: "insensitive",
            };
        }

        // Verifica se a consulta inclui planos
        let extraPlanFilters = {};
        if (planos === "true") {
            extraPlanFilters = {
                subscriptions: {
                    some: {
                        extraPlan: {
                            isEnabled: true,
                        },
                    },
                },
            };
        }

        const prioridadePlanos = {
            "Plano Rubi": 5,
            "Plano Safira": 4,
            "Plano Pink": 3,
            "Plano Vip": 2,
            "Plano Nitro": 1,
            "Contato": 0,
            "Oculto": 0,
            "Reviews Públicos": 0,
            "DarkMode": 0,
            null: 0,
        };

        // Buscando acompanhantes na cidade e estado especificados
        const acompanhantes = await prisma.companion.findMany({
            where: {
                ...filters,
                ...extraPlanFilters,
            },
            orderBy: {
                points: "desc",
            },
            select: {
                id: true,
                userName: true,
                age: true,
                isAgeHidden: true,
                city: true,
                state: true,
                description: true,
                points: true,
                lastOnline: true,
                profileStatus: true,
                documentStatus: true,
                atendimentos: true,
                profileImage: true,
                bannerImage: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        birthDate: true,
                    },
                },
                carrouselImages: {
                    select: {
                        id: true,
                        imageUrl: true,
                        order: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        order: "asc",
                    },
                },
                media: {
                    select: {
                        url: true,
                        mediaType: true,
                    },
                    take: 1, // Retorna apenas a primeira mídia
                },
                plan: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        description: true,
                        planType: {
                            select: {
                                id: true,
                                name: true,
                                size: true,
                            },
                        },
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
                        endDate: null,
                        extraPlan: {
                            // Usando isNot para garantir que extraPlan não seja null
                            isNot: null,
                        },
                    },
                },
                timedServiceCompanion: {
                    include: { TimedService: true }
                },
                contactMethods: {
                    select: {
                        whatsappNumber: true,
                        whatsappCountryCode: true,
                        whatsappMessage: true,
                        telegramUsername: true,
                        phoneNumber: true,
                        phoneCountryCode: true
                    }
                }

            },
        });

        acompanhantes.sort((a, b) => {
            if (a.points !== b.points) return 0; // já está em ordem de pontos
            const planoA = prioridadePlanos[a.plan?.name ?? null] || 0;
            const planoB = prioridadePlanos[b.plan?.name ?? null] || 0;
            return planoB - planoA;
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

        // Incluindo os timedServices no retorno de cada acompanhante
        const acompanhantesComTimedServices = await Promise.all(acompanhantesComIdade.map(async (acompanhante) => {
            // Recuperar os timedServices do acompanhante
            const allTimedServices = await prisma.timedService.findMany();
            const companionTimedServicesMap = new Map(
                acompanhante.timedServiceCompanion.map(ts => [ts.timedServiceId, ts])
            );

            const timedServices = allTimedServices.map(timedService => {
                const companionService = companionTimedServicesMap.get(timedService.id);

                return {
                    id: timedService.id,
                    name: timedService.name,
                    description: timedService.description,
                    defaultPrice: timedService.defaultPrice ?? null,
                    isOffered: companionService ? companionService.isOffered : false,
                    price: companionService?.price ?? null
                };
            });

            // Calcular total de posts e reviews
            const [mediaCount, carrouselCount, feedCount, totalReviews] = await Promise.all([
                prisma.media.count({ where: { companionId: acompanhante.id } }),
                prisma.carrouselImage.count({ where: { companionId: acompanhante.id } }),
                prisma.feedPost.count({ where: { companionId: acompanhante.id } }),
                prisma.review.count({ where: { companionId: acompanhante.id } }),
            ]);

            const totalPosts = mediaCount + carrouselCount + feedCount;

            return {
                ...acompanhante,
                timedServices,
                totalPosts,
                totalReviews
            };
        }));

        return res.status(200).json(acompanhantesComTimedServices);
    } catch (error) {
        console.error("Erro ao buscar acompanhantes:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

exports.searchCompanionProfile = async (req, res) => {
  const { userName } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const companion = await prisma.companion.findUnique({
      where: { userName },
      select: {
        id: true,
        userName: true,
        description: true,
        age: true,
        city: true,
        state: true,
        profileStatus: true,
        lastOnline: true,
        points: true,
        plan: true,
        planType: true,
        profileImage: true,
        bannerImage: true,
        atendimentos: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            birthDate: true,
          },
        },
        servicesOffered: {
          include: { service: true },
        },
        PhysicalCharacteristics: true,
        timedServiceCompanion: {
          include: { TimedService: true },
        },
        paymentMethods: {
          select: { paymentMethod: true },
        },
        lugares: {
          include: { location: true },
        },
        contactMethods: {
          select: {
            id: true,
            whatsappNumber: true,
            whatsappMessage: true,
            telegramUsername: true,
            phoneNumber: true,
          },
        },
        weeklySchedules: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true,
          },
        },
      },
    });

    if (!companion) {
      return res.status(200).json({
        error: true,
        message: 'Acompanhante não encontrada',
        data: null,
      });
    }

    // Função segura para calcular idade
    const calculateAge = (birthDate) => {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const formatDate = (date) =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(date));

    companion.createdAtFormatted = formatDate(companion.createdAt);

    const [mediaCount, carrouselCount, feedCount] = await Promise.all([
      prisma.media.count({ where: { companionId: companion.id } }),
      prisma.carrouselImage.count({ where: { companionId: companion.id } }),
      prisma.feedPost.count({ where: { companionId: companion.id } }),
    ]);

    const totalReviews = await prisma.review.count({
      where: { companionId: companion.id },
    });

    companion.totalPosts = mediaCount + carrouselCount + feedCount;
    companion.totalReviews = totalReviews;

    // Calcular idade se possível
    if (companion.user?.birthDate) {
      const birthDate = new Date(companion.user.birthDate);
      companion.age = calculateAge(birthDate);
    }

    // Formatando serviços
    companion.servicesOffered = (companion.servicesOffered || []).map(service => ({
      id: service.id,
      companionId: service.companionId,
      serviceId: service.serviceId,
      isOffered: service.isOffered,
      price: service.price,
      name: service.service?.name ?? '',
      description: service.service?.description ?? '',
    }));

    // Serviços por tempo
    companion.timedServiceCompanion = (companion.timedServiceCompanion || []).map(service => ({
      id: service.id,
      companionId: service.companionId,
      timedServiceId: service.timedServiceId,
      isOffered: service.isOffered,
      price: service.price,
      name: service.TimedService?.name ?? "Nome não informado",
      description: service.TimedService?.description ?? "Descrição não informada",
    }));

    // Métodos de pagamento
    companion.paymentMethods = (companion.paymentMethods || []).map(
      method => method.paymentMethod
    );

    // Localizações
    companion.lugares = (companion.lugares || []).map(loc => ({
      id: loc.id,
      companionId: loc.companionId,
      locationId: loc.locationId,
      amenities: loc.amenities,
      location: loc.location ? {
        id: loc.location.id,
        name: loc.location.name,
        address: loc.location.address,
        city: loc.location.city,
        state: loc.location.state,
        country: loc.location.country,
      } : null,
    }));

    // Horários
    companion.weeklySchedules = (companion.weeklySchedules || []).map(schedule => ({
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime || "Horário não informado",
      endTime: schedule.endTime || "Horário não informado",
      isActive: schedule.isActive,
    }));

    return res.status(200).json(companion);
  } catch (error) {
    console.error("Erro interno:", error);
    return res.status(500).json({ message: 'Erro ao buscar os dados da acompanhante' });
  }
};



// Listar todos os posts
exports.listFeedPosts = async (req, res) => {
    const { userName } = req.query;

    const companion = await prisma.companion.findFirst({ where: { userName } });
    if (!companion) return res.status(404).json({ error: "Acompanhante não encontrado." });

    try {
        const posts = await prisma.feedPost.findMany({
            where: { companionId: companion.id },
            include: {
                companion: { select: { name: true, city: true, state: true } },
            },
        });

        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao listar posts do feed.' });
    }
};


// Listar stories ativos (que ainda não expiraram)
exports.listActiveStories = async (req, res) => {
    try {
        const stories = await prisma.story.findMany({
            where: {
                expiresAt: { gt: new Date() }
            },
            include: {
                companion: {
                    select: {
                        userName: true,
                        profileImage: true,
                        description: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.status(200).json(stories);
    } catch (error) {
        console.error('Erro ao listar stories:', error);
        return res.status(500).json({ error: 'Erro ao listar stories.' });
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