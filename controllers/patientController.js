// controllers/patientController.js
// Manages the extra "Patient" profile that sits on top of a User account
// with role "patient".

const Patient = require("../models/Patient");
const User = require("../models/User");

// @route  POST /api/patients
// @desc   Create a patient profile (usually right after a patient registers,
//         or a caregiver creates a profile for their patient)
// @access Private (patient or caregiver)
const createPatientProfile = async (req, res) => {
  try {
    const { name, age, caregiverId, preferredLanguage, routine } = req.body;

    if (!name || !caregiverId) {
      return res.status(400).json({ message: "name and caregiverId are required" });
    }

    // make sure the caregiverId actually points to a caregiver account
    const caregiver = await User.findById(caregiverId);
    if (!caregiver || caregiver.role !== "caregiver") {
      return res.status(400).json({ message: "caregiverId must belong to a valid caregiver account" });
    }

    // a patient profile should map 1-to-1 with a logged-in "patient" user
    const existingProfile = await Patient.findOne({ userId: req.user._id });
    if (existingProfile) {
      return res.status(409).json({ message: "This user already has a patient profile" });
    }

    const patient = await Patient.create({
      userId: req.user._id,
      name,
      age,
      caregiverId,
      preferredLanguage,
      routine,
    });

    res.status(201).json({ message: "Patient profile created", patient });
  } catch (error) {
    res.status(500).json({ message: "Server error creating patient profile", error: error.message });
  }
};

// @route  GET /api/patients/:id
// @desc   Get a single patient profile by its Patient document id
// @access Private (the patient themself, or their assigned caregiver)
const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Access control: only the patient themself or their caregiver may view this
    const isOwner = patient.userId.toString() === req.user._id.toString();
    const isAssignedCaregiver = patient.caregiverId.toString() === req.user._id.toString();

    if (!isOwner && !isAssignedCaregiver) {
      return res.status(403).json({ message: "Not authorized to view this patient" });
    }

    res.status(200).json({ patient });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching patient", error: error.message });
  }
};

// @route  PUT /api/patients/:id
// @desc   Update a patient profile (routine notes, reminder settings, etc.)
// @access Private (the patient themself, or their assigned caregiver)
const updatePatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const isOwner = patient.userId.toString() === req.user._id.toString();
    const isAssignedCaregiver = patient.caregiverId.toString() === req.user._id.toString();
    if (!isOwner && !isAssignedCaregiver) {
      return res.status(403).json({ message: "Not authorized to update this patient" });
    }

    // Only allow updating specific, safe fields
    const allowedFields = ["name", "age", "preferredLanguage", "routine", "reminderSettings"];
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
    } else if (req.user.role === "caregiver") {
      patient = await Patient.findOne({ caregiverId: req.user._id });
    }

    if (!patient) {
      return res.status(404).json({ message: "No patient profile found for this account" });
    }

    res.status(200).json({ patient });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching profile", error: error.message });
  }
};

module.exports = { createPatientProfile, getPatientProfile, getMyPatientProfile, updatePatientProfile };
