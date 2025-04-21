const express = require('express');
const router = express.Router();
const { registerConsent } = require('../controllers/consentController');

router.post('/save', registerConsent);

module.exports = router;
