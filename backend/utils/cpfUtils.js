const axios = require('axios');

/**
 * Função para validar CPF localmente sem chamar API externa.
 */
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.charAt(i - 1)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.charAt(i - 1)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;

    return resto === parseInt(cpf.charAt(10));
}

/**
 * Função para calcular idade com base na data de nascimento.
 */
function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}

/**
 * Função para verificar CPF na API externa e calcular a idade.
 */
async function verificarCPFNaAPI(cpf) {
    try {
        const response = await axios.get(`https://api-de-validacao.com/cpf/${cpf}`);
        const dataNascimento = response.data.nascimento; // Retorna algo como "2000-05-10"

        return {
            sucesso: true,
            cpf,
            existe: true,
            maiorDeIdade: calcularIdade(dataNascimento) >= 18,
            idade: calcularIdade(dataNascimento)
        };

    } catch (error) {
        return { sucesso: false, mensagem: "CPF inexistente ou erro na API" };
    }
}

module.exports = { validarCPF, calcularIdade, verificarCPFNaAPI };
