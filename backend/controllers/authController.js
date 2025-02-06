const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { calculateAge } = require('../utils/helpers');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET

const userSchema = Joi.object({
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(100).optional(),
    email: Joi.string().email().max(320).required(),
    password: Joi.string().max(64).optional(),
    birthDate: Joi.date().iso().optional(),
    cpf: Joi.string().length(11).optional(),
    phone: Joi.string().length(11).optional(),
    googleLogin: Joi.boolean().optional(),
    userType: Joi.string()
        .valid('CONTRATANTE', 'ACOMPANHANTE', 'ANUNCIANTE', 'EMPRESA')
        .required(),
});

const loginSchema = userSchema.fork(['firstName', 'lastName', 'birthDate', 'cpf', 'phone', 'userType'], (schema) => schema.optional());

exports.register = async (req, res) => {
    try {
        const { error, value } = userSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { firstName, lastName, email, password, birthDate, cpf, phone, userType } = value;

        // Verifica se o email ou CPF já está em uso
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { cpf }],
            },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email ou CPF já está em uso' });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        // Cria o usuário e o perfil de acompanhante em uma transação
        const newUser = await prisma.$transaction(async (prisma) => {
            // Criar o usuário
            const createdUser = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    birthDate: birthDate ? new Date(birthDate) : null,
                    cpf,
                    phone,
                    userType,
                },
            });

            // Se for acompanhante, criar o perfil na tabela Companion
            if (userType === 'ACOMPANHANTE') {
                await prisma.companion.create({
                    data: {
                        userId: createdUser.id,
                        name: `${firstName} ${lastName}`.trim(),
                        age: birthDate ? calculateAge(birthDate) : 0,
                        description: '',
                        city: '',
                        state: '',
                        profileStatus: 'PENDING',
                        lastOnline: new Date(),
                        points: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            }

            return createdUser;
        });

        res.status(201).json({
            message: 'Usuário registrado com sucesso',
            user: { id: newUser.id, email: newUser.email }
        });
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

        const { email, password, googleLogin } = value;

        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            if (googleLogin) {
                // Cria um novo usuário se o login for pelo Google e o usuário não existir
                user = await prisma.user.create({
                    data: {
                        email,
                        firstName: '',  // Pode ser vazio ou preenchido posteriormente
                        lastName: '',       // Pode ser vazio ou preenchido posteriormente
                        password: '', // Pode ser vazio, pois o login é feito pelo Google
                        cpf: null, // Pode ser vazio ou preenchido posteriormente
                        phone: '', // Pode ser vazio ou preenchido posteriormente
                        userType: 'CONTRATANTE', // Tipo de usuário padrão
                    },
                });
            } else {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
        }

        if (!googleLogin) {
            // Verifica se a senha está correta para login com credenciais
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, userType: user.userType },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, { 
            httpOnly: true,
            secure: true, // Apenas enviar o cookie através de conexões HTTPS
            sameSite: 'Lax', // Prevenir ataques CSRF
            maxAge: 24 * 60 * 60 * 1000 // Tempo de expiração do cookie em milissegundos (1 dia)
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

// Atualiza a data de nascimento do usuário e a idade do acompanhante
exports.updateBirthDate = async (req, res) => {
    const userId = req.user?.id;
    const { birthDate } = req.body;

    try {
        if (!birthDate) {
            return res.status(400).json({ error: 'A data de nascimento é obrigatória.' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { birthDate },
        });

        // Atualiza a idade na tabela Companion
        await prisma.companion.updateMany({
            where: { userId },
            data: { age: calculateAge(birthDate) },
        });

        return res.status(200).json({ message: 'Data de nascimento e idade atualizadas com sucesso.' });

    } catch (error) {
        console.error('Erro ao atualizar data de nascimento:', error);
        return res.status(500).json({ error: 'Erro ao atualizar os dados.' });
    }
};