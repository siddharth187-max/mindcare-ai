// models/GameResult.js
// Stores the result of one cognitive game session played by a patient.

const mongoose = require("mongoose");

const gameResultSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  gameType: {
    type: String,
    enum: ["memory", "pattern", "objectRecognition", "routineSequence"],
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  // accuracy is a percentage, 0-100
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true,
  },
  // time taken to complete the session, in seconds
  timeTaken: {
    type: Number,
    required: true,
    min: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("GameResult", gameResultSchema);
