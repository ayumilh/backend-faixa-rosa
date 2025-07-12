import express from 'express';
import {
  listPlans,
  subscribeToPlan,
  disablePlan,
  disableExtraPlans,
  createUserPlan,
  listUserPlans,
  listAvailablePlanTypes,
  addUserExtras,
} from '../../controllers/companion/planCompanionController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', listPlans); // Listar planos disponíveis
router.post('/subscribe', authenticate, subscribeToPlan); // Assinar plano
router.post('/disable', authenticate, disablePlan); // Finalizar plano
router.post('/disableExtra', authenticate, disableExtraPlans); // Finalizar extras

router.get('/available-types', authenticate, listAvailablePlanTypes); // Listar tipos de planos
router.post('/create-with-extras', authenticate, createUserPlan); // Criar plano com extras

// Usuários já assinados querendo adicionar extras
router.post('/user-plans/extras', addUserExtras); // Adicionar extras ao plano
router.get('/user-plans', authenticate, listUserPlans); // Listar planos do usuário

export default router;
