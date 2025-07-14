import { auth } from '../utils/auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import prisma from '../prisma/client.js';
import bcrypt from 'bcrypt';
import { logActivity } from '../utils/activityService.js';

// Endpoint: Cadastro de usuário (Sign Up Email)
export async function signUpEmail(req, res) {
  try {
    const {
      userName,
      name = '',
      lastName = '',
      password,
      birthDate,
      email,
      cpf,
      userType
    } = req.body;


    const allowedUserTypes = ["CONTRATANTE", "ACOMPANHANTE", "ADMIN"];
    if (!userName || !email || !userType) {
      return res.status(400).json({ error: 'userName, email, e userType são obrigatórios.' });
    }
    if (!allowedUserTypes.includes(userType)) {
      return res.status(400).json({ error: 'Tipo de usuário inválido.' });
    }

    let formattedBirthDate = null;
    if (birthDate) {
      const dateParts = birthDate.split("/");
      formattedBirthDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      if (isNaN(formattedBirthDate.getTime())) {
        return res.status(400).json({ error: 'Data de nascimento inválida.' });
      }
    }

    const existingUserByCpf = await prisma.appUser.findUnique({
      where: { cpf },
    });

    if (existingUserByCpf) {
      return res.status(400).json({ error: 'Email ou CPF já estão em uso' });
    }

    const existingContractor = await prisma.contractor.findFirst({ where: { userName } });
    const existingCompanion = await prisma.companion.findFirst({ where: { userName } });

    if (existingContractor || existingCompanion) {
      return res.status(400).json({ error: 'Nome de Usuário já está em uso' });
    }

    const result = await auth.api.signUpEmail({
      body: { email, password, name: `${name} ${lastName}` },
      asResponse: true,
    });

    for (const [key, value] of Object.entries(result.headers || {})) {
      if (Array.isArray(value)) value.forEach((v) => res.append(key, v));
      else if (value !== undefined) res.setHeader(key, value);
    }

    const body = await result.json();

    if (result.status >= 400 || !body.user) {
      return res.status(result.status).json(body);
    }

    const { id } = body.user;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const calculateAge = (birthDate) => {
      const today = new Date();
      const birthDateObj = new Date(birthDate);
      let age = today.getFullYear() - birthDateObj.getFullYear();
      const m = today.getMonth() - birthDateObj.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) age--;
      return age;
    };

    const transactionResult = await prisma.$transaction(async (prisma) => {
      const createdUser = await prisma.appUser.create({
        data: {
          id,
          firstName: name,
          lastName,
          cpf,
          birthDate: formattedBirthDate,
          userType,
        },
      });

      if (userType === "CONTRATANTE") {
        const age = calculateAge(formattedBirthDate);
        const createdContractor = await prisma.contractor.create({
          data: {
            userId: id,
            userName,
            name: `${name} ${lastName}`,
            profileStatus: "IN_ANALYSIS",
            documentStatus: "IN_ANALYSIS",
            createdAt: new Date(),
            updatedAt: new Date(),
            age,
          },
        });

        let documentFrontUrl = null;
        let documentBackUrl = null;
        let profilePicUrl = null;

        if (req.files?.fileFront && req.files?.fileBack) {
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
            data: { documentStatus: "IN_ANALYSIS" }
          });
        }

        if (req.files?.profilePic) {
          profilePicUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.profilePic[0].key}`;

          await prisma.contractor.update({
            where: { id: createdContractor.id },
            data: { profileImage: profilePicUrl }
          });
        }

        return { user: createdUser, contractorId: createdContractor.id, documentFrontUrl, documentBackUrl, profilePicUrl };
      }

      if (userType === "ACOMPANHANTE") {
        const createdCompanion = await prisma.companion.create({
          data: {
            userId: id,
            userName,
            name: `${name} ${lastName}`,
            profileStatus: "IN_ANALYSIS",
            lastOnline: new Date(),
            points: 0,
            description: "",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        let documentFrontUrl = null;
        let documentBackUrl = null;
        let comparisonVideoUrl = null;
        let profilePicUrl = null;

        if (req.files?.fileFront && req.files?.fileBack) {
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
            data: { documentStatus: "IN_ANALYSIS" }
          });
        }

        if (req.files?.comparisonMedia) {
          comparisonVideoUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.comparisonMedia[0].key}`;
          await prisma.media.create({
            data: {
              companionId: createdCompanion.id,
              url: comparisonVideoUrl,
              mediaType: "VIDEO",
              status: "IN_ANALYSIS",
            }
          });
        }

        if (req.files?.profilePic) {
          profilePicUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.files.profilePic[0].key}`;
          await prisma.companion.update({
            where: { id: createdCompanion.id },
            data: { profileImage: profilePicUrl }
          });
        }

        return {
          user: createdUser,
          companionId: createdCompanion.id,
          documentFrontUrl,
          documentBackUrl,
          profilePicUrl,
          comparisonVideoUrl
        };
      }

      return { user: createdUser };
    });

    const { user, companionId, contractorId, documentFrontUrl, documentBackUrl, comparisonVideoUrl, profilePicUrl } = transactionResult;

    if (userType === "ACOMPANHANTE" && companionId) {
      if (documentFrontUrl && documentBackUrl) {
        await logActivity(companionId, "Envio de Documento", `Acompanhante enviou documentos. Frente: ${documentFrontUrl}, Verso: ${documentBackUrl}`);
      }
      if (comparisonVideoUrl) {
        await logActivity(companionId, "Envio de Vídeo de Comparação", `Vídeo: ${comparisonVideoUrl}`);
      }
      if (profilePicUrl) {
        await logActivity(companionId, "Atualização de Imagem de Perfil", `Foto: ${profilePicUrl}`);
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
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
}

// Endpoint: Login de usuário (Sign In Email)
export async function signInEmail(req, res) {
  try {
    const result = await auth.api.signInEmail({
      body: req.body,
      asResponse: true,
    });

    const rawSetCookie = result.headers.get("set-cookie");

    for (const [key, value] of Object.entries(result.headers || {})) {
      if (Array.isArray(value)) value.forEach((v) => res.append(key, v));
      else if (value !== undefined) res.setHeader(key, value);
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (rawSetCookie) {
      const cookies = Array.isArray(rawSetCookie) ? rawSetCookie : [rawSetCookie];
      const patched = cookies.map(cookie =>
        cookie
          .replace(/;\s*SameSite=Lax/i, '; SameSite=None')
          .replace(/;\s*SameSite=Strict/i, '; SameSite=None')
          .replace(/;\s*Secure/i, '') + '; Secure'
      );
      res.setHeader("Set-Cookie", patched);
    }

    const bodyBuffer = await result.arrayBuffer();
    const responseData = JSON.parse(Buffer.from(bodyBuffer).toString());
    
    console.log('🔴 LOGIN RESPONSE PRODUÇÃO:', responseData);


    const userId = responseData?.user?.id;

    console.log('✅ Usuário logado:', userId);

    // ✅ Buscar userType a partir da tabela AppUser
    const appUser = await prisma.appUser.findUnique({
      where: { id: userId },
      select: { userType: true },
    });
    console.log('✅ Tipo de usuário encontrado:', appUser?.userType);

    if (req.body.browser_fingerprint) {
      await prisma.consent.updateMany({
        where: {
          browser_fingerprint: req.body.browser_fingerprint,
          appUserId: null,
        },
        data: {
          appUserId: user.id,
        },
      });
    }


    return res.status(result.status).json({
      ...responseData,
      userType: appUser?.userType || null,
    });

  } catch (error) {
    console.error('❌ Erro no Sign-In:', error);
    return res.status(500).json({ error: error.message });
  }
}


// Endpoint: Verificar sessão atual
export async function getSession(req, res) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.session?.userId) {
      return res.status(401).json({ message: "Sessão inválida ou expirada." });
    }

    // 🔥 Aqui buscamos o usuário completo no banco
    const user = await prisma.appUser.findUnique({
      where: { id: session?.session?.userId },
      select: {
        userType: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.status(200).json({
      session,
      appUser: user,
    });

  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
  }
}

// Endpoint: Logout
export async function signOut(req, res) {
  try {
    const result = await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    for (const [key, value] of Object.entries(result.headers || {})) {
      if (Array.isArray(value)) value.forEach((v) => res.append(key, v));
      else if (value !== undefined) res.setHeader(key, value);
    }

    const bodyBuffer = await result.arrayBuffer();
    return res.status(result.status).send(Buffer.from(bodyBuffer));
  } catch (error) {
    console.error('Erro no signOut:', error);
    return res.status(500).json({ error: error.message });
  }
}
