import express from 'express';
import * as authController from './betterAuthRoutes.js';
import * as utilsController from '../controllers/authController.js';  // Para as verificações (CPF, Email, Username)

const router = express.Router();

// Rotas de Autenticação via Better Auth
router.post('/sign-up/email', authController.signUpEmail);
router.post('/sign-in/email', authController.signInEmail);
router.get('/me', authController.getSession);
router.post('/sign-out', authController.signOut);

// Rotas de Verificação de Dados (AppUser/Prisma)
router.post('/verify-cpf', utilsController.verificarCpf);
router.post('/verify-email', utilsController.verificarEmail);
router.post('/verify-username', utilsController.verificarUsername);

export default router;
