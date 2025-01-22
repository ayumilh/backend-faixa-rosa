const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET

const userSchema = Joi.object({
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(100).required(),
    email: Joi.string().email().max(320).required(),
    password: Joi.string().max(64).required(),
    cpf: Joi.string().length(11).required(),
    phone: Joi.string().length(11).required(),
    userType: Joi.string()
    .valid('CONTRATANTE', 'ACOMPANHANTE', 'ANUNCIANTE', 'EMPRESA') 
    .required(),
});

const loginSchema = userSchema.fork(['firstName', 'lastName', 'cpf', 'phone', 'userType'], (schema) => schema.optional());

exports.register = async (req, res) => {
    try {
        const { error, value } = userSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { firstName, lastName, email, password, cpf, phone, userType } = value;

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
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email ou CPF já está em uso' });
        }
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
};

exports.login = async (req, res) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não está definido. Verifique suas variáveis de ambiente.');
    }

    try {
        const { error, value } = loginSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password } = value;

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

        const token = jwt.sign(
            { id: user.id, email: user.email, userType: user.userType },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

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