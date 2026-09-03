// public/js/api.js
// MindCare API Client with seamless live backend integration & offline/demo fallback

const API_BASE = '/api';

// Demo initial patient & caregiver data
const DEMO_CARE_ID = 'demo-caregiver-001';
const DEMO_PAT_ID = 'demo-patient-001';

const defaultStorage = {
  user: {
    id: DEMO_PAT_ID,
    name: 'Arthur Pendelton',
    email: 'arthur@example.com',
    role: 'patient',
    age: 74,
    preferredLanguage: 'English'
  },
  caregiver: {
    id: DEMO_CARE_ID,
    name: 'Sarah Jenkins',
    email: 'sarah.caregiver@example.com',
    phone: '(555) 382-9012',
    role: 'caregiver'
  },
  routines: [
    {
      _id: 'r1',
      patientId: DEMO_PAT_ID,
      title: 'Morning Blood Pressure Medication',
      description: 'Take 1 blue pill with a full glass of water after breakfast',
      scheduledTime: '08:30',
      category: 'medicine',
      completed: true,
      reminderEnabled: true
    },
    {
      _id: 'r2',
      patientId: DEMO_PAT_ID,
      title: 'Gentle Teeth Brushing',
      description: 'Brush teeth gently with warm water in the bathroom',
      scheduledTime: '09:00',
      category: 'hygiene',
      completed: true,
      reminderEnabled: true
    },
    {
      _id: 'r3',
      patientId: DEMO_PAT_ID,
      title: 'Nutritious Morning Breakfast',
      description: 'Warm oatmeal with sliced bananas and herbal tea',
      scheduledTime: '09:30',
      category: 'meal',
      completed: true,
      reminderEnabled: true
    },
    {
      _id: 'r4',
      patientId: DEMO_PAT_ID,
      title: 'Mind & Memory Activity',
      description: 'Play a short round of Memory Card Match on the tablet',
      scheduledTime: '11:00',
      category: 'cognitive',
      completed: false,
      reminderEnabled: true
    },
    {
      _id: 'r5',
      patientId: DEMO_PAT_ID,
      title: 'Hydration Break',
      description: 'Drink a refreshing glass of fresh lemon water',
      scheduledTime: '13:00',
      category: 'meal',
      completed: false,
      reminderEnabled: true
    },
    {
      _id: 'r6',
      patientId: DEMO_PAT_ID,
      title: 'Afternoon Garden Walk',
      description: 'Stroll around the sunny backyard garden for fresh air and sunshine',
      scheduledTime: '15:30',
      category: 'exercise',
      completed: false,
      reminderEnabled: true
    },
    {
      _id: 'r7',
      patientId: DEMO_PAT_ID,
      title: 'Evening Memory & Calming Tea',
      description: 'Sip warm chamomile tea and look at family photo album',
      scheduledTime: '19:30',
      category: 'cognitive',
      completed: false,
      reminderEnabled: true
    },
    {
      _id: 'r8',
      patientId: DEMO_PAT_ID,
      title: 'Nightly Sleep Preparation',
      description: 'Change into comfortable nightwear and ensure bedside nightlight is on',
      scheduledTime: '21:00',
      category: 'sleep',
      completed: false,
      reminderEnabled: true
    }
  ],
  reminders: [
    {
      _id: 'rem1',
      patientId: DEMO_PAT_ID,
      title: 'Afternoon Hydration Glass',
      scheduledTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: 'pending'
    }
  ],
  gameResults: [
    {
      _id: 'g1',
      patientId: DEMO_PAT_ID,
      gameType: 'memory',
      score: 90,
      accuracy: 95,
      difficulty: 'easy',
      timeTaken: 28,
      completedAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      _id: 'g2',
      patientId: DEMO_PAT_ID,
      gameType: 'pattern',
      score: 80,
      accuracy: 85,
      difficulty: 'easy',
      timeTaken: 34,
      completedAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      _id: 'g3',
      patientId: DEMO_PAT_ID,
      gameType: 'objectRecognition',
      score: 100,
      accuracy: 100,
      difficulty: 'medium',
      timeTaken: 22,
      completedAt: new Date().toISOString()
    }
  ],
  currentDifficulty: 'medium'
};

function getLocalData() {
  const data = localStorage.getItem('mindcare_demo_data');
  if (!data) {
    localStorage.setItem('mindcare_demo_data', JSON.stringify(defaultStorage));
    return defaultStorage;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultStorage;
  }
}

function saveLocalData(data) {
  localStorage.setItem('mindcare_demo_data', JSON.stringify(data));
}

let authToken = localStorage.getItem('mindcare_token') || 'demo-token';
let currentRole = localStorage.getItem('mindcare_role') || 'patient';

export function setToken(token, role = 'patient') {
  authToken = token;
  currentRole = role;
  if (token) {
    localStorage.setItem('mindcare_token', token);
    localStorage.setItem('mindcare_role', role);
  } else {
    localStorage.removeItem('mindcare_token');
    localStorage.removeItem('mindcare_role');
  }
}

export function getCurrentRole() {
  return currentRole;
}

export function getActivePatientId() {
  return DEMO_PAT_ID;
}

// Universal Request helper with automatic fallback
async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'API request failed');
    }
    return await res.json();
  } catch (err) {
    console.warn(`[MindCare API]: live fetch to ${endpoint} failed (${err.message}), serving fallback.`);
    return null; // Signals fallback to local data store
  }
}

// --- Auth APIs ---
export async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (res && res.token) {
    setToken(res.token, res.user.role);
    return res;
  }
  // Fallback demo login
  const isCaregiver = email.toLowerCase().includes('care') || email.toLowerCase().includes('sarah');
  const role = isCaregiver ? 'caregiver' : 'patient';
  const local = getLocalData();
  const user = role === 'caregiver' ? local.caregiver : local.user;
  setToken('demo-token-123', role);
  return { token: 'demo-token-123', user };
}

export async function register(name, email, password, role) {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role })
  });
  if (res && res.token) {
    setToken(res.token, res.user.role);
    return res;
  }
  // Fallback demo registration
  const user = { id: 'user-' + Date.now(), name, email, role };
  setToken('demo-token-' + Date.now(), role);
  return { token: 'demo-token-reg', user };
}

// --- Patient & Profile APIs ---
export async function getPatientProfile(patientId = DEMO_PAT_ID) {
  const res = await request(`/patients/${patientId}`);
  if (res && res.patient) return res.patient;
  const local = getLocalData();
  return { ...local.user, caregiver: local.caregiver };
}

// --- Routine APIs ---
export async function getTodayRoutines(patientId = DEMO_PAT_ID) {
  const res = await request(`/routines/today/${patientId}`);
  if (res && res.routines) return res.routines;
  return getLocalData().routines;
}

export async function completeRoutine(routineId) {
  const res = await request(`/routines/${routineId}/complete`, { method: 'PATCH' });
  if (res && res.routine) return res.routine;

  // Local fallback update
  const local = getLocalData();
  const routine = local.routines.find(r => r._id === routineId);
  if (routine) routine.completed = true;
  saveLocalData(local);
  return routine;
}

export async function addRoutine(routineData) {
  const res = await request('/routines', {
    method: 'POST',
    body: JSON.stringify(routineData)
  });
  if (res && res.routine) return res.routine;

  const local = getLocalData();
  const newRoutine = {
    _id: 'r_' + Date.now(),
    ...routineData,
    completed: false
  };
  local.routines.push(newRoutine);
  saveLocalData(local);
  return newRoutine;
}

export async function deleteRoutine(routineId) {
  const res = await request(`/routines/${routineId}`, { method: 'DELETE' });
  if (res) return res;

  const local = getLocalData();
  local.routines = local.routines.filter(r => r._id !== routineId);
  saveLocalData(local);
  return { message: 'Routine deleted' };
}

// --- Reminders APIs ---
export async function getPendingReminders(patientId = DEMO_PAT_ID) {
  const res = await request(`/reminders/pending/${patientId}`);
  if (res && res.reminders) return res.reminders;
  return getLocalData().reminders.filter(r => r.status === 'pending');
}

export async function completeReminder(reminderId) {
  const res = await request(`/reminders/${reminderId}/complete`, { method: 'PATCH' });
  if (res && res.reminder) return res.reminder;

  const local = getLocalData();
  const rem = local.reminders.find(r => r._id === reminderId);
  if (rem) {
    rem.status = 'completed';
    rem.completedAt = new Date().toISOString();
  }
  saveLocalData(local);
  return rem;
}

export async function addReminder(reminderData) {
  const res = await request('/reminders', {
    method: 'POST',
    body: JSON.stringify(reminderData)
  });
  if (res && res.reminder) return res.reminder;

  const local = getLocalData();
  const newRem = {
    _id: 'rem_' + Date.now(),
    ...reminderData,
    status: 'pending'
  };
  local.reminders.push(newRem);
  saveLocalData(local);
  return newRem;
}

// --- Cognitive Games & Adaptive Difficulty APIs ---
export function calculateNextDifficulty(currentDifficulty, accuracy) {
  const levels = ['easy', 'medium', 'hard'];
  const idx = levels.indexOf(currentDifficulty);
  if (idx === -1) return 'easy';
  if (accuracy >= 80) return levels[Math.min(idx + 1, levels.length - 1)];
  if (accuracy < 50) return levels[Math.max(idx - 1, 0)];
  return levels[idx];
}

export async function recordGameResult(data) {
  const res = await request('/games/result', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (res && res.result) return res;

  // Local fallback calculation
  const nextDiff = calculateNextDifficulty(data.difficulty, data.accuracy);
  const local = getLocalData();
  const newResult = {
    _id: 'g_' + Date.now(),
    ...data,
    completedAt: new Date().toISOString()
  };
  local.gameResults.unshift(newResult);
  local.currentDifficulty = nextDiff;
  saveLocalData(local);
  return { result: newResult, recommendedNextDifficulty: nextDiff };
}

export async function getGameHistory(patientId = DEMO_PAT_ID) {
  const res = await request(`/games/history/${patientId}`);
  if (res && res.history) return res.history;
  return getLocalData().gameResults;
}

// --- Caregiver & Analytics APIs ---
export async function getCaregiverDashboard(patientId = DEMO_PAT_ID) {
  const res = await request(`/caregiver/dashboard/${patientId}`);
  if (res && res.stats) return res;

  const local = getLocalData();
  const routines = local.routines;
  const completed = routines.filter(r => r.completed);
  const incomplete = routines.filter(r => !r.completed);
  const results = local.gameResults;

  const avgAcc = results.length > 0
    ? Math.round(results.reduce((a, b) => a + b.accuracy, 0) / results.length)
    : 80;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((a, b) => a + b.score, 0) / results.length)
    : 85;

  return {
    patient: local.user,
    todaysRoutine: routines,
    completedActivities: completed,
    incompleteActivities: incomplete,
    missedReminders: [],
    stats: {
      gamesCompleted: results.length,
      averageAccuracy: avgAcc,
      averageScore: avgScore,
      currentDifficulty: local.currentDifficulty || 'easy',
      recentPerformance: results.slice(0, 5).reverse(),
      weeklyPerformance: [
        { date: 'Mon', gamesPlayed: 2, averageAccuracy: 85 },
        { date: 'Tue', gamesPlayed: 3, averageAccuracy: 90 },
        { date: 'Wed', gamesPlayed: 1, averageAccuracy: 78 },
        { date: 'Thu', gamesPlayed: 2, averageAccuracy: 95 },
        { date: 'Today', gamesPlayed: results.length, averageAccuracy: avgAcc }
      ],
      missedReminderCount: 0,
      completedReminderCount: 4
    }
  };
}
