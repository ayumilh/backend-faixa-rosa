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
        console.log(dados.data_nascimento);

        // Convertendo a data de nascimento
        const nascimento = new Date(dados.data_nascimento);
        const hoje = new Date();

        // Cálculo correto da idade
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const aniversarioNaoOcorrido =
            hoje.getMonth() < nascimento.getMonth() ||
            (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());

        if (aniversarioNaoOcorrido) {
            idade--; // Se o aniversário ainda não ocorreu este ano, diminui a idade
        }

        const maiorDeIdade = idade >= 18;

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
