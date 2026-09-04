// controllers/caregiverController.js
// Everything a caregiver needs to see about ONE assigned patient, in one
// combined dashboard call, plus a helper to list all their patients.

const Patient = require("../models/Patient");
const Routine = require("../models/Routine");
const Reminder = require("../models/Reminder");
const GameResult = require("../models/GameResult");
const { buildPatientStats } = require("../utils/analyticsHelper");

// @route  GET /api/caregiver/patients
// @desc   List every patient assigned to the logged-in caregiver
// @access Private (caregiver only)
const getMyPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ caregiverId: req.user._id });
    res.status(200).json({ count: patients.length, patients });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching patients", error: error.message });
  }
};

// @route  GET /api/caregiver/dashboard/:patientId
// @desc   Full dashboard for one assigned patient: profile, today's routine,
//         completed/missed activities, live activity stream, game history, stats.
// @access Private (caregiver only, and only for THEIR patient)
const getPatientDashboard = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Security check: this caregiver must be the one assigned to this patient
    if (patient.caregiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not the assigned caregiver for this patient" });
    }

    const routines = await Routine.find({ patientId }).sort({ scheduledTime: 1 });
    const completedActivities = routines.filter((r) => r.completed);
    const incompleteActivities = routines.filter((r) => !r.completed);

    const activeReminders = await Reminder.find({ patientId, status: "pending" }).sort({ scheduledTime: 1 });
    const missedReminders = await Reminder.find({ patientId, status: "missed" }).sort({ scheduledTime: -1 });
    const completedReminders = await Reminder.find({ patientId, status: "completed" }).sort({ completedAt: -1 }).limit(10);
    const allReminders = await Reminder.find({ patientId }).sort({ scheduledTime: -1 }).limit(20);

    const recentGames = await GameResult.find({ patientId }).sort({ completedAt: -1 }).limit(10);
    const stats = await buildPatientStats(patientId);

    // Live Patient Activity Stream (Notifications of the patient working)
    const activityFeed = [];

    // 1. Completed routines
    completedActivities.forEach((r) => {
      activityFeed.push({
        id: "routine-" + r._id,
        type: "routine",
        title: `Completed Routine: "${r.title}"`,
        detail: `Category: ${r.category.toUpperCase()} • Time: ${r.scheduledTime}`,
        icon: "📋",
        timestamp: r.completedAt || r.createdAt || new Date(),
        badge: "Routine Checked",
        badgeColor: "emerald",
      });
    });

    // 2. Completed / acknowledged reminders
    completedReminders.forEach((rem) => {
      activityFeed.push({
        id: "reminder-" + rem._id,
        type: "reminder",
        title: `Acknowledged Reminder: "${rem.title}"`,
        detail: `Scheduled for: ${new Date(rem.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        icon: "🔔",
        timestamp: rem.completedAt || rem.scheduledTime,
        badge: "Reminder Done",
        badgeColor: "blue",
      });
    });

    // 3. Cognitive game sessions played
    const gameTypeLabels = {
      memory: "Memory Card Match",
      pattern: "Melody & Pattern Chimes",
      objectRecognition: "Everyday Object Quiz",
      routineSequence: "Daily Steps Sequencer",
    };

    recentGames.forEach((g) => {
      activityFeed.push({
        id: "game-" + g._id,
        type: "game",
        title: `Played Cognitive Game: ${gameTypeLabels[g.gameType] || g.gameType}`,
        detail: `Score: ${g.score} • Accuracy: ${g.accuracy}% • Difficulty: ${g.difficulty.toUpperCase()} (${g.timeTaken}s)`,
        icon: "🧠",
        timestamp: g.completedAt,
        badge: `${g.accuracy}% Accuracy`,
        badgeColor: "purple",
      });
    });

    // Sort newest activity first
    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      patient,
      todaysRoutine: routines,
      completedActivities,
      incompleteActivities,
      missedReminders,
      activeReminders,
      allReminders,
      recentActivity: activityFeed.slice(0, 15),
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error building dashboard", error: error.message });
  }
};

module.exports = { getMyPatients, getPatientDashboard };
