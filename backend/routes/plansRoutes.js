const express = require('express');
const router = express.Router();
const { listPlans, subscribeToPlan } = require('../controllers/planController');
// const { authenticate } = require('../middleware/authMiddleware');

router.get('/listPlans', listPlans);
router.post('/subscribe', subscribeToPlan);

module.exports = router;