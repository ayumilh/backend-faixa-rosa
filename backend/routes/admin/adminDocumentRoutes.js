import express from 'express';
import { 
  approvedDocuments, 
  rejectDocument 
} from '../../controllers/admin/adminDocumentController.js';

const router = express.Router();

router.post('/companion/:id/documents/approve', approvedDocuments);

router.post('/companion/:id/documents/reject', rejectDocument);

export default router;
