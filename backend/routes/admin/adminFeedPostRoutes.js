import express from 'express';
import * as feedPostController from '../../controllers/admin/adminFeedPostController.js';

const router = express.Router();

// Listar todos os posts no feed
router.get('/feed', feedPostController.listFeedPosts);

// Obter detalhes de um post específico
router.get('/companion/:id/posts', feedPostController.getPostsByCompanion);

// Deletar um post do feed
router.delete('/feed/:id/delete', feedPostController.deleteFeedPost);

export default router;
