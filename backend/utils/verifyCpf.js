const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const verifyCpf = async (cpf, data_nascimento) => {
    const API_URL = `https://ws.hubdodesenvolvedor.com.br/v2/cpf/`;
    const API_KEY = process.env.PUBLIC_HUB_API_KEY;

    if (!cpf || cpf.length !== 11 || !data_nascimento) {
        return { error: "CPF e data de nascimento são obrigatórios." };
    }

    try {
        const response = await axios.get(API_URL, {
            params: {
                cpf: cpf,
                data: data_nascimento,
                token: API_KEY,
            },
        });

        const dados = response.data;
        console.log("Dados:", dados);

        if (!dados.result || !dados.result.data_nascimento) {
            return { error: "CPF inválido." };
        }

        if (dados.result.data_nascimento !== data_nascimento) {
            return { error: "Data de nascimento inválida." };
        }

        // Convertendo a data para calcular idade
        const nascimentoConvertido = dados.result.data_nascimento.split('/').reverse().join('-');
        const nascimento = new Date(nascimentoConvertido);
        const hoje = new Date();

        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const aniversarioNaoOcorrido =
            hoje.getMonth() < nascimento.getMonth() ||
            (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());

        if (aniversarioNaoOcorrido) {
            idade--;
        }

        const maiorDeIdade = idade >= 18;

        // Verifica se CPF já está cadastrado no banco
        const cpfExistente = await prisma.user.findUnique({
            where: { cpf },
            select: { id: true },
        });

        console.log("CPF existente:", cpfExistente);

        if (cpfExistente) {
            console.log("CPF já cadastrado:", cpf);
            return {
              valid: false,
              message: "CPF já cadastrado."
            };
          }
          

        return {
            nome: dados.result.nome_da_pf,
            cpf: dados.result.numero_de_cpf,
            data_nascimento: dados.result.data_nascimento,
            maior_de_idade: maiorDeIdade,
        };
    } catch (err) {
        console.error("Erro ao consultar API externa:", err);
        return { error: "Erro ao validar CPF." };
    }
};

module.exports = { verifyCpf };
