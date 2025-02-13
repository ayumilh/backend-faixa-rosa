const express = require('express');
const { createPayment, webhook } = require('../controllers/paymentController');

const router = express.Router();

router.post('/create', createPayment); // Criar pagamento
router.post('/webhook', webhook); // Webhook para atualizações

module.exports = router;
