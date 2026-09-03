import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useVoice } from '../../hooks/useVoice';
import LoadingSpinner from '../../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const outletCtx = useOutletContext() || {};
  const soundEnabled = outletCtx.soundEnabled ?? true;
  const highContrast = outletCtx.highContrast ?? false;
  const { speak } = useVoice();
  const [isSpeakingState, setIsSpeakingState] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await api.get('/patients/me');
        setPatient(res.data.patient || res.data);
      } catch (err) {
        console.error('Error fetching patient profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();

    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPeriod = (hour) => {
    if (hour >= 5 && hour < 12) return { name: 'Morning', icon: '🌅', color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30' };
    if (hour >= 12 && hour < 17) return { name: 'Afternoon', icon: '☀️', color: 'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    if (hour >= 17 && hour < 21) return { name: 'Evening', icon: '🌆', color: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30' };
    return { name: 'Night', icon: '🌙', color: 'from-indigo-600/30 to-purple-900/30 text-indigo-300 border-indigo-500/30' };
  };

  const period = getPeriod(time.getHours());
  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const patientDisplayName = patient?.name || user?.name || 'Friend';
  const greetingText = `Good ${period.name}, ${patientDisplayName}. It is ${formattedTime} on ${formattedDate}. You are safe in your home.`;

  const handleSpeakGreeting = () => {
    if (soundEnabled) {
      setIsSpeakingState(true);
      speak(greetingText);
      setTimeout(() => setIsSpeakingState(false), 5000);
    }
  };

  if (loading) return (
    <div className="p-12 text-center text-purple-300 flex flex-col items-center gap-3">
      <span className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></span>
      <span className="text-lg font-bold">Connecting to MindCare AI...</span>
    </div>
  );

  const cardStyle = highContrast 
    ? 'bg-black border-2 border-yellow-300 text-yellow-300' 
    : 'bg-slate-900/90 border border-slate-800 text-white shadow-xl';

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Hero Orientation & Clock Card */}
      <div className={`${cardStyle} rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden border-t-4 ${
        highContrast ? 'border-t-yellow-300' : 'border-t-purple-500 shadow-[0_0_30px_rgba(147,51,234,0.15)]'
      }`}>
        
        {/* Ambient Purple Gradient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm mb-4 border ${period.color}`}>
            <span>{period.icon}</span>
            <span>{period.name} Period</span>
          </div>

          <div className="flex flex-col items-center justify-center my-3">
            <h2 className="text-6xl sm:text-8xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_20px_rgba(168,85,247,0.35)]">
              {formattedTime}
            </h2>
            <p className="text-2xl sm:text-3xl font-bold mt-2 text-purple-200">
              {formattedDate}
            </p>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold mt-6 mb-3 text-white">
            Good {period.name}, <span className="text-purple-400">{patientDisplayName}</span>!
          </h1>
          
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-slate-950/80 border border-purple-900/40 my-6 shadow-inner">
            <p className="text-xl sm:text-2xl font-bold text-purple-200 flex items-center justify-center gap-2.5">
              <span>🏡</span>
              <span>You are in your home, safe and comfortable.</span>
            </p>
          </div>

          {soundEnabled && (
            <button 
              onClick={handleSpeakGreeting}
              disabled={isSpeakingState}
              className={`min-h-14 py-3 px-8 rounded-2xl text-xl font-bold flex items-center justify-center mx-auto gap-3 transition-all active:scale-95 shadow-lg ${
                isSpeakingState 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]'
              }`}
            >
              <span className="text-2xl">🔊</span>
              <span>{isSpeakingState ? 'Reading Aloud...' : 'Read Time & Greeting'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Routine */}
        <Link 
          to="/patient/routine"
          className={`${cardStyle} rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:border-blue-500/50 min-h-[260px] group border-b-4 border-b-blue-500`}
        >
          <div className="w-20 h-20 rounded-2xl bg-blue-950/80 border border-blue-500/30 text-blue-400 flex items-center justify-center text-5xl mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            📋
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-1.5 text-white">
            Today's Routine
          </h3>
          <p className="text-lg font-semibold text-slate-300">
            View activities & check off tasks
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-blue-400 font-bold text-sm bg-blue-950/60 border border-blue-800/60 px-4 py-1.5 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
            Open Checklist ➔
          </span>
        </Link>

        {/* Card 2: Games */}
        <Link 
          to="/patient/games"
          className={`${cardStyle} rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:border-purple-500/50 min-h-[260px] group border-b-4 border-b-purple-500`}
        >
          <div className="w-20 h-20 rounded-2xl bg-purple-950/80 border border-purple-500/30 text-purple-400 flex items-center justify-center text-5xl mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            🧠
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-1.5 text-white">
            Brain Activities
          </h3>
          <p className="text-lg font-semibold text-slate-300">
            Gentle memory & pattern exercises
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-purple-300 font-bold text-sm bg-purple-950/60 border border-purple-800/60 px-4 py-1.5 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
            Play Activities ➔
          </span>
        </Link>

        {/* Card 3: Results */}
        <Link 
          to="/patient/results"
          className={`${cardStyle} rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:border-emerald-500/50 min-h-[260px] group border-b-4 border-b-emerald-500`}
        >
          <div className="w-20 h-20 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-5xl mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            📊
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-1.5 text-white">
            My Progress
          </h3>
          <p className="text-lg font-semibold text-slate-300">
            View completed sessions & scores
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-emerald-400 font-bold text-sm bg-emerald-950/60 border border-emerald-800/60 px-4 py-1.5 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
            View History ➔
          </span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
