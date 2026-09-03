// routes/gameRoutes.js
const express = require("express");
const router = express.Router();
const {
  recordGameResult,
  getGameHistory,
  getRecommendedDifficulty,
} = require("../controllers/gameController");
const { protect } = require("../middleware/authMiddleware");

router.post("/result", protect, recordGameResult);
router.get("/history/:patientId", protect, getGameHistory);
router.post("/next-difficulty", protect, getRecommendedDifficulty);

module.exports = router;
