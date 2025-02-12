const express = require('express');
const {
    updateCompanion,
    updateCompanionDescriptionProfile,
    getCompanionDescriptionProfile,
    updateCompanionContact,
    getCompanionContact,
    updateCompanionServicesAndPrices,
    getCompanionServicesAndPrices,
    updateWeeklySchedule,
    getWeeklySchedule,
    updateLocationManagement,
    getLocationManagement,
    updateUnavailableDates,
    getUnavailableDates,
    updateCompanionFinanceAndServices,
    getCompanionFinanceAndServices,
    listCompanions,
    deleteCompanion
} = require('../controllers/companionController');
const { uploadSingleVideo } = require("../config/wasabi");

const router = express.Router();

router.get('/list', listCompanions);
router.delete('/delete/:id', deleteCompanion);

router.put('/update', updateCompanion);

router.post('/description/update', uploadSingleVideo, updateCompanionDescriptionProfile);
router.get('/description/list', uploadSingleVideo, getCompanionDescriptionProfile);


router.put('/contact/update', updateCompanionContact);
router.get('/contact/list', getCompanionContact);


router.put('/services/update', updateCompanionServicesAndPrices);
router.get('/services/list', getCompanionServicesAndPrices);


router.put('/schedule/update', updateWeeklySchedule);
router.get('/schedule/list', getWeeklySchedule );


router.put('/unavailable-date/update', updateUnavailableDates);
router.get('/unavailable-date/list', getUnavailableDates);


router.put("/locations/update", updateLocationManagement);            
router.get("/locations/list", getLocationManagement);   


router.put('/finance/update', updateCompanionFinanceAndServices);
router.get('/finance/list', getCompanionFinanceAndServices);

module.exports = router;
