const { mercadoPago } = require("./config/mercadoPago.js"); // Importa a configuração do Mercado Pago
const { Preference, Payment } = require("mercadopago");
const dotenv = require("dotenv");

dotenv.config();


// Função para gerar idempotencyKey
function generateIdempotencyKey() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

// Função assíncrona para processar o pagamento
async function processPayment(req, res) {
  const payment = new Payment(mercadoPago); // Usa a configuração importada diretamente

    console.log("Dados do pagamento:", req.body); 

  const paymentData = {
    body: {
      transaction_amount: req.body.transaction_amount,  // Valor da transação
      token: req.body.token,  // Token do cartão gerado
      description: req.body.description,  // Descrição do pagamento
      installments: req.body.installments,  // Parcelamento
      payment_method_id: req.body.paymentMethodId,  // Método de pagamento
      issuer_id: req.body.issuer,  // Emissor do cartão
      payer: {
        email: req.body.email,  // E-mail do pagador
        identification: {
          type: req.body.identificationType,  // Tipo de documento
          number: req.body.number  // Número do documento
        }
      }
    },
    requestOptions: { 
      idempotencyKey: generateIdempotencyKey()  // Gerando a chave de idempotência
    }
  };

  // Chamada para criar o pagamento
  try {
    const paymentResponse = await payment.create(paymentData);  // Cria o pagamento com os dados fornecidos

    // Se o pagamento for bem-sucedido, retorna a resposta
    return res.status(200).json(paymentResponse);
  } catch (error) {
    // Caso ocorra um erro, exibe e retorna a mensagem de erro
    console.error("Erro ao processar pagamento:", error);
    return res.status(500).json({ error: "Erro ao processar pagamento", details: error });
  }
}

// Exporta a função processPayment
module.exports = { processPayment };
