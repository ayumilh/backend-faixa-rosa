const { verifyCpf } = require("../utils/verifyCpf");
const { validarUsername } = require("../utils/verifyUsername");
const { validarEmail } = require("../utils/verifyEmail");

exports.verificarCpf = async (req, res) => {
    try {
        const { cpf } = req.body;
        const { data_nascimento } = req.body;

        const resultado = await verifyCpf(cpf, data_nascimento);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

exports.verificarUsername = async (req, res) => {
    try {
        const { userName } = req.body;
        const resultado = await validarUsername(userName);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

exports.verificarEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const resultado = await validarEmail(email);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}