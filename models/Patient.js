// models/Patient.js
// Extra profile info for a user whose role is "patient".
// IMPORTANT: This app does NOT store medical diagnoses and does NOT claim
// to diagnose or treat dementia. It only supports daily routine + cognitive
// activities. Keep it that way.

const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  // Link back to the User account (role: "patient")
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    min: 0,
  },
  // The caregiver responsible for this patient
  caregiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  preferredLanguage: {
    type: String,
    default: "English",
  },
  // A simple free-text summary of routine preferences (actual routine
  // items live in the Routine collection - this is just a note/settings field)
  routine: {
    type: String,
    default: "",
  },
  reminderSettings: {
    enabled: { type: Boolean, default: true },
    // how many minutes before scheduled time to remind
    leadTimeMinutes: { type: Number, default: 10 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Patient", patientSchema);
