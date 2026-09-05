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
  const [resetting, setResetting] = useState(false);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  
  const { soundEnabled, highContrast } = useOutletContext() || {};
  const { speak, playPop } = useVoice();
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
    if (routine.completed) {
      // Toggle back to pending (undo)
      try {
        await api.patch(`/routines/${routine._id}/uncomplete`);
        setRoutines(prev => 
          prev.map(r => r._id === routine._id ? { ...r, completed: false } : r)
        );
      } catch (err) {
        console.error("Error uncompleting routine:", err);
      }
      return;
    }
    
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

  const handleResetAll = async () => {
    if (!window.confirm("Start fresh and reset all activities to do them again?")) return;
    setResetting(true);
    try {
      await api.post(`/routines/reset/${patientId}`);
      await fetchRoutines(patientId);
      if (soundEnabled) {
        speak("Daily activities have been reset. Have a wonderful day!");
      }
    } catch (err) {
      console.error("Error resetting routines:", err);
    } finally {
      setResetting(false);
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      <ConfettiCanvas ref={confettiRef} />
      
      {/* Top Banner & Progress Meter */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-2">
          <Link 
            to="/patient" 
            className="px-5 py-2.5 bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#263B42] border border-[#C8DDD4] rounded-2xl shadow-sm font-bold text-sm transition-all flex items-center gap-2 active:scale-95"
          >
            ← Return Home
          </Link>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#263B42]">📋 Daily Routine</h1>
            <p className="text-sm font-medium text-[#566D75] mt-0.5">Step-by-step guidance for a comfortable day</p>
          </div>
          
          <button
            onClick={handleResetAll}
            disabled={resetting}
            className="px-4 py-2 bg-[#FFFDF7] hover:bg-[#FBF4E4] text-[#D9A441] border border-[#EED7A6] rounded-2xl shadow-sm font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 active:scale-95"
            title="Reset all tasks so you can check them off again"
          >
            <span>🔄</span>
            <span>{resetting ? 'Resetting...' : 'Reset Checklist'}</span>
          </button>
        </div>
        
        {/* Progress Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <div className="flex justify-between items-center mb-3 text-lg sm:text-xl font-bold">
            <span className="text-[#263B42]">Today's Progress</span>
            <span className="text-[#397F7A] font-extrabold">{completedCount} of {totalCount} Done ({progressPercent}%)</span>
          </div>
          <div className="w-full h-5 bg-[#F7F3E8] rounded-full overflow-hidden p-1 border border-[#EADBCC]">
            <div 
              className="h-full rounded-full transition-all duration-700 bg-[#397F7A]"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            ></div>
          </div>

          {progressPercent === 100 && totalCount > 0 && (
            <div className="mt-4 p-3.5 bg-[#EBF5ED] border border-[#B7D9BE] rounded-2xl flex items-center justify-between">
              <span className="text-[#4F8A5B] font-bold text-sm">🎉 Splendid! You have completed all of today's activities!</span>
              <button
                onClick={handleResetAll}
                className="text-xs bg-[#4F8A5B] hover:bg-[#43774E] text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm active:scale-95"
              >
                🔄 Reset Checklist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE TIMED REMINDERS SECTION */}
      {reminders.length > 0 && (
        <div className="p-6 rounded-3xl bg-[#FFFDF7] border-2 border-[#EED7A6] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl text-[#D9A441]">🔔</span>
              <div>
                <h3 className="text-2xl font-extrabold text-[#263B42]">Caregiver Reminders</h3>
                <p className="text-xs text-[#566D75] font-semibold">Important scheduled alerts</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#FBF4E4] text-[#D9A441] border border-[#EED7A6] rounded-full text-xs font-bold">
              {reminders.length} PENDING
            </span>
          </div>

          <div className="space-y-3">
            {reminders.map(rem => {
              const d = new Date(rem.scheduledTime);
              const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

              return (
                <div 
                  key={rem._id}
                  className="p-4 rounded-2xl bg-[#F7F3E8] border border-[#EADBCC] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFFDF7] text-[#D9A441] border border-[#EED7A6] flex items-center justify-center text-2xl flex-shrink-0">
                      ⏰
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#263B42]">{rem.title}</h4>
                      <p className="text-sm font-semibold text-[#566D75]">Scheduled for {timeStr}</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                    {soundEnabled && (
                      <button
                        onClick={() => {
                          playPop();
                          speak(`Reminder: ${rem.title}. Scheduled for ${timeStr}`);
                        }}
                        className="p-3 rounded-xl bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4] text-xl active:scale-95 shadow-sm"
                        title="Read aloud"
                      >
                        🔊
                      </button>
                    )}
                    <button
                      onClick={() => handleCompleteReminder(rem)}
                      className="flex-1 sm:flex-none px-6 py-3 bg-[#4F8A5B] hover:bg-[#43774E] text-white rounded-xl font-bold text-base shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
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
            className={`min-h-12 px-6 sm:px-8 py-2.5 rounded-2xl text-base sm:text-lg font-bold border transition-all active:scale-98 shadow-sm ${
              filter === f 
              ? 'bg-[#397F7A] border-[#397F7A] text-white' 
              : 'bg-[#FFFDF7] border-[#C8DDD4] text-[#263B42] hover:bg-[#EAF2EE]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Routine Item Cards */}
      <div className="space-y-4">
        {getFilteredRoutines().length === 0 ? (
          <div className="text-center p-12 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC]">
            <div className="text-5xl mb-3">☀️</div>
            <p className="text-xl font-bold text-[#263B42]">No activities scheduled for this time.</p>
            <p className="text-sm text-[#566D75] mt-1">Take some time to rest and relax.</p>
          </div>
        ) : (
          getFilteredRoutines().map(routine => {
            const timeStr = formatTime(routine.scheduledTime);
            const isDone = routine.completed;

            return (
              <div 
                key={routine._id} 
                className={`flex flex-col sm:flex-row items-center justify-between p-5 sm:p-6 rounded-3xl transition-all duration-200 border ${
                  isDone 
                  ? 'bg-[#EBF5ED] border-[#B7D9BE] text-[#263B42]' 
                  : 'bg-[#FFFDF7] border-[#EADBCC] hover:border-[#8DB7A5] text-[#263B42] shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
                  <div className="text-4xl w-16 h-16 flex items-center justify-center rounded-2xl bg-[#EAF2EE] border border-[#C8DDD4] text-[#397F7A] flex-shrink-0">
                    {getCategoryIcon(routine.category)}
                  </div>
                  <div>
                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold mb-1 bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4]">
                      ⏰ {timeStr}
                    </span>
                    <h3 className={`text-xl sm:text-2xl font-extrabold ${isDone ? 'line-through text-[#566D75]' : 'text-[#263B42]'}`}>
                      {routine.title}
                    </h3>
                    {routine.description && (
                      <p className="text-sm font-medium text-[#566D75] mt-0.5">{routine.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
                  {soundEnabled && (
                    <button 
                      onClick={() => speak(`At ${timeStr}, ${routine.title}`)}
                      className="min-h-14 w-14 flex items-center justify-center rounded-2xl text-2xl border border-[#C8DDD4] bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#397F7A] transition-all active:scale-95 shadow-sm"
                      title="Read aloud"
                    >
                      🔊
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleComplete(routine)}
                    className={`min-h-14 px-7 py-3 rounded-2xl text-lg font-bold shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2 ${
                      isDone
                      ? 'bg-[#8DB7A5] hover:bg-[#79A391] text-[#263B42] cursor-pointer'
                      : 'bg-[#4F8A5B] hover:bg-[#43774E] text-white'
                    }`}
                    title={isDone ? "Click to uncheck/undo" : "Click to mark done"}
                  >
                    {isDone ? (
                      <><span>✅</span> Done (Undo?)</>
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
