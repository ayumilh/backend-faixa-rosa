const { validarCPF, verificarCPFNaAPI } = require('../../utils/cpfUtils');

async function verificarCPF(req, res) {
    const { cpf } = req.params;
    const userId = req.user?.id; // Obtém o ID do usuário autenticado

    console.log('userId:', userId);

    if (!userId) {
        return res.status(401).json({ sucesso: false, mensagem: "Usuário não autenticado" });
    }

    const cpfLimpo = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos

    if (!validarCPF(cpfLimpo)) {
        return res.status(400).json({ sucesso: false, mensagem: "CPF inválido" });
    }

    // Passando o CPF e o token do usuário autenticado para a API externa
    const resultado = await verificarCPFNaAPI(cpfLimpo, req.user.token);

    return res.json(resultado);
}

module.exports = { verificarCPF };
