const { validarCPF, calcularIdade } = require('../../utils/cpfUtils');

async function verificarCPF(req, res) {
    const { cpf } = req.params;
    const userId = req.user?.id; // Obtém o ID do usuário autenticado

    console.log('userId:', userId);

    if (!userId) {
        return res.status(401).json({ sucesso: false, mensagem: "Usuário não autenticado" });
    }

    const cpfLimpo = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos

    // Valida o CPF apenas pelo algoritmo local (não verifica na Receita Federal)
    if (!validarCPF(cpfLimpo)) {
        return res.status(400).json({ sucesso: false, mensagem: "CPF inválido" });
    }

    return res.json({ 
        sucesso: true, 
        cpf: cpfLimpo, 
        mensagem: "CPF válido pelo algoritmo local"
    });
}

module.exports = { verificarCPF };
