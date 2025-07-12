import express from 'express';
import * as pagamentoController from '../../controllers/admin/adminPagamentoController.js';

const router = express.Router();

// Listar todos os pagamentos
router.get('/pagamentos', pagamentoController.listPagamentos);

// Obter detalhes de um pagamento por ID
router.get('/pagamentos/:id', pagamentoController.getPagamentoById);

export default router;
