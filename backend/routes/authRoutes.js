const express = require('express');
const authController = require('../controllers/authController.js');
const { verificarUsername, verificarCpf, verificarEmail } = require('../controllers/utilsController.js');
const verifyToken = require('../utils/verifyToken.js');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/userId', verifyToken.userId);
router.post('/verify-cpf', verificarCpf);
router.post('/verify-username', verificarUsername);
router.post('/verify-email', verificarEmail);

module.exports = router;
