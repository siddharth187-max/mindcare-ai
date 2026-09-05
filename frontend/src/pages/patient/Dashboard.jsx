import React, { useState, useEffect, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { useVoice } from '../../hooks/useVoice';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const [patient, setPatient] = useState(null);
  const [caregiverInfo, setCaregiverInfo] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [resettingRoutine, setResettingRoutine] = useState(false);

  // Link Caregiver Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [caregiverEmailInput, setCaregiverEmailInput] = useState('');
  const [linkingLoading, setLinkingLoading] = useState(false);

  // Active Alert Modal State for Patient
  const [activeAlarmReminder, setActiveAlarmReminder] = useState(null);
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
        return sched <= now && r.status === 'pending';
      });

      if (dueReminder) {
        const remId = dueReminder._id;
        const nowMs = Date.now();
        const lastTime = lastPromptTime.current[remId] || 0;

        if (nowMs - lastTime > 60000) {
          lastPromptTime.current[remId] = nowMs;
          setActiveAlarmReminder(dueReminder);
          
          if (soundEnabled) {
            playPop();
            setTimeout(() => {
              const count = (dueReminder.promptCount || 0) + 1;
              speak(`Gentle reminder: ${dueReminder.title}. Please tap I Did This.`);
            }, 600);
          }

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

  const fetchPatientProfile = async () => {
    try {
      const response = await api.get('/patients/me');
      const pat = response.data.patient || response.data;
      setPatient(pat);
      if (response.data.caregiver) {
        setCaregiverInfo(response.data.caregiver);
      }
      if (pat && (pat._id || pat.id)) {
        fetchReminders(pat._id || pat.id);
      }
    } catch (err) {
      console.error('Error fetching patient profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientProfile();

    const timer = setInterval(() => setTime(new Date()), 1000);
    const reminderPoll = setInterval(() => {
      if (patient?._id || patient?.id) {
        fetchReminders(patient._id || patient.id);
      }
    }, 12000);

    return () => {
      clearInterval(timer);
      clearInterval(reminderPoll);
    };
  }, [soundEnabled]);

  const handleLinkCaregiver = async (e) => {
    e.preventDefault();
    setLinkingLoading(true);
    try {
      const res = await api.post('/patients/link-caregiver', {
        caregiverEmail: caregiverEmailInput,
      });
      alert(res.data.message);
      setCaregiverInfo(res.data.caregiver);
      setShowLinkModal(false);
      setCaregiverEmailInput('');
      fetchPatientProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Error linking caregiver');
    } finally {
      setLinkingLoading(false);
    }
  };

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
    lastPromptTime.current[activeAlarmReminder._id] = Date.now() + 60000;
    setActiveAlarmReminder(null);
    if (soundEnabled) {
      speak("Reminder snoozed. We will remind you again in a moment.");
    }
  };

  const handleResetRoutinesFromDashboard = async () => {
    if (!patient?._id && !patient?.id) return;
    if (!window.confirm("Reset all today's routine tasks so you can check them off again?")) return;
    setResettingRoutine(true);
    try {
      const pid = patient._id || patient.id;
      await api.post(`/routines/reset/${pid}`);
      if (soundEnabled) {
        speak("Your routine tasks have been reset for today!");
      }
      alert("✅ Routine tasks reset to active!");
    } catch (e) {
      console.error("Error resetting routines:", e);
    } finally {
      setResettingRoutine(false);
    }
  };

  const getPeriod = (hour) => {
    if (hour >= 5 && hour < 12) return { name: 'Morning', icon: '🌅' };
    if (hour >= 12 && hour < 17) return { name: 'Afternoon', icon: '☀️' };
    if (hour >= 17 && hour < 21) return { name: 'Evening', icon: '🌆' };
    return { name: 'Night', icon: '🌙' };
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
    <div className="p-12 text-center text-[#263B42] flex flex-col items-center gap-3">
      <span className="w-10 h-10 border-4 border-[#8DB7A5] border-t-[#397F7A] rounded-full animate-spin"></span>
      <span className="text-xl font-bold">Connecting to MindCare...</span>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn pb-16">
      
      {/* 🔔 REMINDER ALERT MODAL */}
      {activeAlarmReminder && (
        <div className="fixed inset-0 z-50 bg-[#263B42]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-lg w-full rounded-3xl bg-[#FFFDF7] border-2 border-[#D9A441] shadow-xl p-6 sm:p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#FBF4E4] border border-[#EED7A6] flex items-center justify-center text-4xl text-[#D9A441]">
              🔔
            </div>

            <div className="inline-block px-4 py-1 rounded-full bg-[#FBF4E4] text-[#D9A441] border border-[#EED7A6] text-xs sm:text-sm font-bold uppercase tracking-wider mb-3">
              Gentle Reminder
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#263B42] mb-2">
              {activeAlarmReminder.title}
            </h2>

            <p className="text-base sm:text-lg text-[#566D75] font-semibold mb-6">
              Scheduled for: {new Date(activeAlarmReminder.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleCompleteReminder(activeAlarmReminder)}
                className="w-full min-h-16 py-4 px-8 rounded-2xl text-xl font-bold bg-[#4F8A5B] hover:bg-[#43774E] text-white shadow-sm transition-all active:scale-98 flex items-center justify-center gap-3"
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
                    className="flex-1 py-3 px-4 rounded-xl bg-[#F7F3E8] border border-[#C8DDD4] text-[#263B42] font-bold text-sm hover:bg-[#EAF2EE] transition-all flex items-center justify-center gap-2"
                  >
                    <span>🔊</span>
                    <span>Replay Audio</span>
                  </button>
                )}
                <button
                  onClick={handleSnooze}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#F7F3E8] border border-[#C8DDD4] text-[#566D75] font-bold text-sm hover:bg-[#EAF2EE] transition-all flex items-center justify-center gap-2"
                >
                  <span>⏰</span>
                  <span>Snooze (1 Min)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔗 LINK CAREGIVER MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-[#263B42]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] p-6 sm:p-8 text-[#263B42] shadow-xl">
            <div className="text-center mb-5">
              <span className="text-4xl p-2.5 rounded-2xl bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4] inline-block mb-2">
                🩺
              </span>
              <h3 className="text-2xl font-extrabold">Connect Your Caregiver</h3>
              <p className="text-xs sm:text-sm text-[#566D75] mt-1">
                Enter your caregiver's email to link your account for live care coordination.
              </p>
            </div>

            <form onSubmit={handleLinkCaregiver} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#263B42] mb-1">
                  Caregiver Email Address
                </label>
                <input
                  type="email"
                  required
                  value={caregiverEmailInput}
                  onChange={(e) => setCaregiverEmailInput(e.target.value)}
                  placeholder="e.g. caregiver@mindcare.com"
                  className="w-full p-3.5 rounded-xl bg-[#FFFDF7] border border-[#C8DDD4] text-[#263B42] font-medium outline-none focus:border-[#397F7A]"
                />
              </div>

              {patient?.pairCode && (
                <div className="p-3.5 bg-[#F7F3E8] border border-[#EADBCC] rounded-2xl text-center">
                  <span className="text-xs text-[#566D75] block font-semibold">Your Quick Pairing Code</span>
                  <span className="text-2xl font-mono font-extrabold text-[#397F7A] tracking-wider">
                    {patient.pairCode}
                  </span>
                  <span className="text-[11px] text-[#566D75] block mt-0.5">Your caregiver can also enter this code from their portal.</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#F7F3E8] hover:bg-[#EAF2EE] border border-[#C8DDD4] text-[#566D75] font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkingLoading}
                  className="flex-1 py-3 rounded-xl bg-[#397F7A] hover:bg-[#2E6B66] text-white font-bold text-sm shadow-sm active:scale-98 transition-all"
                >
                  {linkingLoading ? 'Connecting...' : 'Link Caregiver ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Orientation & Live Clock Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm relative overflow-hidden">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-bold bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4]">
              <span className="text-xl">{period.icon}</span>
              <span className="uppercase tracking-wider">{period.name} Time</span>
            </div>

            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-bold bg-[#FBF4E4] text-[#D9A441] border border-[#EED7A6]">
              <span className="text-xl">🔥</span>
              <span>{patient?.currentStreak || 1}-Day Streak</span>
            </div>
          </div>

          <div className="my-3">
            <p className="text-4xl sm:text-7xl font-extrabold tracking-tight text-[#263B42] font-sans">
              {formattedTime}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-[#566D75] mt-2">
              {formattedDate}
            </p>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold mt-6 mb-3 text-[#263B42]">
            Good {period.name}, <span className="text-[#397F7A]">{patientDisplayName}</span>!
          </h1>
          
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-[#F7F3E8] border border-[#EADBCC] my-5">
            <p className="text-lg sm:text-xl font-bold text-[#263B42] flex items-center justify-center gap-2.5">
              <span>🏡</span>
              <span>You are in your home, safe and cared for.</span>
            </p>
          </div>

          {/* Caregiver Link Status Bar */}
          <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-[#EAF2EE] border border-[#C8DDD4] flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold mb-6">
            <div className="flex items-center gap-2.5 text-left">
              <span className="text-2xl">🩺</span>
              <div>
                <span className="text-[#263B42] font-bold block">
                  {caregiverInfo?.name ? `Caregiver: ${caregiverInfo.name}` : 'No Caregiver Linked'}
                </span>
                <span className="text-xs text-[#566D75]">
                  {caregiverInfo?.email ? caregiverInfo.email : 'Link caregiver for 24/7 emergency safety alerts'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowLinkModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#FFFDF7] hover:bg-[#F7F3E8] text-[#397F7A] border border-[#8DB7A5] font-bold text-xs transition-all active:scale-95 whitespace-nowrap shadow-sm"
            >
              {caregiverInfo ? 'Change 🔗' : 'Connect Caregiver 🔗'}
            </button>
          </div>

          {soundEnabled && (
            <button 
              onClick={handleSpeakGreeting}
              disabled={isSpeakingState}
              className={`min-h-14 py-3 px-8 rounded-2xl text-lg font-bold flex items-center justify-center mx-auto gap-3 transition-all active:scale-98 shadow-sm ${
                isSpeakingState 
                ? 'bg-[#EAF2EE] text-[#849CA4] cursor-not-allowed' 
                : 'bg-[#397F7A] hover:bg-[#2E6B66] text-white'
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
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFDF7] border-2 border-[#EED7A6] shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl text-[#D9A441]">🔔</span>
              <div>
                <h3 className="text-2xl font-extrabold text-[#263B42]">Today's Reminders</h3>
                <p className="text-sm text-[#566D75] font-medium">Gentle spoken alerts and reminders</p>
              </div>
            </div>
            <span className="px-3.5 py-1.5 bg-[#FBF4E4] text-[#D9A441] border border-[#EED7A6] rounded-full text-xs sm:text-sm font-bold">
              {reminders.length} PENDING
            </span>
          </div>

          <div className="space-y-3.5">
            {reminders.map(rem => {
              const d = new Date(rem.scheduledTime);
              const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

              return (
                <div 
                  key={rem._id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#F7F3E8] border border-[#EADBCC] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#FFFDF7] text-[#D9A441] border border-[#EED7A6] flex items-center justify-center text-3xl flex-shrink-0">
                      ⏰
                    </div>
                    <div>
                      <h4 className="text-xl font-extrabold text-[#263B42]">{rem.title}</h4>
                      <p className="text-sm font-semibold text-[#566D75]">
                        Scheduled for: <strong className="text-[#263B42]">{timeStr}</strong>
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
                        className="p-3.5 rounded-xl bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4] text-xl active:scale-95 transition-all shadow-sm"
                        title="Read aloud"
                      >
                        🔊
                      </button>
                    )}
                    <button
                      onClick={() => handleCompleteReminder(rem)}
                      className="flex-1 sm:flex-none px-6 sm:px-8 py-3.5 bg-[#4F8A5B] hover:bg-[#43774E] text-white rounded-xl font-bold text-base shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2"
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Daily Routine Card */}
        <div className="p-6 rounded-3xl flex flex-col justify-between bg-[#FFFDF7] border border-[#EADBCC] shadow-sm hover:border-[#8DB7A5] transition-all">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-[#EAF2EE] border border-[#C8DDD4] text-[#397F7A] flex items-center justify-center text-3xl mb-4">
              📋
            </div>
            <h3 className="text-xl font-extrabold mb-1.5 text-[#263B42]">Daily Routine</h3>
            <p className="text-sm font-medium text-[#566D75] mb-6 leading-relaxed">
              Step-by-step checklist of meals, hygiene, medications, and wellness.
            </p>
          </div>
          <div className="space-y-2">
            <Link
              to="/patient/routine"
              className="w-full min-h-12 py-3 px-4 rounded-xl text-base font-bold flex items-center justify-center bg-[#397F7A] hover:bg-[#2E6B66] text-white transition-all active:scale-98 shadow-sm"
            >
              Open Checklist →
            </Link>
            <button
              onClick={handleResetRoutinesFromDashboard}
              disabled={resettingRoutine}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold text-[#566D75] hover:text-[#263B42] bg-[#F7F3E8] border border-[#EADBCC] hover:bg-[#EAF2EE] transition-all flex items-center justify-center gap-1"
            >
              <span>🔄</span>
              <span>{resettingRoutine ? 'Resetting...' : 'Reset Tasks'}</span>
            </button>
          </div>
        </div>

        {/* Cognitive Brain Games Card */}
        <div className="p-6 rounded-3xl flex flex-col justify-between bg-[#FFFDF7] border border-[#EADBCC] shadow-sm hover:border-[#8DB7A5] transition-all">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-[#EAF2EE] border border-[#C8DDD4] text-[#397F7A] flex items-center justify-center text-3xl mb-4">
              🧠
            </div>
            <h3 className="text-xl font-extrabold mb-1.5 text-[#263B42]">Memory Games</h3>
            <p className="text-sm font-medium text-[#566D75] mb-6 leading-relaxed">
              Calming card matching, melodic pattern chimes, and everyday object quizzes.
            </p>
          </div>
          <Link
            to="/patient/games"
            className="w-full min-h-12 py-3 px-4 rounded-xl text-base font-bold flex items-center justify-center bg-[#397F7A] hover:bg-[#2E6B66] text-white transition-all active:scale-98 shadow-sm"
          >
            Play Activities →
          </Link>
        </div>

        {/* Family Album Memory Lane Card */}
        <div className="p-6 rounded-3xl flex flex-col justify-between bg-[#FFFDF7] border border-[#EADBCC] shadow-sm hover:border-[#8DB7A5] transition-all">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-[#EAF2EE] border border-[#C8DDD4] text-[#397F7A] flex items-center justify-center text-3xl mb-4">
              🖼️
            </div>
            <h3 className="text-xl font-extrabold mb-1.5 text-[#263B42]">Family Album</h3>
            <p className="text-sm font-medium text-[#566D75] mb-6 leading-relaxed">
              Cherished family photographs, warm memories, and gentle recall activities.
            </p>
          </div>
          <Link
            to="/patient/memory-lane"
            className="w-full min-h-12 py-3 px-4 rounded-xl text-base font-bold flex items-center justify-center bg-[#8DB7A5] hover:bg-[#79A391] text-[#263B42] transition-all active:scale-98 shadow-sm"
          >
            View Album →
          </Link>
        </div>

        {/* My Progress Card */}
        <div className="p-6 rounded-3xl flex flex-col justify-between bg-[#FFFDF7] border border-[#EADBCC] shadow-sm hover:border-[#8DB7A5] transition-all">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-[#EAF2EE] border border-[#C8DDD4] text-[#397F7A] flex items-center justify-center text-3xl mb-4">
              📊
            </div>
            <h3 className="text-xl font-extrabold mb-1.5 text-[#263B42]">My Progress</h3>
            <p className="text-sm font-medium text-[#566D75] mb-6 leading-relaxed">
              Review your daily activity completions, stars, and milestones.
            </p>
          </div>
          <Link
            to="/patient/results"
            className="w-full min-h-12 py-3 px-4 rounded-xl text-base font-bold flex items-center justify-center bg-[#397F7A] hover:bg-[#2E6B66] text-white transition-all active:scale-98 shadow-sm"
          >
            Achievements →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
