// routes/geofenceRoutes.js
const express = require("express");
const router = express.Router();
const {
  getGeofenceStatus,
  updateSafeZone,
  pingLocation,
  triggerLostSOS
} = require("../controllers/geofenceController");
const { protect } = require("../middleware/authMiddleware");

router.get("/:patientId", protect, getGeofenceStatus);
router.post("/update-zone", protect, updateSafeZone);
router.post("/ping-location", protect, pingLocation);
router.post("/trigger-sos", protect, triggerLostSOS);

module.exports = router;
