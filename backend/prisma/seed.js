const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPlanTypes() {
    const planTypes = [
        {
            name: 'VIP',
            size: 'Pequeno',
            isOnline: true,
            accessDashboard: true,
            accessMetrics: true,
            accessConvenio: false,
            points: 300,
            cityChangeAllowed: true,
            cityChangeFee: 50.0,
            isDarkMode: false,
        },
        {
            name: 'Pink',
            size: 'Padrão',
            isOnline: true,
            accessDashboard: true,
            accessMetrics: true,
            accessConvenio: true,
            points: 500,
            cityChangeAllowed: true,
            cityChangeFee: 50.0,
            isDarkMode: false,
        },
        {
            name: 'Safira',
            size: 'Médio',
            isOnline: true,
            accessDashboard: true,
            accessMetrics: true,
            accessConvenio: true,
            points: 1000,
            cityChangeAllowed: true,
            cityChangeFee: 30.0,
            isDarkMode: false,
        },
        {
            name: 'Rubi',
            size: 'Grande',
            isOnline: true,
            accessDashboard: true,
            accessMetrics: true,
            accessConvenio: true,
            points: 2000,
            cityChangeAllowed: true,
            cityChangeFee: 20.0,
            isDarkMode: false,
        },
        {
            name: 'Nitro',
            size: 'Temporário',
            isOnline: true,
            accessDashboard: false,
            accessMetrics: false,
            accessConvenio: false,
            points: 4000, // Pontos de destaque temporário
            cityChangeAllowed: false,
            cityChangeFee: 0.0,
            isDarkMode: true, // Modo escuro ativo
        },
    ];

    // Inserir no banco de dados
    for (const planType of planTypes) {
        const existingPlanType = await prisma.planType.findUnique({
            where: { name: planType.name },
        });

        if (!existingPlanType) {
            await prisma.planType.create({
                data: planType,
            });
        }
    }

    console.log('Seed concluído: Tipos de planos inseridos com sucesso!');
}

async function seedPlan() {
    const plans = [
        {
            name: 'Plano Rubi',
            price: 327.90,
            description: 'Seu anúncio em tamanho grande. Prioridade no suporte Faixa Rosa. Anúncio online todos os dias da semana. Acesso aos stories. Acesso ao convênio. +2000 pontos de listagem.',
            isBasic: true,
        },
        {
            name: 'Plano Safira',
            price: 287.90,
            description: 'Seu anúncio em tamanho médio. Prioridade no suporte Faixa Rosa. Anúncio online todos os dias da semana. Acesso aos stories. Acesso ao convênio. +1000 pontos de listagem.',
            isBasic: true,
        },
        {
            name: 'Plano Pink',
            price: 227.90,
            description: 'Seu anúncio em tamanho padrão. Prioridade no suporte Faixa Rosa. Anúncio online todos os dias da semana. Acesso aos stories. Acesso ao convênio. +500 pontos de listagem.',
            isBasic: true,
        },
        {
            name: 'Plano Vip',
            price: 169.90,
            description: 'Tenha até 10 fotos e 4 vídeos exclusivos. Anúncio online todos os dias da semana. Prioridade no suporte Faixa Rosa. Sem convênio. Sem stories. +300 pontos de listagem.',
            isBasic: true,
        },
        {
            name: 'Plano Nitro',
            price: 6.90,
            description: 'Anúncio em posição de destaque (Por uma hora). Todos benefícios de outros planos (Por uma hora). Opção de stories (Por uma hora). Sem convênio. +4000 pontos de listagem (Por uma hora).',
            isBasic: false,
            extraDetails: {
                isTemporary: true,
                duration: 60, // Duração em minutos
                pointsBonus: 4000,
                tempPoints: 4000,
                isEnabled: true,
                hasContact: false,
                canHideAge: false,
                hasPublicReviews: false,
                hasDarkMode: true,
                hasStories: true,
            },
        },
    ];

    // Inserir no banco de dados
    for (const plan of plans) {
        const existingPlan = await prisma.plan.findUnique({
            where: { name: plan.name }, // Verifica se o plano já existe pelo nome
        });

        if (!existingPlan) {
            await prisma.plan.create({
                data: {
                    name: plan.name,
                    price: plan.price,
                    description: plan.description,
                    isBasic: plan.isBasic,
                },
            });

            // Se for um plano extra (isBasic: false), adicioná-lo também na tabela ExtraPlan
            if (!plan.isBasic && plan.extraDetails) {
                const existingExtraPlan = await prisma.extraPlan.findUnique({
                    where: { name: plan.name },
                });

                if (!existingExtraPlan) {
                    await prisma.extraPlan.create({
                        data: {
                            name: plan.name,
                            description: plan.description,
                            ...plan.extraDetails, // Inclui as funcionalidades extras
                        },
                    });
                    console.log(`Plano extra criado: ${plan.name}`);
                }
            }
        }
    }

    console.log('Seed concluído: Planos básicos inseridos com sucesso!');
}

async function seedPlansAndExtras() {
    const extraPlans = [
        {
            name: 'Contato',
            price: 83.60,
            description: 'Até 1.5x mais visitas e 2 mais contatos de clientes que outros perfis da sua cidade. Prioridade no suporte Faixa Rosa. Anúncio online todos os dias da semana.',
            extraDetails: {
                pointsBonus: 200,
                tempPoints: 0,
                hasContact: true,
                hasStories: false,
                hasDarkMode: false,
                canHideAge: false,
                hasPublicReviews: false,
                isTemporary: false,
                duration: null,
                isEnabled: true,
            },
        },
        {
            name: 'Oculto',
            price: 99.90,
            description: 'Esconda sua idade no Faixa Rosa. Prioridade no suporte Faixa Rosa. Anúncio online todos os dias da semana.',
            extraDetails: {
                pointsBonus: 100,  // Pontos de destaque
                tempPoints: 0,    // Pontos de destaque temporário
                isTemporary: false,       // Destaque temporário
                hasContact: false,        // Contato
                canHideAge: true,         // Ocultar idade
                hasPublicReviews: false,  // Reviews públicos
                hasDarkMode: false,       // Modo escuro
                hasStories: false,        // Stories
                duration: null,           // Duração do destaque temporário
                isEnabled: true,           // Habilitado
            },
        },
        {
            name: 'Troca de Cidade',
            price: 80.00,
            description: 'Troque de cidade facilmente. Anúncio online na nova cidade.',
            extraDetails: {
                pointsBonus: 0,
                tempPoints: 0,
                isTemporary: false,
                hasContact: false,
                hasStories: false,
                hasDarkMode: false,
                canHideAge: false,
                hasPublicReviews: false,
                duration: null,
                isEnabled: true,
            },
        },
        {
            name: 'Reviews Públicos',
            price: 314.91,
            description: 'Deixe que os contratantes leiam seus reviews. Prioridade no suporte Faixa Rosa. Anúncio online todos os dias da semana.',
            extraDetails: {
                pointsBonus: 800,
                tempPoints: 0,
                hasContact: false,
                hasStories: false,
                hasDarkMode: false,
                canHideAge: false,
                hasPublicReviews: true,
                isTemporary: false,
                duration: null,
                isEnabled: true,
            },
        },
        {
            name: 'DarkMode',
            price: 314.91,
            description: 'Anúncio em posição de destaque (Por uma hora). Todos os benefícios de outros planos (Por uma hora).',
            extraDetails: {
                pointsBonus: 2000,
                tempPoints: 2000,
                hasContact: false,
                hasStories: true,
                hasDarkMode: true,
                canHideAge: false,
                hasPublicReviews: false,
                isTemporary: true,
                duration: 60,
                isEnabled: true,
            },
        },
    ];

    for (const extraPlan of extraPlans) {
        // Verificar se o registro já existe pelo campo `name`
        const existingExtraPlan = await prisma.extraPlan.findUnique({
            where: { name: extraPlan.name },
        });

        if (!existingExtraPlan) {
            // Criar o registro na tabela `ExtraPlan`
            await prisma.extraPlan.create({
                data: {
                    name: extraPlan.name,
                    description: extraPlan.description,
                    ...extraPlan.extraDetails, // Insere os detalhes adicionais
                },
            });
            console.log(`Plano extra criado: ${extraPlan.name}`);
        } else {
            console.log(`Plano extra já existe: ${extraPlan.name}`);
        }
    }


    console.log('Seed concluído: Planos extras e funcionalidades inseridos com sucesso!');
}



async function runAllSeeds() {
    try {
        await seedPlanTypes();
        await seedPlan();
        await seedPlansAndExtras();
    } catch (error) {
        console.error('Erro ao executar seeds:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runAllSeeds();