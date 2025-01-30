const express = require('express');
const authController = require('../controllers/authController.js');
const cpfController = require('../controllers/utils/cpfController.js');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/verify-cpf', cpfController.verificarCPF);

module.exports = router;
