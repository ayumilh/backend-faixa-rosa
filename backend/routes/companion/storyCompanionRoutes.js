import express from 'express';
import {
  createStory,
  listActiveStories,
  deleteStory,
} from '../../controllers/companion/storyCompanionController.js';

const router = express.Router();

router.post('/story/create', createStory);
router.get('/story/', listActiveStories);
router.delete('/story/:id/delete', deleteStory);

export default router;
