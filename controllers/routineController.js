// controllers/routineController.js
// CRUD operations for a patient's daily routine. Only the patient themselves
// or their assigned caregiver can view/modify them.

const Routine = require("../models/Routine");
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

// @route  POST /api/routines
// @desc   Add a routine item for a patient
// @access Private
const addRoutineItem = async (req, res) => {
  try {
    const { patientId, title, description, scheduledTime, category, reminderEnabled } = req.body;

    if (!patientId || !title || !scheduledTime) {
      return res.status(400).json({ message: "patientId, title, and scheduledTime are required" });
    }

    const access = await assertAccessToPatient(patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const routine = await Routine.create({
      patientId,
      title,
      description,
      scheduledTime,
      category,
      reminderEnabled,
    });

    res.status(201).json({ message: "Routine item added", routine });
  } catch (error) {
    res.status(500).json({ message: "Server error adding routine item", error: error.message });
  }
};

// @route  GET /api/routines/today/:patientId
// @desc   Get all routine items for a patient
// @access Private
const getTodayRoutine = async (req, res) => {
  try {
    const access = await assertAccessToPatient(req.params.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const routines = await Routine.find({ patientId: req.params.patientId }).sort({ scheduledTime: 1 });
    res.status(200).json({ count: routines.length, routines });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching routine", error: error.message });
  }
};

// @route  PUT /api/routines/:id
// @desc   Update a routine item
// @access Private
const updateRoutineItem = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ message: "Routine item not found" });

    const access = await assertAccessToPatient(routine.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const allowedFields = ["title", "description", "scheduledTime", "category", "reminderEnabled", "completed"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) routine[field] = req.body[field];
    });

    await routine.save();
    res.status(200).json({ message: "Routine item updated", routine });
  } catch (error) {
    res.status(500).json({ message: "Server error updating routine item", error: error.message });
  }
};

// @route  PATCH /api/routines/:id/complete
// @desc   Mark a routine item as completed
// @access Private
const completeRoutineItem = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ message: "Routine item not found" });

    const access = await assertAccessToPatient(routine.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    routine.completed = true;
    routine.completedAt = new Date();
    await routine.save();

    res.status(200).json({ message: "Routine item marked as completed", routine });
  } catch (error) {
    res.status(500).json({ message: "Server error completing routine item", error: error.message });
  }
};

// @route  PATCH /api/routines/:id/uncomplete
// @desc   Mark a routine item as pending (uncomplete)
// @access Private
const uncompleteRoutineItem = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ message: "Routine item not found" });

    const access = await assertAccessToPatient(routine.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    routine.completed = false;
    routine.completedAt = null;
    await routine.save();

    res.status(200).json({ message: "Routine item marked as pending", routine });
  } catch (error) {
    res.status(500).json({ message: "Server error uncompleting routine item", error: error.message });
  }
};

// @route  POST /api/routines/reset/:patientId
// @desc   Reset all routines for a patient to pending (for a new day or test run)
// @access Private
const resetRoutines = async (req, res) => {
  try {
    const access = await assertAccessToPatient(req.params.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    await Routine.updateMany(
      { patientId: req.params.patientId },
      { $set: { completed: false, completedAt: null } }
    );

    const routines = await Routine.find({ patientId: req.params.patientId }).sort({ scheduledTime: 1 });
    res.status(200).json({ message: "All routines reset to pending", routines });
  } catch (error) {
    res.status(500).json({ message: "Server error resetting routines", error: error.message });
  }
};

// @route  DELETE /api/routines/:id
// @desc   Delete a routine item
// @access Private
const deleteRoutineItem = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ message: "Routine item not found" });

    const access = await assertAccessToPatient(routine.patientId, req.user);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    await routine.deleteOne();
    res.status(200).json({ message: "Routine item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting routine item", error: error.message });
  }
};

module.exports = {
  addRoutineItem,
  getTodayRoutine,
  updateRoutineItem,
  completeRoutineItem,
  uncompleteRoutineItem,
  resetRoutines,
  deleteRoutineItem,
};
