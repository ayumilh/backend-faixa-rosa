import dotenv from 'dotenv';
import { MercadoPagoConfig } from 'mercadopago';

dotenv.config();

const mercadoPago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

export { mercadoPago };
