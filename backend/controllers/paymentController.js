const mercadopago = require('mercadopago');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configura o Mercado Pago com a Access Token do ambiente
// mercadopago.configure({
//     access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
// });

// Criar pagamento (Pix, Cartão de Crédito, Boleto)
// exports.createPayment = async (req, res) => {
//     const { userId, planId, amount, paymentMethod } = req.body;

//     try {
//         const user = await prisma.user.findUnique({ where: { id: userId } });
//         if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

//         const paymentData = {
//             transaction_amount: amount,
//             description: `Pagamento do plano ${planId}`,
//             payment_method_id: paymentMethod, // "pix", "visa", "master", "bolbradesco"
//             payer: {
//                 email: user.email
//             }
//         };

//         const response = await mercadopago.payment.create(paymentData);

//         // Salvar no banco de dados
//         const newPayment = await prisma.payment.create({
//             data: {
//                 userId,
//                 planId,
//                 amount,
//                 status: "PENDING",
//                 transactionId: response.body.id,
//             },
//         });

//         return res.status(201).json({
//             message: "Pagamento criado com sucesso.",
//             paymentLink: response.body.point_of_interaction?.transaction_data?.qr_code,
//             transactionId: response.body.id,
//             status: newPayment.status
//         });

//     } catch (error) {
//         console.error("Erro ao criar pagamento:", error);
//         return res.status(500).json({ error: "Erro ao processar pagamento." });
//     }
// };

// exports.webhook = async (req, res) => {
//     const { id, action } = req.query; // ID da transação e ação recebida pelo Mercado Pago

//     try {
//         if (action === "payment.created" || action === "payment.updated") {
//             const payment = await mercadopago.payment.findById(id);

//             if (!payment) return res.status(404).json({ error: "Pagamento não encontrado." });

//             // Atualiza o status do pagamento no banco de dados
//             await prisma.payment.update({
//                 where: { transactionId: id },
//                 data: { status: payment.body.status }
//             });

//             return res.status(200).json({ message: "Status atualizado com sucesso." });
//         }

//         return res.status(400).json({ error: "Ação desconhecida." });

//     } catch (error) {
//         console.error("Erro no webhook:", error);
//         return res.status(500).json({ error: "Erro ao processar webhook." });
//     }
// };
