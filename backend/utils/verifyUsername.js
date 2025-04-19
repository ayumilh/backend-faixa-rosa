const prisma = require("../prisma/client"); // Importando o cliente Prisma

const validarUsername = async (userName) => {
  if (!userName) {
    return { error: "O campo userName é obrigatório." };
  }

  try {
    const existingUser = await prisma.companion.findUnique({
      where: { userName },
      select: { id: true },
    });

    if (existingUser) {
      return { valid: false, message: "Nome de usuário já está em uso." };
    } else {
      return { valid: true, message: "Nome de usuário disponível!" };
    }
  } catch (error) {
    return { error: "Erro interno ao verificar o userName." };
  }
};

module.exports = { validarUsername };
