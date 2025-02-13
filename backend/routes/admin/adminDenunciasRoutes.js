const express = require('express');
const router = express.Router();
const {
    listDenuncias,
    getDenunciaById,
    updateDenunciaStatus,
    deleteDenuncia
} = require('../../controllers/admin/adminDenunciasController');

// Listar todas as denúncias
router.get('/denuncias', listDenuncias);

// Obter detalhes de uma denúncia específica
router.get('/denuncias/:id', getDenunciaById);

// Aprovar uma denúncia e suspender o acompanhante denunciado
router.patch('/denuncias/:id/status', updateDenunciaStatus);

// Deletar uma denúncia
router.delete('/denuncias/:id/delete', deleteDenuncia);

module.exports = router;
