import express from 'express';
import {
  listContratantes,
  getContratanteById,
  createContratante,
  updateContratante,
  updateContratanteStatus,
  deleteContratante
} from '../../controllers/admin/adminContratanteController.js';

const router = express.Router();

// Rotas para gestão de contratantes
router.get('/contratantes', listContratantes);
router.get('/contratantes/:id', getContratanteById);
router.post('/contratantes', createContratante);
router.patch('/contratantes/:id', updateContratante);
router.patch('/contratantes/:id/status', updateContratanteStatus);
router.delete('/contratantes/:id', deleteContratante);

export default router;
