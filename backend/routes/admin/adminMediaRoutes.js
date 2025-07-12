import express from 'express';
import { 
  approvedMedia, 
  rejectMedia, 
  suspendMedia 
} from '../../controllers/admin/adminMediaController.js';

const router = express.Router();

router.post('/companion/:id/media/approve', approvedMedia);
router.post('/companion/:id/media/reject', rejectMedia);
router.post('/companion/:id/media/suspend', suspendMedia);

export default router;
