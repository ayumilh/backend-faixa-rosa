const express = require('express');
const {
    updateCompanion,
    addPhysicalCharacteristics,
    uploadCompanionMedia,
    updateCompanionContact,
    updateCompanionServices,
    updateCompanionSchedule,
    updateCompanionLocation,
    updateCompanionFinanceAndServices,
    listCompanions,
    deleteCompanion
} = require('../controllers/companionController');

const router = express.Router();

router.put('/update', updateCompanion);
router.post('/physical-characteristics', addPhysicalCharacteristics);
router.post('/upload-media', uploadCompanionMedia);
router.put('/update-contact', updateCompanionContact);
router.put('/update-services', updateCompanionServices);
router.put('/update-schedule', updateCompanionSchedule);
router.put('/update-location', updateCompanionLocation);
router.put('/update-finance', updateCompanionFinanceAndServices);
router.get('/list', listCompanions);
router.delete('/delete/:id', deleteCompanion);

module.exports = router;
