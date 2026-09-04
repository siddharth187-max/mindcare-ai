import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAudioContext, triggerHapticAlert, triggerBrowserNotification, playCaregiverEscalationSound } from '../hooks/useVoice';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const CaregiverLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showMobileAudioBanner, setShowMobileAudioBanner] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('mindcare_caregiver_dark') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('mindcare_caregiver_dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const isUnlocked = sessionStorage.getItem('mindcare_audio_unlocked');
    if (!isUnlocked) {
      setShowMobileAudioBanner(true);
    }
  }, []);

  const handleUnlockMobileAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      if ('speechSynthesis' in window) window.speechSynthesis.resume();
      triggerHapticAlert([100, 50, 150]);
      triggerBrowserNotification('Caregiver Alarms Active', 'Emergency chimes and phone vibrations are enabled.');
      playCaregiverEscalationSound();
      sessionStorage.setItem('mindcare_audio_unlocked', 'true');
      setShowMobileAudioBanner(false);
    } catch (e) {
      console.warn(e);
      setShowMobileAudioBanner(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: '📊 Telemetry Dashboard', path: '/caregiver', end: true },
    { name: '📈 Cognitive Trends', path: '/caregiver/progress' },
    { name: '🏆 Activity History', path: '/caregiver/results' },
    { name: '⏰ Care Reminders', path: '/caregiver/reminders' },
    { name: '🔔 Safety Alerts', path: '/caregiver/alerts' },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Mobile Audio & Vibration Activator Banner */}
      {showMobileAudioBanner && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-bounce">📱</span>
            <span>Tap to enable Mobile Emergency Sound & Phone Vibrations</span>
          </div>
          <button
            onClick={handleUnlockMobileAudio}
            className="px-3.5 py-1 bg-white text-blue-900 font-black rounded-lg shadow hover:bg-blue-100 active:scale-95 transition-all text-xs uppercase"
          >
            Enable Now ✓
          </button>
        </div>
      )}

      {/* Top Clinical Monitoring Header */}
      <header className={`sticky top-0 z-30 shadow-md transition-colors ${
        darkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-white border-b border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Brand & Portal Title */}
            <div className="flex items-center gap-3">
              <Link to="/caregiver" className="flex items-center gap-2">
                <span className="text-2xl p-1.5 rounded-lg bg-blue-500/10 text-blue-500">🌿</span>
                <span className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  MindCare <span className="text-blue-500">Pro</span>
                </span>
              </Link>
              <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                darkMode ? 'bg-blue-950/60 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                Caregiver Console
              </span>
            </div>

            {/* Quick Actions & Theme Toggle */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Dark Theme Toggle Button */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center gap-1.5 active:scale-95 shadow-sm ${
                  darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
                title="Toggle Dark/Light Mode"
              >
                <span>{darkMode ? '☀️' : '🌙'}</span>
                <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
              </button>

              <NavLink
                to="/patient"
                className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>👤</span>
                <span className="hidden sm:inline">Switch to </span><span>Patient View</span>
              </NavLink>
              
              <button
                onClick={handleLogout}
                className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-colors ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Navigation Bar */}
          <nav className={`flex space-x-2 sm:space-x-3 overflow-x-auto py-2 no-scrollbar border-t ${
            darkMode ? 'border-slate-800/80' : 'border-slate-100'
          }`}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : darkMode 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Caregiver View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ darkMode }} />
      </main>

      <MedicalDisclaimer />
    </div>
  );
};

export default CaregiverLayout;
