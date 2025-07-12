import prisma from '../prisma/client.js';

export async function authenticate(req, res, next) {
  const rawToken = req.cookies?.["better-auth.session_token"];
  const token = rawToken?.split('.')[0];
  console.log("Token de sessão:", rawToken);

  if (!token) {
    return res.status(401).json({ error: "Token de sessão ausente." });
  }

  try {
    // Buscar a sessão pelo token (retorna 1 ou nenhum resultado)
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || !session.userId) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }

    // Buscar o usuário vinculado (AppUser) usando o userId da sessão
    const user = await prisma.appUser.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    req.user = {
      id: user.id,
      userType: user.userType,
    };

    next();
  } catch (error) {
    console.error("Erro ao autenticar:", error.message);
    return res.status(500).json({ error: "Erro interno ao autenticar." });
  }
}

export function verifyAdmin(req, res, next) {
  if (!req.user || req.user.userType !== "ADMIN") {
    return res.status(403).json({ error: "Apenas administradores podem acessar esta rota." });
  }
  next();
}
