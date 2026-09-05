import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getAudioContext, triggerHapticAlert, triggerBrowserNotification, playChime, speakText } from '../hooks/useVoice';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const PatientLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showEmergency, setShowEmergency] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showMobileAudioBanner, setShowMobileAudioBanner] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    // Check if audio has been unlocked on this device
    const isUnlocked = sessionStorage.getItem('mindcare_audio_unlocked');
    if (!isUnlocked) {
      setShowMobileAudioBanner(true);
    }

    // Load patient data for emergency contact
    async function loadPatient() {
      try {
        const { data } = await api.get('/patients/me');
        setPatientData(data?.patient || data);
      } catch (err) {
        console.warn('Failed to load patient info for emergency layout:', err);
      }
    }
    loadPatient();
  }, []);

  const handleUnlockMobileAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      if ('speechSynthesis' in window) window.speechSynthesis.resume();
      triggerHapticAlert([100, 50, 150]);
      triggerBrowserNotification('MindCare Active', 'Sound and voice reminders are now ready.');
      playChime('pop');
      sessionStorage.setItem('mindcare_audio_unlocked', 'true');
      setShowMobileAudioBanner(false);
    } catch (e) {
      console.warn(e);
      setShowMobileAudioBanner(false);
    }
  };

  const handleTriggerSOSBeacon = async () => {
    try {
      playChime('click');
      let currentLat = 28.6139;
      let currentLng = 77.2090;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
          },
          (err) => console.warn('GPS error, using fallback:', err),
          { timeout: 3000 }
        );
      }

      const pId = patientData?._id;
      if (pId) {
        await api.post('/geofence/trigger-sos', {
          patientId: pId,
          lat: currentLat,
          lng: currentLng,
        });
      }

      setSosSent(true);
      speakText('Your location has been shared with your caregiver. Please stay in a safe place, help is notified.');
    } catch (err) {
      console.error('Failed to dispatch SOS radar beacon:', err);
    }
  };

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

  const caregiverPhone = patientData?.caregiverPhone || '+91 98765 43210';
  const homeAddress = patientData?.emergencyAddress || '442 Maplewood Enclave, Block B, New Delhi, India';

  return (
    <div className={`min-h-screen flex flex-col ${
      highContrast 
      ? 'high-contrast bg-black text-yellow-300' 
      : 'bg-[#F7F3E8] text-[#263B42]'
    } ${getFontSizeClass()} font-sans transition-colors duration-200`}>
      
      {/* Mobile Audio & Vibration Activator Banner */}
      {showMobileAudioBanner && (
        <div className="bg-[#EBF3F2] border-b border-[#BCD5D3] text-[#263B42] px-4 py-2.5 shadow-sm flex items-center justify-between text-xs sm:text-sm font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <span>Tap to enable spoken reminders & gentle chimes</span>
          </div>
          <button
            onClick={handleUnlockMobileAudio}
            className="px-3.5 py-1 bg-[#397F7A] text-white font-bold rounded-lg shadow-sm hover:bg-[#2E6B66] active:scale-95 transition-all text-xs"
          >
            Enable Audio ✓
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className={`sticky top-0 z-40 shadow-sm ${
        highContrast 
        ? 'bg-black border-b-2 border-yellow-300' 
        : 'bg-[#FFFDF7] border-b border-[#EADBCC]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-3.5">
            
            {/* Brand Logo */}
            <div className="flex items-center justify-between w-full lg:w-auto gap-3">
              <Link to="/patient" className="flex items-center gap-2.5 group">
                <span className="text-2xl sm:text-3xl p-2 rounded-2xl bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4]">
                  🌿
                </span>
                <div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#263B42] tracking-tight">
                    MindCare
                  </span>
                  <p className="text-xs font-bold text-[#566D75] tracking-wide hidden sm:block">
                    Cognitive & Daily Routine Companion
                  </p>
                </div>
              </Link>

              <button 
                onClick={handleLogout} 
                className="lg:hidden text-sm font-bold text-[#566D75] hover:text-[#263B42] p-1.5"
              >
                Logout
              </button>
            </div>

            {/* Navigation Buttons */}
            <nav className="flex flex-wrap justify-center gap-2 sm:gap-2.5 w-full lg:w-auto">
              <NavLink 
                to="/patient" 
                end
                className={({isActive}) => `min-h-12 flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-2xl text-base sm:text-lg font-bold border transition-all active:scale-98 ${
                  isActive 
                  ? 'bg-[#397F7A] border-[#397F7A] text-white shadow-sm' 
                  : 'bg-[#FFFDF7] border-[#C8DDD4] text-[#263B42] hover:bg-[#EAF2EE]'
                }`}
              >
                🏠 Home
              </NavLink>

              <NavLink 
                to="/patient/routine" 
                className={({isActive}) => `min-h-12 flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-2xl text-base sm:text-lg font-bold border transition-all active:scale-98 ${
                  isActive 
                  ? 'bg-[#397F7A] border-[#397F7A] text-white shadow-sm' 
                  : 'bg-[#FFFDF7] border-[#C8DDD4] text-[#263B42] hover:bg-[#EAF2EE]'
                }`}
              >
                📋 Routine
              </NavLink>

              <NavLink 
                to="/patient/games" 
                className={({isActive}) => `min-h-12 flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-2xl text-base sm:text-lg font-bold border transition-all active:scale-98 ${
                  isActive 
                  ? 'bg-[#397F7A] border-[#397F7A] text-white shadow-sm' 
                  : 'bg-[#FFFDF7] border-[#C8DDD4] text-[#263B42] hover:bg-[#EAF2EE]'
                }`}
              >
                🧠 Memory Games
              </NavLink>

              <NavLink 
                to="/patient/memory-lane" 
                className={({isActive}) => `min-h-12 flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-2xl text-base sm:text-lg font-bold border transition-all active:scale-98 ${
                  isActive 
                  ? 'bg-[#397F7A] border-[#397F7A] text-white shadow-sm' 
                  : 'bg-[#FFFDF7] border-[#C8DDD4] text-[#263B42] hover:bg-[#EAF2EE]'
                }`}
              >
                🖼️ Family Album
              </NavLink>

              <NavLink 
                to="/patient/results" 
                className={({isActive}) => `min-h-12 flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-2xl text-base sm:text-lg font-bold border transition-all active:scale-98 ${
                  isActive 
                  ? 'bg-[#397F7A] border-[#397F7A] text-white shadow-sm' 
                  : 'bg-[#FFFDF7] border-[#C8DDD4] text-[#263B42] hover:bg-[#EAF2EE]'
                }`}
              >
                📊 Progress
              </NavLink>
            </nav>

            {/* Accessibility & Quick Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex rounded-xl overflow-hidden border border-[#C8DDD4] bg-[#FFFDF7]">
                <button 
                  onClick={() => setFontSize('small')} 
                  className={`px-3 py-1.5 text-sm font-bold transition-colors ${fontSize === 'small' ? 'bg-[#397F7A] text-white' : 'text-[#263B42] hover:bg-[#EAF2EE]'}`}
                  title="Smaller Text"
                >
                  A-
                </button>
                <button 
                  onClick={() => setFontSize('normal')} 
                  className={`px-3 py-1.5 text-base font-bold border-l border-r border-[#C8DDD4] transition-colors ${fontSize === 'normal' ? 'bg-[#397F7A] text-white' : 'text-[#263B42] hover:bg-[#EAF2EE]'}`}
                  title="Standard Text"
                >
                  A
                </button>
                <button 
                  onClick={() => setFontSize('large')} 
                  className={`px-3 py-1.5 text-lg font-bold transition-colors ${fontSize === 'large' ? 'bg-[#397F7A] text-white' : 'text-[#263B42] hover:bg-[#EAF2EE]'}`}
                  title="Large Text"
                >
                  A+
                </button>
              </div>
              
              <button 
                onClick={() => setHighContrast(!highContrast)} 
                className="min-h-11 px-3 py-1.5 rounded-xl font-bold border border-[#C8DDD4] bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#263B42] text-xs sm:text-sm transition-all shadow-sm"
                title="Toggle High Contrast"
              >
                ◑ Contrast
              </button>

              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className={`min-h-11 px-3 py-1.5 rounded-xl text-lg border transition-all ${
                  soundEnabled 
                  ? 'border-[#397F7A] bg-[#EBF3F2] text-[#397F7A]' 
                  : 'border-[#C8DDD4] bg-[#FFFDF7] text-[#849CA4]'
                }`}
                title="Toggle Sound"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>

              <button 
                onClick={() => setShowEmergency(true)}
                className="min-h-11 px-4 py-2 bg-[#C95C5C] hover:bg-[#B54E4E] text-white rounded-xl text-sm sm:text-base font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
              >
                🚨 Call Help
              </button>

              <Link 
                to="/caregiver" 
                className="min-h-11 px-3.5 py-1.5 rounded-xl font-bold bg-[#8DB7A5] hover:bg-[#79A391] text-[#263B42] text-xs sm:text-sm flex items-center gap-1 shadow-sm transition-all active:scale-95"
                title="Switch to Caregiver Portal"
              >
                🩺 Caregiver
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Patient View */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <Outlet context={{ soundEnabled, highContrast }} />
      </main>

      {/* Emergency Reassurance Modal */}
      {showEmergency && (
        <div className="fixed inset-0 bg-[#263B42]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="max-w-2xl w-full rounded-3xl p-7 sm:p-10 text-center shadow-lg bg-[#FFFDF7] border-2 border-[#BCD5D3] text-[#263B42]">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#EAF2EE] border border-[#C8DDD4] text-[#397F7A] flex items-center justify-center text-5xl mb-4">
              🏡
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2 text-[#263B42]">
              You Are Safe at Home
            </h2>
            <p className="text-lg sm:text-xl mb-6 leading-relaxed text-[#566D75] font-medium">
              Take a slow, deep breath. Your home is secure, and your caregivers are always looking out for you.
            </p>

            <div className="bg-[#F7F3E8] p-5 rounded-2xl mb-6 text-left border border-[#EADBCC]">
              <div className="text-xs font-bold text-[#397F7A] uppercase tracking-wider mb-1">📍 Home Address</div>
              <div className="text-lg sm:text-xl font-bold text-[#263B42]">{homeAddress}</div>
              <div className="text-sm font-medium text-[#566D75] mt-1">Caregiver on Duty: {caregiverPhone}</div>
            </div>

            {sosSent ? (
              <div className="p-4 rounded-2xl bg-[#EBF5ED] border border-[#B7D9BE] text-[#4F8A5B] font-bold mb-4 animate-fadeIn text-base">
                ✓ Your location has been shared with your caregiver. Help is on the way.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTriggerSOSBeacon}
                className="w-full mb-3 py-3.5 px-4 rounded-2xl bg-[#D9A441] hover:bg-[#C89433] text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
              >
                <span>🧭</span>
                <span>I Feel Lost (Notify My Caregiver)</span>
              </button>
            )}

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <a 
                href="tel:112"
                className="py-3.5 px-5 text-base sm:text-lg font-bold rounded-2xl bg-[#C95C5C] hover:bg-[#B54E4E] text-white shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <span>🚨</span>
                <span>Call 112 (Police / Medical)</span>
              </a>
              <a 
                href={`tel:${caregiverPhone}`}
                className="py-3.5 px-5 text-base sm:text-lg font-bold rounded-2xl bg-[#397F7A] hover:bg-[#2E6B66] text-white shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <span>📞</span>
                <span>Call Caregiver Directly</span>
              </a>
            </div>

            <button 
              onClick={() => {
                setShowEmergency(false);
                setSosSent(false);
              }}
              className="w-full py-3 px-6 text-base sm:text-lg font-bold rounded-2xl bg-[#EAF2EE] hover:bg-[#D7E8E0] text-[#263B42] border border-[#C8DDD4] active:scale-98 transition-all"
            >
              ✓ I Feel Safe (Close Window)
            </button>
          </div>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};

export default PatientLayout;
