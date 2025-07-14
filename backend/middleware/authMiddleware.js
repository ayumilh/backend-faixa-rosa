import prisma from '../prisma/client.js';

export async function authenticate(req, res, next) {
  try {
    const cookieHeader = req.headers.cookie || '';
    const tokenRaw = cookieHeader
      .split(';')
      .map(c => c.trim())
      .filter(c => c.startsWith('better-auth.session_token='))
      .pop();  // Pega o último token

    const token = tokenRaw?.split('=')[1]?.split('.')[0];

    console.log("Token de sessão selecionado:", token);

    if (!token) {
      return res.status(401).json({ error: "Token de sessão ausente." });
    }

    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || !session.userId) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }

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
    console.error("Erro na autenticação:", error);
    return res.status(500).json({ error: "Erro interno de autenticação." });
  }
}


export function verifyAdmin(req, res, next) {
  console.log("Verificando se o usuário é administrador...");
  console.log("Usuário autenticado:", req.user);
  
  if (!req.user || req.user.userType !== "ADMIN") {
    return res.status(403).json({ error: "Apenas administradores podem acessar esta rota." });
  }
  
  next();
}

