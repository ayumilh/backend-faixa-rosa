const express = require('express');
const router = express.Router();
const {
    listAcompanhantes,
    approveAcompanhantes,
    rejectAcompanhantes,
    suspendAcompanhantes,
    updatePlan,
    updateExtraPlanForCompanion,
    deleteAcompanhante,
    getActivityLog,
    adminDeleteCompanionAndUser
} = require('../../controllers/admin/adminCompanionController');


router.get('/companion', listAcompanhantes);

// PERFIL DAS ACOMPANHANTES
router.post('/companion/:id/approve', approveAcompanhantes);

router.post('/companion/:id/reject', rejectAcompanhantes);

router.post('/companion/:id/suspend', suspendAcompanhantes);

router.delete('/companion/:id/delete', deleteAcompanhante);

router.put('/companion/:id/update-plan', updatePlan);
router.put('/companion/:id/update-extrasPlan', updateExtraPlanForCompanion);

router.get('/companion/:id/activity', getActivityLog);

router.delete('/companion/deletar/:id', adminDeleteCompanionAndUser);


module.exports = router;
