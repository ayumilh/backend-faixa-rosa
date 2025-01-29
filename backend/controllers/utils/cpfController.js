const { validarCpf } = require("../../utils/cpfUtils");

exports.verificarCPF = async (req, res) => {
    try {
        const { cpf } = req.params;

        const resultado = await validarCpf(cpf);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
