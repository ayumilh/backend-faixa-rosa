const express = require("express");
const router = express.Router();
const adminStoryController = require("../../controllers/admin/adminStoryController");

// Listar todos os stories (ativos e expirados)**
router.get("/stories", adminStoryController.listAllStories);

// Listar apenas stories ativos**
router.get("/stories/active", adminStoryController.listActiveStories);

// Excluir um story específico**
router.delete("/stories/:id/delete", adminStoryController.deleteStoryAdmin);

// Limpar stories expirados**
router.delete("/stories/expired/clean", adminStoryController.cleanExpiredStories);

module.exports = router;
