import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useVoice } from '../../hooks/useVoice';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfettiCanvas from '../../components/ConfettiCanvas';

const Routine = () => {
  const [routines, setRoutines] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  
  const { soundEnabled, highContrast } = useOutletContext() || {};
  const { speak } = useVoice();
  const confettiRef = useRef();

  const fetchReminders = async (pId) => {
    try {
      const res = await api.get(`/reminders/pending/${pId}`);
      setReminders(res.data.reminders || []);
    } catch (e) {
      console.error("Error fetching reminders in routine:", e);
    }
  };

  const fetchRoutines = async (id) => {
    try {
      const res = await api.get(`/routines/today/${id}`);
      setRoutines(res.data.routines || res.data || []);
    } catch (err) {
      console.error("Error fetching routines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let pid = null;
    const init = async () => {
      try {
        const pRes = await api.get('/patients/me');
        const pat = pRes.data.patient || pRes.data;
        if (pat && (pat._id || pat.id)) {
          pid = pat._id || pat.id;
          setPatientId(pid);
          await Promise.all([fetchRoutines(pid), fetchReminders(pid)]);
        } else {
          setError("Patient profile not found. Please ask your caregiver to set it up.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching patient:", err);
        setError("Could not load your profile. Please try again later.");
        setLoading(false);
      }
    };
    init();

    // Auto-poll reminders every 15 seconds
    const interval = setInterval(() => {
      if (pid) fetchReminders(pid);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleComplete = async (routine) => {
    if (routine.completed) return;
    
    try {
      await api.patch(`/routines/${routine._id}/complete`);
      
      if (confettiRef.current) {
        confettiRef.current.triggerConfetti();
      }
      if (soundEnabled) {
        speak("Wonderful job completing " + routine.title + "!");
      }

      setRoutines(prev => 
        prev.map(r => r._id === routine._id ? { ...r, completed: true } : r)
      );
    } catch (err) {
      console.error("Error completing routine:", err);
    }
  };

  const handleCompleteReminder = async (rem) => {
    try {
      await api.patch(`/reminders/${rem._id}/complete`);
      if (confettiRef.current) {
        confettiRef.current.triggerConfetti();
      }
      if (soundEnabled) {
        speak(`Thank you for completing your reminder: ${rem.title}`);
      }
      setReminders(prev => prev.filter(r => r._id !== rem._id));
    } catch (e) {
      console.error("Error completing reminder:", e);
    }
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      medicine: '💊', hygiene: '🪥', meal: '🍳', exercise: '🚶', 
      cognitive: '🧠', sleep: '🌙', other: '⭐'
    };
    return icons[cat] || '📋';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes(':')) {
      const [h, m] = timeStr.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m < 10 ? '0' + m : m} ${period}`;
    }
    return timeStr;
  };

  const getFilteredRoutines = () => {
    if (filter === 'All') return routines;
    return routines.filter(r => {
      const hour = parseInt(r.scheduledTime?.split(':')[0], 10) || 0;
      if (filter === 'Morning') return hour >= 5 && hour < 12;
      if (filter === 'Afternoon') return hour >= 12 && hour < 17;
      if (filter === 'Evening') return hour >= 17;
      return true;
    });
  };

  if (loading) return <LoadingSpinner message="Loading your daily checklist..." />;

  const completedCount = routines.filter(r => r.completed).length;
  const totalCount = routines.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const cardStyle = highContrast 
    ? 'bg-black border-2 border-cyan-400 text-white' 
    : 'bg-slate-900/90 border border-slate-800 text-white shadow-xl';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      <ConfettiCanvas ref={confettiRef} />
      
      {/* Top Banner & Progress Meter */}
      <div className="text-center space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-purple-900/30 pb-4">
          <Link 
            to="/patient" 
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl shadow-sm font-bold text-sm transition-all flex items-center gap-2 active:scale-95"
          >
            ← Return Home
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">📋 Today's Daily Routine</h1>
            <p className="text-sm font-bold text-purple-300 mt-0.5">Stay refreshed and on track throughout your day</p>
          </div>
          <div className="w-28 hidden sm:block"></div>
        </div>
        
        {/* Glowing Progress Card */}
        <div className={`p-6 sm:p-8 rounded-3xl ${cardStyle} shadow-[0_0_25px_rgba(16,185,129,0.15)] relative overflow-hidden`}>
          <div className="flex justify-between items-center mb-3 text-lg sm:text-2xl font-black">
            <span className="text-purple-200">Daily Completion Goal</span>
            <span className="text-emerald-400 font-mono">{completedCount} of {totalCount} Done ({progressPercent}%)</span>
          </div>
          <div className="w-full h-6 sm:h-7 bg-slate-950 rounded-full overflow-hidden p-1 border border-slate-800">
            <div 
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ACTIVE TIMED REMINDERS SECTION */}
      {reminders.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl animate-bounce">🔔</span>
              <div>
                <h3 className="text-2xl font-extrabold text-amber-300">Caregiver Reminders</h3>
                <p className="text-xs text-amber-200/80 font-bold">Important scheduled alerts</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black">
              {reminders.length} PENDING
            </span>
          </div>

          <div className="space-y-3">
            {reminders.map(rem => {
              const d = new Date(rem.scheduledTime);
              const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={rem._id}
                  className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                      ⏰
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white">{rem.title}</h4>
                      <p className="text-sm font-bold text-amber-300">Scheduled for {timeStr}</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                    {soundEnabled && (
                      <button
                        onClick={() => speak(`Reminder: ${rem.title}. Scheduled for ${timeStr}`)}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xl active:scale-95"
                        title="Read aloud"
                      >
                        🔊
                      </button>
                    )}
                    <button
                      onClick={() => handleCompleteReminder(rem)}
                      className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-base shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>✓</span>
                      <span>I Did This</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Filter Pills */}
      <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
        {['All', 'Morning', 'Afternoon', 'Evening'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-12 px-6 sm:px-8 py-2.5 rounded-2xl text-base sm:text-lg font-black border transition-all active:scale-95 shadow-md ${
              filter === f 
              ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
              : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Routine Item Cards */}
      <div className="space-y-4">
        {getFilteredRoutines().length === 0 ? (
          <div className={`text-center p-12 rounded-3xl ${cardStyle}`}>
            <div className="text-6xl mb-4">☀️</div>
            <p className="text-2xl font-extrabold text-slate-300">No activities scheduled for this time.</p>
            <p className="text-base text-slate-500 mt-1">Take some time to rest and relax.</p>
          </div>
        ) : (
          getFilteredRoutines().map(routine => {
            const timeStr = formatTime(routine.scheduledTime);
            const isDone = routine.completed;

            return (
              <div 
                key={routine._id} 
                className={`flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl transition-all duration-200 border ${
                  isDone 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-slate-300' 
                  : 'bg-slate-900/90 border-slate-800 hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] text-white'
                }`}
              >
                <div className="flex items-center gap-5 w-full sm:w-auto">
                  <div className="text-5xl w-20 h-20 flex items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 shadow-inner flex-shrink-0">
                    {getCategoryIcon(routine.category)}
                  </div>
                  <div>
                    <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black mb-1 bg-blue-950 text-blue-300 border border-blue-800 shadow-sm">
                      ⏰ {timeStr}
                    </span>
                    <h3 className={`text-2xl sm:text-3xl font-extrabold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                      {routine.title}
                    </h3>
                    {routine.description && (
                      <p className="text-sm font-medium text-slate-400 mt-0.5">{routine.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
                  {soundEnabled && (
                    <button 
                      onClick={() => speak(`At ${timeStr}, ${routine.title}`)}
                      className="min-h-14 w-14 flex items-center justify-center rounded-2xl text-2xl border bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 transition-all active:scale-95 shadow-sm"
                      title="Read aloud"
                    >
                      🔊
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleComplete(routine)}
                    disabled={isDone}
                    className={`min-h-14 px-7 py-3 rounded-2xl text-xl font-extrabold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isDone
                      ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]'
                    }`}
                  >
                    {isDone ? (
                      <><span>✅</span> Done</>
                    ) : (
                      <><span>✓</span> I Did This</>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Routine;
