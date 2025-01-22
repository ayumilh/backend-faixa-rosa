const express = require('express');
const router = express.Router();
const {
    createCompanion,
    listCompanions,
    getCompanionById,
    updateCompanion,
    deleteCompanion,
} = require('../controllers/companionController');
const { authenticate } = require('../middleware/authMiddleware');

// Rota para criar um acompanhante (protegida)
router.post('/', authenticate, createCompanion);

// Rota para listar todos os acompanhantes
router.get('/', listCompanions);

// Rota para obter detalhes de um acompanhante específico
router.get('/:id', getCompanionById);

// Rota para atualizar um acompanhante (protegida)
router.put('/:id', authenticate, updateCompanion);

// Rota para excluir um acompanhante (protegida)
router.delete('/:id', authenticate, deleteCompanion);

module.exports = router;
