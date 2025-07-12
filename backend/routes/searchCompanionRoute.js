import express from "express";
import {
  searchCompanionCity,
  searchCompanionProfile,
  listFeedPosts,
  listActiveStories
} from "../controllers/searchCompanionController.js";

const router = express.Router();

// Busca das acompanhantes por cidade
router.get("/companion", searchCompanionCity);
router.get("/profile", searchCompanionProfile);
router.get("/feed-posts", listFeedPosts);
router.get("/story", listActiveStories);

export default router;
