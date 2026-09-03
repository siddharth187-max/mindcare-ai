// routes/patientRoutes.js
const express = require("express");
const router = express.Router();
const {
  createPatientProfile,
  getPatientProfile,
  getMyPatientProfile,
  updatePatientProfile,
} = require("../controllers/patientController");
const { protect } = require("../middleware/authMiddleware");

// All patient routes require login
router.post("/", protect, createPatientProfile);
router.get("/me", protect, getMyPatientProfile);
router.get("/:id", protect, getPatientProfile);
router.put("/:id", protect, updatePatientProfile);

module.exports = router;
