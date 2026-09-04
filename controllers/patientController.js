// controllers/patientController.js
// Manages the extra "Patient" profile and caregiver linking.

const Patient = require("../models/Patient");
const User = require("../models/User");

// @route  POST /api/patients
// @desc   Create or initialize a patient profile
// @access Private (patient or caregiver)
const createPatientProfile = async (req, res) => {
  try {
    const { name, age, caregiverId, preferredLanguage, routine, emergencyPhone, caregiverPhone, emergencyAddress } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    let existingProfile = await Patient.findOne({ userId: req.user._id });
    if (existingProfile) {
      existingProfile.name = name || existingProfile.name;
      if (age) existingProfile.age = age;
      if (caregiverId) existingProfile.caregiverId = caregiverId;
      if (preferredLanguage) existingProfile.preferredLanguage = preferredLanguage;
      if (emergencyPhone) existingProfile.emergencyPhone = emergencyPhone;
      if (caregiverPhone) existingProfile.caregiverPhone = caregiverPhone;
      if (emergencyAddress) existingProfile.emergencyAddress = emergencyAddress;
      await existingProfile.save();
      return res.status(200).json({ message: "Patient profile updated", patient: existingProfile });
    }

    const patient = await Patient.create({
      userId: req.user._id,
      name,
      age: age || 70,
      caregiverId,
      preferredLanguage: preferredLanguage || "English",
      emergencyPhone: emergencyPhone || "112",
      caregiverPhone: caregiverPhone || "+91 98765 43210",
      emergencyAddress: emergencyAddress || "442 Maplewood Enclave, Block B, New Delhi, India",
      routine,
    });

    res.status(201).json({ message: "Patient profile created", patient });
  } catch (error) {
    res.status(500).json({ message: "Server error creating patient profile", error: error.message });
  }
};

// @route  POST /api/patients/link-caregiver
// @desc   Patient links their caregiver by entering caregiver's registered email
// @access Private (patient only)
const linkCaregiver = async (req, res) => {
  try {
    const { caregiverEmail, caregiverPhone } = req.body;

    if (!caregiverEmail) {
      return res.status(400).json({ message: "Caregiver email is required" });
    }

    const caregiver = await User.findOne({ email: caregiverEmail.toLowerCase().trim() });
    if (!caregiver) {
      return res.status(404).json({ message: "No registered caregiver found with this email. Ask them to register first." });
    }
    if (caregiver.role !== "caregiver") {
      return res.status(400).json({ message: "The specified account is registered as a patient, not a caregiver." });
    }

    let patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      patient = await Patient.create({
        userId: req.user._id,
        name: req.user.name,
        age: 70,
        caregiverId: caregiver._id,
        caregiverPhone: caregiverPhone || "+91 98765 43210",
      });
    } else {
      patient.caregiverId = caregiver._id;
      if (caregiverPhone) patient.caregiverPhone = caregiverPhone;
      await patient.save();
    }

    res.status(200).json({
      message: `Successfully linked with caregiver: ${caregiver.name}`,
      patient,
      caregiver: {
        id: caregiver._id,
        name: caregiver.name,
        email: caregiver.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error linking caregiver", error: error.message });
  }
};

// @route  GET /api/patients/:id
// @desc   Get a single patient profile by its Patient document id
// @access Private
const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const isOwner = patient.userId && patient.userId.toString() === req.user._id.toString();
    const isAssignedCaregiver = patient.caregiverId && patient.caregiverId.toString() === req.user._id.toString();

    if (!isOwner && !isAssignedCaregiver) {
      return res.status(403).json({ message: "Not authorized to view this patient" });
    }

    res.status(200).json({ patient });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching patient", error: error.message });
  }
};

// @route  PUT /api/patients/:id
// @desc   Update a patient profile
// @access Private
const updatePatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const isOwner = patient.userId && patient.userId.toString() === req.user._id.toString();
    const isAssignedCaregiver = patient.caregiverId && patient.caregiverId.toString() === req.user._id.toString();
    if (!isOwner && !isAssignedCaregiver) {
      return res.status(403).json({ message: "Not authorized to update this patient" });
    }

    const allowedFields = ["name", "age", "preferredLanguage", "routine", "reminderSettings", "emergencyPhone", "caregiverPhone", "emergencyAddress"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        patient[field] = req.body[field];
      }
    });

    await patient.save();
    res.status(200).json({ message: "Patient profile updated", patient });
  } catch (error) {
    res.status(500).json({ message: "Server error updating patient", error: error.message });
  }
};

// @route  GET /api/patients/me
// @desc   Get the currently logged-in user's patient profile
// @access Private
const getMyPatientProfile = async (req, res) => {
  try {
    let patient;
    if (req.user.role === "patient") {
      patient = await Patient.findOne({ userId: req.user._id });
      if (!patient) {
        // Auto-initialize if missing
        patient = await Patient.create({
          userId: req.user._id,
          name: req.user.name,
          age: 70,
        });
      }
    } else if (req.user.role === "caregiver") {
      patient = await Patient.findOne({ caregiverId: req.user._id });
    }

    if (!patient) {
      return res.status(404).json({ message: "No patient profile found for this account" });
    }

    // Populate caregiver details if linked
    let caregiverInfo = null;
    if (patient.caregiverId) {
      const cg = await User.findById(patient.caregiverId);
      if (cg) {
        caregiverInfo = { id: cg._id, name: cg.name, email: cg.email };
      }
    }

    res.status(200).json({ patient, caregiver: caregiverInfo });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching profile", error: error.message });
  }
};

module.exports = {
  createPatientProfile,
  linkCaregiver,
  getPatientProfile,
  getMyPatientProfile,
  updatePatientProfile,
};
