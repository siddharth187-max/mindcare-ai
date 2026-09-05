import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAudioContext, triggerHapticAlert, triggerBrowserNotification, playCaregiverEscalationSound } from '../hooks/useVoice';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const CaregiverLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showMobileAudioBanner, setShowMobileAudioBanner] = useState(false);

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
      triggerBrowserNotification('Caregiver Alerts Active', 'Sound and emergency notifications are enabled.');
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
    { name: '📊 Dashboard', path: '/caregiver', end: true },
    { name: '📍 Wandering Radar', path: '/caregiver/radar' },
    { name: '🖼️ Memory Vault', path: '/caregiver/memories' },
    { name: '📈 Cognitive Trends', path: '/caregiver/progress' },
    { name: '🏆 Results', path: '/caregiver/results' },
    { name: '⏰ Reminders', path: '/caregiver/reminders' },
    { name: '🔔 Safety Alerts', path: '/caregiver/alerts' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F7F3E8] text-[#263B42]">
      {/* Mobile Audio & Vibration Activator Banner */}
      {showMobileAudioBanner && (
        <div className="bg-[#EBF3F2] border-b border-[#BCD5D3] text-[#263B42] px-4 py-2.5 shadow-sm flex items-center justify-between text-xs sm:text-sm font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <span>Enable sound & vibration alerts for urgent patient notifications</span>
          </div>
          <button
            onClick={handleUnlockMobileAudio}
            className="px-3.5 py-1 bg-[#397F7A] text-white font-bold rounded-lg shadow-sm hover:bg-[#2E6B66] active:scale-95 transition-all text-xs"
          >
            Enable Alerts ✓
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 shadow-sm bg-[#FFFDF7] border-b border-[#EADBCC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Brand */}
            <div className="flex items-center gap-3">
              <Link to="/caregiver" className="flex items-center gap-2">
                <span className="text-2xl p-1.5 rounded-xl bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4]">🌿</span>
                <span className="text-xl font-extrabold text-[#263B42] tracking-tight">
                  MindCare <span className="text-[#397F7A] font-semibold text-lg">Caregiver</span>
                </span>
              </Link>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4]">
                Clinical & Family Portal
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <NavLink
                to="/patient"
                className="px-3.5 py-2 text-xs sm:text-sm font-bold text-[#263B42] bg-[#8DB7A5] hover:bg-[#79A391] rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>👤</span>
                <span className="hidden sm:inline">Switch to </span><span>Patient View</span>
              </NavLink>
              
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border border-[#C8DDD4] bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#566D75] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-2 sm:space-x-2.5 overflow-x-auto py-2.5 no-scrollbar border-t border-[#EADBCC]">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-98 ${
                    isActive
                      ? 'bg-[#397F7A] text-white shadow-sm'
                      : 'bg-[#FFFDF7] text-[#263B42] border border-[#C8DDD4] hover:bg-[#EAF2EE]'
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
        <Outlet />
      </main>

      <MedicalDisclaimer />
    </div>
  );
};

export default CaregiverLayout;
