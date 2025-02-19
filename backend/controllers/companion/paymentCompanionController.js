const mercadopago = require('../../config/mercadoPago.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar um pagamento
export const createPayment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { planId, amount } = req.body;

        if (!userId || !planId || !amount) return res.status(400).json({ error: 'Usuário, plano e valor são obrigatórios.' });

        const user = await prisma.user.findFirst({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usúario não encontrado.' });

        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return res.status(404).json({ error: 'Plano não encontrado.' });

        // Criar preferência de pagamento no Mercado Pago
        const preference = {
            items: [   // definir o item a ser pago
                {
                    title: plan.name,
                    quantity: 1,
                    unit_price: amount,
                    currency_id: "BRL",
                },
            ],
            payer: {  // informação do pagador
                email: user.email,
            },
            back_urls: {
                success: "https://www.faixarosa.com/sucesso",
                failure: "https://www.faixarosa.com/erro",
                pending: "https://www.faixarosa.com/pendente",
            },
            auto_return: "approved",
            notification_url: "https://www.faixarosa.com/api/payments/webhooks",
        };

        const response = await mercadopago.preferences.create(preference);

        // Salvar a transação no banco de dados (status "pendente")
        const payment = await prisma.payment.create({
            data: {
                userId,
                planId,
                amount,
                status: "pending",
                transactionId: response.body.id, // ID da transação gerado pelo Mercado Pago
            },
        });

        return res.status(200).json({ init_point: response.body.init_point, paymentId: payment.id });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        return res.status(500).json({ error: 'Erro ao criar pagamento.' });
    }
};

// Webhook para atualizar status do pagamento
export const webhookHandler = async (req, res) => {
    try {
        console.log("🔔 Webhook recebido:", req.body);

        const paymentId = req.body.data.id;

        // Buscar detalhes do pagamento no Mercado Pago
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
            },
        });

        const paymentData = await response.json();

        if (!paymentData || !paymentData.status) {
            return res.status(400).json({ error: "Pagamento não encontrado no Mercado Pago." });
        }

        // Atualizar status do pagamento no banco
        await prisma.payment.updateMany({
            where: { transactionId: paymentId },
            data: { status: paymentData.status },
        });

        return res.status(200).json({ message: "Webhook processado com sucesso." });
    } catch (error) {
        console.error("❌ Erro no Webhook:", error);
        return res.status(500).json({ error: "Erro ao processar webhook." });
    }
};


// Listar pagamentos de um usuário
export const listPaymentsByUser = async (req, res) => {
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
export const updatePaymentStatus = async (req, res) => {
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