// routes/caregiverRoutes.js
const express = require("express");
const router = express.Router();
const { getMyPatients, getPatientDashboard } = require("../controllers/caregiverController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Every route here requires: logged in AND role === "caregiver"
router.get("/patients", protect, authorizeRoles("caregiver"), getMyPatients);
router.get("/dashboard/:patientId", protect, authorizeRoles("caregiver"), getPatientDashboard);

module.exports = router;
