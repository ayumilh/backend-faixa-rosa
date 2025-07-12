import express from 'express';
import * as adminPlanController from '../../controllers/admin/adminPlanController.js';

const router = express.Router();

// ============================
// ROTAS PARA PLANOS PRINCIPAIS
// ============================

// Criar um novo plano
router.post('/plans/create', adminPlanController.createPlan);

// Atualizar um plano existente
router.put('/plans/:id/update', adminPlanController.updatePlan);

// Deletar um plano
router.delete('/plans/:id/delete', adminPlanController.deletePlan);

// Listar todos os planos
router.get('/plans', adminPlanController.listPlans);

// ============================
// ROTAS PARA PLANOS EXTRAS
// ============================

// Criar um novo plano extra
router.post('/extra-plans/create', adminPlanController.createExtraPlan);

// Atualizar um plano extra
router.put('/extra-plans/:id/update', adminPlanController.updateExtraPlan);

// Deletar um plano extra
router.delete('/extra-plans/:id/delete', adminPlanController.deleteExtraPlan);

// Listar todos os planos extras
router.get('/extra-plans', adminPlanController.listExtraPlans);

// ============================
// ROTAS PARA GERENCIAR ASSINATURAS DE USUÁRIOS
// ============================

// Listar todas as assinaturas ativas
router.get('/subscriptions', adminPlanController.listActiveSubscriptions);

// Cancelar a assinatura principal de um usuário (desativar plano principal)
router.put('/subscriptions/:companionId/disable', adminPlanController.disableUserPlan);

// Cancelar um plano extra específico de um usuário
router.patch('/subscriptions/:companionId/extra/:extraPlanId/disable', adminPlanController.disableUserExtraPlan);

// Obter assinaturas próximas do vencimento
router.get("/expiring", adminPlanController.getExpiringSubscriptions);

export default router;
