// routes/reminderRoutes.js
const express = require("express");
const router = express.Router();
const {
  createReminder,
  getAllReminders,
  getPendingReminders,
  getMissedReminders,
  completeReminder,
  deleteReminder,
} = require("../controllers/reminderController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createReminder);
router.get("/patient/:patientId", protect, getAllReminders);
router.get("/pending/:patientId", protect, getPendingReminders);
router.get("/missed/:patientId", protect, getMissedReminders);
router.patch("/:id/complete", protect, completeReminder);
router.delete("/:id", protect, deleteReminder);

module.exports = router;
