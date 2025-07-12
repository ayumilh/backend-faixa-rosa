import express from 'express';
import {
  followCompanion,
  unfollowCompanion,
  getFollowingOfContractor,
} from '../../controllers/companion/followController.js';

const router = express.Router();

router.post('/follow/', followCompanion);
router.delete('/follow/delete/:id', unfollowCompanion);
router.get('/follow/list', getFollowingOfContractor);

export default router;
