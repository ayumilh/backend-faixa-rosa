const express = require('express');
const {
    updateCompanion,
    addPhysicalCharacteristics,
    uploadCompanionMedia,
    updateCompanionContact,
    updateCompanionServicesAndPrices,
    updateWeeklySchedule,
    updateCompanionLocation,
    updateAttendedLocations,
    updateCompanionFinanceAndServices,
    updateUnavailableDates,
    listCompanions,
    deleteCompanion
} = require('../controllers/companionController');
const { updateCompanionVideo, uploadVideoMiddleware } = require("../controllers/uploadVideo");


const router = express.Router();

router.put('/update', updateCompanion);
router.post('/physical-characteristics', addPhysicalCharacteristics);
router.post('/upload-media', uploadCompanionMedia);
router.put('/update-contact', updateCompanionContact);
router.put('/update-services', updateCompanionServicesAndPrices);
router.put('/update-schedule', updateWeeklySchedule);
router.put('/unavailable-date', updateUnavailableDates);
router.put('/update-location', updateCompanionLocation);                               // atualizar localização da acompanhante
router.put("/attended-locations", updateAttendedLocations);                            // atualizar locais atendidos pela acompanhante
router.put('/update-finance', updateCompanionFinanceAndServices);
router.get('/list', listCompanions);
router.delete('/delete/:id', deleteCompanion);


router.post("/upload-comparison", uploadVideoMiddleware, updateCompanionVideo);

module.exports = router;
