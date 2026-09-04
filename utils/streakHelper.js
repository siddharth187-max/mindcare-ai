// utils/streakHelper.js
// Handles automatic routine reset on new calendar days and patient streak tracking.

const Routine = require("../models/Routine");
const Patient = require("../models/Patient");

function getLocalDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a new day has arrived. If so, automatically resets all routines
 * to pending and detects if any days were missed.
 */
async function checkAndResetDailyRoutines(patientId) {
  try {
    const patient = await Patient.findById(patientId);
    if (!patient) return null;

    const todayStr = getLocalDateString(0);
    const yesterdayStr = getLocalDateString(-1);

    // If new day arrived (or first initialization)
    if (patient.lastResetDate !== todayStr) {
      // 1. Reset all routines to not completed
      await Routine.updateMany(
        { patientId },
        { $set: { completed: false, completedAt: null } }
      );

      // 2. Check if patient missed yesterday (inactive streak break)
      if (patient.lastActiveDate && patient.lastActiveDate !== yesterdayStr && patient.lastActiveDate !== todayStr) {
        patient.missedDaysAlert = true;
        patient.lastMissedDate = yesterdayStr;
        patient.currentStreak = 0; // streak broken
      }

      patient.lastResetDate = todayStr;
      await patient.save();
    }

    return patient;
  } catch (error) {
    console.error("Error in checkAndResetDailyRoutines:", error);
    return null;
  }
}

/**
 * Called whenever a patient completes an activity (routine, game, reminder).
 * Updates their streak and clears missed day alerts.
 */
async function recordPatientActivity(patientId) {
  try {
    const patient = await Patient.findById(patientId);
    if (!patient) return null;

    const todayStr = getLocalDateString(0);
    const yesterdayStr = getLocalDateString(-1);

    // If already active today, no need to increment streak again today
    if (patient.lastActiveDate !== todayStr) {
      if (patient.lastActiveDate === yesterdayStr) {
        // Consecutive day! Increment streak
        patient.currentStreak = (patient.currentStreak || 0) + 1;
      } else {
        // Starting a new streak
        patient.currentStreak = 1;
      }

      if (patient.currentStreak > (patient.longestStreak || 0)) {
        patient.longestStreak = patient.currentStreak;
      }

      patient.lastActiveDate = todayStr;
      patient.missedDaysAlert = false; // resolved
      await patient.save();
    }

    return patient;
  } catch (error) {
    console.error("Error in recordPatientActivity:", error);
    return null;
  }
}

module.exports = {
  getLocalDateString,
  checkAndResetDailyRoutines,
  recordPatientActivity,
};
