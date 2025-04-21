const jwt = require("jsonwebtoken");

// Middleware para verificar autenticação geral
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    console.log("🔐 Authorization Header:", authHeader);

    // Verifica se o header existe e está no formato correto
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("⚠️ Token ausente ou mal formatado");
        return res.status(401).json({ error: "Token não fornecido ou mal formatado" });
    }

    const token = authHeader.split(" ")[1];

    console.log("🔍 Token extraído:", token);

    if (!token) {
        console.warn("⚠️ Token ausente após Bearer");
        return res.status(401).json({ error: "Token ausente após Bearer" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Anexa os dados do usuário (id, role, etc.) ao objeto req
        console.log("✅ Token validado com sucesso:", decoded);
        next();
    } catch (error) {
        console.error("❌ Erro ao validar token:", error.message);
        return res.status(403).json({ error: "Token inválido ou expirado" });
    }
}

// Middleware para verificar se o usuário é ADMIN
function verifyAdmin(req, res, next) {
    if (!req.user || req.user.userType !== "ADMIN") {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar esta rota." });
    }
    next();
}

module.exports = { authenticate, verifyAdmin };
