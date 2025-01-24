const express = require('express');
const router = express.Router();
const { listPlans, subscribeToPlan, finalizePlan, createUserPlan, listUserPlans, listAvailablePlanTypes, addUserExtras } = require('../controllers/planController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/listPlans', listPlans);                      // Listar planos
router.post('/subscribe', authenticate, subscribeToPlan); // Assinar plano
router.post('/finalize', authenticate, finalizePlan);     // Finalizar plano

router.get('/available-types', listAvailablePlanTypes);  // Listar planos básicos disponíveis
router.post('/create-with-extras', createUserPlan);      // Criar plano básico com extras

// usuarios ja assinados, mas que querem adicionar extras
router.post('/user-plans/extras', addUserExtras);         // Adicionar extras ao plano
router.get('/user-plans', listUserPlans);                // Listar todos planos do usuário

module.exports = router;