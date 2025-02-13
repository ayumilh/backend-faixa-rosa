const express = require('express');
const router = express.Router();
const feedPostController = require('../../controllers/admin/adminFeedPostController');

// Listar todos os posts no feed
router.get('/feed', feedPostController.listFeedPosts);

// Obter detalhes de um post específico
router.get('/feed/:id', feedPostController.getFeedPostById);

// Deletar um post do feed
router.delete('/feed/:id/delete', feedPostController.deleteFeedPost);

module.exports = router;
