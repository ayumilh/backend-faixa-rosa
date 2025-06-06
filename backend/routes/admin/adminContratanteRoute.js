const express = require('express');
const router = express.Router();

const {
  listContratantes,
  getContratanteById,
  createContratante,
  updateContratante,
  updateContratanteStatus,
  deleteContratante,
} = require('../../controllers/admin/adminContratanteController');

// Rotas para gestão de contratantes
router.get('/contratantes', listContratantes);
router.get('/contratantes/:id', getContratanteById);
router.post('/contratantes', createContratante);
router.patch('/contratantes/:id', updateContratante);
router.patch('/contratantes/:id/status', updateContratanteStatus);
router.delete('/contratantes/:id', deleteContratante);

module.exports = router;
