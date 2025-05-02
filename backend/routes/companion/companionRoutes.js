const express = require('express');
const {
    updateCompanion,
    updateCompanionDescriptionProfile,
    updateProfileAndBanner,
    getCompanionMedia,
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
} = require('../../controllers/companion/companionController.js');
const { uploadSingleVideo, uploadProfileAndBanner } = require("../../config/wasabi.js");

const router = express.Router();

router.get('/', listCompanions);
router.delete('/delete/:id', deleteCompanion);

router.put('/update', updateCompanion);

router.post("/profile-banner/update", uploadProfileAndBanner, updateProfileAndBanner );
router.get("/profile-banner/", uploadProfileAndBanner, getCompanionMedia );


router.post("/description/update", uploadSingleVideo, updateCompanionDescriptionProfile);
router.get('/description/', uploadSingleVideo, getCompanionDescriptionProfile);


router.put('/contact/update', updateCompanionContact);
router.get('/contact/', getCompanionContact);


router.put('/services/update', updateCompanionServicesAndPrices);
router.get('/services/', getCompanionServicesAndPrices);


router.put('/schedule/update', updateWeeklySchedule);
router.get('/schedule/', getWeeklySchedule );


router.put('/unavailable-date/update', updateUnavailableDates);
router.get('/unavailable-date/', getUnavailableDates);


router.put("/locations/update", updateLocationManagement);            
router.get("/locations/", getLocationManagement);   


router.put('/finance/update', updateCompanionFinanceAndServices);
router.get('/finance/', getCompanionFinanceAndServices);



module.exports = router;
