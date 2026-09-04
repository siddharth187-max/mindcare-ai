// controllers/reminderController.js
const Reminder = require("../models/Reminder");
const Patient = require("../models/Patient");

async function assertAccessToPatient(patientId, user) {
  const patient = await Patient.findById(patientId);
  if (!patient) return { ok: false, status: 404, message: "Patient not found" };

  const isOwner = patient.userId && patient.userId.toString() === user._id.toString();
  const isCaregiver = patient.caregiverId && patient.caregiverId.toString() === user._id.toString();
  if (!isOwner && !isCaregiver) {
    return { ok: false, status: 403, message: "Not authorized for this patient" };
  }
  return { ok: true, patient };
}

// @route  POST /api/reminders
// @desc   Create a new reminder
// @access Private
const createReminder = async (req, res) => {
  try {
    const { patientId, routineId, title, scheduledTime } = req.body;

    if (!patientId || !title || !scheduledTime) {
      return res.status(400).json({ message: "patientId, title and scheduledTime are required" });
    }

    const access = await assertAccessToPatient(patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const reminder = await Reminder.create({
      patientId,
      routineId,
      title,
      scheduledTime: new Date(scheduledTime),
      status: "pending",
      promptCount: 0,
      escalatedToCaregiver: false,
    });

    res.status(201).json({ message: "Reminder created", reminder });
  } catch (error) {
    res.status(500).json({ message: "Server error creating reminder", error: error.message });
  }
};

// @route  GET /api/reminders/patient/:patientId
// @desc   Get ALL reminders for a patient
// @access Private
const getAllReminders = async (req, res) => {
  try {
    const access = await assertAccessToPatient(req.params.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const reminders = await Reminder.find({
      patientId: req.params.patientId,
    }).sort({ scheduledTime: -1 });

    res.status(200).json({ count: reminders.length, reminders });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching all reminders", error: error.message });
  }
};

// @route  GET /api/reminders/pending/:patientId
// @desc   Get all pending reminders for a patient
// @access Private
const getPendingReminders = async (req, res) => {
  try {
    const access = await assertAccessToPatient(req.params.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const reminders = await Reminder.find({
      patientId: req.params.patientId,
      status: "pending",
    }).sort({ scheduledTime: 1 });

    res.status(200).json({ count: reminders.length, reminders });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching pending reminders", error: error.message });
  }
};

// @route  GET /api/reminders/escalated/:patientId
// @desc   Get reminders that reached 3 prompts without patient response
// @access Private (caregiver)
const getEscalatedReminders = async (req, res) => {
  try {
    const access = await assertAccessToPatient(req.params.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const reminders = await Reminder.find({
      patientId: req.params.patientId,
      escalatedToCaregiver: true,
      status: { $ne: "completed" },
    }).sort({ scheduledTime: -1 });

    res.status(200).json({ count: reminders.length, reminders });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching escalated reminders", error: error.message });
  }
};

// @route  GET /api/reminders/missed/:patientId
// @desc   Get all missed reminders for a patient
// @access Private
const getMissedReminders = async (req, res) => {
  try {
    const access = await assertAccessToPatient(req.params.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const reminders = await Reminder.find({
      patientId: req.params.patientId,
      status: "missed",
    }).sort({ scheduledTime: -1 });

    res.status(200).json({ count: reminders.length, reminders });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching missed reminders", error: error.message });
  }
};

// @route  PATCH /api/reminders/:id/prompt
// @desc   Record a popping/flash prompt played to patient. If reached 3 prompts, escalate to caregiver!
// @access Private
const recordPrompt = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    const access = await assertAccessToPatient(reminder.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    reminder.promptCount = (reminder.promptCount || 0) + 1;
    reminder.lastPromptAt = new Date();

    // If patient was prompted 3 times without completing, escalate to caregiver!
    if (reminder.promptCount >= 3) {
      reminder.escalatedToCaregiver = true;
      reminder.escalatedAt = new Date();
    }

    await reminder.save();
    res.status(200).json({
      message: `Prompt ${reminder.promptCount} of 3 recorded`,
      reminder,
      isEscalated: reminder.escalatedToCaregiver,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error recording prompt", error: error.message });
  }
};

// @route  PATCH /api/reminders/:id/complete
// @desc   Mark a reminder as completed
// @access Private
const completeReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    const access = await assertAccessToPatient(reminder.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    reminder.status = "completed";
    reminder.completedAt = new Date();
    reminder.escalatedToCaregiver = false; // resolved
    await reminder.save();

    res.status(200).json({ message: "Reminder marked as completed", reminder });
  } catch (error) {
    res.status(500).json({ message: "Server error completing reminder", error: error.message });
  }
};

// @route  PATCH /api/reminders/:id/acknowledge-caregiver
// @desc   Caregiver acknowledges the unresponded reminder alert
// @access Private
const acknowledgeCaregiver = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    const access = await assertAccessToPatient(reminder.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    reminder.caregiverAcknowledged = true;
    await reminder.save();

    res.status(200).json({ message: "Alert acknowledged by caregiver", reminder });
  } catch (error) {
    res.status(500).json({ message: "Server error acknowledging alert", error: error.message });
  }
};

// @route  PATCH /api/reminders/:id/resend-prompt
// @desc   Caregiver resets prompt count and resends alert to patient
// @access Private
const resendPrompt = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    const access = await assertAccessToPatient(reminder.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    reminder.promptCount = 0;
    reminder.escalatedToCaregiver = false;
    reminder.caregiverAcknowledged = false;
    reminder.scheduledTime = new Date(); // prompt now
    await reminder.save();

    res.status(200).json({ message: "Reminder resent to patient", reminder });
  } catch (error) {
    res.status(500).json({ message: "Server error resending reminder", error: error.message });
  }
};

// @route  DELETE /api/reminders/:id
// @desc   Delete a reminder
// @access Private
const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    const access = await assertAccessToPatient(reminder.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    await Reminder.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Reminder deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting reminder", error: error.message });
  }
};

module.exports = {
  createReminder,
  getAllReminders,
  getPendingReminders,
  getEscalatedReminders,
  getMissedReminders,
  recordPrompt,
  completeReminder,
  acknowledgeCaregiver,
  resendPrompt,
  deleteReminder,
};
