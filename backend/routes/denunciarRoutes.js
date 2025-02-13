const express = require('express');
const router = express.Router();
const { createDenuncia, listDenuncias, removerDenuncia } = require('../controllers/denunciaController');

router.post('/create', createDenuncia);
router.get('/', listDenuncias);
router.delete('/:id/delete', removerDenuncia);

module.exports = router;
