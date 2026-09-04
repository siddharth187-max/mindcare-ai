// routes/routineRoutes.js
const express = require("express");
const router = express.Router();
const {
  addRoutineItem,
  getTodayRoutine,
  updateRoutineItem,
  completeRoutineItem,
  uncompleteRoutineItem,
  resetRoutines,
  deleteRoutineItem,
} = require("../controllers/routineController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, addRoutineItem);
router.get("/today/:patientId", protect, getTodayRoutine);
router.post("/reset/:patientId", protect, resetRoutines);
router.put("/:id", protect, updateRoutineItem);
router.patch("/:id/complete", protect, completeRoutineItem);
router.patch("/:id/uncomplete", protect, uncompleteRoutineItem);
router.delete("/:id", protect, deleteRoutineItem);

module.exports = router;
