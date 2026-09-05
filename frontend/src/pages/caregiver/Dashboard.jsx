import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useVoice } from '../../hooks/useVoice';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('routines'); // 'routines' or 'reminders'
  const [resetting, setResetting] = useState(false);

  // Link Patient Modal State
  const [showLinkPatientModal, setShowLinkPatientModal] = useState(false);
  const [patientIdentifierInput, setPatientIdentifierInput] = useState('');
  const [linkPatientLoading, setLinkPatientLoading] = useState(false);

  const { playCaregiverAlert, speak } = useVoice();
  const prevEscalatedCount = useRef(0);

  // Modals state
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Forms state
  const [routineForm, setRoutineForm] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    category: 'other',
  });

  const getLocalDefaultTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [reminderForm, setReminderForm] = useState({
    title: '',
    scheduledTime: getLocalDefaultTime(),
  });

  const fetchPatients = async () => {
    try {
      const response = await api.get('/caregiver/patients');
      const pts = response.data.patients || response.data || [];
      setPatients(pts);
      if (pts.length > 0) {
        setSelectedPatientId(pts[0]._id || pts[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch patients.');
      setLoading(false);
    }
  };

  const fetchDashboardData = async (patientId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get(`/caregiver/dashboard/${patientId}`);
      const data = response.data;
      setDashboardData(data);

      const escalated = data.escalatedAlerts || [];
      if (escalated.length > 0 && escalated.length > prevEscalatedCount.current) {
        playCaregiverAlert();
        setTimeout(() => {
          speak(`Attention: ${data.patient?.name || 'Patient'} has not responded to reminder: ${escalated[0].title}.`);
        }, 500);
      }
      prevEscalatedCount.current = escalated.length;

      if (!silent) setLoading(false);
    } catch (err) {
      if (!silent) {
        setError('Failed to load dashboard data.');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchDashboardData(selectedPatientId);
      const interval = setInterval(() => {
        fetchDashboardData(selectedPatientId, true);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [selectedPatientId]);

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    setLinkPatientLoading(true);
    try {
      const trimmed = patientIdentifierInput.trim();
      const isCode = trimmed.toUpperCase().startsWith('MC-');
      const payload = isCode ? { pairCode: trimmed } : { patientEmail: trimmed };
      
      const res = await api.post('/caregiver/link-patient', payload);
      alert(res.data.message);
      setShowLinkPatientModal(false);
      setPatientIdentifierInput('');

      const ptsRes = await api.get('/caregiver/patients');
      const pList = ptsRes.data.patients || [];
      setPatients(pList);
      if (res.data.patient) {
        setSelectedPatientId(res.data.patient._id || res.data.patient.id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error linking patient');
    } finally {
      setLinkPatientLoading(false);
    }
  };

  const handleAddRoutine = async (e) => {
    e.preventDefault();
    try {
      await api.post('/routines', { ...routineForm, patientId: selectedPatientId });
      setShowRoutineModal(false);
      fetchDashboardData(selectedPatientId, true);
      setRoutineForm({ title: '', description: '', scheduledTime: '', category: 'other' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      const localDate = new Date(reminderForm.scheduledTime);
      const isoTime = isNaN(localDate.getTime()) ? reminderForm.scheduledTime : localDate.toISOString();

      await api.post('/reminders', {
        title: reminderForm.title,
        scheduledTime: isoTime,
        patientId: selectedPatientId
      });
      setShowReminderModal(false);
      setReminderForm({ title: '', scheduledTime: getLocalDefaultTime() });
      fetchDashboardData(selectedPatientId, true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResendPrompt = async (id) => {
    try {
      await api.patch(`/reminders/${id}/resend-prompt`);
      alert("✅ Reminder has been resent to patient with high-priority audio chime.");
      fetchDashboardData(selectedPatientId, true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkCompleteByCaregiver = async (id) => {
    try {
      await api.patch(`/reminders/${id}/complete`);
      fetchDashboardData(selectedPatientId, true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetAllRoutines = async () => {
    if (!window.confirm("Reset all routines to pending so the patient can do them again?")) return;
    setResetting(true);
    try {
      await api.post(`/routines/reset/${selectedPatientId}`);
      await fetchDashboardData(selectedPatientId, true);
    } catch (err) {
      console.error("Error resetting routines:", err);
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteRoutine = async (id) => {
    if (!window.confirm('Delete this routine?')) return;
    try {
      await api.delete(`/routines/${id}`);
      fetchDashboardData(selectedPatientId, true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await api.delete(`/reminders/${id}`);
      fetchDashboardData(selectedPatientId, true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !dashboardData) return (
    <div className="p-12 text-center text-[#566D75] flex flex-col items-center gap-3">
      <span className="w-9 h-9 border-4 border-[#397F7A] border-t-transparent rounded-full animate-spin"></span>
      <span className="text-lg font-bold text-[#263B42]">Connecting to patient telemetry stream...</span>
    </div>
  );
  
  if (error && !dashboardData) return <div className="p-8 text-center text-[#C95C5C] font-bold">{error}</div>;

  // No patients linked yet empty state
  if (!patients.length) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 rounded-3xl border border-[#EADBCC] text-center shadow-sm bg-[#FFFDF7] text-[#263B42] animate-fadeIn">
        <span className="text-5xl p-4 bg-[#8DB7A5]/20 border border-[#8DB7A5]/40 rounded-2xl inline-block mb-4">
          👥
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mb-2 text-[#263B42]">Welcome to MindCare Portal</h2>
        <p className="text-base text-[#566D75] mb-6 leading-relaxed">
          You don't have any patients linked to your caregiver console yet. Link your patient's registered email or pair code to start continuous telemetry monitoring.
        </p>
        <button
          onClick={() => setShowLinkPatientModal(true)}
          className="px-8 py-3.5 bg-[#397F7A] hover:bg-[#2E6B66] text-white rounded-2xl font-bold text-base shadow-sm transition-all active:scale-95"
        >
          + 🔗 Link Patient via Email or Code
        </button>

        {showLinkPatientModal && (
          <div className="fixed inset-0 z-50 bg-[#263B42]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="max-w-md w-full rounded-3xl bg-[#FFFDF7] border-2 border-[#397F7A]/40 p-6 sm:p-8 text-[#263B42] shadow-2xl text-left">
              <h3 className="text-xl font-extrabold mb-1">Link Patient Account</h3>
              <p className="text-sm text-[#566D75] mb-4">Enter patient's registered email or 6-digit pair code (e.g. MC-4821)</p>
              <form onSubmit={handleLinkPatient} className="space-y-4">
                <input
                  type="text"
                  required
                  value={patientIdentifierInput}
                  onChange={(e) => setPatientIdentifierInput(e.target.value)}
                  placeholder="patient@mindcare.local or MC-1234"
                  className="w-full p-3.5 rounded-xl bg-white border border-[#EADBCC] text-[#263B42] font-medium outline-none focus:border-[#397F7A]"
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowLinkPatientModal(false)} className="px-4 py-2 text-[#566D75] text-sm font-bold hover:text-[#263B42]">Cancel</button>
                  <button type="submit" disabled={linkPatientLoading} className="px-5 py-2.5 bg-[#397F7A] hover:bg-[#2E6B66] text-white rounded-xl font-bold shadow-sm active:scale-95">
                    {linkPatientLoading ? 'Linking...' : 'Connect Patient ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!dashboardData) return null;

  const patient = dashboardData.patient || {};
  const stats = dashboardData.stats || {};
  const todayRoutines = dashboardData.todaysRoutine || dashboardData.todayRoutines || [];
  const activeReminders = dashboardData.activeReminders || [];
  const escalatedAlerts = dashboardData.escalatedAlerts || [];
  const recentActivity = dashboardData.recentActivity || [];
  const completedCount = dashboardData.completedActivities?.length || todayRoutines.filter(r => r.completed).length;
  const adherence = todayRoutines.length > 0 ? `${Math.round((completedCount / todayRoutines.length) * 100)}%` : '0%';

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Link Patient Modal (Accessible anytime) */}
      {showLinkPatientModal && (
        <div className="fixed inset-0 z-50 bg-[#263B42]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full rounded-3xl bg-[#FFFDF7] border-2 border-[#397F7A]/40 p-6 sm:p-8 text-[#263B42] shadow-2xl text-left">
            <h3 className="text-xl font-extrabold mb-1">Link Another Patient</h3>
            <p className="text-sm text-[#566D75] mb-4">Enter patient's registered email or their 6-digit pairing code (e.g. MC-4821)</p>
            <form onSubmit={handleLinkPatient} className="space-y-4">
              <input
                type="text"
                required
                value={patientIdentifierInput}
                onChange={(e) => setPatientIdentifierInput(e.target.value)}
                placeholder="patient@mindcare.local or MC-1234"
                className="w-full p-3.5 rounded-xl bg-white border border-[#EADBCC] text-[#263B42] font-medium outline-none focus:border-[#397F7A]"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowLinkPatientModal(false)} className="px-4 py-2 text-[#566D75] text-sm font-bold hover:text-[#263B42]">Cancel</button>
                <button type="submit" disabled={linkPatientLoading} className="px-5 py-2.5 bg-[#397F7A] hover:bg-[#2E6B66] text-white rounded-xl font-bold shadow-sm active:scale-95">
                  {linkPatientLoading ? 'Linking...' : 'Connect Patient ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚨 URGENT UNRESPONDED PATIENT CARE ALERT BANNER */}
      {escalatedAlerts.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#FFF5F5] border-2 border-[#C95C5C] shadow-sm animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <span className="text-3xl p-3 rounded-2xl bg-[#C95C5C]/15 border border-[#C95C5C]/30 flex-shrink-0">
                🚨
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-[#C95C5C]">
                    Urgent Alert: Patient Unresponsive to Reminder
                  </h3>
                  <span className="px-3 py-0.5 bg-[#C95C5C] text-white rounded-full text-xs font-black uppercase">
                    3 Alerts Ignored
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-[#263B42] mt-1">
                  {patient?.name} was prompted 3 times with gentle chime alarms for: <strong className="text-[#C95C5C] underline">"{escalatedAlerts[0].title}"</strong>
                </p>
                <p className="text-xs text-[#566D75] mt-0.5">
                  Scheduled for {new Date(escalatedAlerts[0].scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} • Immediate caregiver follow-up recommended.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
              <button
                onClick={() => {
                  playCaregiverAlert();
                  alert(`Calling ${patient?.name}'s primary emergency contact (+91 98765 43210)...`);
                }}
                className="px-4 py-2.5 bg-[#C95C5C] hover:bg-[#b04a4a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>📞</span>
                <span>Call Patient</span>
              </button>
              <button
                onClick={() => handleResendPrompt(escalatedAlerts[0]._id)}
                className="px-4 py-2.5 bg-[#D9A441] hover:bg-[#c29032] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>🔁</span>
                <span>Resend Alarm</span>
              </button>
              <button
                onClick={() => handleMarkCompleteByCaregiver(escalatedAlerts[0]._id)}
                className="px-4 py-2.5 bg-[#4F8A5B] hover:bg-[#41754c] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>✓</span>
                <span>Mark Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ MISSED DAY INACTIVITY BANNER */}
      {dashboardData?.missedDayAlert && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9E6] border-2 border-[#D9A441] shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-[#D9A441]/20 border border-[#D9A441]/40">⚠️</span>
              <div>
                <h4 className="text-lg font-black text-[#263B42]">Patient Inactivity Notice: Missed Day</h4>
                <p className="text-xs sm:text-sm text-[#566D75] font-medium">
                  {patient?.name} did not record any routines or brain activities yesterday ({patient?.lastMissedDate || 'yesterday'}). Daily streak was reset.
                </p>
              </div>
            </div>
            <button
              onClick={() => alert(`Calling primary contact for ${patient?.name || 'patient'}...`)}
              className="px-4 py-2 bg-[#D9A441] hover:bg-[#c29032] text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap self-end sm:self-auto"
            >
              📞 Check On Patient
            </button>
          </div>
        </div>
      )}

      {/* Top Patient Header with Live Telemetry Pulse, Streak & Link Patient */}
      <div className="bg-[#FFFDF7] p-6 rounded-3xl border border-[#EADBCC] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#263B42]">
              {patient?.name}'s Telemetry & Care
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#8DB7A5]/20 text-[#397F7A] border border-[#8DB7A5]/40">
              <span className="w-2 h-2 rounded-full bg-[#397F7A] animate-ping"></span>
              Live Sync Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#D9A441]/15 text-[#D9A441] border border-[#D9A441]/30">
              <span>🔥</span>
              <span>{dashboardData?.streak?.current || patient?.currentStreak || 1} Day Streak</span>
            </span>
          </div>
          {patient?.age && (
            <p className="text-sm font-semibold text-[#566D75] mt-1">
              Age: {patient.age} • Pair Code: <strong className="text-[#397F7A] font-mono">{patient.pairCode || 'MC-DEMO'}</strong>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowLinkPatientModal(true)}
            className="px-4 py-2 bg-[#8DB7A5]/20 hover:bg-[#8DB7A5]/30 text-[#397F7A] border border-[#8DB7A5]/50 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95"
          >
            + 🔗 Link Patient
          </button>

          {patients.length > 1 && (
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="border border-[#EADBCC] rounded-xl shadow-sm p-2 font-bold text-sm bg-white text-[#263B42] outline-none focus:border-[#397F7A]"
            >
              {patients.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Routine Adherence</p>
          <p className="text-3xl font-extrabold text-[#4F8A5B]">{adherence}</p>
          <span className="text-xs text-[#566D75] mt-1 block">{completedCount} of {todayRoutines.length} Tasks Done</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Cognitive Sessions</p>
          <p className="text-3xl font-extrabold text-[#397F7A]">{stats?.gamesCompleted || 0}</p>
          <span className="text-xs text-[#566D75] mt-1 block">Completed Activities</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Avg Precision</p>
          <p className="text-3xl font-extrabold text-[#397F7A]">{stats?.averageAccuracy || 0}%</p>
          <span className="text-xs text-[#566D75] mt-1 block">Target: &gt;75%</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Active Reminders</p>
          <p className="text-3xl font-extrabold text-[#D9A441]">{activeReminders.length}</p>
          <span className="text-xs text-[#566D75] mt-1 block">Scheduled in Local Time</span>
        </div>
      </div>

      {/* 🔴 LIVE PATIENT ACTIVITY & TELEMETRY STREAM */}
      <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-[#EADBCC]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">📡</span>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#263B42] flex items-center gap-2">
                Live Patient Activity Feed
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8DB7A5]/20 text-[#397F7A] font-bold border border-[#8DB7A5]/40">
                  Auto-Refreshing
                </span>
              </h3>
              <p className="text-xs text-[#566D75]">Real-time notifications whenever {patient?.name || 'patient'} completes tasks, plays games, or acknowledges reminders</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {recentActivity.length > 0 ? (
            recentActivity.map((act) => {
              const d = new Date(act.timestamp);
              const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
              const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div 
                  key={act.id} 
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                    act.badgeColor === 'rose'
                    ? 'bg-[#FFF5F5] border-[#C95C5C]/40'
                    : 'bg-white border-[#EADBCC] hover:border-[#8DB7A5]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl p-2 rounded-xl bg-[#F7F3E8] border border-[#EADBCC]">{act.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-sm sm:text-base text-[#263B42]">{act.title}</p>
                        <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          act.badgeColor === 'emerald' 
                          ? 'bg-[#4F8A5B]/15 text-[#4F8A5B] border-[#4F8A5B]/30' 
                          : act.badgeColor === 'purple' 
                          ? 'bg-[#397F7A]/15 text-[#397F7A] border-[#397F7A]/30' 
                          : act.badgeColor === 'rose'
                          ? 'bg-[#C95C5C]/15 text-[#C95C5C] border-[#C95C5C]/40'
                          : 'bg-[#8DB7A5]/20 text-[#397F7A] border-[#8DB7A5]/30'
                        }`}>
                          {act.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#566D75] mt-0.5">{act.detail}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#566D75] self-end sm:self-auto bg-[#F7F3E8] px-2.5 py-1 rounded-lg border border-[#EADBCC]">
                    ⏱️ {dateStr} at {timeStr}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-[#566D75]">
              <span className="text-3xl block mb-2">⏳</span>
              <p className="text-sm font-bold text-[#263B42]">Waiting for patient activities...</p>
              <p className="text-xs text-[#566D75] mt-1">When {patient?.name || 'patient'} completes a routine, plays games, or marks a reminder, it will appear here in real time.</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts & Routine / Reminders Side-by-Side */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* 7-Day Trend Chart */}
        <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#263B42]">7-Day Cognitive Accuracy Trend</h3>
            <span className="text-xs font-bold text-[#397F7A] bg-[#8DB7A5]/15 px-2.5 py-1 rounded-full border border-[#8DB7A5]/30">Daily Average</span>
          </div>
          <div className="h-64">
            {stats?.weeklyPerformance?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EADBCC" />
                  <XAxis dataKey="date" stroke="#566D75" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} stroke="#566D75" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFDF7', 
                      borderColor: '#EADBCC',
                      borderRadius: '16px',
                      color: '#263B42',
                      boxShadow: '0 4px 12px rgba(38, 59, 66, 0.08)'
                    }} 
                  />
                  <Bar dataKey="averageAccuracy" fill="#397F7A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[#566D75] font-medium">
                No session data for the last 7 days.
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Routines & Reminders Management with RESET button */}
        <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div className="flex bg-[#F7F3E8] p-1 rounded-xl border border-[#EADBCC]">
              <button
                onClick={() => setActiveTab('routines')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'routines' ? 'bg-[#397F7A] text-white shadow-sm' : 'text-[#566D75] hover:text-[#263B42]'
                }`}
              >
                📋 Routines ({todayRoutines.length})
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'reminders' ? 'bg-[#397F7A] text-white shadow-sm' : 'text-[#566D75] hover:text-[#263B42]'
                }`}
              >
                ⏰ Reminders ({activeReminders.length})
              </button>
            </div>

            <div className="flex gap-2">
              {activeTab === 'routines' && (
                <button
                  onClick={handleResetAllRoutines}
                  disabled={resetting}
                  className="text-xs bg-[#F7F3E8] hover:bg-[#EADBCC] text-[#263B42] border border-[#EADBCC] px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 active:scale-95"
                  title="Reset all completed tasks to pending for a new day"
                >
                  <span>🔄</span>
                  <span>{resetting ? 'Resetting...' : 'Reset All'}</span>
                </button>
              )}

              {activeTab === 'reminders' ? (
                <button
                  onClick={() => setShowReminderModal(true)}
                  className="text-xs bg-[#D9A441]/15 text-[#D9A441] hover:bg-[#D9A441]/25 px-3 py-1.5 rounded-xl font-bold transition-colors border border-[#D9A441]/40"
                >
                  + Add Reminder
                </button>
              ) : (
                <button
                  onClick={() => setShowRoutineModal(true)}
                  className="text-xs bg-[#397F7A]/15 text-[#397F7A] hover:bg-[#397F7A]/25 px-3 py-1.5 rounded-xl font-bold transition-colors border border-[#397F7A]/40"
                >
                  + Add Routine
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-64 space-y-2.5 pr-1">
            {activeTab === 'routines' ? (
              todayRoutines?.length > 0 ? (
                todayRoutines.map((routine) => (
                  <div 
                    key={routine._id} 
                    className="flex justify-between items-center p-3 rounded-xl border border-[#EADBCC] bg-white hover:border-[#8DB7A5] transition-colors"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#263B42]">{routine.title}</p>
                      <p className="text-xs text-[#566D75]">
                        ⏰ {routine.scheduledTime} • <span className="capitalize">{routine.category}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {routine.completed ? (
                        <span className="text-xs font-bold bg-[#4F8A5B]/15 text-[#4F8A5B] px-2.5 py-0.5 rounded-full border border-[#4F8A5B]/30">Done</span>
                      ) : (
                        <span className="text-xs font-bold bg-[#D9A441]/15 text-[#D9A441] px-2.5 py-0.5 rounded-full border border-[#D9A441]/30">Pending</span>
                      )}
                      <button 
                        onClick={() => handleDeleteRoutine(routine._id)} 
                        className="text-[#566D75] hover:text-[#C95C5C] text-lg px-1.5 transition-colors"
                        title="Delete routine"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#566D75] text-center py-8 text-sm">No routines scheduled for today.</p>
              )
            ) : (
              activeReminders?.length > 0 ? (
                activeReminders.map((rem) => {
                  const d = new Date(rem.scheduledTime);
                  const timeFormatted = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                  const dateFormatted = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

                  return (
                    <div 
                      key={rem._id} 
                      className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
                        rem.escalatedToCaregiver
                        ? 'border-[#C95C5C]/50 bg-[#FFF5F5]'
                        : 'border-[#EADBCC] bg-white hover:border-[#8DB7A5]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-[#263B42]">{rem.title}</p>
                          {rem.promptCount > 0 && (
                            <span className="text-[10px] bg-[#D9A441]/20 text-[#D9A441] px-1.5 py-0.5 rounded font-mono font-bold">
                              {rem.promptCount}/3
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#566D75]">
                          ⏰ {dateFormatted} at <strong className="text-[#D9A441]">{timeFormatted}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rem.escalatedToCaregiver ? (
                          <span className="text-xs font-bold bg-[#C95C5C]/15 text-[#C95C5C] px-2.5 py-0.5 rounded-full border border-[#C95C5C]/30 animate-pulse">
                            🚨 Unresponsive
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-[#D9A441]/15 text-[#D9A441] px-2.5 py-0.5 rounded-full border border-[#D9A441]/30">
                            {rem.status}
                          </span>
                        )}
                        <button 
                          onClick={() => handleDeleteReminder(rem._id)} 
                          className="text-[#566D75] hover:text-[#C95C5C] text-lg px-1.5 transition-colors"
                          title="Delete reminder"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[#566D75] text-center py-8 text-sm">No active reminders. Click "+ Add Reminder" above.</p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Add Routine Modal */}
      {showRoutineModal && (
        <div className="fixed inset-0 bg-[#263B42]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EADBCC] bg-[#FFFDF7] text-[#263B42]">
            <h3 className="text-xl font-extrabold mb-4 text-[#263B42]">Add Routine Activity</h3>
            <form onSubmit={handleAddRoutine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Activity Title</label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-[#EADBCC] p-3 rounded-xl font-medium outline-none bg-white text-[#263B42] focus:border-[#397F7A]" 
                  placeholder="e.g. Afternoon Walk" 
                  value={routineForm.title} 
                  onChange={e => setRoutineForm({...routineForm, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Description</label>
                <textarea 
                  className="w-full border border-[#EADBCC] p-3 rounded-xl font-medium outline-none bg-white text-[#263B42] focus:border-[#397F7A]" 
                  placeholder="Brief note or instructions" 
                  value={routineForm.description} 
                  onChange={e => setRoutineForm({...routineForm, description: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Scheduled Time</label>
                  <input 
                    required 
                    type="time" 
                    className="w-full border border-[#EADBCC] p-3 rounded-xl font-medium outline-none bg-white text-[#263B42] focus:border-[#397F7A]" 
                    value={routineForm.scheduledTime} 
                    onChange={e => setRoutineForm({...routineForm, scheduledTime: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Category</label>
                  <select 
                    className="w-full border border-[#EADBCC] p-3 rounded-xl font-medium outline-none bg-white text-[#263B42] focus:border-[#397F7A]" 
                    value={routineForm.category} 
                    onChange={e => setRoutineForm({...routineForm, category: e.target.value})}
                  >
                    <option value="medicine">💊 Medicine</option>
                    <option value="hygiene">🪥 Hygiene</option>
                    <option value="meal">🍳 Meal</option>
                    <option value="exercise">🚶 Exercise</option>
                    <option value="cognitive">🧠 Cognitive</option>
                    <option value="sleep">🌙 Sleep</option>
                    <option value="other">⭐ Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-[#EADBCC]">
                <button type="button" onClick={() => setShowRoutineModal(false)} className="px-4 py-2 text-sm font-bold text-[#566D75] hover:text-[#263B42] transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#397F7A] hover:bg-[#2E6B66] text-white rounded-xl font-bold shadow-sm transition-all active:scale-95">Save Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-[#263B42]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EADBCC] bg-[#FFFDF7] text-[#263B42]">
            <h3 className="text-xl font-extrabold mb-1 text-[#263B42]">Add Safety Reminder</h3>
            <p className="text-xs text-[#566D75] mb-4">Patient will receive 3 gentle sound alarms before escalating to you.</p>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Reminder Title</label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-[#EADBCC] p-3 rounded-xl font-medium outline-none bg-white text-[#263B42] focus:border-[#397F7A]" 
                  placeholder="e.g. Drink warm herbal tea" 
                  value={reminderForm.title} 
                  onChange={e => setReminderForm({...reminderForm, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Scheduled Date & Time (Your Local Time)</label>
                <input 
                  required 
                  type="datetime-local" 
                  className="w-full border border-[#EADBCC] p-3 rounded-xl font-medium outline-none bg-white text-[#263B42] focus:border-[#397F7A]" 
                  value={reminderForm.scheduledTime} 
                  onChange={e => setReminderForm({...reminderForm, scheduledTime: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-[#EADBCC]">
                <button type="button" onClick={() => setShowReminderModal(false)} className="px-4 py-2 text-sm font-bold text-[#566D75] hover:text-[#263B42] transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#D9A441] hover:bg-[#c29032] text-white rounded-xl font-bold shadow-sm transition-all active:scale-95">Save & Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
