const axios = require("axios");

const validarCpf = async (cpf, data_nascimento) => {
    const API_URL = `https://ws.hubdodesenvolvedor.com.br/v2/cpf/`;
    const API_KEY = process.env.NEXT_PUBLIC_HUB_API_KEY;

    if (!cpf || cpf.length !== 11 || !data_nascimento) {
        console.log("CPF não informado");
    }

    console.log("Nascimento: ", data_nascimento);

    try {
        const response = await axios.get(API_URL, {
            params: {
                cpf: cpf,
                data: data_nascimento,
                token: API_KEY,
            },
        });

        const dados = response.data;
        console.log("Dados: ", dados);

        // Convertendo a data de nascimento
        const nascimentoConvertido = dados.result.data_nascimento.split('/').reverse().join('-');
        const nascimento = new Date(nascimentoConvertido);
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
            nome: dados.result.nome_da_pf,
            cpf: dados.result.numero_de_cpf,
            data_nascimento: dados.result.data_nascimento,
            maior_de_idade: maiorDeIdade,
        };
    } catch {
        return null
    }
};

module.exports = { validarCpf };
