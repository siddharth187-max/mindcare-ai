import React, { useState, useEffect, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { useVoice } from '../../hooks/useVoice';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const [patient, setPatient] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [resettingRoutine, setResettingRoutine] = useState(false);

  // Active Alert Modal State for Patient
  const [activeAlarmReminder, setActiveAlarmReminder] = useState(null);
  const promptedIds = useRef(new Set());
  const lastPromptTime = useRef({});

  const { user } = useAuth();
  const { soundEnabled, highContrast } = useOutletContext() || {};
  const { speak, playPop } = useVoice();

  const fetchReminders = async (pId) => {
    try {
      const res = await api.get(`/reminders/pending/${pId}`);
      const rems = res.data.reminders || [];
      setReminders(rems);

      // Check for due reminders that need popping audio alarm & flash modal
      const now = new Date();
      const dueReminder = rems.find(r => {
        const sched = new Date(r.scheduledTime);
        // If scheduled time has arrived or passed (within last 24 hrs) and not completed
        return sched <= now && r.status === 'pending';
      });

      if (dueReminder) {
        const remId = dueReminder._id;
        const nowMs = Date.now();
        const lastTime = lastPromptTime.current[remId] || 0;

        // Prompt if not prompted yet or if 60 seconds have passed since last prompt
        if (nowMs - lastTime > 60000) {
          lastPromptTime.current[remId] = nowMs;
          setActiveAlarmReminder(dueReminder);
          
          // Trigger popping sound & voice prompt
          if (soundEnabled) {
            playPop();
            setTimeout(() => {
              const count = (dueReminder.promptCount || 0) + 1;
              speak(`Gentle reminder: ${dueReminder.title}. Alert ${Math.min(3, count)} of 3. Please tap I Did This.`);
            }, 600);
          }

          // Record prompt on backend (tracks prompt 1, 2, 3 and auto-escalates if >= 3)
          try {
            const promptRes = await api.patch(`/reminders/${remId}/prompt`);
            if (promptRes.data.reminder) {
              setActiveAlarmReminder(promptRes.data.reminder);
            }
          } catch (pe) {
            console.error("Error recording prompt:", pe);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching reminders:", e);
    }
  };

  useEffect(() => {
    let pId = null;
    const fetchPatient = async () => {
      try {
        const response = await api.get('/patients/me');
        const pat = response.data.patient || response.data;
        setPatient(pat);
        if (pat && (pat._id || pat.id)) {
          pId = pat._id || pat.id;
          fetchReminders(pId);
        }
      } catch (err) {
        console.error('Error fetching patient profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();

    const timer = setInterval(() => setTime(new Date()), 1000);
    // Poll reminders every 12 seconds
    const reminderPoll = setInterval(() => {
      if (pId) fetchReminders(pId);
    }, 12000);

    return () => {
      clearInterval(timer);
      clearInterval(reminderPoll);
    };
  }, [soundEnabled]);

  const handleCompleteReminder = async (rem) => {
    try {
      await api.patch(`/reminders/${rem._id}/complete`);
      if (soundEnabled) {
        speak(`Wonderful! Thank you for completing ${rem.title}.`);
      }
      setActiveAlarmReminder(null);
      setReminders(prev => prev.filter(r => r._id !== rem._id));
    } catch (e) {
      console.error("Error completing reminder:", e);
    }
  };

  const handleSnooze = () => {
    if (!activeAlarmReminder) return;
    lastPromptTime.current[activeAlarmReminder._id] = Date.now() + 60000; // snooze for 1 minute
    setActiveAlarmReminder(null);
    if (soundEnabled) {
      speak("Reminder snoozed. We will gently remind you again shortly.");
    }
  };

  const handleResetRoutinesFromDashboard = async () => {
    if (!patient?._id && !patient?.id) return;
    if (!window.confirm("Reset all today's routine tasks to pending so you can do them again?")) return;
    setResettingRoutine(true);
    try {
      const pid = patient._id || patient.id;
      await api.post(`/routines/reset/${pid}`);
      if (soundEnabled) {
        speak("Your routine tasks have been reset for you!");
      }
      alert("✅ All routine tasks have been reset to pending!");
    } catch (e) {
      console.error("Error resetting routines:", e);
    } finally {
      setResettingRoutine(false);
    }
  };

  const getPeriod = (hour) => {
    if (hour >= 5 && hour < 12) return { name: 'Morning', icon: '🌅', color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30' };
    if (hour >= 12 && hour < 17) return { name: 'Afternoon', icon: '☀️', color: 'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    if (hour >= 17 && hour < 21) return { name: 'Evening', icon: '🌆', color: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30' };
    return { name: 'Night', icon: '🌙', color: 'from-indigo-600/30 to-purple-900/30 text-indigo-300 border-indigo-500/30' };
  };

  const period = getPeriod(time.getHours());
  const formattedTime = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDate = time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const patientDisplayName = patient?.name || user?.name || 'Friend';
  const greetingText = `Good ${period.name}, ${patientDisplayName}. It is ${time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} on ${formattedDate}. You are safe in your home.`;

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
    ? 'bg-black border-2 border-cyan-400 text-white' 
    : 'bg-slate-900/90 border border-slate-800 text-white shadow-xl';

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn pb-16">
      
      {/* 🔔 POPPING / FLASH REMINDER ALARM MODAL */}
      {activeAlarmReminder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-lg w-full rounded-3xl bg-slate-950 border-4 border-amber-500 shadow-[0_0_60px_rgba(245,158,11,0.5)] p-6 sm:p-8 text-center relative overflow-hidden animate-pulse">
            {/* Flashing Beacon */}
            <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(245,158,11,0.8)]">
              🔔
            </div>

            <div className="inline-block px-4 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs sm:text-sm font-black uppercase tracking-wider mb-3">
              Alert {(activeAlarmReminder.promptCount || 1)} of 3 • Action Required
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
              {activeAlarmReminder.title}
            </h2>

            <p className="text-base sm:text-lg text-amber-200 font-bold mb-6">
              Scheduled for: {new Date(activeAlarmReminder.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
            </p>

            {(activeAlarmReminder.promptCount || 1) >= 3 && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl mb-6 text-rose-300 text-xs sm:text-sm font-bold">
                ⚠️ Final Alert: If not acknowledged, your caregiver Sarah will be notified with sound immediately.
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleCompleteReminder(activeAlarmReminder)}
                className="w-full min-h-16 py-4 px-8 rounded-2xl text-xl sm:text-2xl font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <span>✅</span>
                <span>I Did This (Mark Done)</span>
              </button>

              <div className="flex gap-3">
                {soundEnabled && (
                  <button
                    onClick={() => {
                      playPop();
                      speak(`Reminder: ${activeAlarmReminder.title}`);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <span>🔊</span>
                    <span>Replay Sound</span>
                  </button>
                )}
                <button
                  onClick={handleSnooze}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <span>⏰</span>
                  <span>Snooze (1 Min)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Orientation & Live Clock Card */}
      <div className={`p-6 sm:p-10 rounded-3xl ${cardStyle} shadow-[0_0_30px_rgba(147,51,234,0.15)] relative overflow-hidden`}>
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center relative z-10">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-base sm:text-lg font-black bg-gradient-to-r border shadow-sm mb-4">
            <span className="text-2xl">{period.icon}</span>
            <span className="uppercase tracking-wider">{period.name} Time</span>
          </div>

          <div className="my-2">
            <p className="text-4xl sm:text-7xl font-black tracking-tight text-white font-mono drop-shadow-md">
              {formattedTime}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-purple-300 mt-2">
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

      {/* ACTIVE REMINDERS SECTION */}
      {reminders.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl animate-bounce">🔔</span>
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-300">Caregiver Reminders</h3>
                <p className="text-sm text-amber-200/80 font-bold">Popping sound & flash notifications active</p>
              </div>
            </div>
            <span className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs sm:text-sm font-black">
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
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-amber-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-3xl flex-shrink-0">
                      ⏰
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl sm:text-2xl font-black text-white">{rem.title}</h4>
                        {rem.promptCount > 0 && (
                          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                            Prompt {rem.promptCount}/3
                          </span>
                        )}
                      </div>
                      <p className="text-base font-bold text-amber-300">
                        Scheduled for: <strong className="text-white text-lg">{timeStr}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                    {soundEnabled && (
                      <button
                        onClick={() => {
                          playPop();
                          speak(`Reminder: ${rem.title}. Scheduled for ${timeStr}`);
                        }}
                        className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-2xl active:scale-95 transition-all"
                        title="Read aloud with popping chime"
                      >
                        🔊
                      </button>
                    )}
                    <button
                      onClick={() => handleCompleteReminder(rem)}
                      className="flex-1 sm:flex-none px-6 sm:px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
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

      {/* Main Feature Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Today's Routine Card */}
        <div className={`p-6 sm:p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 ${cardStyle} hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]`}>
          <div>
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-3xl mb-4 shadow-inner">
              📋
            </div>
            <h3 className="text-2xl font-black mb-2 text-white">Daily Routine</h3>
            <p className="text-sm font-medium text-slate-300 mb-6 leading-relaxed">
              Step-by-step checklist of meals, hygiene, medications, and wellness activities.
            </p>
          </div>
          <div className="space-y-2">
            <Link
              to="/patient/routine"
              className="w-full min-h-14 py-3.5 px-6 rounded-2xl text-lg font-black flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            >
              Open Checklist →
            </Link>
            <button
              onClick={handleResetRoutinesFromDashboard}
              disabled={resettingRoutine}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔄</span>
              <span>{resettingRoutine ? 'Resetting...' : 'Reset Tasks to Pending'}</span>
            </button>
          </div>
        </div>

        {/* Cognitive Games Card */}
        <div className={`p-6 sm:p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 ${cardStyle} hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]`}>
          <div>
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center text-3xl mb-4 shadow-inner">
              🧠
            </div>
            <h3 className="text-2xl font-black mb-2 text-white">Brain Games</h3>
            <p className="text-sm font-medium text-slate-300 mb-6 leading-relaxed">
              Calming memory cards, melodic chimes, and everyday object matching games.
            </p>
          </div>
          <Link
            to="/patient/games"
            className="w-full min-h-14 py-3.5 px-6 rounded-2xl text-lg font-black flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            Play Activities →
          </Link>
        </div>

        {/* My Progress Card */}
        <div className={`p-6 sm:p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 ${cardStyle} hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]`}>
          <div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-3xl mb-4 shadow-inner">
              📊
            </div>
            <h3 className="text-2xl font-black mb-2 text-white">My Progress</h3>
            <p className="text-sm font-medium text-slate-300 mb-6 leading-relaxed">
              See your activity achievements, scores, and cognitive session completions.
            </p>
          </div>
          <Link
            to="/patient/results"
            className="w-full min-h-14 py-3.5 px-6 rounded-2xl text-lg font-black flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            View Achievements →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
