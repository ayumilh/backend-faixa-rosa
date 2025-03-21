const express = require('express');
const { createPayment, listPaymentsByUser, updatePaymentStatus, receiveWebhook, getPaymentStatus } = require('../../controllers/companion/paymentCompanionController');
const router = express.Router();

router.post('/checkout', createPayment); // Criar pagamento
router.post('/webhook', receiveWebhook); // Webhook para atualizações
router.get('/checkout/status/:transactionId', getPaymentStatus);

router.get('/pagamento/:userId', listPaymentsByUser);
router.patch('/pagamento/:id/status', updatePaymentStatus);

module.exports = router;
