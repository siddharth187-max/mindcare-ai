// routes/patientRoutes.js
const express = require("express");
const router = express.Router();
const {
  createPatientProfile,
  linkCaregiver,
  getPatientProfile,
  getMyPatientProfile,
  updatePatientProfile,
} = require("../controllers/patientController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createPatientProfile);
router.post("/link-caregiver", protect, linkCaregiver);
router.get("/me", protect, getMyPatientProfile);
router.get("/:id", protect, getPatientProfile);
router.put("/:id", protect, updatePatientProfile);

module.exports = router;
