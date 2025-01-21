const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET

exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, cpf, phone, userType } = req.body;

        // Verifica se o email ou CPF já está em uso
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { cpf }],
            },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email ou CPF já está em uso' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Cria o novo usuário no banco de dados
        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                cpf,
                phone,
                userType, // Default: CONTRATANTE
            },
        });

        res.status(201).json({ message: 'Usuário registrado com sucesso', user: { id: newUser.id, email: newUser.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
};

exports.login = async (req, res) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não está definido. Verifique suas variáveis de ambiente.');
    }

    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verifica se a senha está correta
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ userId: user.id, userType: user.userType }, JWT_SECRET, {
            expiresIn: '1h', // Token válido por 1 hora
        });

        res.status(200).json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao realizar login' });
    }
};