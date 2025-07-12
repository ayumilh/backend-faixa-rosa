import prisma from '../prisma/client.js';
import dotenv from 'dotenv';

dotenv.config();

export const getUserIdBd = async (req, res) => {  
  try {
    const userid = req.user.id;
    const tipoPerfil = req.query.tipoPerfil;

    console.log("ID do usuário:", userid);
  
    if (!userid || !tipoPerfil) {
      return res.status(400).json({ message: 'ID do usuário ou tipo de perfil não fornecido.' });
    }
  
    let includeObj = null;
  
    if (tipoPerfil === "CONTRATANTE") {
      includeObj = { Contractor: true };
    } else if (tipoPerfil === "ACOMPANHANTE") {
      includeObj = {
        companion: {
          include: {
            top10: {
              select: {
                rank: true,
              },
            },
          },
        },
      };
    } else if (tipoPerfil === "ADMIN") {
      includeObj = undefined; // Não inclui nada extra
    } else {
      return res.status(400).json({ message: 'Tipo de perfil inválido.' });
    }
  
  
    const user = await prisma.appUser.findUnique({
      where: { id: userid },
      ...(includeObj ? { include: includeObj } : {}),
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    let userName = "";
    let ranking = null;

    if (tipoPerfil === "CONTRATANTE" && user.Contractor?.userName) {
      userName = user.Contractor.userName;
      delete user.Contractor.userName;
    } else if (tipoPerfil === "ACOMPANHANTE") {
      if (user.companion && user.companion.userName) {
        userName = user.companion.userName;
        ranking = user.companion.top10?.rank || null;
        delete user.companion.userName;
      }
    }

    const cleanUser = {
      ...user,
      userName,
      ...(ranking !== null && { ranking }),
    };

    return res.status(200).json(cleanUser);
  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ message: 'Erro ao recuperar o usuário do banco de dados.' });
  }
};
