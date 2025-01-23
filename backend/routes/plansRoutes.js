const express = require('express');
const router = express.Router();
const { listPlans, subscribeToPlan, finalizePlan } = require('../controllers/planController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/listPlans', listPlans);
router.post('/subscribe', authenticate, subscribeToPlan);
router.post('/finalize', authenticate, finalizePlan);

module.exports = router;