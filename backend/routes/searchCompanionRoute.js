const express = require("express");
const router = express.Router();
const { searchCompanionCity, searchCompanionProfile } = require("../controllers/searchCompanionController.js");

// busca das acompanhantes por cidade
router.get("/companion-city", searchCompanionCity);

router.get("/profile", searchCompanionProfile);

module.exports = router;
