const express = require('express');
const router = express.Router();
const { uploadDocuments } = require("../config/wasabi");
const userController = require('../controllers/userController.js');
const documentController = require('../controllers/documentController');
const getUser = require('../utils/getUser.js');

// router.get('/', userController.getAllUsers);
// router.get('/:id', userController.getUserById);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);

//Informações Usuario Get
router.get('/info', getUser.getUserIdBd);


// documentRoutes.js
router.post("/documents/upload", uploadDocuments, documentController.uploadDocument);

module.exports = router;