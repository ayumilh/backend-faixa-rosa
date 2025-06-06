const prisma = require('../../prisma/client');

// Listar todos os contratantes
exports.listContratantes = async (req, res) => {
  try {
    const contratantes = await prisma.user.findMany({
      where: { userType: 'CONTRATANTE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        cpf: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(contratantes);
  } catch (error) {
    console.error('Erro ao listar contratantes:', error);
    return res.status(500).json({ error: 'Erro ao listar contratantes.' });
  }
};

// Obter contratante por ID
exports.getContratanteById = async (req, res) => {
  const { id } = req.params;

  try {
    const contratante = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        cpf: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!contratante || contratante.userType !== 'CONTRATANTE') {
      return res.status(404).json({ error: 'Contratante não encontrado.' });
    }

    return res.status(200).json(contratante);
  } catch (error) {
    console.error('Erro ao buscar contratante:', error);
    return res.status(500).json({ error: 'Erro ao buscar contratante.' });
  }
};

// Criar novo contratante
exports.createContratante = async (req, res) => {
  const { firstName, lastName, email, cpf, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso.' });
    }

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        cpf,
        password, // Idealmente, hash a senha aqui
        userType: 'CONTRATANTE',
      },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error('Erro ao criar contratante:', error);
    return res.status(500).json({ error: 'Erro ao criar contratante.' });
  }
};

// Atualizar dados do contratante
exports.updateContratante = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, cpf } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { firstName, lastName, email, cpf },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar contratante:', error);
    return res.status(500).json({ error: 'Erro ao atualizar contratante.' });
  }
};

// Atualizar status (visibilidade ou ativação, por exemplo)
exports.updateContratanteStatus = async (req, res) => {
  const { id } = req.params;
  const { profileVisibility } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { profileVisibility },
    });

    return res.status(200).json({
      message: `Status atualizado para ${profileVisibility ? 'visível' : 'oculto'}.`,
      user: updated,
    });
  } catch (error) {
    console.error('Erro ao atualizar status do contratante:', error);
    return res.status(500).json({ error: 'Erro ao atualizar status do contratante.' });
  }
};

// Deletar contratante
exports.deleteContratante = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    return res.status(200).json({ message: 'Contratante deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar contratante:', error);
    return res.status(500).json({ error: 'Erro ao deletar contratante.' });
  }
};
