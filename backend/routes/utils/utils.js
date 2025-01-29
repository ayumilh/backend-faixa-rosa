const express = require('express');
const verifyToken = require('../../utils/verifyToken.js');
const cpfController = require('../../controllers/utils/cpfController.js');
const router = express.Router();

router.post('/userId', verifyToken.userId);
router.get('/verify-cpf/:cpf', cpfController.verificarCPF);


module.exports = router;
