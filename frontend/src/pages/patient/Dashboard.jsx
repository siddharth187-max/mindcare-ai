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
    if (hour >= 5 && hour < 12) return { name: 'Morning', icon: '🌅', color: 'from-amber-400 to-orange-400' };
    if (hour >= 12 && hour < 17) return { name: 'Afternoon', icon: '☀️', color: 'from-blue-400 to-cyan-400' };
    if (hour >= 17 && hour < 21) return { name: 'Evening', icon: '🌆', color: 'from-purple-400 to-indigo-400' };
    return { name: 'Night', icon: '🌙', color: 'from-indigo-600 to-slate-800' };
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

  if (loading) return <LoadingSpinner message="Opening MindCare..." />;

  const cardStyle = highContrast ? 'bg-black border-2 border-yellow-300' : 'bg-white/95 backdrop-blur-md shadow-xl border border-slate-100';
  const textStyle = highContrast ? 'text-yellow-300' : 'text-slate-800';

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Hero Orientation & Clock Card */}
      <div className={`${cardStyle} rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden border-t-8 ${highContrast ? 'border-t-yellow-300' : 'border-t-emerald-600'}`}>
        
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-sm mb-4 border border-emerald-200 shadow-sm">
            <span>{period.icon}</span>
            <span>{period.name} Period</span>
          </div>

          <div className="flex flex-col items-center justify-center my-3">
            <h2 className={`text-6xl sm:text-8xl font-black tracking-tight ${textStyle} font-mono`}>
              {formattedTime}
            </h2>
            <p className={`text-2xl sm:text-3xl font-bold mt-2 ${highContrast ? 'text-yellow-200' : 'text-slate-600'}`}>
              {formattedDate}
            </p>
          </div>

          <h1 className={`text-3xl sm:text-5xl font-extrabold mt-6 mb-3 ${textStyle}`}>
            Good {period.name}, {patientDisplayName}!
          </h1>
          
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 my-6">
            <p className={`text-xl sm:text-2xl font-bold ${highContrast ? 'text-yellow-100' : 'text-emerald-900'} flex items-center justify-center gap-2`}>
              <span>🏡</span>
              <span>You are in your home, safe and comfortable.</span>
            </p>
          </div>

          {soundEnabled && (
            <button 
              onClick={handleSpeakGreeting}
              disabled={isSpeakingState}
              className={`min-h-14 py-3 px-8 rounded-2xl text-xl font-bold flex items-center justify-center mx-auto gap-3 transition-all active:scale-95 shadow-md ${
                isSpeakingState 
                ? 'bg-slate-400 text-white cursor-not-allowed' 
                : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow-lg'
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
          className={`${cardStyle} rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:scale-102 hover:shadow-2xl transition-all min-h-[260px] group border-b-4 border-b-blue-600`}
        >
          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-5xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
            📋
          </div>
          <h3 className={`text-2xl sm:text-3xl font-extrabold mb-1.5 ${textStyle}`}>
            Today's Routine
          </h3>
          <p className={`text-lg font-semibold ${highContrast ? 'text-yellow-100' : 'text-slate-600'}`}>
            View activities & check off tasks
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-blue-700 font-bold text-sm bg-blue-50 px-3.5 py-1.5 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
            Open Checklist ➔
          </span>
        </Link>

        {/* Card 2: Games */}
        <Link 
          to="/patient/games"
          className={`${cardStyle} rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:scale-102 hover:shadow-2xl transition-all min-h-[260px] group border-b-4 border-b-purple-600`}
        >
          <div className="w-20 h-20 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-5xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
            🧠
          </div>
          <h3 className={`text-2xl sm:text-3xl font-extrabold mb-1.5 ${textStyle}`}>
            Brain Activities
          </h3>
          <p className={`text-lg font-semibold ${highContrast ? 'text-yellow-100' : 'text-slate-600'}`}>
            Gentle memory & pattern exercises
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-purple-700 font-bold text-sm bg-purple-50 px-3.5 py-1.5 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-colors">
            Play Activities ➔
          </span>
        </Link>

        {/* Card 3: Results */}
        <Link 
          to="/patient/results"
          className={`${cardStyle} rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:scale-102 hover:shadow-2xl transition-all min-h-[260px] group border-b-4 border-b-teal-600`}
        >
          <div className="w-20 h-20 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-5xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
            📊
          </div>
          <h3 className={`text-2xl sm:text-3xl font-extrabold mb-1.5 ${textStyle}`}>
            My Progress
          </h3>
          <p className={`text-lg font-semibold ${highContrast ? 'text-yellow-100' : 'text-slate-600'}`}>
            View completed sessions & scores
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-teal-700 font-bold text-sm bg-teal-50 px-3.5 py-1.5 rounded-full group-hover:bg-teal-600 group-hover:text-white transition-colors">
            View History ➔
          </span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
