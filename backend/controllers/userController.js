const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

        res.status(200).json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Erro ao buscar o usuário.' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, senha, data_nascimento, telefone, cnpj } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                email,
                senha,
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
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.user.delete({
            where: { id: parseInt(id) },
        });

        res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Erro ao excluir o usuário.' });
    }
};