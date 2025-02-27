const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { calculateAge } = require('../utils/helpers');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET

const userSchema = Joi.object({
    userName: Joi.string().max(30).required(),
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(100).optional(),
    email: Joi.string().email().max(320).required(),
    password: Joi.string().max(64).optional(),
    birthDate: Joi.date().iso().optional(),
    cpf: Joi.string().length(11).optional(),
    phone: Joi.string().length(11).optional(),
    googleLogin: Joi.boolean().optional(),
    userType: Joi.string()
        .valid('CONTRATANTE', 'ACOMPANHANTE', 'ANUNCIANTE', 'EMPRESA', 'ADMIN')
        .required(),
});

const loginSchema = userSchema.fork(['firstName', 'lastName', 'birthDate', 'cpf', 'phone', 'userType', 'userName'], (schema) => schema.optional());

exports.register = async (req, res) => {
    try {
        const { error, value } = userSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { userName, firstName, lastName, email, password, birthDate, cpf, phone, userType } = value;

        const formattedBirthDate = birthDate ? new Date(birthDate) : null;

        // Verifica se o email ou CPF já está em uso
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { cpf },
                ],
            },
        });

        if (existingUser) {
            // Verificar se o userName já está em uso nas tabelas Contractor ou Companion
            const existingContractor = await prisma.contractor.findFirst({
                where: { userName }
            });

            const existingCompanion = await prisma.companion.findFirst({
                where: { userName }
            });

            if (existingContractor || existingCompanion) {
                return res.status(400).json({ error: 'Email, CPF ou Nome de Usuário já estão em uso' });
            }
        }
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        // Criar usuário e perfil de contratante/acompanhante em transação
        const newUser = await prisma.$transaction(async (prisma) => {
            // Criar o usuário
            const createdUser = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    birthDate: formattedBirthDate ? new Date(birthDate) : null,
                    cpf,
                    phone,
                    userType,
                },
            });

            if (userType === 'ACOMPANHANTE') {
                await prisma.companion.create({
                    data: {
                        userName,
                        userId: createdUser.id,
                        name: `${firstName} ${lastName}`.trim(),
                        age: formattedBirthDate ? calculateAge(formattedBirthDate) : 0,
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
            } else if (userType === 'CONTRATANTE') {
                await prisma.contractor.create({
                    data: {
                        userName,
                        userId: createdUser.id,
                        name: `${firstName} ${lastName}`.trim(),
                        age: formattedBirthDate ? calculateAge(formattedBirthDate) : 0,
                        profileStatus: 'PENDING',
                        documentStatus: 'PENDING',
                    },
                });
            }

            return createdUser;
        });

        res.status(201).json({
            message: 'Usuário registrado com sucesso',
            user: { id: newUser.id, email: newUser.email, userName: newUser.userName }
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
        return res.status(500).json({ error: 'Chave secreta JWT não configurada no servidor' });
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
                        lastName: '',    // Pode ser vazio ou preenchido posteriormente
                        password: '',    // Pode ser vazio, pois o login é feito pelo Google
                        cpf: null,       // Pode ser vazio ou preenchido posteriormente
                        phone: '',       // Pode ser vazio ou preenchido posteriormente
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

        // Buscar userName dependendo do tipo de usuário
        let userName = "";
        if (user.userType === 'CONTRATANTE') {
            const contractor = await prisma.contractor.findUnique({
                where: { userId: user.id },
                select: { userName: true },
            });
            userName = contractor?.userName;
        } else if (user.userType === 'ACOMPANHANTE') {
            const companion = await prisma.companion.findUnique({
                where: { userId: user.id },
                select: { userName: true },
            });
            userName = companion?.userName;
        }
        
        if (!userName) {
            return res.status(400).json({ error: 'userName é necessário para este tipo de usuário.' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                userType: user.userType, 
                firstName: user.firstName, 
                lastName: user.lastName, 
                userName 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        });

        console.log('DADOS ENVIADOS PARA O FRONTEND:', user, token);

        res.status(200).json({
            auth: true,
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType,
                userName,
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