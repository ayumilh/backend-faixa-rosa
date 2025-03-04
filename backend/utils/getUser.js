const dotenv = require('dotenv');
dotenv.config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get User por Id no Banco
const getUserIdBd = async (req, res) => {
    try {
        const userid = req.user.id;

        if (!userid || isNaN(userid)) {
            return res.status(400).json({ message: 'ID de usuário inválido.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userid },
            include: {
                companion: true,
            }
        });

        if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

        res.status(200).json({ user });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar o usuário do banco de dados.' });
    }
};

module.exports = {
    getUserIdBd,
};