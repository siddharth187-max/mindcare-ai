// models/Reminder.js
// A reminder record with multi-stage audio/visual escalation telemetry.

const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  routineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Routine",
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  scheduledTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "missed"],
    default: "pending",
  },
  completedAt: {
    type: Date,
  },
  // Multi-prompt escalation tracking (3 prompts before caregiver escalation)
  promptCount: {
    type: Number,
    default: 0,
  },
  lastPromptAt: {
    type: Date,
  },
  escalatedToCaregiver: {
    type: Boolean,
    default: false,
  },
  escalatedAt: {
    type: Date,
  },
  caregiverAcknowledged: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Reminder", reminderSchema);
