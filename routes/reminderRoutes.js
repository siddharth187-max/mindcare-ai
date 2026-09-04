// routes/reminderRoutes.js
const express = require("express");
const router = express.Router();
const {
  createReminder,
  getAllReminders,
  getPendingReminders,
  getEscalatedReminders,
  getMissedReminders,
  recordPrompt,
  completeReminder,
  acknowledgeCaregiver,
  resendPrompt,
  deleteReminder,
} = require("../controllers/reminderController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createReminder);
router.get("/patient/:patientId", protect, getAllReminders);
router.get("/pending/:patientId", protect, getPendingReminders);
router.get("/escalated/:patientId", protect, getEscalatedReminders);
router.get("/missed/:patientId", protect, getMissedReminders);
router.patch("/:id/prompt", protect, recordPrompt);
router.patch("/:id/complete", protect, completeReminder);
router.patch("/:id/acknowledge-caregiver", protect, acknowledgeCaregiver);
router.patch("/:id/resend-prompt", protect, resendPrompt);
router.delete("/:id", protect, deleteReminder);

module.exports = router;
