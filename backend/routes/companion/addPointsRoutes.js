const express = require("express");
const router = express.Router();
const { addPoints } = require("../../controllers/companion/addPointsController.js");

router.post("/add-points", addPoints);

module.exports = router;
