const express = require('express');
const { createPayment, listPaymentsByUser, updatePaymentStatus, receiveWebhook } = require('../../controllers/companion/paymentCompanionController');
const router = express.Router();

router.post('/checkout', createPayment); // Criar pagamento
router.post('/webhook', receiveWebhook); // Webhook para atualizações

router.post('/pagamento', createPayment);
router.get('/pagamento/:userId', listPaymentsByUser);
router.patch('/pagamento/:id/status', updatePaymentStatus);

module.exports = router;
