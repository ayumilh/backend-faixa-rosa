const express = require("express");
const router = express.Router();
const { searchCompanionCity } = require("../controllers/searchCompanionController.js");

// busca das acompanhantes por cidade
router.get("/companion-city", searchCompanionCity);

module.exports = router;
