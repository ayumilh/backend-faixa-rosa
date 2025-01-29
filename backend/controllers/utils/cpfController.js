const { validarCPF, verificarCPFNaAPI } = require('../../utils/cpfUtils');

async function verificarCPF(req, res) {
    const { cpf } = req.params;
    const cpfLimpo = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos

    if (!validarCPF(cpfLimpo)) {
        return res.status(400).json({ sucesso: false, mensagem: "CPF inválido" });
    }

    const resultado = await verificarCPFNaAPI(cpfLimpo);
    return res.json(resultado);
}

module.exports = { verificarCPF };
