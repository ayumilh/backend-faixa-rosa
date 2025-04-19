const express = require('express');
const router = express.Router();
const { listPlans, subscribeToPlan, disablePlan, disableExtraPlans, createUserPlan, listUserPlans, listAvailablePlanTypes, addUserExtras } = require('../../controllers/companion/planCompanionController');
const { authenticate } = require('../../middleware/authMiddleware');

router.get('/', listPlans);         // Listar planos disponíveis
router.post('/subscribe', authenticate, subscribeToPlan); // Assinar plano
router.post('/disable', authenticate, disablePlan);     // Finalizar plano
router.post('/disableExtra', authenticate, disableExtraPlans);     // Finalizar plano extras

router.get('/available-types', authenticate, listAvailablePlanTypes);  // Listar planos básicos disponíveis
router.post('/create-with-extras', authenticate, createUserPlan);      // Criar plano básico com extras

// usuarios ja assinados, mas que querem adicionar extras
router.post('/user-plans/extras', addUserExtras);         // Adicionar extras ao plano
router.get('/user-plans', authenticate, listUserPlans);                // Listar todos planos do usuário

module.exports = router;