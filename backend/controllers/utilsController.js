import { verifyCpf } from "../utils/verifyCpf.js";
import { validarUsername } from "../utils/verifyUsername.js";
import { validarEmail } from "../utils/verifyEmail.js";

export async function verificarCpf(req, res) {
  try {
    const { cpf, data_nascimento } = req.body;
    const resultado = await verifyCpf(cpf, data_nascimento);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function verificarUsername(req, res) {
  try {
    const { userName } = req.body;
    const resultado = await validarUsername(userName);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function verificarEmail(req, res) {
  try {
    const { email } = req.body;
    const resultado = await validarEmail(email);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
