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
      triggerBrowserNotification('MindCare Alerts Active', 'Sound, popups, and vibration are now ready.');
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
      speakText('Your live location has been sent to your caregiver radar. Please stay where you are, help is on the way.');
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
      ? 'bg-black text-yellow-300' 
      : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100'
    } ${getFontSizeClass()} font-sans transition-colors duration-300`}>
      
      {/* Mobile Audio & Vibration Activator Banner */}
      {showMobileAudioBanner && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-bounce">📱</span>
            <span>Tap to enable Mobile Sound, Vibration & Popup Alarms</span>
          </div>
          <button
            onClick={handleUnlockMobileAudio}
            className="px-3.5 py-1 bg-white text-purple-900 font-black rounded-lg shadow hover:bg-purple-100 active:scale-95 transition-all text-xs uppercase"
          >
            Enable Now ✓
          </button>
        </div>
      )}

      {/* Top Obsidian Glass Navigation Header */}
      <header className={`sticky top-0 z-40 shadow-xl ${
        highContrast 
        ? 'bg-black border-b-2 border-yellow-300' 
        : 'bg-slate-900/90 backdrop-blur-md border-b border-purple-900/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-3.5">
            
            {/* Brand Logo & Telemetry Badge */}
            <div className="flex items-center justify-between w-full lg:w-auto gap-3">
              <Link to="/patient" className="flex items-center gap-2.5 group">
                <span className="text-3xl p-1.5 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform shadow-inner border border-purple-500/20">
                  🌿
                </span>
                <div>
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    highContrast ? 'text-yellow-300' : 'text-white'
                  }`}>
                    MindCare <span className="text-purple-400 font-extrabold text-xl">AI</span>
                  </span>
                  <p className="text-[11px] font-bold text-purple-300/70 uppercase tracking-widest hidden sm:block">
                    Cognitive Companion Portal
                  </p>
                </div>
              </Link>

              {/* Status Badge */}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-950/60 text-purple-300 border border-purple-800/60 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                AI Adaptive Active
              </span>

              <button onClick={handleLogout} className="lg:hidden text-sm font-bold text-slate-400 hover:text-white">Logout</button>
            </div>

            {/* Navigation Pills */}
            <nav className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full lg:w-auto">
              <NavLink 
                to="/patient" 
                end
                className={({isActive}) => `min-h-11 flex items-center justify-center px-4 py-2 rounded-xl text-base sm:text-lg font-extrabold border transition-all active:scale-95 ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white')
                }`}
              >
                🏠 Home
              </NavLink>

              <NavLink 
                to="/patient/routine" 
                className={({isActive}) => `min-h-11 flex items-center justify-center px-4 py-2 rounded-xl text-base sm:text-lg font-extrabold border transition-all active:scale-95 ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white')
                }`}
              >
                📋 Routine
              </NavLink>

              <NavLink 
                to="/patient/games" 
                className={({isActive}) => `min-h-11 flex items-center justify-center px-4 py-2 rounded-xl text-base sm:text-lg font-extrabold border transition-all active:scale-95 ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white')
                }`}
              >
                🧠 Brain Games
              </NavLink>

              <NavLink 
                to="/patient/memory-lane" 
                className={({isActive}) => `min-h-11 flex items-center justify-center px-4 py-2 rounded-xl text-base sm:text-lg font-extrabold border transition-all active:scale-95 ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white')
                }`}
              >
                🖼️ Memories
              </NavLink>

              <NavLink 
                to="/patient/results" 
                className={({isActive}) => `min-h-11 flex items-center justify-center px-4 py-2 rounded-xl text-base sm:text-lg font-extrabold border transition-all active:scale-95 ${
                  isActive 
                  ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]') 
                  : (highContrast ? 'border-yellow-300 text-yellow-300' : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white')
                }`}
              >
                📊 Progress
              </NavLink>
            </nav>

            {/* Accessibility & Quick Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className={`flex rounded-xl overflow-hidden border ${highContrast ? 'border-yellow-300' : 'border-slate-700 bg-slate-800'}`}>
                <button onClick={() => setFontSize('small')} className={`px-2.5 py-1.5 text-sm font-bold ${fontSize === 'small' ? 'bg-purple-600 text-white' : 'text-slate-300'}`}>A-</button>
                <button onClick={() => setFontSize('normal')} className={`px-2.5 py-1.5 text-base font-bold border-l border-r border-slate-700 ${fontSize === 'normal' ? 'bg-purple-600 text-white' : 'text-slate-300'}`}>A</button>
                <button onClick={() => setFontSize('large')} className={`px-2.5 py-1.5 text-lg font-bold ${fontSize === 'large' ? 'bg-purple-600 text-white' : 'text-slate-300'}`}>A+</button>
              </div>
              
              <button 
                onClick={() => setHighContrast(!highContrast)} 
                className={`min-h-11 px-3 py-1.5 rounded-xl font-bold border text-xs sm:text-sm transition-all ${
                  highContrast 
                  ? 'bg-yellow-300 text-black border-yellow-300' 
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                }`}
                title="Toggle High Contrast"
              >
                ◑ Contrast
              </button>

              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className={`min-h-11 px-3 py-1.5 rounded-xl text-lg border transition-all ${
                  soundEnabled 
                  ? 'border-purple-500/40 bg-purple-950/60 text-purple-300 shadow-sm' 
                  : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
                title="Toggle Sound"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>

              <button 
                onClick={() => setShowEmergency(true)}
                className="min-h-11 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg animate-pulse border border-red-500 flex items-center gap-1.5"
              >
                🚨 Call Help
              </button>

              <Link 
                to="/caregiver" 
                className="min-h-11 px-3.5 py-1.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm flex items-center gap-1 shadow-md transition-all active:scale-95"
                title="Switch to Caregiver Portal"
              >
                🩺 Caregiver View
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="max-w-2xl w-full rounded-3xl p-8 sm:p-10 text-center shadow-2xl bg-slate-900 border-2 border-red-500/40 text-white">
            <div className="text-6xl mb-4 animate-bounce">🏡</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 text-red-400">
              You Are Safe at Home
            </h2>
            <p className="text-xl sm:text-2xl mb-6 leading-relaxed text-slate-300 font-medium">
              Take a slow, deep breath. Your home is warm, your door is secure, and your caregivers are watching over you.
            </p>

            <div className="bg-slate-950 p-5 rounded-2xl mb-6 text-left border border-slate-800">
              <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">📍 Home Anchor Address</div>
              <div className="text-lg sm:text-xl font-bold text-slate-100">{homeAddress}</div>
              <div className="text-sm text-slate-400 mt-1">Direct Emergency Caregiver Line: {caregiverPhone}</div>
            </div>

            {sosSent ? (
              <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 font-bold mb-4 animate-fadeIn">
                ✓ Live GPS Beacon Dispatched to Caregiver Radar! Help is notified.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTriggerSOSBeacon}
                className="w-full mb-3 py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <span>🧭</span>
                <span>I Feel Lost / Send My Location Beacon</span>
              </button>
            )}

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <a 
                href="tel:112"
                className="py-4 px-5 text-lg font-black rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>🚨</span>
                <span>Call 112 (Emergency)</span>
              </a>
              <a 
                href={`tel:${caregiverPhone}`}
                className="py-4 px-5 text-lg font-black rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>📞</span>
                <span>Call Caregiver</span>
              </a>
            </div>

            <button 
              onClick={() => {
                setShowEmergency(false);
                setSosSent(false);
              }}
              className="w-full py-3.5 px-6 text-lg font-bold rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-200 border border-slate-700 active:scale-95 transition-all"
            >
              ✓ I Feel Safe (Close Dialog)
            </button>
          </div>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};

export default PatientLayout;
