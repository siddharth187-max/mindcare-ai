import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Layouts
import PatientLayout from './layouts/PatientLayout';
import CaregiverLayout from './layouts/CaregiverLayout';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import PatientRoutine from './pages/patient/Routine';
import PatientResults from './pages/patient/Results';
import GameHub from './pages/patient/games/GameHub';
import MemoryGame from './pages/patient/games/MemoryGame';
import PatternGame from './pages/patient/games/PatternGame';
import ObjectGame from './pages/patient/games/ObjectGame';
import RoutineSequenceGame from './pages/patient/games/RoutineSequenceGame';
import MemoryLane from './pages/patient/MemoryLane';

// Caregiver Pages
import CaregiverDashboard from './pages/caregiver/Dashboard';
import CaregiverProgress from './pages/caregiver/Progress';
import CaregiverResults from './pages/caregiver/Results';
import CaregiverAlerts from './pages/caregiver/Alerts';
import CaregiverReminders from './pages/caregiver/Reminders';
import WanderingRadar from './pages/caregiver/WanderingRadar';
import MemoryVault from './pages/caregiver/MemoryVault';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientDashboard />} />
            <Route path="routine" element={<PatientRoutine />} />
            <Route path="results" element={<PatientResults />} />
            <Route path="memory-lane" element={<MemoryLane />} />
            <Route path="games" element={<GameHub />} />
            <Route path="games/memory" element={<MemoryGame />} />
            <Route path="games/pattern" element={<PatternGame />} />
            <Route path="games/object" element={<ObjectGame />} />
            <Route path="games/sequence" element={<RoutineSequenceGame />} />
          </Route>

          {/* Caregiver routes */}
          <Route
            path="/caregiver"
            element={
              <ProtectedRoute allowedRoles={['caregiver']}>
                <CaregiverLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CaregiverDashboard />} />
            <Route path="radar" element={<WanderingRadar />} />
            <Route path="memories" element={<MemoryVault />} />
            <Route path="progress" element={<CaregiverProgress />} />
            <Route path="results" element={<CaregiverResults />} />
            <Route path="alerts" element={<CaregiverAlerts />} />
            <Route path="reminders" element={<CaregiverReminders />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
