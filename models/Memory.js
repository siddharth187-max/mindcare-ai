// models/Memory.js
// Stores digital reminiscence photos, stories, and voice reassurance scripts.

const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema({
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
  imageUrl: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    default: "",
  },
  relationship: {
    type: String,
    default: "Family", // e.g., "Grandson", "Spouse", "Pet", "Vacation", "Home"
  },
  year: {
    type: String,
    default: "", // e.g. "1998", "2015"
  },
  audioPrompt: {
    type: String,
    default: "", // Voice script read aloud to comfort patient
  },
  tags: {
    type: [String],
    default: ["Family"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Memory", memorySchema);
