const { validarCpf } = require("../../utils/cpfUtils");

exports.verificarCPF = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
      }
    
      try {
        const { cpf } = req.body;
        const resultado = await validarCpf(cpf);
        return res.status(200).json(resultado);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
}
