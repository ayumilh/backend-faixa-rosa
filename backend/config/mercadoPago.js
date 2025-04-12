const { MercadoPagoConfig } = require("mercadopago");
const dotenv = require("dotenv");
dotenv.config();

const mercadoPago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

module.exports = { mercadoPago };
