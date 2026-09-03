// routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const { getPatientAnalytics } = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

router.get("/:patientId", protect, getPatientAnalytics);

module.exports = router;
