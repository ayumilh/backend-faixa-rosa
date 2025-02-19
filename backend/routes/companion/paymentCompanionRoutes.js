const express = require('express');
const { createPayment, listPaymentsByUser, updatePaymentStatus, webhookHandler } = require('../../controllers/companion/paymentCompanionController');
const router = express.Router();

router.post('/checkout', createPayment); // Criar pagamento
router.post('/webhook', webhookHandler); // Webhook para atualizações

router.post('/pagamento', createPayment);
router.get('/pagamento/:userId', listPaymentsByUser);
router.patch('/pagamento/:id/status', updatePaymentStatus);

module.exports = router;
