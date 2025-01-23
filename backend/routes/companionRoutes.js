const express = require('express');
const router = express.Router();
const { addCompanionInfo } = require('../controllers/companionController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/addInfo', authenticate, addCompanionInfo);

module.exports = router;
