// utils/generateToken.js
// Small helper so we don't repeat JWT-signing code in multiple places.

const jwt = require("jsonwebtoken");

/**
 * Creates a signed JWT containing the user's id and role.
 * @param {string} userId - MongoDB _id of the user
 * @param {string} role - "patient" or "caregiver"
 * @returns {string} signed JWT
 */
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
