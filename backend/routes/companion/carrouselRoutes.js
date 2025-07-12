import express from 'express';
import { addCarrouselImages, deleteCarrouselImage } from '../../controllers/companion/carrouselController.js';
import { uploadCarrouselImages } from '../../config/wasabi.js';

const router = express.Router();

// Rota para adicionar imagem ao carrossel
router.post('/carrousel/update', uploadCarrouselImages, addCarrouselImages);

// Rota para deletar imagem do carrossel
router.delete('/carrousel/delete', deleteCarrouselImage);

export default router;
