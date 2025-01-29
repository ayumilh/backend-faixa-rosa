const { validarCpf } = require("../../utils/cpfUtils");

exports.verificarCPF = async (req, res) => {
    try {
        const { cpf } = req.body;
        const { data_nascimento } = req.body;

        const resultado = await validarCpf(cpf, data_nascimento);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
