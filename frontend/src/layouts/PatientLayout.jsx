import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const PatientLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showEmergency, setShowEmergency] = useState(false);
  const [fontSize, setFontSize] = useState('normal'); // small, normal, large
  const [highContrast, setHighContrast] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getFontSizeClass = () => {
    switch(fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-xl';
      default: return 'text-base';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${highContrast ? 'bg-black text-yellow-300' : 'bg-[#F9F7F1] text-gray-900'} ${getFontSizeClass()} font-sans transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 shadow-md ${highContrast ? 'bg-gray-900 border-b-2 border-yellow-300' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Brand & Logout */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <Link to="/patient" className={`text-3xl font-bold ${highContrast ? 'text-yellow-300' : 'text-[#2E7D32]'}`}>
                🌿 MindCare
              </Link>
              <button onClick={handleLogout} className="sm:hidden text-lg underline text-gray-600">Logout</button>
            </div>

            {/* Main Navigation */}
            <nav className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full sm:w-auto">
              <NavLink 
                to="/patient/routine" 
                className={({isActive}) => `min-h-12 flex items-center justify-center px-4 py-2 rounded-xl text-xl font-bold border-2 transition-all ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-blue-100 border-blue-500 text-blue-800') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                }`}
              >
                📋 Routine
              </NavLink>
              <NavLink 
                to="/patient/games" 
                className={({isActive}) => `min-h-12 flex items-center justify-center px-4 py-2 rounded-xl text-xl font-bold border-2 transition-all ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-purple-100 border-purple-500 text-purple-800') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                }`}
              >
                🧠 Games
              </NavLink>
              <NavLink 
                to="/patient/results" 
                className={({isActive}) => `min-h-12 flex items-center justify-center px-4 py-2 rounded-xl text-xl font-bold border-2 transition-all ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-green-100 border-[#2E7D32] text-[#2E7D32]') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                }`}
              >
                📊 Results
              </NavLink>
            </nav>

            {/* Accessibility & Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className={`flex rounded-lg overflow-hidden border-2 ${highContrast ? 'border-yellow-300' : 'border-gray-300'}`}>
                <button onClick={() => setFontSize('small')} className={`px-3 py-2 text-lg font-bold ${fontSize === 'small' ? 'bg-gray-200 text-black' : ''}`}>A-</button>
                <button onClick={() => setFontSize('normal')} className={`px-3 py-2 text-xl font-bold border-l border-r ${highContrast ? 'border-yellow-300' : 'border-gray-300'} ${fontSize === 'normal' ? 'bg-gray-200 text-black' : ''}`}>A</button>
                <button onClick={() => setFontSize('large')} className={`px-3 py-2 text-2xl font-bold ${fontSize === 'large' ? 'bg-gray-200 text-black' : ''}`}>A+</button>
              </div>
              
              <button 
                onClick={() => setHighContrast(!highContrast)} 
                className={`min-h-12 px-4 py-2 rounded-xl font-bold border-2 ${highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-black text-white border-black'}`}
                title="Toggle High Contrast"
              >
                ◑
              </button>

              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className={`min-h-12 px-4 py-2 rounded-xl text-2xl border-2 ${soundEnabled ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-100'} ${highContrast ? 'border-yellow-300 text-yellow-300 bg-gray-800' : ''}`}
                title="Toggle Sound"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>

              <button 
                onClick={() => setShowEmergency(true)}
                className="min-h-12 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xl font-bold shadow-md animate-pulse border-2 border-red-800"
              >
                🚨 Call Help
              </button>
              
              <Link 
                to="/caregiver" 
                className="min-h-12 px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
                title="Switch to Caregiver Portal"
              >
                🩺 Caregiver View
              </Link>

              <button onClick={handleLogout} className="hidden sm:block min-h-12 px-4 py-2 text-lg underline font-semibold text-gray-700 hover:text-black">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <Outlet context={{ soundEnabled, highContrast }} />
      </main>

      {/* Emergency Modal */}
      {showEmergency && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className={`max-w-2xl w-full rounded-3xl p-8 sm:p-12 text-center shadow-2xl ${highContrast ? 'bg-black border-4 border-yellow-300' : 'bg-white'}`}>
            <div className="text-6xl mb-6">🚨</div>
            <h2 className={`text-4xl sm:text-5xl font-bold mb-6 ${highContrast ? 'text-yellow-300' : 'text-red-700'}`}>
              Do you need help?
            </h2>
            <p className="text-2xl sm:text-3xl mb-8 leading-relaxed">
              You are safe. Your caregiver has been notified and is checking on you.
            </p>
            <div className={`p-6 rounded-2xl mb-8 text-xl sm:text-2xl ${highContrast ? 'border-2 border-yellow-300' : 'bg-gray-100'}`}>
              <p className="font-bold mb-2">Primary Contact:</p>
              <p>Emergency Services: 911</p>
            </div>
            <button 
              onClick={() => setShowEmergency(false)}
              className="w-full min-h-16 py-4 px-8 text-3xl font-bold rounded-2xl bg-[#2E7D32] hover:bg-[#1b5e20] text-white shadow-lg"
            >
              I'm Okay, Close This
            </button>
          </div>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};

export default PatientLayout;
