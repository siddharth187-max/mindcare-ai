// models/Reminder.js
// A simple reminder record. Kept separate from Routine so that reminders
// can be tracked/queried on their own (pending vs missed vs completed),
// without building a full notification service yet.

const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  // Optional link back to the routine item this reminder is for
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
});

module.exports = mongoose.model("Reminder", reminderSchema);
