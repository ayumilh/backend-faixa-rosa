const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Função para seguir um Companion por um Contractor
exports.followCompanion = async (contractorId, companionId) => {
    // Verificar se o Contractor já está seguindo o Companion
    const existingFollow = await prisma.follow.findFirst({
        where: {
            followerId: contractorId,
            followingId: companionId,
        },
    });

    if (existingFollow) {
        // Caso já esteja seguindo, não cria um novo relacionamento
        return { message: "Você já está seguindo essa acompanhante." };
    }

    // Caso contrário, cria o novo relacionamento de seguir
    const follow = await prisma.follow.create({
        data: {
            followerId: contractorId,
            followingId: companionId,
        },
    });

    return follow;
};

// Função para deixar de seguir um Companion
exports.unfollowCompanion = async (contractorId, companionId) => {
    // Remover o relacionamento de seguir
    const unfollow = await prisma.follow.deleteMany({
        where: {
            followerId: contractorId,
            followingId: companionId,
        },
    });

    if (unfollow.count === 0) {
        return { message: "Você não segue essa acompanhante." };
    }

    return { message: "Você deixou de seguir a acompanhante." };
};

// Função para listar os companions que um Contractor está seguindo
exports.getFollowingOfContractor = async (contractorId) => {
    const following = await prisma.follow.findMany({
        where: {
            followerId: contractorId, // Busca os companions que o contractor está seguindo
        },
        include: {
            following: true, // Inclui os dados do Companion
        },
    });

    return following.map(follow => follow.following); // Retorna os Companions seguidos
};

// Função para listar os seguidores de um Companion
exports.getFollowersOfCompanion = async (companionId) => {
    const followers = await prisma.follow.findMany({
        where: {
            followingId: companionId, // Busca os contractors que seguem esse companion
        },
        include: {
            follower: true, // Inclui os dados do Contractor
        },
    });

    return followers.map(follow => follow.follower); // Retorna os Contractors que seguem o Companion
};