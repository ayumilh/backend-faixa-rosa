import express from 'express';
import { createFeedPost, listFeedPosts, deleteFeedPost } from '../../controllers/companion/feedPostCompanionController.js';

const router = express.Router();

router.post('/feed/create', createFeedPost);
router.get('/feed', listFeedPosts);
router.delete('/feed/:id/delete', deleteFeedPost);

export default router;
