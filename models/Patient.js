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
  // The caregiver responsible for this patient (can be linked post-registration)
  caregiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // 6-character easy code to pair patient with caregiver (e.g. MC-4891)
  pairCode: {
    type: String,
    default: function () {
      return "MC-" + Math.floor(1000 + Math.random() * 9000);
    },
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
  // Geofencing & Wandering Safety Radar
  safeZone: {
    center: {
      lat: { type: Number, default: 28.6139 }, // Default New Delhi coordinates
      lng: { type: Number, default: 77.2090 },
    },
    radiusMeters: { type: Number, default: 500 }, // Safe zone radius
    address: { type: String, default: "442 Maplewood Enclave, Block B, New Delhi, India" },
  },
  lastKnownLocation: {
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.2090 },
    timestamp: { type: Date, default: Date.now },
    isSafe: { type: Boolean, default: true },
    distanceFromCenter: { type: Number, default: 0 },
    batteryLevel: { type: Number, default: 92 },
  },
  wanderingAlerts: [
    {
      timestamp: { type: Date, default: Date.now },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      distanceMeters: { type: Number, default: 0 },
      status: { type: String, default: "BREACHED" }, // "BREACHED" | "SOS_TRIGGERED" | "RESOLVED"
      triggeredBy: { type: String, default: "GEOFENCE_RADAR" }, // "GEOFENCE_RADAR" | "PATIENT_SOS"
      note: { type: String, default: "Patient exited designated 500m safe zone perimeter." },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Patient", patientSchema);
