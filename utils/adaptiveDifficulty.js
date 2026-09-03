// utils/adaptiveDifficulty.js
//
// SIMPLE ADAPTIVE DIFFICULTY ALGORITHM
// ------------------------------------
// Given the difficulty the patient JUST played at, and their accuracy (%)
// on that session, decide what difficulty they should play next.
//
// Rules (as per spec):
//   accuracy >= 80        -> go one level UP   (easy -> medium -> hard)
//   accuracy 50 to 79     -> STAY on the same level
//   accuracy < 50         -> go one level DOWN (hard -> medium -> easy)
//
// Difficulty can never go above "hard" or below "easy".

const LEVELS = ["easy", "medium", "hard"];

/**
 * @param {string} currentDifficulty - "easy" | "medium" | "hard"
 * @param {number} accuracy - 0-100
 * @returns {string} the recommended next difficulty
 */
function getNextDifficulty(currentDifficulty, accuracy) {
  const currentIndex = LEVELS.indexOf(currentDifficulty);

  // Fallback: if something unexpected was passed in, default to "easy"
  if (currentIndex === -1) return "easy";

  let nextIndex = currentIndex;

  if (accuracy >= 80) {
    // Doing great -> increase difficulty (but don't go past "hard")
    nextIndex = Math.min(currentIndex + 1, LEVELS.length - 1);
  } else if (accuracy < 50) {
    // Struggling -> decrease difficulty (but don't go below "easy")
    nextIndex = Math.max(currentIndex - 1, 0);
  }
  // else: accuracy is 50-79 -> keep the same level (nextIndex unchanged)

  return LEVELS[nextIndex];
}

module.exports = { getNextDifficulty, LEVELS };
