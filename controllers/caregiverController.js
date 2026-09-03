// controllers/caregiverController.js
// Everything a caregiver needs to see about ONE assigned patient, in one
// combined dashboard call, plus a helper to list all their patients.

const Patient = require("../models/Patient");
const Routine = require("../models/Routine");
const Reminder = require("../models/Reminder");
const { buildPatientStats } = require("../utils/analyticsHelper");

// @route  GET /api/caregiver/patients
// @desc   List every patient assigned to the logged-in caregiver
// @access Private (caregiver only)
const getMyPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ caregiverId: req.user._id });
    res.status(200).json({ count: patients.length, patients });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching patients", error: error.message });
  }
};

// @route  GET /api/caregiver/dashboard/:patientId
// @desc   Full dashboard for one assigned patient: profile, today's routine,
//         completed/missed activities, game history summary, stats.
// @access Private (caregiver only, and only for THEIR patient)
const getPatientDashboard = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Security check: this caregiver must be the one assigned to this patient
    if (patient.caregiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not the assigned caregiver for this patient" });
    }

    const routines = await Routine.find({ patientId }).sort({ scheduledTime: 1 });
    const completedActivities = routines.filter((r) => r.completed);
    const incompleteActivities = routines.filter((r) => !r.completed);

    const missedReminders = await Reminder.find({ patientId, status: "missed" }).sort({ scheduledTime: -1 });

    const stats = await buildPatientStats(patientId);

    res.status(200).json({
      patient,
      todaysRoutine: routines,
      completedActivities,
      incompleteActivities,
      missedReminders,
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error building dashboard", error: error.message });
  }
};

module.exports = { getMyPatients, getPatientDashboard };
