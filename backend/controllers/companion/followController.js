const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Função para seguir um Companion por um Contractor
exports.followCompanion(contractorId, companionId) => {
    // Verificar se o Contractor já está seguindo o Companion
    const existingFollow = await prisma.follow.findFirst({
        where: {
            followerId: contractorId,
            followingId: companionId,
        },
    });

    if (existingFollow) {
        // Caso já esteja seguindo, não cria um novo relacionamento
        return "Você já está seguindo essa acompanhante.";
    }

    // Caso contrário, cria o novo relacionamento de seguir
    const follow = await prisma.follow.create({
        data: {
            followerId: contractorId,
            followingId: companionId,
        },
    });

    return follow;
}


// Função para deixar de seguir um Companion
async function unfollowCompanion(contractorId, companionId) {
    // Remover o relacionamento de seguir
    const unfollow = await prisma.follow.deleteMany({
        where: {
            followerId: contractorId,
            followingId: companionId,
        },
    });

    return unfollow;
}

// Função para listar os companions que um Contractor está seguindo
async function getFollowingOfContractor(contractorId) {
    const following = await prisma.follow.findMany({
        where: {
            followerId: contractorId, // Busca os companions que o contractor está seguindo
        },
        include: {
            following: true, // Inclui os dados do Companion
        },
    });

    return following.map(follow => follow.following); // Retorna os Companions seguidos
}
