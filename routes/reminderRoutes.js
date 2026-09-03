// routes/reminderRoutes.js
const express = require("express");
const router = express.Router();
const {
  createReminder,
  getPendingReminders,
  getMissedReminders,
  completeReminder,
} = require("../controllers/reminderController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createReminder);
router.get("/pending/:patientId", protect, getPendingReminders);
router.get("/missed/:patientId", protect, getMissedReminders);
router.patch("/:id/complete", protect, completeReminder);

module.exports = router;
