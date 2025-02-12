const express = require('express');
const router = express.Router();
const {
    listAcompanhantes,
    approveAcompanhantes,
    rejectAcompanhantes,
    suspendAcompanhantes,
    updatePlan,
    deleteAcompanhante,
    monitorPosts
} = require('../../controllers/admin/adminCompanionController');


router.get('/acompanhante', listAcompanhantes);

// PERFIL DAS ACOMPANHANTES
router.patch('/acompanhante/:id/approve', approveAcompanhantes);

router.patch('/acompanhante/:id/reject', rejectAcompanhantes);

router.patch('/acompanhante/:id/suspend', suspendAcompanhantes);

router.put('/acompanhante/:id/update-plan', updatePlan);

router.delete('/acompanhante/:id/delete', deleteAcompanhante);



// Monitorar postagens
router.get('/acompanhante/:id/posts', monitorPosts);

module.exports = router;
