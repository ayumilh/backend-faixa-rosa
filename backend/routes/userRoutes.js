import express from 'express';
import { uploadDocuments } from "../config/wasabi.js";
import * as userController from '../controllers/userController.js';
import * as documentController from '../controllers/companion/documentCompanionController.js';
import * as getUser from '../utils/getUser.js';

const router = express.Router();

// Informações do Usuário
router.get('/info', getUser.getUserIdBd);

// Upload de Documentos
router.post("/documents/upload", uploadDocuments, documentController.uploadDocument);

export default router;
