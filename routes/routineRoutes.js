// routes/routineRoutes.js
const express = require("express");
const router = express.Router();
const {
  addRoutineItem,
  getTodayRoutine,
  updateRoutineItem,
  completeRoutineItem,
  deleteRoutineItem,
} = require("../controllers/routineController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, addRoutineItem);
router.get("/today/:patientId", protect, getTodayRoutine);
router.put("/:id", protect, updateRoutineItem);
router.patch("/:id/complete", protect, completeRoutineItem);
router.delete("/:id", protect, deleteRoutineItem);

module.exports = router;
