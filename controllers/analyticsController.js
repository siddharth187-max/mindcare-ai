// controllers/analyticsController.js
// Standalone analytics endpoint (reuses the same helper as the caregiver
// dashboard, but callable directly by patientId - handy if the frontend
// just wants the stats without the whole dashboard payload).

const Patient = require("../models/Patient");
const { buildPatientStats } = require("../utils/analyticsHelper");

// @route  GET /api/analytics/:patientId
// @desc   Get basic progress statistics for a patient
// @access Private (the patient themself, or their assigned caregiver)
const getPatientAnalytics = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const isOwner = patient.userId.toString() === req.user._id.toString();
    const isCaregiver = patient.caregiverId.toString() === req.user._id.toString();
    if (!isOwner && !isCaregiver) {
      return res.status(403).json({ message: "Not authorized for this patient" });
    }

    const stats = await buildPatientStats(patientId);
    res.status(200).json({ patientId, stats });
  } catch (error) {
    res.status(500).json({ message: "Server error calculating analytics", error: error.message });
  }
};

module.exports = { getPatientAnalytics };
