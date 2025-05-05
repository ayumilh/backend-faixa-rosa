const express = require("express");
const router = express.Router();
const { searchCompanionCity, searchCompanionProfile, listFeedPosts, listActiveStories } = require("../controllers/searchCompanionController.js");

// busca das acompanhantes por cidade
router.get("/companion", searchCompanionCity);

router.get("/profile", searchCompanionProfile);

router.get("/feed-posts", listFeedPosts);

router.get("/story", listActiveStories);

module.exports = router;
