// controllers/gameController.js
// Recording cognitive game sessions + the adaptive difficulty recommendation.

const GameResult = require("../models/GameResult");
const Patient = require("../models/Patient");
const { getNextDifficulty } = require("../utils/adaptiveDifficulty");

// Helper: confirm the logged-in user is allowed to act on this patientId
// (must be the patient themself or their assigned caregiver)
async function assertAccessToPatient(patientId, user) {
  const patient = await Patient.findById(patientId);
  if (!patient) return { ok: false, status: 404, message: "Patient not found" };

  const isOwner = patient.userId.toString() === user._id.toString();
  const isCaregiver = patient.caregiverId.toString() === user._id.toString();
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

    // Also tell the frontend what difficulty to use NEXT, so it can be
    // used immediately without a second API call if desired.
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

    const history = await GameResult.find({ patientId: req.params.patientId }).sort({ completedAt: -1 });

    res.status(200).json({ count: history.length, history });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching game history", error: error.message });
  }
};

// @route  POST /api/games/next-difficulty
// @desc   Given the latest performance, return the recommended next difficulty
//         (does NOT save anything - just runs the algorithm)
// @access Private
const getRecommendedDifficulty = async (req, res) => {
  try {
    const { currentDifficulty, accuracy } = req.body;

    if (!currentDifficulty || accuracy == null) {
      return res.status(400).json({ message: "currentDifficulty and accuracy are required" });
    }

    const recommendedNextDifficulty = getNextDifficulty(currentDifficulty, accuracy);
    res.status(200).json({ currentDifficulty, accuracy, recommendedNextDifficulty });
  } catch (error) {
    res.status(500).json({ message: "Server error calculating difficulty", error: error.message });
  }
};

module.exports = { recordGameResult, getGameHistory, getRecommendedDifficulty };
