const express = require('express');
const router = express.Router();
const pagamentoController = require('../../controllers/admin/adminPagamentoController');

// Listar todos os pagamentos
router.get('/pagamentos', pagamentoController.listPagamentos);

// Obter detalhes de um pagamento por ID
router.get('/pagamentos/:id', pagamentoController.getPagamentoById);


module.exports = router;
