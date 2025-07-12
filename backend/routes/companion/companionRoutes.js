import express from 'express';
import {
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
  deleteCompanion,
} from '../../controllers/companion/companionController.js';

import { uploadSingleVideo, uploadProfileAndBannerMiddleware } from '../../config/wasabi.js';

const router = express.Router();

router.get('/', listCompanions);
router.delete('/delete/:id', deleteCompanion);

router.put('/update', updateCompanion);

router.post('/profile-banner/update', uploadProfileAndBannerMiddleware, updateProfileAndBanner);
router.get('/profile-banner/', uploadProfileAndBannerMiddleware, getCompanionMedia);

router.post('/description/update', uploadSingleVideo, updateCompanionDescriptionProfile);
router.get('/description/', uploadSingleVideo, getCompanionDescriptionProfile);

router.put('/contact/update', updateCompanionContact);
router.get('/contact/', getCompanionContact);

router.put('/services/update', updateCompanionServicesAndPrices);
router.get('/services/', getCompanionServicesAndPrices);

router.put('/schedule/update', updateWeeklySchedule);
router.get('/schedule/', getWeeklySchedule);

router.put('/unavailable-date/update', updateUnavailableDates);
router.get('/unavailable-date/', getUnavailableDates);

router.put('/locations/update', updateLocationManagement);
router.get('/locations/', getLocationManagement);

router.put('/finance/update', updateCompanionFinanceAndServices);
router.get('/finance/', getCompanionFinanceAndServices);

export default router;
