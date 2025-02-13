const express = require('express');
const router = express.Router();
const { createFeedPost, listFeedPosts, deleteFeedPost } = require('../../controllers/companion/feedPostCompanionController');

router.post('/feed/create', createFeedPost);
router.get('/feed', listFeedPosts);
router.delete('/feed/:id/delete', deleteFeedPost);

module.exports = router;
