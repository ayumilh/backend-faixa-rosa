const express = require('express');
const userController = require('../controllers/userController.js');
const getUser = require('../utils/getUser.js');

const router = express.Router();

// router.get('/', userController.getAllUsers);
// router.get('/:id', userController.getUserById);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);

//Informações Usuario Get
router.get('/info', getUser.getUserIdBd);


module.exports = router;