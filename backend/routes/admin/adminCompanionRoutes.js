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
router.patch('/companion/:id/approve', approveAcompanhantes);

router.patch('/companion/:id/reject', rejectAcompanhantes);

router.patch('/companion/:id/suspend', suspendAcompanhantes);

router.put('/companion/:id/update-plan', updatePlan);

router.delete('/companion/:id/delete', deleteAcompanhante);


module.exports = router;
