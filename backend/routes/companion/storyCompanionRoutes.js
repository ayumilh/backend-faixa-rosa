const express = require('express');
const router = express.Router();
const { createStory, listActiveStories, deleteStory } = require('../../controllers/companion/storyCompanionController.js');

router.post('/story/create', createStory);
router.get('/story/', listActiveStories);
router.delete('/story/:id/delete', deleteStory);

module.exports = router;
