const prisma = require("../prisma/client"); // Importando o cliente Prisma

const validarEmail = async (email) => {
  if (!email) {
    return { error: "O campo email é obrigatório." };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return { valid: false, message: "Email já está em uso." };
    } else {
      return { valid: true, message: "Email disponível!" };
    }
  } catch (error) {
    return { error: "Erro interno ao verificar o email." };
  }
};

module.exports = { validarEmail };
