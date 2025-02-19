const { mercadoPago } = require("../../config/mercadoPago.js");
const { Preference, Payment } = require("mercadopago"); 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Criar um pagamento
exports.createPayment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { planId, amount } = req.body;

        if (!userId || !planId || !amount) {
            return res.status(400).json({ error: 'Usuário, plano e valor são obrigatórios.' });
        }

        const user = await prisma.user.findFirst({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return res.status(404).json({ error: 'Plano não encontrado.' });

        // Criar uma instância de pagamento usando a nova SDK do Mercado Pago
        const preference = new Preference(mercadoPago);

        const preferenceResponse = await preference.create({
            body: {
                items: [
                    {
                        title: plan.name,
                        quantity: 1,
                        unit_price: amount,
                        currency_id: "BRL",
                    },
                ],
                payer: {
                    email: "TESTUSER65026117@testuser.com",
                },
                back_urls: {
                    success: "https://www.faixarosa.com/sucesso",
                    failure: "https://www.faixarosa.com/erro",
                    pending: "https://www.faixarosa.com/pendente",
                },
                auto_return: "approved",
                notification_url: "https://www.faixarosa.com/api/payments/webhooks",
            }
        });

        // Salvar a transação no banco de dados (status "pendente")
        const payment = await prisma.payment.create({
            data: {
                userId,
                planId,
                amount,
                status: "pending",
                transactionId: preferenceResponse.id, // ID da transação gerado pelo Mercado Pago
            },
        });

        return res.status(200).json({ init_point: preferenceResponse.sandbox_init_point, paymentId: payment.id });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        return res.status(500).json({ error: 'Erro ao criar pagamento.' });
    }
};


// Webhook para atualizar status do pagamento
exports.webhookHandler = async (req, res) => {
    try {
        console.log("🔔 Webhook recebido:", req.body);

        const paymentId = req.body.data?.id;
        if (!paymentId) return res.status(400).json({ error: "ID de pagamento ausente no webhook." });

        // Criar instância de pagamentos com a nova SDK
        const payment = new Payment(mercadoPago);

        // Buscar detalhes do pagamento no Mercado Pago
        const paymentData = await payment.get({ id: paymentId });

        if (!paymentData || !paymentData.status) {
            return res.status(400).json({ error: "Pagamento não encontrado no Mercado Pago." });
        }

        // Atualizar status do pagamento no banco
        await prisma.payment.updateMany({
            where: { transactionId: paymentId },
            data: { status: paymentData.status },
        });

        console.log(`✅ Pagamento atualizado no banco. ID: ${paymentId}, Status: ${paymentData.status}`);

        return res.status(200).json({ message: "Webhook processado com sucesso." });
    } catch (error) {
        console.error("❌ Erro no Webhook:", error);
        return res.status(500).json({ error: "Erro ao processar webhook." });
    }
};

// Listar pagamentos de um usuário
exports.listPaymentsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const payments = await prisma.payment.findMany({
            where: { userId: parseInt(userId) },
        });

        return res.status(200).json(payments);
    } catch (error) {
        console.error('Erro ao listar pagamentos:', error);
        return res.status(500).json({ error: 'Erro ao listar pagamentos.' });
    }
};

// Atualizar status do pagamento
exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updatedPayment = await prisma.payment.update({
            where: { id: parseInt(id) },
            data: { status },
        });

        return res.status(200).json({ message: 'Status do pagamento atualizado.', updatedPayment });
    } catch (error) {
        console.error('Erro ao atualizar status do pagamento:', error);
        return res.status(500).json({ error: 'Erro ao atualizar status do pagamento.' });
    }
};
