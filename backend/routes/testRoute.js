const express = require('express');
const router = express.Router();

// Importa o controlador do pagamento
const { processPayment } = require('../test.js'); // Ajuste o caminho conforme necessário

// Definir a rota POST para processar o pagamento
router.post('/process_payment', processPayment);

module.exports = router;
