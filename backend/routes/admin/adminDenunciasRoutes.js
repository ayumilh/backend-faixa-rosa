import express from 'express';
import {
  listDenuncias,
  getDenunciaById,
  updateDenunciaStatus,
  deleteDenuncia
} from '../../controllers/admin/adminDenunciasController.js';

const router = express.Router();

// Listar todas as denúncias
router.get('/denuncias', listDenuncias);

// Obter detalhes de uma denúncia específica
router.get('/denuncias/:id', getDenunciaById);

// Aprovar uma denúncia e suspender o acompanhante denunciado
router.patch('/denuncias/:id/status', updateDenunciaStatus);

// Deletar uma denúncia
router.delete('/denuncias/:id/delete', deleteDenuncia);

export default router;
