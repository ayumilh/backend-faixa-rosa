import prisma from '../../prisma/client.js';

// Listar todos os contratantes
export async function listContratantes(req, res) {
  console.log('Listando contratantes...');
  try {
    const contratantes = await prisma.appUser.findMany({
      where: { userType: 'CONTRATANTE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        cpf: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
        profileVisibility: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(contratantes);
  } catch (error) {
    console.error('Erro ao listar contratantes:', error);
    return res.status(500).json({ error: 'Erro ao listar contratantes.' });
  }
}

// Obter contratante por ID
export async function getContratanteById(req, res) {
  const { id } = req.params;

  try {
    const contratante = await prisma.appUser.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        cpf: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
        profileVisibility: true,
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
}

// Criar novo contratante (somente AppUser)
export async function createContratante(req, res) {
  const { firstName, lastName, cpf, userId } = req.body;

  try {
    const existing = await prisma.appUser.findUnique({ where: { id: userId } });
    if (existing) {
      return res.status(400).json({ error: 'Usuário já existe.' });
    }

    const newUser = await prisma.appUser.create({
      data: {
        id: userId,
        firstName,
        lastName,
        cpf,
        userType: 'CONTRATANTE',
      },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error('Erro ao criar contratante:', error);
    return res.status(500).json({ error: 'Erro ao criar contratante.' });
  }
}

// Atualizar dados do contratante
export async function updateContratante(req, res) {
  const { id } = req.params;
  const { firstName, lastName, cpf } = req.body;

  try {
    const updatedUser = await prisma.appUser.update({
      where: { id },
      data: { firstName, lastName, cpf },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar contratante:', error);
    return res.status(500).json({ error: 'Erro ao atualizar contratante.' });
  }
}

// Atualizar status do contratante (visibilidade)
export async function updateContratanteStatus(req, res) {
  const { id } = req.params;
  const { profileVisibility } = req.body;

  try {
    const updated = await prisma.appUser.update({
      where: { id },
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
}

// Deletar contratante
export async function deleteContratante(req, res) {
  const { id } = req.params;

  try {
    await prisma.appUser.delete({ where: { id } });
    return res.status(200).json({ message: 'Contratante deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar contratante:', error);
    return res.status(500).json({ error: 'Erro ao deletar contratante.' });
  }
}
