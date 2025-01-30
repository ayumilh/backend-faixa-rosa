const express = require('express');
const {
    updateCompanion,
    addPhysicalCharacteristics,
    uploadCompanionMedia,
    updateCompanionContact,
    updateCompanionServicesAndPrices,
    updateCompanionSchedule,
    updateCompanionLocation,
    updateAttendedLocations,
    updateCompanionFinanceAndServices,
    listCompanions,
    deleteCompanion
} = require('../controllers/companionController');

const router = express.Router();

router.put('/update', updateCompanion);
router.post('/physical-characteristics', addPhysicalCharacteristics);
router.post('/upload-media', uploadCompanionMedia);
router.put('/update-contact', updateCompanionContact);
router.put('/update-services', updateCompanionServicesAndPrices);
router.put('/update-schedule', updateCompanionSchedule);
router.put('/update-location', updateCompanionLocation);                               // atualizar localização da acompanhante
router.put("/attended-locations", updateAttendedLocations);                            // atualizar locais atendidos pela acompanhante
router.put('/update-finance', updateCompanionFinanceAndServices);
router.get('/list', listCompanions);
router.delete('/delete/:id', deleteCompanion);

module.exports = router;
