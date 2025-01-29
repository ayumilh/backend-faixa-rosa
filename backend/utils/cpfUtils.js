const axios = require("axios");

const validarCpf = async (cpf) => {
    const API_KEY = process.env.NEXT_PUBLIC_HUB_API_KEY;

    if (!cpf) {
        console.log("CPF não informado");
    }

    try {
        const response = await axios.get(
            `https://www.hubdodesenvolvedor.com.br/api/cpf/${cpf}`,
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                },
            }
        );

        const dados = response.data;

        console.log(dados);

        if (!dados.data_nascimento) {
            console.log("CPF inválido");
        }

        const nascimento = new Date(dados.data_nascimento);
        const hoje = new Date();
        const idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        const dia = hoje.getDate() - nascimento.getDate();

        const maiorDeIdade =
            idade > 18 || (idade === 18 && (mes > 0 || (mes === 0 && dia >= 0)));

        return {
            nome: dados.nome,
            cpf: dados.cpf,
            data_nascimento: dados.data_nascimento,
            maior_de_idade: maiorDeIdade,
        };
    } catch {
        return null
    }
};

module.exports = { validarCpf };
