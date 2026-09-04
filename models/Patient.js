// models/Patient.js
// Extra profile info for a user whose role is "patient".

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
  emergencyPhone: {
    type: String,
    default: "112",
  },
  caregiverPhone: {
    type: String,
    default: "+91 98765 43210",
  },
  emergencyAddress: {
    type: String,
    default: "442 Maplewood Enclave, Block B, New Delhi, India",
  },
  preferredLanguage: {
    type: String,
    default: "English",
  },
  routine: {
    type: String,
    default: "",
  },
  reminderSettings: {
    enabled: { type: Boolean, default: true },
    leadTimeMinutes: { type: Number, default: 10 },
  },
  // Daily Streak & Inactivity Tracking
  currentStreak: {
    type: Number,
    default: 1,
  },
  longestStreak: {
    type: Number,
    default: 1,
  },
  lastActiveDate: {
    type: String,
    default: "", // "YYYY-MM-DD"
  },
  lastResetDate: {
    type: String,
    default: "", // "YYYY-MM-DD"
  },
  missedDaysAlert: {
    type: Boolean,
    default: false,
  },
  lastMissedDate: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Patient", patientSchema);
