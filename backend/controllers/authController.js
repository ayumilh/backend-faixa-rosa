const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const crypto = require('crypto');
const { logActivity } = require("../utils/activityService");
const sendEmail = require('../utils/sendEmail');
const { calculateAge } = require('../utils/helpers');

const prisma = require('../prisma/client');

const userSchema = Joi.object({
    userName: Joi.string().max(30).required(),
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(100).optional(),
    email: Joi.string().email().max(320).required(),
    password: Joi.string().max(64).optional(),
    birthDate: Joi.date().iso().optional(),
    cpf: Joi.string().length(11).optional(),
    googleLogin: Joi.boolean().optional(),
    userType: Joi.string()
        .valid('CONTRATANTE', 'ACOMPANHANTE', 'ANUNCIANTE', 'EMPRESA', 'ADMIN')
        .required(),
});

const loginSchema = userSchema
    .fork(['firstName', 'lastName', 'birthDate', 'cpf', 'userType', 'userName'], (schema) => schema.optional())
    .keys({
        browser_fingerprint: Joi.string().optional()
    });

exports.register = async (req, res) => {
    try {
        console.log('📥 Dados recebidos no req.body:', req.body);
        console.log('📂 Arquivos recebidos:', req.files);

        const {
            userName,
            firstName = '',
            lastName = '',
            email,
            password,
            birthDate,
            cpf,
            userType
        } = req.body;

        if (!userName || !email || !userType) {
            return res.status(400).json({ error: 'userName, email e userType são obrigatórios.' });
        }

        let formattedBirthDate = null;
        if (birthDate) {
            const dateParts = birthDate.split("/");
            formattedBirthDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

            if (isNaN(formattedBirthDate.getTime())) {
                return res.status(400).json({ error: 'Data de nascimento inválida.' });
            }
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    ...(cpf ? [{ cpf }] : []),
                ],
            },
        });

        console.log('Usuário existente?', existingUser);

        if (existingUser) {
            return res.status(400).json({ error: 'Email ou CPF já estão em uso' });
        }

        // Verifica se o userName já está em uso em outra tabela
        const existingContractor = await prisma.contractor.findFirst({ where: { userName } });
        const existingCompanion = await prisma.companion.findFirst({ where: { userName } });

        console.log('🔎 Contractor existente?', existingContractor);
        console.log('🔎 Companion existente?', existingCompanion);

        // Se já existe userName em uso, bloqueia também
        if (existingContractor || existingCompanion) {
            return res.status(400).json({ error: 'Nome de Usuário já está em uso' });
        }

        console.log('📥 Senha recebida:', password);
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        console.log('🔒 Hash da senha:', hashedPassword);

        const calculateAge = (birthDate) => {
            const today = new Date();
            const birthDateObj = new Date(birthDate);
            let age = today.getFullYear() - birthDateObj.getFullYear();
            const m = today.getMonth() - birthDateObj.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }
            return age;
        };

        const transactionResult = await prisma.$transaction(async (prisma) => {
            const createdUser = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    birthDate: formattedBirthDate,
                    cpf,
                    userType,
                },
            });

            console.log('👤 Usuário criado:', createdUser);

            if (userType === "CONTRATANTE") {
                const age = calculateAge(formattedBirthDate);
                const createdContractor = await prisma.contractor.create({
                    data: {
                        userId: createdUser.id,
                        userName,
                        name: `${firstName} ${lastName}`,
                        profileStatus: "IN_ANALYSIS",
                        documentStatus: "IN_ANALYSIS",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        age,
                    },
                });

                console.log('📄 Contractor criado:', createdContractor);

                let documentFrontUrl = null;
                let documentBackUrl = null;
                let profilePicUrl = null;

                if (req.files?.fileFront && req.files?.fileBack) {
                    console.log('🧾 Upload de documentos:', req.files.fileFront[0], req.files.fileBack[0]);
                    documentFrontUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.fileFront[0].key}`;
                    documentBackUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.fileBack[0].key}`;

                    await prisma.document.create({
                        data: {
                            contractorId: createdContractor.id,
                            type: "RG",
                            fileFront: documentFrontUrl,
                            fileBack: documentBackUrl,
                            documentStatus: "IN_ANALYSIS",
                        }
                    });

                    await prisma.contractor.update({
                        where: { id: createdContractor.id },
                        data: {
                            documentStatus: "IN_ANALYSIS",
                        }
                    });
                }

                if (req.files?.profilePic) {
                    console.log('🖼️ Upload de foto de perfil:', req.files.profilePic[0]);
                    profilePicUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.profilePic[0].key}`;

                    await prisma.contractor.update({
                        where: { id: createdContractor.id },
                        data: {
                            profileImage: profilePicUrl,
                        }
                    });
                }

                return { user: createdUser };
            }

            if (userType === "ACOMPANHANTE") {
                const createdCompanion = await prisma.companion.create({
                    data: {
                        userId: createdUser.id,
                        userName,
                        name: `${firstName} ${lastName}`,
                        profileStatus: "IN_ANALYSIS",
                        lastOnline: new Date(),
                        points: 0,
                        description: "",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });

                console.log('📸 Companion criado:', createdCompanion);

                let documentFrontUrl = null;
                let documentBackUrl = null;
                let comparisonVideoUrl = null;
                let profilePicUrl = null;

                if (req.files?.fileFront && req.files?.fileBack) {
                    console.log('🧾 Upload de documentos:', req.files.fileFront[0], req.files.fileBack[0]);
                    documentFrontUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.fileFront[0].key}`;
                    documentBackUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.fileBack[0].key}`;

                    await prisma.document.create({
                        data: {
                            companionId: createdCompanion.id,
                            type: "RG",
                            fileFront: documentFrontUrl,
                            fileBack: documentBackUrl,
                            documentStatus: "IN_ANALYSIS",
                        }
                    });

                    await prisma.companion.update({
                        where: { id: createdCompanion.id },
                        data: {
                            documentStatus: "IN_ANALYSIS",
                        }
                    });
                }

                if (req.files?.comparisonMedia) {
                    console.log('🎥 Upload de vídeo de comparação:', req.files.comparisonMedia[0]);
                    comparisonVideoUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.comparisonMedia[0].key}`;

                    await prisma.media.create({
                        data: {
                            companionId: createdCompanion.id,
                            url: comparisonVideoUrl,
                            mediaType: "VIDEO",
                            status: "PENDING",
                        }
                    });
                }

                if (req.files?.profilePic) {
                    console.log('🖼️ Upload de foto de perfil:', req.files.profilePic[0]);
                    profilePicUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.profilePic[0].key}`;

                    await prisma.companion.update({
                        where: { id: createdCompanion.id },
                        data: {
                            profileImage: profilePicUrl,
                        }
                    });
                }

                return {
                    user: createdUser,
                    companionId: createdCompanion.id,
                    documentUrls: { documentFrontUrl, documentBackUrl },
                    profilePicUrl,
                    comparisonVideoUrl
                };
            }
        });

        const { user, companionId, documentUrls, profilePicUrl, comparisonVideoUrl } = transactionResult;

        console.log('✅ Usuário registrado com sucesso:', user, companionId, documentUrls, profilePicUrl, comparisonVideoUrl);

        if (userType === "ACOMPANHANTE" && companionId) {
            if (documentUrls?.documentFrontUrl && documentUrls?.documentBackUrl) {
                await logActivity(companionId, "Envio de Documento", `Acompanhante enviou documentos. Frente: ${documentUrls.documentFrontUrl}, Verso: ${documentUrls.documentBackUrl}`);
            }
            if (comparisonVideoUrl) {
                await logActivity(companionId, "Envio de Vídeo de Comparação", `Acompanhante enviou vídeo de comparação: ${comparisonVideoUrl}`);
            }
            if (profilePicUrl) {
                await logActivity(companionId, "Atualização de Imagem de Perfil", `Acompanhante atualizou a foto de perfil: ${profilePicUrl}`);
            }
        }

        res.status(201).json({
            message: 'Usuário registrado com sucesso',
            user: {
                id: user.id,
                email: user.email,
                userName: userName
            },
        });

    } catch (error) {
        console.error('❌ Erro ao registrar usuário:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email ou CPF já está em uso' });
        }
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
            include: {
                companion: true, // Inclui o companion se existir
            },
        });


        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        } else {
            if (googleLogin) {
                // Cria um novo usuário se o login for pelo Google e o usuário não existir
                user = await prisma.user.create({
                    data: {
                        email,
                        firstName: '',  // Pode ser vazio ou preenchido posteriormente
                        lastName: '',    // Pode ser vazio ou preenchido posteriormente
                        password: '',    // Pode ser vazio, pois o login é feito pelo Google
                        cpf: null,       // Pode ser vazio ou preenchido posteriormente
                        userType: 'CONTRATANTE', // Tipo de usuário padrão
                    },
                });
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

        if (user.userType !== 'ADMIN' && !userName) {
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

        if (req.body.browser_fingerprint) {
            await prisma.consent.updateMany({
                where: {
                    browser_fingerprint: req.body.browser_fingerprint,
                    user_id: null,
                },
                data: {
                    user_id: user.id,
                },
            });
        }

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


exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    console.log('Usuário encontrado:', user);

    try {

        // Gera um token e define validade de 1 hora
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hora

        // Salva no banco
        await prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt: expires,
            },
        });

        // Link para frontend (ajuste para o seu domínio)
        const resetLink = `${process.env.FRONTEND_URL}/auth/resetar-senha?token=${token}`;
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #d63384;">Redefinição de Senha</h2>
        <p>Olá, ${user.firstName || "usuário"},</p>
        <p>Clique no botão abaixo para redefinir sua senha. O link é válido por 1 hora.</p>
        <a href="${resetLink}" style="background-color: #d63384; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Redefinir Senha</a>
        <p style="margin-top: 20px; font-size: 12px; color: #999;">Se você não solicitou isso, ignore este e-mail.</p>
      </div>
    `;

        // Envia e-mail
        await sendEmail(user.email, 'Redefina sua senha', emailHtml);

        res.json({ message: 'Instruções de redefinição de senha enviadas para o e-mail.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao enviar instruções de redefinição.' });
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