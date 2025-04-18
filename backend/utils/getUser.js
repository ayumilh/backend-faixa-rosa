const prisma = require('../prisma/client');
const dotenv = require('dotenv');
dotenv.config();

const getUserIdBd = async (req, res) => {
    try {
        console.log('getUserIdBd');
        console.log('req.user', req.user);
        console.log('req.query', req.query);
        const userid = req.user.id;
        const tipoPerfil = req.query.tipoPerfil;

        if (!userid || isNaN(userid)) {
            return res.status(400).json({ message: 'ID de usuário inválido.' });
        }

        let includeObj = {};

        if (tipoPerfil === "CONTRATANTE") {
            includeObj.Contractor = true;
        } else if (tipoPerfil === "ACOMPANHANTE") {
            includeObj.companion = {
                include: {
                  top10: {
                    select: {
                      rank: true,
                    },
                  },
                },
              };              
        } else {
            return res.status(400).json({ message: 'Tipo de perfil não especificado ou inválido.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userid },
            include: includeObj,
        });

        console.log('user', user);

        if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

        let userName = "";
        if (tipoPerfil === "CONTRATANTE" && user.Contractor?.userName) {
            userName = user.Contractor.userName;
            delete user.Contractor.userName;
        } else if (tipoPerfil === "ACOMPANHANTE" && user.companion?.userName) {
            userName = user.companion.userName;
            ranking = user.companion.top10?.rank || null;
            delete user.companion.userName;
        }

        const cleanUser = {
            ...user,
            userName,
            ...(ranking !== null && { ranking }), 
        };

        // Retorna também o tipo
        res.status(200).json(cleanUser);

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar o usuário do banco de dados.' });
    }
};



module.exports = {
    getUserIdBd,
};