const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const plans = [
        {
            name: 'Plano Rubi',
            price: 327.90,
            description: 'Seu anúncio em tamanho grande. Prioridade no suporte Faixa Rosa. Anúncio online todos os dias da semana. Acesso aos stories. Acesso ao convênio. +2000 pontos de listagem.',
            isDarkMode: false,
        },
        {
            name: 'Plano Safira',
            price: 287.90,
            description: 'Seu anúncio em tamanho médio. Prioridade no suporte Faixa Rosa. Anúncio online todos os dias da semana. Acesso aos stories. Acesso ao convênio. +1000 pontos de listagem.',
            isDarkMode: false,
        },
        {
            name: 'Plano Pink',
            price: 227.90,
            description: 'Seu anúncio em tamanho padrão. Prioridade no suporte Faixa Rosa. Anúncio online todos os dias da semana. Acesso aos stories. Acesso ao convênio. +500 pontos de listagem.',
            isDarkMode: false,
        },
    ];

    // Inserir no banco de dados
    for (const plan of plans) {
        await prisma.plan.create({
            data: plan,
        });
    }

    console.log('Seed concluído: Planos inseridos com sucesso!');
}

main()
    .catch((e) => {
        console.error('Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
