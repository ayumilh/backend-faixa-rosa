const { mercadoPago } = require("../../config/mercadoPago.js");
const { Preference, Payment } = require("mercadopago");
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Função para gerar idempotencyKey
function generateIdempotencyKey() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

// Criar um pagamento
exports.createPayment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { product, payment_method_id } = req.body;

        if (!userId || !product || !payment_method_id) {
            return res.status(400).json({ error: 'Todos os dados são obrigatórios.' });
        }

        const user = await prisma.user.findFirst({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const plan = await prisma.plan.findUnique({ where: { id: product } });
        if (!plan) return res.status(404).json({ error: 'Plano não encontrado.' });

        // Garantir que o email do usuário seja utilizado para o pagador
        const payerEmail = user.email;
        const payerCpf = user.cpf;

        // Criar uma instância de pagamento usando a configuração do Mercado Pago
        const payment = new Payment(mercadoPago);  // Usa a configuração importada diretamente

        // Criação do pagamento com a SDK do Mercado Pago
        const paymentResponse = await payment.create({
            body: {
                transaction_amount: plan.price,  // O valor da transação (preço do plano)
                description: plan.name,  // Descrição do plano
                payment_method_id: payment_method_id,  // O ID do método de pagamento (ex: 'visa', 'pix', etc.)
                payer: {
                    email: payerEmail,  // E-mail do pagador
                    identification: {
                        type: 'CPF',  // Tipo de identificação (ex: 'CPF', 'CNPJ')
                        number: '58962188856'  // Número do CPF do pagador
                    }
                },
                notification_url: 'https://www.faixarosa.com/api/payments/webhook',
            },
            requestOptions: { idempotencyKey: generateIdempotencyKey() }  // Valor único para idempotência
        });

        console.log(' Pagamento criado:', paymentResponse);

        // Converte o transactionId para string antes de salvar no banco
        const transactionId = paymentResponse.id.toString();  // Garante que seja uma string

        // Salvar a transação no banco de dados (status "pendente")
        const savedPayment = await prisma.payment.create({
            data: {
                userId,
                planId: product,
                amount: plan.price,
                status: paymentResponse.status,  // Status do pagamento retornado pela API do Mercado Pago
                transactionId: transactionId,  // Salva como string
            },
        });

        console.log('💾 Pagamento salvo:', savedPayment);

        // Retornar a URL de pagamento, ticket_url e o ID do pagamento
        return res.status(200).json({
            init_point: paymentResponse.init_point,  // A URL para o pagamento
            ticket_url: paymentResponse.point_of_interaction.transaction_data.ticket_url,  // URL do ticket
            paymentId: savedPayment.id
        });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        return res.status(500).json({ error: 'Erro ao criar pagamento.' });
    }
};


// Função que processa o webhook
exports.receiveWebhook = async (req, res) => {
    try {
        const { action, data, live_mode, id } = req.body;

        // Verifique se a ação é 'payment.updated' (evento do Mercado Pago indicando atualização de pagamento)
        if (action === 'payment.updated') {
            const paymentId = data.id;  // ID do pagamento (transação)
            console.log(`Pagamento atualizado recebido, ID: ${paymentId}`);

            // Consultar o status atual do pagamento usando a API do Mercado Pago
            const paymentResponse = await mercadoPago.payment.get(paymentId);

            // O status do pagamento
            const paymentStatus = paymentResponse.body.status;

            // Verifique se o pagamento foi encontrado no banco
            const paymentToUpdate = await prisma.payment.findUnique({
                where: { transactionId: paymentId.toString() },
            });

            // Se encontrar o pagamento no banco, atualiza o status
            if (paymentToUpdate) {
                const updatedPayment = await prisma.payment.update({
                    where: { transactionId: paymentId.toString() },
                    data: {
                        status: paymentStatus,  // Atualiza o status no banco de dados
                    },
                });

                console.log(`Pagamento atualizado no banco: ${updatedPayment.id} - Status: ${updatedPayment.status}`);
                return res.status(200).json({ received: true });
            } else {
                console.log(`Pagamento não encontrado para o ID: ${paymentId}`);
                return res.status(404).json({ error: 'Pagamento não encontrado' });
            }
        }

        // Caso o evento não seja 'payment.updated', retorna erro
        return res.status(400).json({ error: 'Evento não suportado' });
    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        return res.status(500).json({ error: 'Erro ao processar webhook' });
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
