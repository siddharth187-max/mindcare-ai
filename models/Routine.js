// models/Routine.js
// One item in a patient's daily routine, e.g. "Brush teeth at 8:00 AM".

const mongoose = require("mongoose");

const routineSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  // Stored as a simple "HH:mm" 24-hour string, e.g. "08:00"
  scheduledTime: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["hygiene", "meal", "medicine", "cognitive", "exercise", "sleep", "other"],
    default: "other",
  },
  completed: {
    type: Boolean,
    default: false,
  },
  reminderEnabled: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Routine", routineSchema);
