import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const PatientLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showEmergency, setShowEmergency] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
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
    <div className={`min-h-screen flex flex-col ${highContrast ? 'bg-black text-yellow-300' : 'bg-gradient-to-b from-[#F4F9F4] via-[#F9F7F1] to-[#FAF8F5] text-slate-800'} ${getFontSizeClass()} font-sans transition-colors duration-300`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-40 shadow-md ${highContrast ? 'bg-gray-900 border-b-2 border-yellow-300' : 'bg-white/95 backdrop-blur-md border-b border-emerald-100'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-3.5">
            
            {/* Brand */}
            <div className="flex items-center justify-between w-full lg:w-auto gap-3">
              <Link to="/patient" className="flex items-center gap-2.5 group">
                <span className="text-3xl p-1.5 rounded-xl bg-emerald-50 group-hover:scale-105 transition-transform">🌿</span>
                <div>
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${highContrast ? 'text-yellow-300' : 'text-emerald-800'}`}>
                    MindCare <span className="text-emerald-500 font-extrabold text-xl">AI</span>
                  </span>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
                    Patient Companion Portal
                  </p>
                </div>
              </Link>

              {/* Status Badge */}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                AI Adaptive Active
              </span>

              <button onClick={handleLogout} className="lg:hidden text-sm font-bold underline text-slate-600">Logout</button>
            </div>

            {/* Navigation Pills */}
            <nav className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full lg:w-auto">
              <NavLink 
                to="/patient" 
                end
                className={({isActive}) => `min-h-11 flex items-center justify-center px-4 py-2 rounded-xl text-lg font-bold border-2 transition-all active:scale-95 ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-emerald-600 border-emerald-600 text-white shadow-md') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                }`}
              >
                🏠 Home
              </NavLink>

              <NavLink 
                to="/patient/routine" 
                className={({isActive}) => `min-h-11 flex items-center justify-center px-4 py-2 rounded-xl text-lg font-bold border-2 transition-all active:scale-95 ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-blue-600 border-blue-600 text-white shadow-md') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                }`}
              >
                📋 Routine
              </NavLink>

              <NavLink 
                to="/patient/games" 
                className={({isActive}) => `min-h-11 flex items-center justify-center px-4 py-2 rounded-xl text-lg font-bold border-2 transition-all active:scale-95 ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-purple-600 border-purple-600 text-white shadow-md') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                }`}
              >
                🧠 Games
              </NavLink>

              <NavLink 
                to="/patient/results" 
                className={({isActive}) => `min-h-11 flex items-center justify-center px-4 py-2 rounded-xl text-lg font-bold border-2 transition-all active:scale-95 ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-teal-600 border-teal-600 text-white shadow-md') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                }`}
              >
                📊 Progress
              </NavLink>
            </nav>

            {/* Accessibility & Quick Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className={`flex rounded-xl overflow-hidden border-2 ${highContrast ? 'border-yellow-300' : 'border-slate-200'}`}>
                <button onClick={() => setFontSize('small')} className={`px-2.5 py-1.5 text-base font-bold ${fontSize === 'small' ? 'bg-slate-200 text-black' : 'bg-white'}`}>A-</button>
                <button onClick={() => setFontSize('normal')} className={`px-2.5 py-1.5 text-lg font-bold border-l border-r ${highContrast ? 'border-yellow-300' : 'border-slate-200'} ${fontSize === 'normal' ? 'bg-slate-200 text-black' : 'bg-white'}`}>A</button>
                <button onClick={() => setFontSize('large')} className={`px-2.5 py-1.5 text-xl font-bold ${fontSize === 'large' ? 'bg-slate-200 text-black' : 'bg-white'}`}>A+</button>
              </div>
              
              <button 
                onClick={() => setHighContrast(!highContrast)} 
                className={`min-h-11 px-3 py-1.5 rounded-xl font-bold border-2 text-sm ${highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-slate-800 text-white border-slate-800'}`}
                title="Toggle High Contrast"
              >
                ◑ Contrast
              </button>

              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className={`min-h-11 px-3 py-1.5 rounded-xl text-xl border-2 ${soundEnabled ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-100'} ${highContrast ? 'border-yellow-300 text-yellow-300 bg-gray-800' : ''}`}
                title="Toggle Sound"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>

              <button 
                onClick={() => setShowEmergency(true)}
                className="min-h-11 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md animate-pulse border border-red-700 flex items-center gap-1"
              >
                🚨 Call Help
              </button>

              <Link 
                to="/caregiver" 
                className="min-h-11 px-3.5 py-1.5 rounded-xl font-bold bg-blue-700 hover:bg-blue-800 text-white text-sm flex items-center gap-1 shadow-sm"
                title="Switch to Caregiver Portal"
              >
                🩺 Caregiver View
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <Outlet context={{ soundEnabled, highContrast }} />
      </main>

      {/* Emergency Reassurance Modal */}
      {showEmergency && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={`max-w-2xl w-full rounded-3xl p-8 sm:p-10 text-center shadow-2xl ${highContrast ? 'bg-black border-4 border-yellow-300' : 'bg-white border border-red-100'}`}>
            <div className="text-6xl mb-4">🏡</div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold mb-3 ${highContrast ? 'text-yellow-300' : 'text-red-700'}`}>
              You Are Safe at Home
            </h2>
            <p className="text-xl sm:text-2xl mb-6 leading-relaxed text-slate-700 font-medium">
              Take a slow, deep breath. Your door is locked, your home is warm, and help is always right here.
            </p>

            <div className="bg-slate-50 p-5 rounded-2xl mb-6 text-left border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">📍 Home Address Anchor</div>
              <div className="text-xl font-bold text-slate-800">442 Maplewood Drive, Apt 3B</div>
              <div className="text-sm text-slate-600 mt-1">Caregiver on duty: Sarah Jenkins • (555) 382-9012</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href="tel:911"
                className="flex-1 py-4 px-6 text-xl font-bold rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center gap-2"
              >
                🚨 Call Emergency (911)
              </a>
              <button 
                onClick={() => setShowEmergency(false)}
                className="flex-1 py-4 px-6 text-xl font-bold rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg"
              >
                ✓ I Feel Safe Now (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};

export default PatientLayout;
