// utils/seed.js
// Seeds the database with demo patient, caregiver, routines, game results, and reminders.
// Usage: node utils/seed.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Patient = require('../models/Patient');
const Routine = require('../models/Routine');
const GameResult = require('../models/GameResult');
const Reminder = require('../models/Reminder');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindcare';

async function seed() {
  console.log('🌿 MindCare Seed Script Starting...');
  console.log(`📦 Connecting to: ${MONGO_URI}`);

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ---- Clean existing demo data ----
  const existingPatient = await User.findOne({ email: 'patient.demo@mindcare.local' });
  const existingCaregiver = await User.findOne({ email: 'caregiver.demo@mindcare.local' });

  if (existingPatient) {
    const existingProfile = await Patient.findOne({ userId: existingPatient._id });
    if (existingProfile) {
      await Routine.deleteMany({ patientId: existingProfile._id });
      await GameResult.deleteMany({ patientId: existingProfile._id });
      await Reminder.deleteMany({ patientId: existingProfile._id });
      await Patient.deleteOne({ _id: existingProfile._id });
    }
    await User.deleteOne({ _id: existingPatient._id });
    console.log('🗑️  Cleaned existing demo patient data');
  }

  if (existingCaregiver) {
    await User.deleteOne({ _id: existingCaregiver._id });
    console.log('🗑️  Cleaned existing demo caregiver data');
  }

  // ---- Create Caregiver User ----
  const caregiverPassword = await bcrypt.hash('MindCareDemo123!', 10);
  const caregiverUser = await User.create({
    name: 'Sarah Jenkins',
    email: 'caregiver.demo@mindcare.local',
    password: caregiverPassword,
    role: 'caregiver',
  });
  console.log(`👩‍⚕️ Caregiver created: ${caregiverUser.email}`);

  // ---- Create Patient User ----
  const patientPassword = await bcrypt.hash('MindCareDemo123!', 10);
  const patientUser = await User.create({
    name: 'Arthur Pendelton',
    email: 'patient.demo@mindcare.local',
    password: patientPassword,
    role: 'patient',
  });
  console.log(`👤 Patient user created: ${patientUser.email}`);

  // ---- Create Patient Profile ----
  const patientProfile = await Patient.create({
    userId: patientUser._id,
    name: 'Arthur Pendelton',
    age: 74,
    caregiverId: caregiverUser._id,
    preferredLanguage: 'English',
    routine: 'Morning-Focused Daily Care',
    reminderSettings: {
      enabled: true,
      frequency: 30,
    },
  });
  console.log(`📋 Patient profile created: ${patientProfile.name}, age ${patientProfile.age}`);

  // ---- Seed Daily Routines ----
  const routines = [
    {
      patientId: patientProfile._id,
      title: 'Morning Blood Pressure Medication',
      description: 'Take 1 blue pill with a full glass of water after breakfast',
      scheduledTime: '08:30',
      category: 'medicine',
      completed: true,
      reminderEnabled: true,
    },
    {
      patientId: patientProfile._id,
      title: 'Gentle Teeth Brushing',
      description: 'Brush teeth gently with warm water in the bathroom',
      scheduledTime: '09:00',
      category: 'hygiene',
      completed: true,
      reminderEnabled: true,
    },
    {
      patientId: patientProfile._id,
      title: 'Nutritious Morning Breakfast',
      description: 'Warm oatmeal with sliced bananas and herbal tea',
      scheduledTime: '09:30',
      category: 'meal',
      completed: true,
      reminderEnabled: true,
    },
    {
      patientId: patientProfile._id,
      title: 'Mind & Memory Activity',
      description: 'Play a short round of Memory Card Match on the tablet',
      scheduledTime: '11:00',
      category: 'cognitive',
      completed: false,
      reminderEnabled: true,
    },
    {
      patientId: patientProfile._id,
      title: 'Hydration Break',
      description: 'Drink a refreshing glass of fresh lemon water',
      scheduledTime: '13:00',
      category: 'meal',
      completed: false,
      reminderEnabled: true,
    },
    {
      patientId: patientProfile._id,
      title: 'Afternoon Garden Walk',
      description: 'Stroll around the sunny backyard garden for fresh air',
      scheduledTime: '15:30',
      category: 'exercise',
      completed: false,
      reminderEnabled: true,
    },
    {
      patientId: patientProfile._id,
      title: 'Evening Memory & Calming Tea',
      description: 'Sip warm chamomile tea and look at family photo album',
      scheduledTime: '19:30',
      category: 'cognitive',
      completed: false,
      reminderEnabled: true,
    },
    {
      patientId: patientProfile._id,
      title: 'Nightly Sleep Preparation',
      description: 'Change into comfortable nightwear and ensure bedside nightlight is on',
      scheduledTime: '21:00',
      category: 'sleep',
      completed: false,
      reminderEnabled: true,
    },
  ];

  await Routine.insertMany(routines);
  console.log(`📅 ${routines.length} daily routines seeded`);

  // ---- Seed Game Results (past 7 days) ----
  const now = Date.now();
  const DAY = 86400000;
  const gameResults = [
    {
      patientId: patientProfile._id,
      gameType: 'memory',
      score: 90,
      accuracy: 95,
      difficulty: 'easy',
      timeTaken: 28,
      completedAt: new Date(now - 6 * DAY),
    },
    {
      patientId: patientProfile._id,
      gameType: 'pattern',
      score: 80,
      accuracy: 85,
      difficulty: 'easy',
      timeTaken: 34,
      completedAt: new Date(now - 5 * DAY),
    },
    {
      patientId: patientProfile._id,
      gameType: 'objectRecognition',
      score: 100,
      accuracy: 100,
      difficulty: 'easy',
      timeTaken: 22,
      completedAt: new Date(now - 4 * DAY),
    },
    {
      patientId: patientProfile._id,
      gameType: 'memory',
      score: 85,
      accuracy: 90,
      difficulty: 'medium',
      timeTaken: 35,
      completedAt: new Date(now - 3 * DAY),
    },
    {
      patientId: patientProfile._id,
      gameType: 'routineSequence',
      score: 90,
      accuracy: 100,
      difficulty: 'easy',
      timeTaken: 18,
      completedAt: new Date(now - 2 * DAY),
    },
    {
      patientId: patientProfile._id,
      gameType: 'pattern',
      score: 95,
      accuracy: 100,
      difficulty: 'medium',
      timeTaken: 42,
      completedAt: new Date(now - 1 * DAY),
    },
    {
      patientId: patientProfile._id,
      gameType: 'objectRecognition',
      score: 95,
      accuracy: 100,
      difficulty: 'medium',
      timeTaken: 25,
      completedAt: new Date(now),
    },
  ];

  await GameResult.insertMany(gameResults);
  console.log(`🎮 ${gameResults.length} game results seeded`);

  // ---- Seed Reminders ----
  const reminders = [
    {
      patientId: patientProfile._id,
      title: 'Afternoon Hydration Glass',
      scheduledTime: new Date(now + 30 * 60000),
      status: 'pending',
    },
    {
      patientId: patientProfile._id,
      title: 'Evening Medication Reminder',
      scheduledTime: new Date(now + 4 * 3600000),
      status: 'pending',
    },
  ];

  await Reminder.insertMany(reminders);
  console.log(`⏰ ${reminders.length} reminders seeded`);

  // ---- Summary ----
  console.log('\n✅ ===== SEED COMPLETE =====');
  console.log('Demo Accounts:');
  console.log('  Patient:   patient.demo@mindcare.local / MindCareDemo123!');
  console.log('  Caregiver: caregiver.demo@mindcare.local / MindCareDemo123!');
  console.log(`  Patient Profile ID: ${patientProfile._id}`);
  console.log('============================\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
