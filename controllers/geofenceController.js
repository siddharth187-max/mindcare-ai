// controllers/geofenceController.js
// Handles Safe-Zone GPS monitoring, Wandering Radar telemetry, and Patient SOS dispatch.

const Patient = require("../models/Patient");

// Calculate Haversine distance in meters between two GPS coordinates
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// @route  GET /api/geofence/:patientId
// @desc   Get safe zone parameters, live location telemetry, and breach incident history
// @access Private
const getGeofenceStatus = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Default safe zone coordinates if not set
    const safeZone = patient.safeZone || {
      center: { lat: 28.6139, lng: 77.2090 },
      radiusMeters: 500,
      address: "442 Maplewood Enclave, Block B, New Delhi, India"
    };

    const lastKnownLocation = patient.lastKnownLocation || {
      lat: safeZone.center.lat,
      lng: safeZone.center.lng,
      timestamp: new Date(),
      isSafe: true,
      distanceFromCenter: 0,
      batteryLevel: 92
    };

    const wanderingAlerts = patient.wanderingAlerts || [];

    res.status(200).json({
      patientId: patient._id,
      patientName: patient.name,
      caregiverPhone: patient.caregiverPhone,
      safeZone,
      lastKnownLocation,
      wanderingAlerts: wanderingAlerts.slice(-15).reverse() // 15 most recent
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch geofence status", error: error.message });
  }
};

// @route  POST /api/geofence/update-zone
// @desc   Caregiver updates safe zone radius, address, and coordinates
// @access Private
const updateSafeZone = async (req, res) => {
  try {
    const { patientId, lat, lng, radiusMeters, address } = req.body;
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    patient.safeZone = {
      center: {
        lat: lat ? parseFloat(lat) : (patient.safeZone?.center?.lat || 28.6139),
        lng: lng ? parseFloat(lng) : (patient.safeZone?.center?.lng || 77.2090),
      },
      radiusMeters: radiusMeters ? parseInt(radiusMeters, 10) : (patient.safeZone?.radiusMeters || 500),
      address: address ? address.trim() : (patient.safeZone?.address || "442 Maplewood Enclave, New Delhi"),
    };

    await patient.save();

    res.status(200).json({
      message: "Safe Zone perimeter successfully updated",
      safeZone: patient.safeZone,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update safe zone", error: error.message });
  }
};

// @route  POST /api/geofence/ping-location
// @desc   Receive GPS telemetry from patient's companion app or simulated radar ping
// @access Private
const pingLocation = async (req, res) => {
  try {
    const { patientId, lat, lng, batteryLevel } = req.body;
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const currentLat = parseFloat(lat);
    const currentLng = parseFloat(lng);
    const safeLat = patient.safeZone?.center?.lat || 28.6139;
    const safeLng = patient.safeZone?.center?.lng || 77.2090;
    const radius = patient.safeZone?.radiusMeters || 500;

    const distance = calculateDistanceMeters(currentLat, currentLng, safeLat, safeLng);
    const isSafe = distance <= radius;

    patient.lastKnownLocation = {
      lat: currentLat,
      lng: currentLng,
      timestamp: new Date(),
      isSafe,
      distanceFromCenter: distance,
      batteryLevel: batteryLevel !== undefined ? batteryLevel : (patient.lastKnownLocation?.batteryLevel || 90)
    };

    // If outside safe zone, log a wandering incident alert
    if (!isSafe) {
      patient.wanderingAlerts.push({
        timestamp: new Date(),
        lat: currentLat,
        lng: currentLng,
        distanceMeters: distance,
        status: "BREACHED",
        triggeredBy: "GEOFENCE_RADAR",
        note: `Patient reached ${distance}m away from home (safe limit: ${radius}m).`
      });
    }

    await patient.save();

    res.status(200).json({
      message: isSafe ? "Location ping: INSIDE SAFE ZONE" : "ALERT: GEOFENCE BREACH DETECTED",
      isSafe,
      distanceFromCenter: distance,
      safeLimitMeters: radius,
      location: patient.lastKnownLocation,
      wanderingAlerts: patient.wanderingAlerts.slice(-10).reverse()
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update location ping", error: error.message });
  }
};

// @route  POST /api/geofence/trigger-sos
// @desc   Patient clicks "I'm Lost" or emergency button to dispatch live coordinates to caregiver
// @access Private
const triggerLostSOS = async (req, res) => {
  try {
    const { patientId, lat, lng } = req.body;
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const currentLat = lat ? parseFloat(lat) : (patient.lastKnownLocation?.lat || 28.6139);
    const currentLng = lng ? parseFloat(lng) : (patient.lastKnownLocation?.lng || 77.2090);
    const safeLat = patient.safeZone?.center?.lat || 28.6139;
    const safeLng = patient.safeZone?.center?.lng || 77.2090;

    const distance = calculateDistanceMeters(currentLat, currentLng, safeLat, safeLng);

    patient.lastKnownLocation = {
      lat: currentLat,
      lng: currentLng,
      timestamp: new Date(),
      isSafe: false,
      distanceFromCenter: distance,
      batteryLevel: patient.lastKnownLocation?.batteryLevel || 88
    };

    patient.wanderingAlerts.push({
      timestamp: new Date(),
      lat: currentLat,
      lng: currentLng,
      distanceMeters: distance,
      status: "SOS_TRIGGERED",
      triggeredBy: "PATIENT_SOS",
      note: `PATIENT PRESSED 'I AM LOST' SOS: Live GPS coordinates dispatched to caregiver.`
    });

    await patient.save();

    res.status(200).json({
      message: "Emergency wandering SOS broadcasted to caregiver radar!",
      patientName: patient.name,
      caregiverPhone: patient.caregiverPhone,
      location: patient.lastKnownLocation,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to broadcast wandering SOS", error: error.message });
  }
};

module.exports = {
  getGeofenceStatus,
  updateSafeZone,
  pingLocation,
  triggerLostSOS
};
