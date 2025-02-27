const express = require('express');
const router = express.Router();
const {
    listAcompanhantes,
    approveAcompanhantes,
    rejectAcompanhantes,
    suspendAcompanhantes,
    updatePlan,
    deleteAcompanhante,
    getActivityLog
} = require('../../controllers/admin/adminCompanionController');


router.get('/companion', listAcompanhantes);

// PERFIL DAS ACOMPANHANTES
router.post('/companion/:id/approve', approveAcompanhantes);

router.post('/companion/:id/reject', rejectAcompanhantes);

router.post('/companion/:id/suspend', suspendAcompanhantes);

router.delete('/companion/:id/delete', deleteAcompanhante);

router.put('/companion/:id/update-plan', updatePlan);

router.get('/companion/:id/activity', getActivityLog);


module.exports = router;
