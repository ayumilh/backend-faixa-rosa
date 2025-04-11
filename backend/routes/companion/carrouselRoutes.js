const express = require('express');
const { addCarrouselImages, deleteCarrouselImage } = require('../../controllers/companion/carrouselController.js');
const { uploadCarrouselImages } = require('../../config/wasabi.js');
const router = express.Router();

// Rota para adicionar imagem ao carrossel
router.post('/carrousel/update', uploadCarrouselImages, addCarrouselImages);

router.delete("/carrousel/delete", deleteCarrouselImage);

module.exports = router;
