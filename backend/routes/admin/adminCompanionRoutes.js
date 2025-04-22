const express = require('express');
const router = express.Router();
const {
    listAcompanhantes,
    detalhesAcompanhante,
    approveAcompanhantes,
    rejectAcompanhantes,
    suspendAcompanhantes,
    updatePlan,
    updateExtraPlanForCompanion,
    deleteAcompanhante,
    getActivityLog,
    deleteCompanionAndUser
} = require('../../controllers/admin/adminCompanionController');


router.get('/companion', listAcompanhantes);

router.get('/companion/:id/detalhes', detalhesAcompanhante);


// PERFIL DAS ACOMPANHANTES
router.post('/companion/:id/approve', approveAcompanhantes);

router.post('/companion/:id/reject', rejectAcompanhantes);

router.post('/companion/:id/suspend', suspendAcompanhantes);

router.delete('/companion/:id/delete', deleteAcompanhante);

router.put('/companion/:id/update-plan', updatePlan);
router.put('/companion/:id/update-extrasPlan', updateExtraPlanForCompanion);

router.get('/companion/:id/activity', getActivityLog);

router.delete('/companion/deletar/:id', deleteCompanionAndUser);


module.exports = router;
