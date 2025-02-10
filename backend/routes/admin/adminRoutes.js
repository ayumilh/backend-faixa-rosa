const express = require('express');
const router = express.Router();
const AdminController = require('../../controllers/admin/adminController');

// Listar acompanhante
router.get('/acompanhante', AdminController.listAcompanhantes);

// Aprovar anunciante
router.patch('/acompanhante/:id/approve', AdminController.approveAcompanhantes);

// Rejeitar anunciante
router.patch('/acompanhante/:id/reject', AdminController.rejectAcompanhantes);

// Suspender anunciante
router.patch('/acompanhante/:id/suspend', AdminController.suspendAcompanhantes);

// Atualizar plano
router.put('/acompanhante/:id/update-plan', AdminController.updatePlan);

// Aprovar documento
router.patch('/acompanhante/:id/approved-documents', AdminController.approvedDocuments);

// Monitorar postagens
router.get('/acompanhante/:id/posts', AdminController.monitorPosts);

module.exports = router;
