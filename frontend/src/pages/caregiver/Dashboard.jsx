import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
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
  const { darkMode } = useOutletContext() || {};
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

  const handleAcknowledgeAlert = async (id) => {
    try {
      await api.patch(`/reminders/${id}/acknowledge-caregiver`);
      fetchDashboardData(selectedPatientId, true);
    } catch (e) {
      console.error(e);
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

  const cardStyle = darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900 shadow-sm';
  const subTextStyle = darkMode ? 'text-slate-400' : 'text-slate-500';

  if (loading && !dashboardData) return (
    <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
      <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
      <span className="text-lg font-bold">Connecting to patient telemetry stream...</span>
    </div>
  );
  
  if (error && !dashboardData) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

  // No patients linked yet empty state
  if (!patients.length) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 rounded-3xl border text-center shadow-xl bg-slate-900 border-slate-800 text-white animate-fadeIn">
        <span className="text-5xl p-3 bg-blue-500/20 border border-blue-500/30 rounded-2xl inline-block mb-4">
          👥
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mb-2">Welcome to MindCare Pro</h2>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          You don't have any patients linked to your caregiver console yet. Link your patient's registered email or pair code to start 24/7 telemetry monitoring.
        </p>
        <button
          onClick={() => setShowLinkPatientModal(true)}
          className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-base shadow-lg transition-all active:scale-95"
        >
          + 🔗 Link Patient via Email or Code
        </button>

        {showLinkPatientModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="max-w-md w-full rounded-3xl bg-slate-900 border-2 border-blue-500/50 p-6 sm:p-8 text-white shadow-2xl text-left">
              <h3 className="text-xl font-extrabold mb-1">Link Patient Account</h3>
              <p className="text-xs text-slate-400 mb-4">Enter patient's registered email or 6-digit pair code (e.g. MC-4821)</p>
              <form onSubmit={handleLinkPatient} className="space-y-4">
                <input
                  type="text"
                  required
                  value={patientIdentifierInput}
                  onChange={(e) => setPatientIdentifierInput(e.target.value)}
                  placeholder="patient@mindcare.local or MC-1234"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium outline-none focus:border-blue-400"
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowLinkPatientModal(false)} className="px-4 py-2 text-slate-400 text-sm font-bold">Cancel</button>
                  <button type="submit" disabled={linkPatientLoading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow active:scale-95">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border-2 border-blue-500/50 p-6 sm:p-8 text-white shadow-2xl text-left">
            <h3 className="text-xl font-extrabold mb-1">Link Another Patient</h3>
            <p className="text-xs text-slate-400 mb-4">Enter patient's registered email or their 6-digit pairing code (e.g. MC-4821)</p>
            <form onSubmit={handleLinkPatient} className="space-y-4">
              <input
                type="text"
                required
                value={patientIdentifierInput}
                onChange={(e) => setPatientIdentifierInput(e.target.value)}
                placeholder="patient@mindcare.local or MC-1234"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium outline-none focus:border-blue-400"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowLinkPatientModal(false)} className="px-4 py-2 text-slate-400 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={linkPatientLoading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow active:scale-95">
                  {linkPatientLoading ? 'Linking...' : 'Connect Patient ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚨 URGENT UNRESPONDED PATIENT CARE ALERT BANNER */}
      {escalatedAlerts.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-rose-950/80 border-2 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)] animate-pulse">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <span className="text-4xl p-2.5 rounded-2xl bg-rose-900/60 border border-rose-500/50 shadow-inner flex-shrink-0">
                🚨
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-rose-200">
                    Urgent Alert: Patient Unresponsive to Reminder
                  </h3>
                  <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-full text-xs font-black uppercase">
                    3 Alerts Ignored
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-rose-300 mt-1">
                  {patient?.name} was prompted 3 times with popping sound alarms for: <strong className="text-white underline">"{escalatedAlerts[0].title}"</strong>
                </p>
                <p className="text-xs text-rose-400 font-mono mt-0.5">
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
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>📞</span>
                <span>Call Patient</span>
              </button>
              <button
                onClick={() => handleResendPrompt(escalatedAlerts[0]._id)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>🔁</span>
                <span>Resend Alarm</span>
              </button>
              <button
                onClick={() => handleMarkCompleteByCaregiver(escalatedAlerts[0]._id)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
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
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/80 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-amber-900/60 border border-amber-500/50">⚠️</span>
              <div>
                <h4 className="text-lg font-black text-amber-200">Patient Inactivity Notice: Missed Day</h4>
                <p className="text-xs sm:text-sm text-amber-300 font-medium">
                  {patient?.name} did not record any routines or brain activities yesterday ({patient?.lastMissedDate || 'yesterday'}). Daily streak was reset.
                </p>
              </div>
            </div>
            <button
              onClick={() => alert(`Calling primary contact for ${patient?.name || 'patient'}...`)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 whitespace-nowrap self-end sm:self-auto"
            >
              📞 Check On Patient
            </button>
          </div>
        </div>
      )}

      {/* Top Patient Header with Live Telemetry Pulse, Streak & Link Patient */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className={`text-2xl sm:text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {patient?.name}'s Telemetry
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Sync Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm">
              <span>🔥</span>
              <span>{dashboardData?.streak?.current || patient?.currentStreak || 1} Day Streak</span>
            </span>
          </div>
          {patient?.age && (
            <p className={`text-sm font-semibold ${subTextStyle} mt-0.5`}>
              Age: {patient.age} • Pair Code: <strong className="text-purple-400 font-mono">{patient.pairCode || 'MC-DEMO'}</strong>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowLinkPatientModal(true)}
            className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95"
          >
            + 🔗 Link Patient
          </button>

          {patients.length > 1 && (
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className={`border rounded-xl shadow-sm p-2 font-bold text-sm outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
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
        <div className={`p-5 rounded-2xl border ${cardStyle}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${subTextStyle}`}>Routine Adherence</p>
          <p className="text-3xl font-extrabold text-emerald-500">{adherence}</p>
          <span className="text-xs text-slate-400 mt-1 block">{completedCount} of {todayRoutines.length} Tasks Done</span>
        </div>

        <div className={`p-5 rounded-2xl border ${cardStyle}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${subTextStyle}`}>Cognitive Sessions</p>
          <p className="text-3xl font-extrabold text-blue-500">{stats?.gamesCompleted || 0}</p>
          <span className="text-xs text-slate-400 mt-1 block">Completed Activities</span>
        </div>

        <div className={`p-5 rounded-2xl border ${cardStyle}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${subTextStyle}`}>Avg Precision</p>
          <p className="text-3xl font-extrabold text-purple-500">{stats?.averageAccuracy || 0}%</p>
          <span className="text-xs text-slate-400 mt-1 block">Target: &gt;75%</span>
        </div>

        <div className={`p-5 rounded-2xl border ${cardStyle}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${subTextStyle}`}>Active Reminders</p>
          <p className="text-3xl font-extrabold text-amber-500">{activeReminders.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Scheduled in Local Time</span>
        </div>
      </div>

      {/* 🔴 LIVE PATIENT ACTIVITY & TELEMETRY STREAM */}
      <div className={`p-6 rounded-3xl border ${cardStyle} shadow-[0_0_30px_rgba(59,130,246,0.1)]`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">📡</span>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                Live Patient Activity Feed
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  Auto-Refreshing
                </span>
              </h3>
              <p className={`text-xs ${subTextStyle}`}>Real-time notifications whenever {patient?.name || 'patient'} completes tasks, plays games, or acknowledges reminders</p>
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
                    ? 'bg-rose-950/40 border-rose-500/50 shadow-md'
                    : darkMode ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">{act.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-sm sm:text-base text-white">{act.title}</p>
                        <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          act.badgeColor === 'emerald' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : act.badgeColor === 'purple' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                          : act.badgeColor === 'rose'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {act.badge}
                        </span>
                      </div>
                      <p className={`text-xs ${subTextStyle} mt-0.5`}>{act.detail}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 self-end sm:self-auto bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    ⏱️ {dateStr} at {timeStr}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500">
              <span className="text-3xl block mb-2">⏳</span>
              <p className="text-sm font-bold text-slate-400">Waiting for patient activities...</p>
              <p className="text-xs text-slate-500 mt-1">When {patient?.name || 'patient'} completes a routine, plays games, or marks a reminder, it will appear here in real time!</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts & Routine / Reminders Side-by-Side */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* 7-Day Trend Chart */}
        <div className={`p-6 rounded-2xl border ${cardStyle}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">7-Day Cognitive Accuracy Trend</h3>
            <span className="text-xs font-bold text-blue-500">Daily Average</span>
          </div>
          <div className="h-64">
            {stats?.weeklyPerformance?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="date" stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#cbd5e1',
                      borderRadius: '12px' 
                    }} 
                  />
                  <Bar dataKey="averageAccuracy" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-medium">
                No session data for the last 7 days.
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Routines & Reminders Management with RESET button */}
        <div className={`p-6 rounded-2xl border flex flex-col ${cardStyle}`}>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('routines')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'routines' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                📋 Routines ({todayRoutines.length})
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'reminders' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
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
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 active:scale-95"
                  title="Reset all completed tasks to pending for a new day"
                >
                  <span>🔄</span>
                  <span>{resetting ? 'Resetting...' : 'Reset All'}</span>
                </button>
              )}

              {activeTab === 'reminders' ? (
                <button
                  onClick={() => setShowReminderModal(true)}
                  className="text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl font-bold transition-colors border border-amber-500/30"
                >
                  + Add Reminder
                </button>
              ) : (
                <button
                  onClick={() => setShowRoutineModal(true)}
                  className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl font-bold transition-colors border border-blue-500/30"
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
                    className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
                      darkMode ? 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm text-white">{routine.title}</p>
                      <p className={`text-xs ${subTextStyle}`}>
                        ⏰ {routine.scheduledTime} • <span className="capitalize">{routine.category}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {routine.completed ? (
                        <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">Done</span>
                      ) : (
                        <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">Pending</span>
                      )}
                      <button 
                        onClick={() => handleDeleteRoutine(routine._id)} 
                        className="text-slate-400 hover:text-red-500 text-lg px-1.5 transition-colors"
                        title="Delete routine"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-8 text-sm">No routines scheduled for today.</p>
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
                        ? 'border-rose-500/50 bg-rose-950/30'
                        : darkMode ? 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white">{rem.title}</p>
                          {rem.promptCount > 0 && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                              {rem.promptCount}/3
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${subTextStyle}`}>
                          ⏰ {dateFormatted} at <strong className="text-amber-400">{timeFormatted}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rem.escalatedToCaregiver ? (
                          <span className="text-xs font-bold bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
                            🚨 Unresponsive
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            {rem.status}
                          </span>
                        )}
                        <button 
                          onClick={() => handleDeleteReminder(rem._id)} 
                          className="text-slate-400 hover:text-red-500 text-lg px-1.5 transition-colors"
                          title="Delete reminder"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 text-center py-8 text-sm">No active reminders. Click "+ Add Reminder" above.</p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Add Routine Modal */}
      {showRoutineModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xl font-extrabold mb-4">Add Routine Activity</h3>
            <form onSubmit={handleAddRoutine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Activity Title</label>
                <input 
                  required 
                  type="text" 
                  className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                  placeholder="e.g. Afternoon Walk" 
                  value={routineForm.title} 
                  onChange={e => setRoutineForm({...routineForm, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Description</label>
                <textarea 
                  className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                  placeholder="Brief note or instructions" 
                  value={routineForm.description} 
                  onChange={e => setRoutineForm({...routineForm, description: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Scheduled Time</label>
                  <input 
                    required 
                    type="time" 
                    className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                    value={routineForm.scheduledTime} 
                    onChange={e => setRoutineForm({...routineForm, scheduledTime: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Category</label>
                  <select 
                    className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
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
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-700/50">
                <button type="button" onClick={() => setShowRoutineModal(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95">Save Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xl font-extrabold mb-1">Add Safety Reminder</h3>
            <p className="text-xs text-slate-400 mb-4">Patient will receive 3 popping sound alarms before escalating to you.</p>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Reminder Title</label>
                <input 
                  required 
                  type="text" 
                  className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                  placeholder="e.g. Drink warm herbal tea" 
                  value={reminderForm.title} 
                  onChange={e => setReminderForm({...reminderForm, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Scheduled Date & Time (Your Local Time)</label>
                <input 
                  required 
                  type="datetime-local" 
                  className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                  value={reminderForm.scheduledTime} 
                  onChange={e => setReminderForm({...reminderForm, scheduledTime: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-700/50">
                <button type="button" onClick={() => setShowReminderModal(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md transition-all active:scale-95">Save & Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
