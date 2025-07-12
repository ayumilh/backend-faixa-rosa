import prisma from '../prisma/client.js';

export async function getAllUsers(req, res) {
  try {
    const users = await prisma.appUser.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro ao buscar usuários.' });
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await prisma.appUser.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro ao buscar o usuário.' });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { data_nascimento, telefone, cnpj } = req.body;

    const updatedUser = await prisma.appUser.update({
      where: { id: parseInt(id) },
      data: {
        data_nascimento,
        telefone,
        cnpj,
      },
    });

    res.status(200).json({ message: 'Usuário atualizado com sucesso.', user: updatedUser });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro ao atualizar o usuário.' });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    await prisma.appUser.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro ao excluir o usuário.' });
  }
}
