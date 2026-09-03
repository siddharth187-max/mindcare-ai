// utils/analyticsHelper.js
// Shared function that computes basic statistics from a patient's game
// results. Used by both the caregiver dashboard and the analytics API so
// the numbers are calculated the exact same way in both places.

const GameResult = require("../models/GameResult");
const Reminder = require("../models/Reminder");

/**
 * Builds a simple statistics summary for one patient.
 * @param {string} patientId
 */
async function buildPatientStats(patientId) {
  const allResults = await GameResult.find({ patientId }).sort({ completedAt: -1 });

  const gamesCompleted = allResults.length;

  // average accuracy / score (0 if no games played yet)
  const averageAccuracy =
    gamesCompleted > 0
      ? Math.round((allResults.reduce((sum, r) => sum + r.accuracy, 0) / gamesCompleted) * 10) / 10
      : 0;

  const averageScore =
    gamesCompleted > 0
      ? Math.round((allResults.reduce((sum, r) => sum + r.score, 0) / gamesCompleted) * 10) / 10
      : 0;

  // current difficulty = difficulty used in the most recent game (default "easy")
  const currentDifficulty = gamesCompleted > 0 ? allResults[0].difficulty : "easy";

  // recent performance = last 5 sessions, oldest to newest
  const recentPerformance = [...allResults]
    .slice(0, 5)
    .reverse()
    .map((r) => ({
      gameType: r.gameType,
      score: r.score,
      accuracy: r.accuracy,
      difficulty: r.difficulty,
      completedAt: r.completedAt,
    }));

  // weekly performance = games grouped by day for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const lastWeekResults = allResults.filter((r) => r.completedAt >= sevenDaysAgo);

  const weeklyPerformanceMap = {};
  lastWeekResults.forEach((r) => {
    const dayKey = r.completedAt.toISOString().split("T")[0]; // "YYYY-MM-DD"
    if (!weeklyPerformanceMap[dayKey]) {
      weeklyPerformanceMap[dayKey] = { date: dayKey, gamesPlayed: 0, totalAccuracy: 0 };
    }
    weeklyPerformanceMap[dayKey].gamesPlayed += 1;
    weeklyPerformanceMap[dayKey].totalAccuracy += r.accuracy;
  });

  const weeklyPerformance = Object.values(weeklyPerformanceMap)
    .map((day) => ({
      date: day.date,
      gamesPlayed: day.gamesPlayed,
      averageAccuracy: Math.round((day.totalAccuracy / day.gamesPlayed) * 10) / 10,
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  // reminder stats: how many missed vs completed overall
  const missedReminderCount = await Reminder.countDocuments({ patientId, status: "missed" });
  const completedReminderCount = await Reminder.countDocuments({ patientId, status: "completed" });

  return {
    gamesCompleted,
    averageAccuracy,
    averageScore,
    currentDifficulty,
    recentPerformance,
    weeklyPerformance,
    missedReminderCount,
    completedReminderCount,
  };
}

module.exports = { buildPatientStats };
