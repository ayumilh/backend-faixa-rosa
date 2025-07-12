import express from 'express';
import prisma from '../prisma/client.js';

const router = express.Router();

router.get('/listar', async (req, res) => {
  try {
    const companions = await prisma.companion.findMany({
      where: {
        top10Id: {
          not: null,
        },
      },
      include: {
        top10: {
          select: {
            rank: true,
            points: true,
          }
        },
        appUser: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        plan: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        top10: {
          rank: 'asc'
        }
      }
    });

    const result = companions.map(comp => ({
      userName: comp.userName,
      profileImage: comp.profileImage,
      city: comp.city,
      state: comp.state,
      rank: comp.top10?.rank,
      points: comp.top10?.points,
      name: `${comp.appUser.firstName} ${comp.appUser.lastName}`,
      plan: comp.plan?.name || "Sem plano"
    }));

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar Top 10:', error);
    res.status(500).json({ error: 'Erro ao buscar o ranking Top 10.' });
  }
});

export default router;
