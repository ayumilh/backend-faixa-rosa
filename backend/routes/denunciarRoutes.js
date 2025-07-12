import express from 'express';
import {
  createDenuncia,
  listDenuncias,
  updateDenunciaStatus,
  removerDenuncia,
} from '../controllers/denunciaController.js';
import { authenticate, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Criar denúncia (acesso usuários autenticados)
router.post('/create', authenticate, createDenuncia);

// Listar denúncias (acesso admin)
router.get('/', authenticate, verifyAdmin, listDenuncias);

// Atualizar status da denúncia (acesso admin)
router.put('/:id/status', authenticate, verifyAdmin, updateDenunciaStatus);

// Remover denúncia (acesso admin — opcional)
router.delete('/:id', authenticate, verifyAdmin, removerDenuncia);

export default router;
