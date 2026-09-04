// controllers/gameController.js
// Recording cognitive game sessions + the adaptive difficulty recommendation.

const GameResult = require("../models/GameResult");
const Patient = require("../models/Patient");
const { getNextDifficulty } = require("../utils/adaptiveDifficulty");
const { recordPatientActivity } = require("../utils/streakHelper");

// Helper: confirm the logged-in user is allowed to act on this patientId
async function assertAccessToPatient(patientId, user) {
  const patient = await Patient.findById(patientId);
  if (!patient) return { ok: false, status: 404, message: "Patient not found" };

  const isOwner = patient.userId && patient.userId.toString() === user._id.toString();
  const isCaregiver = patient.caregiverId && patient.caregiverId.toString() === user._id.toString();
  if (!isOwner && !isCaregiver) {
    return { ok: false, status: 403, message: "Not authorized for this patient" };
  }
  return { ok: true, patient };
}

// @route  POST /api/games/result
// @desc   Save the result of a completed game session
// @access Private
const recordGameResult = async (req, res) => {
  try {
    const { patientId, gameType, score, accuracy, difficulty, timeTaken } = req.body;

    if (!patientId || !gameType || score == null || accuracy == null || !difficulty || timeTaken == null) {
      return res.status(400).json({
        message: "patientId, gameType, score, accuracy, difficulty and timeTaken are all required",
      });
    }

    const access = await assertAccessToPatient(patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const result = await GameResult.create({
      patientId,
      gameType,
      score,
      accuracy,
      difficulty,
      timeTaken,
    });

    // Record streak activity for playing cognitive brain activities
    await recordPatientActivity(patientId);

    const recommendedNextDifficulty = getNextDifficulty(difficulty, accuracy);

    res.status(201).json({
      message: "Game result saved",
      result,
      recommendedNextDifficulty,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error saving game result", error: error.message });
  }
};

// @route  GET /api/games/history/:patientId
// @desc   Get a patient's full game history (most recent first)
// @access Private
const getGameHistory = async (req, res) => {
  try {
    const access = await assertAccessToPatient(req.params.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const results = await GameResult.find({ patientId: req.params.patientId }).sort({ completedAt: -1 });

    res.status(200).json({ count: results.length, results });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching game history", error: error.message });
  }
};

// @route  POST /api/games/next-difficulty
// @desc   Determine the next difficulty level for a game type based on recent performance
// @access Private
const getRecommendedDifficulty = async (req, res) => {
  try {
    const { patientId, gameType } = req.body;

    if (!patientId || !gameType) {
      return res.status(400).json({ message: "patientId and gameType are required" });
    }

    const access = await assertAccessToPatient(patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const lastResult = await GameResult.findOne({ patientId, gameType }).sort({ completedAt: -1 });

    if (!lastResult) {
      return res.status(200).json({ recommendedDifficulty: "easy" });
    }

    const recommendedDifficulty = getNextDifficulty(lastResult.difficulty, lastResult.accuracy);
    res.status(200).json({ recommendedDifficulty, lastResult });
  } catch (error) {
    res.status(500).json({ message: "Server error determining difficulty", error: error.message });
  }
};

module.exports = {
  recordGameResult,
  getGameHistory,
  getRecommendedDifficulty,
};
