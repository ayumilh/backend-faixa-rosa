const express = require('express');
const { createPayment, listPaymentsByUser, updatePaymentStatus } = require('../../controllers/companion/paymentCompanionController');
const router = express.Router();

router.post('/create', createPayment); // Criar pagamento
// router.post('/webhook', webhook); // Webhook para atualizações

router.post('/pagamento', createPayment);
router.get('/pagamento/:userId', listPaymentsByUser);
router.patch('/pagamento/:id/status', updatePaymentStatus);

module.exports = router;
