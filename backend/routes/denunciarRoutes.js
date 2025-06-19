const express = require('express');
const router = express.Router();
const {
  createDenuncia,
  listDenuncias,
  updateDenunciaStatus,
  removerDenuncia
} = require('../controllers/denunciaController');

const { authenticate, verifyAdmin } = require('../middleware/authMiddleware');

// Criar denúncia (acesso usuários autenticados)
router.post('/create', authenticate, createDenuncia);

// Listar denúncias (acesso admin)
router.get('/', authenticate, verifyAdmin, listDenuncias);

// Atualizar status da denúncia (acesso admin)
router.put('/:id/status', authenticate, verifyAdmin, updateDenunciaStatus);

// Remover denúncia (acesso admin — opcional)
router.delete('/:id', authenticate, verifyAdmin, removerDenuncia);

module.exports = router;
