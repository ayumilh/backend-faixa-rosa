const express = require('express');
const router = express.Router();
const metricaController = require('../../controllers/admin/adminMetricaController');

// Listar todas as métricas
router.get('/metricas', metricaController.listMetricas);

// Criar uma nova métrica
router.post('/metricas', metricaController.createMetrica);

// Deletar uma métrica por ID
router.delete('/metricas/:id', metricaController.deleteMetrica);

module.exports = router;
