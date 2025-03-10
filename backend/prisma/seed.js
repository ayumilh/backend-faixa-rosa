const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    ];

    // Inserir no banco de dados
    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { name: plan.name },
            update: {},
            create: {
                name: plan.name,
                price: plan.price,
                description: plan.description,
                isBasic: plan.isBasic,
            },
        });
    }

    console.log('Seed concluído: Planos básicos inseridos com sucesso!');
}

async function seedPlanTypes() {
    const planTypes = [
        {
            name: 'Plano Vip',
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
            name: 'Plano Pink',
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
            name: 'Plano Safira',
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
            name: 'Plano Rubi',
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
    ];

    // Inserir no banco de dados
    const plans = await prisma.plan.findMany(); 

    const mapping = {
        "Plano Rubi": "Plano Rubi",
        "Plano Safira": "Plano Safira",
        "Plano Pink": "Plano Pink",
        "Plano Vip": "Plano Vip"
      };

    for (const planType of planTypes) {
        const plan = plans.find((p) => p.name === mapping[planType.name]);

        if (plan) {
            await prisma.planType.upsert({
                where: { name: planType.name },
                update: {},
                create: {
                    ...planType,
                    plans: { connect: { id: plan.id } }, 
                },
            });
        } else {
            console.error(`⚠️ Erro: Plano correspondente a ${planType.name} não encontrado.`);
        }
    }
    

    console.log('Seed concluído: Tipos de planos inseridos com sucesso!');
}

async function seedPlansAndExtras() {
    const extraPlans = [
        {
            name: 'Plano Nitro',
            price: 6.90,
            description: 'Anúncio em posição de destaque (Por uma hora). Todos os benefícios de outros planos (Por uma hora). Opção de stories (Por uma hora). Sem convênio. +4000 pontos de listagem (Por uma hora).',
            extraDetails: {
                isTemporary: true,
                duration: 60,
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

    // for (const extraPlan of extraPlans) {
    //     const existingExtraPlan = await prisma.extraPlan.findUnique({
    //         where: { name: extraPlan.name },
    //     });

    //     if (!existingExtraPlan) {
    //         await prisma.extraPlan.create({
    //             data: {
    //                 name: extraPlan.name,
    //                 description: extraPlan.description,
    //                 ...extraPlan.extraDetails,
    //             },
    //         });
    //         console.log(`Plano extra criado: ${extraPlan.name}`);
    //     } else {
    //         console.log(`Plano extra já existe: ${extraPlan.name}`);
    //     }
    // }

    for (const extraPlan of extraPlans) {
        // Criar ou atualizar o Plan
        const plan = await prisma.plan.upsert({
            where: { name: extraPlan.name },
            update: {},
            create: {
                name: extraPlan.name,
                price: extraPlan.price,
                description: extraPlan.description,
                isBasic: false, // Planos extras não são básicos
            },
        });

        // Criar ou atualizar o ExtraPlan vinculado ao Plan
        await prisma.extraPlan.upsert({
            where: { name: extraPlan.name },
            update: {},
            create: {
                name: extraPlan.name,
                description: extraPlan.description,
                pointsBonus: extraPlan.extraDetails.pointsBonus,
                tempPoints: extraPlan.extraDetails.tempPoints,
                isTemporary: extraPlan.extraDetails.isTemporary,
                duration: extraPlan.extraDetails.duration,
                isEnabled: extraPlan.extraDetails.isEnabled,
                hasContact: extraPlan.extraDetails.hasContact,
                canHideAge: extraPlan.extraDetails.canHideAge,
                hasPublicReviews: extraPlan.extraDetails.hasPublicReviews,
                hasDarkMode: extraPlan.extraDetails.hasDarkMode,
                hasStories: extraPlan.extraDetails.hasStories,
                plans: { connect: { id: plan.id } }, // Associar ExtraPlan ao Plan
            },
        });
    }

    console.log('Seed concluído: Planos extras e funcionalidades inseridos com sucesso!');
}

async function seedTimedServices() {
    const services = [
        { name: '1 hora', description: 'Serviço de 1 hora.', defaultPrice: 50 },
        { name: '2 horas', description: 'Serviço de 2 horas.', defaultPrice: 100 },
        { name: '4 horas', description: 'Serviço de 4 horas.', defaultPrice: 200 },
        { name: 'Diária', description: 'Serviço diário.', defaultPrice: 500 },
        { name: '30 minutos', description: 'Serviço de 30 minutos.', defaultPrice: 30 },
        { name: '15 minutos', description: 'Serviço de 15 minutos.', defaultPrice: 20 },
        { name: 'Diária de viagem', description: 'Serviço diário durante viagens.', defaultPrice: 800 },
    ];

    for (const service of services) {
        await prisma.timedService.upsert({
            where: { name: service.name },
            update: {},
            create: service,
        });
    }

    console.log('Seed de serviços criada com sucesso!');
}

async function seedAttendedLocations() {
    const locations = [
        { name: "A_DOMICILIO" },
        { name: "FESTAS_EVENTOS" },
        { name: "HOTEIS" },
        { name: "LOCAL_PROPRIO" },
        { name: "MOTEIS" },
        { name: "VIAGENS" },
        { name: "CLUB_DE_SWING" },
        { name: "JANTARES" },
        { name: "DESPEDIDA_SOLTEIRO" },
    ];

    console.log("Seeding locations...");

    for (const location of locations) {
        await prisma.location.upsert({
            where: { name: location.name },
            update: {},
            create: {
                name: location.name, // Passando o valor como ENUM corretamente
            },
        });
    }

    console.log("Seeding complete.");
}

const seedServicesOffered = async () => {
    const services = [
        {
            name: "Utiliza acessórios eróticos",
            description: "Inclui o uso de brinquedos eróticos diversos.",
            isOffered: false,
        },
        {
            name: "Beijo grego",
            description: "Prática que envolve a estimulação oral da região anal.",
            isOffered: false,
        },
        {
            name: "Podolatria",
            description: "Atração sexual por pés, onde os pés são o foco principal da excitação.",
            isOffered: false,
        },
        {
            name: "Fisting",
            description: "Introdução de uma mão inteira na vagina ou no ânus durante o ato sexual.",
            isOffered: false,
        },
        {
            name: "Dominação",
            description: "Envolve o controle e a submissão de uma pessoa sobre a outra.",
            isOffered: false,
        },
        {
            name: "Uso de roupas de fantasia/uniformes",
            description: "Prática onde um dos participantes veste roupas específicas ou uniformes.",
            isOffered: false,
        },
        {
            name: "Sadomasoquismo",
            description: "Atividades que envolvem dor ou humilhação consensual.",
            isOffered: false,
        },
        {
            name: "Facefuck",
            description: "Ato de penetração oral intensa e profunda.",
            isOffered: false,
        },
        {
            name: "Squirt",
            description: "Ejaculação feminina durante o clímax.",
            isOffered: false,
        },
        {
            name: "Permite filmagem",
            description: "Consente que a relação seja filmada com consentimento claro.",
            isOffered: false,
        },
        {
            name: "Beijo na boca",
            description: "Realiza beijo na boca com seus clientes.",
            isOffered: false,
        },
        {
            name: "Striptease",
            description: "Tira a roupa de forma lenta e sensual, normalmente com dança.",
            isOffered: false,
        },
        {
            name: "Massagem tradicional",
            description: "Realiza massagem relaxante em seus clientes.",
            isOffered: false,
        },
        {
            name: "Massagem tântrica",
            description: "Realiza massagem tântrica que expande a sensibilidade sexual.",
            isOffered: false,
        },
        {
            name: "Sexo virtual",
            description: "Sexo à distância por meio de texto, áudio e vídeo online. Sem contato físico.",
            isOffered: false,
        },
        {
            name: "Viagem",
            description: "Aceita viajar com seus clientes.",
            isOffered: false,
        },
        {
            name: "Sexo oral com preservativo",
            description: "Realiza sexo oral com preservativo em seus clientes.",
            isOffered: false,
        },
        {
            name: "Sexo oral sem preservativo",
            description: "Atividade em que o sexo oral é realizado sem o uso de preservativo.",
            isOffered: false,
        },
        {
            name: "Fazer roleplay",
            description: "Envolve atuar ou fingir ser outra pessoa em um cenário fictício.",
            isOffered: false,
        },
        {
            name: "Sexo anal com preservativo",
            description: "Aceita receber penetração anal com preservativo de seus clientes.",
            isOffered: false,
        },
        {
            name: "Sexo vaginal com preservativo",
            description: "Faz penetração vaginal com preservativo em seus clientes.",
            isOffered: false,
        },
        {
            name: "Masturbação",
            description: "Realiza masturbação em seus clientes.",
            isOffered: false,
        },
        {
            name: "Acompanhante",
            description: "Companhia para encontros, festas e eventos.",
            isOffered: false,
        },
        {
            name: "Dupla penetração",
            description: "Prática que envolve a penetração simultânea em duas áreas do corpo.",
            isOffered: false,
        },
        {
            name: "Tripla  penetração",
            description: "Prática que envolve a penetração simultânea em três áreas do corpo.",
            isOffered: false,
        },
        {
            name: "Penetração com acessórios sexuais",
            description: "Uso de brinquedos ou acessórios durante a penetração.",
            isOffered: false,
        },
        {
            name: "Sexo com voyeurismo/ser voyeur",
            description: "Ato de observar ou ser observado durante relações sexuais.",
            isOffered: false,
        },
        {
            name: "Bondage",
            description: "Prática de amarração consensual com cordas para restrição.",
            isOffered: false,
        },        
        {
            name: "Quirofilia",
            description: "Excitação sexual causada pelas mãos.",
            isOffered: false,
        },
        {
            name: "Chuva dourada",
            description: "Prática de urinar no parceiro durante o ato sexual.",
            isOffered: false,
        },
        {
            name: "Chuva marrom",
            description: "Prática de defecar no parceiro.",
            isOffered: false,
        },
        {
            name: "Trampling",
            description: "Ato de pisotear outra pessoa com os pés como forma de excitação sexual.",
            isOffered: false,
        },
    ];

    for (const service of services) {
        await prisma.serviceOffered.upsert({
            where: { name: service.name },
            update: {
                description: service.description,
                isOffered: service.isOffered
            },
            create: service
        });
    }

    console.log("Seeding services offered complete.");
}

async function runAllSeeds() {
    try {
        // await seedPlan();
        // await seedPlanTypes();
        // await seedPlansAndExtras();
        // await seedTimedServices();
        // await seedAttendedLocations();
        // await seedServicesOffered();
    } catch (error) {
        console.error('Erro ao executar seeds:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runAllSeeds();