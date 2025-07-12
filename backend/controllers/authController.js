import prisma from '../prisma/client.js';

// Verificar se o CPF já existe
export async function verificarCpf(req, res) {
  const { cpf } = req.body;

  if (!cpf) {
    return res.status(400).json({ error: 'CPF é obrigatório.' });
  }

  try {
    const existingCpf = await prisma.appUser.findUnique({
      where: { cpf },
    });

    if (existingCpf) {
      return res.status(400).json({ error: 'CPF já está em uso.' });
    }

    return res.status(200).json({ message: 'CPF disponível.' });
  } catch (error) {
    console.error('Erro ao verificar CPF:', error);
    return res.status(500).json({ error: 'Erro interno ao verificar CPF.' });
  }
}

// Verificar se o Email já existe
export async function verificarEmail(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      valid: false,
      message: "E-mail é obrigatório.",
    });
  }

  try {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(200).json({
        valid: false,
        message: "E-mail já está em uso.",
      });
    }

    return res.status(200).json({
      valid: true,
      message: "E-mail disponível.",
    });
  } catch (error) {
    console.error("Erro ao verificar E-mail:", error);
    return res.status(500).json({
      valid: false,
      message: "Erro interno ao verificar E-mail.",
    });
  }
}


// Verificar se o userName já existe (na tabela Contractor ou Companion)
export async function verificarUsername(req, res) {
  const { userName } = req.body;

  if (!userName) {
    return res.status(400).json({
      valid: false,
      message: "userName é obrigatório.",
    });
  }

  try {
    const existsInContractor = await prisma.contractor.findUnique({
      where: { userName },
    });

    const existsInCompanion = await prisma.companion.findUnique({
      where: { userName },
    });

    if (existsInContractor || existsInCompanion) {
      return res.status(200).json({
        valid: false,
        message: "userName já está em uso.",
      });
    }

    return res.status(200).json({
      valid: true,
      message: "userName disponível.",
    });
  } catch (error) {
    console.error("Erro ao verificar userName:", error);
    return res.status(500).json({
      valid: false,
      message: "Erro interno ao verificar userName.",
    });
  }
}
