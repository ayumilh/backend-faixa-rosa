const { MercadoPagoConfig } = require("mercadopago");
const dotenv = require("dotenv");

dotenv.config();

// Criando a instância da configuração
const mercadoPago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

module.exports = { mercadoPago };
