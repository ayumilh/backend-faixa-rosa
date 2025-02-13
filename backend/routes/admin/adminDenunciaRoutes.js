const express = require('express');
const router = express.Router();
const {
    listDenuncias,
    getDenunciaById,
    approveDenuncia,
    rejectDenuncia,
    deleteDenuncia
} = require('../../controllers/admin/adminDenunciaController');

// Listar todas as denúncias
router.get('/denuncias', listDenuncias);

// Obter detalhes de uma denúncia específica
router.get('/denuncias/:id', getDenunciaById);

// Aprovar uma denúncia e suspender o acompanhante denunciado
router.patch('/denuncias/:id/aprovar', approveDenuncia);

// Rejeitar uma denúncia
router.patch('/denuncias/:id/rejeitar', rejectDenuncia);

// Deletar uma denúncia
router.delete('/denuncias/:id', deleteDenuncia);

module.exports = router;
