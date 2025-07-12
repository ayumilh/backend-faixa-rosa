import express from 'express';
import { registerConsent } from '../controllers/consentController.js';

const router = express.Router();

router.post('/save', registerConsent);

export default router;
