// routes/memoryRoutes.js
const express = require("express");
const router = express.Router();
const {
  getMemories,
  createMemory,
  deleteMemory,
  getMemoryQuiz
} = require("../controllers/memoryController");
const { protect } = require("../middleware/authMiddleware");

router.get("/quiz/:patientId", protect, getMemoryQuiz);
router.get("/:patientId", protect, getMemories);
router.post("/", protect, createMemory);
router.delete("/:id", protect, deleteMemory);

module.exports = router;
