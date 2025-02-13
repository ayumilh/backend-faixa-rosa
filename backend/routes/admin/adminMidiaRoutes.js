const express = require('express');
const router = express.Router();
const midiaController = require('../../controllers/admin/adminMidiaController');

// Listar todas as mídias
router.get('/midias', midiaController.listMidias);

// Obter detalhes de uma mídia por ID
router.get('/midias/:id', midiaController.getMidiaById);

// Deletar uma mídia por ID
router.delete('/midias/:id', midiaController.deleteMidia);

module.exports = router;
