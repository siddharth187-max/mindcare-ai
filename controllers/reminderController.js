// controllers/reminderController.js
const Reminder = require("../models/Reminder");
const Patient = require("../models/Patient");

async function assertAccessToPatient(patientId, user) {
  const patient = await Patient.findById(patientId);
  if (!patient) return { ok: false, status: 404, message: "Patient not found" };

  const isOwner = patient.userId.toString() === user._id.toString();
  const isCaregiver = patient.caregiverId.toString() === user._id.toString();
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
    });

    res.status(201).json({ message: "Reminder created", reminder });
  } catch (error) {
    res.status(500).json({ message: "Server error creating reminder", error: error.message });
  }
};

// @route  GET /api/reminders/patient/:patientId
// @desc   Get ALL reminders for a patient (pending, completed, missed)
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

    // Only mark reminders as missed if they were scheduled more than 24 hours ago
    // This allows patients and caregivers to still view and complete reminders scheduled for today
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Reminder.updateMany(
      { patientId: req.params.patientId, status: "pending", scheduledTime: { $lt: oneDayAgo } },
      { $set: { status: "missed" } }
    );

    const reminders = await Reminder.find({
      patientId: req.params.patientId,
      status: "pending",
    }).sort({ scheduledTime: 1 });

    res.status(200).json({ count: reminders.length, reminders });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching pending reminders", error: error.message });
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
    await reminder.save();

    res.status(200).json({ message: "Reminder marked as completed", reminder });
  } catch (error) {
    res.status(500).json({ message: "Server error completing reminder", error: error.message });
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
  getMissedReminders,
  completeReminder,
  deleteReminder,
};
