import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { useVoice } from '../../hooks/useVoice';

const Alerts = () => {
  const { darkMode } = useOutletContext() || {};
  const [escalatedReminders, setEscalatedReminders] = useState([]);
  const [missedReminders, setMissedReminders] = useState([]);
  const [incompleteRoutines, setIncompleteRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);

  const { playCaregiverAlert } = useVoice();

  const fetchAlerts = async () => {
    try {
      const pRes = await api.get('/caregiver/patients');
      const pts = pRes.data.patients || pRes.data || [];
      if (pts.length > 0) {
        const p = pts[0];
        setPatient(p);
        const pid = p._id || p.id;
        
        const [escRes, remRes, routRes] = await Promise.all([
          api.get(`/reminders/escalated/${pid}`),
          api.get(`/reminders/missed/${pid}`),
          api.get(`/routines/today/${pid}`)
        ]);

        setEscalatedReminders(escRes.data.reminders || []);
        setMissedReminders(remRes.data.reminders || []);
        
        const routines = routRes.data.routines || routRes.data || [];
        const now = new Date();
        const currTimeStr = now.toTimeString().substring(0, 5); // "HH:MM"
        
        const missed = Array.isArray(routines) ? routines.filter(r => !r.completed && r.scheduledTime < currTimeStr) : [];
        setIncompleteRoutines(missed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResend = async (id) => {
    try {
      await api.patch(`/reminders/${id}/resend-prompt`);
      alert("✅ Reminder prompt resent to patient with popping chime alert!");
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.patch(`/reminders/${id}/complete`);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
      <span className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
      <span className="text-lg font-bold">Scanning patient telemetry & alarms...</span>
    </div>
  );

  const hasAlerts = escalatedReminders.length > 0 || missedReminders.length > 0 || incompleteRoutines.length > 0;
  const cardStyle = darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16">
      <div className="border-b border-slate-800/40 pb-4">
        <h2 className={`text-2xl sm:text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          🚨 Caregiver Attention & Escalation Alerts
        </h2>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Real-time alerts for unresponded medication alarms, late routines, and patient safety notifications.
        </p>
      </div>
      
      {!hasAlerts ? (
        <div className={`p-10 rounded-3xl border text-center shadow-lg ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="text-5xl mb-3">✅</div>
          <h3 className={`text-2xl font-black mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>
            No Active Escalations! Everything is on Track.
          </h3>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-emerald-700'}`}>
            {patient?.name || 'Patient'} has acknowledged all scheduled reminders and routines on time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* URGENT 3-PROMPT UNRESPONDED ALERTS */}
          {escalatedReminders.map(rem => (
            <div 
              key={rem._id} 
              className="p-5 rounded-3xl bg-rose-950/80 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-rose-500 text-white">
                    🚨 3 Alerts Ignored
                  </span>
                  <span className="text-xs text-rose-300 font-mono">
                    Scheduled: {new Date(rem.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <h4 className="text-xl font-extrabold text-white">{rem.title}</h4>
                <p className="text-xs text-rose-300 mt-0.5 font-medium">
                  Patient did not respond after 3 popping audio/visual reminder prompts.
                </p>
              </div>

              <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    playCaregiverAlert();
                    alert(`Calling ${patient?.name || 'Patient'} primary phone line...`);
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>📞</span>
                  <span>Call Patient</span>
                </button>
                <button
                  onClick={() => handleResend(rem._id)}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>🔁</span>
                  <span>Resend Alarm</span>
                </button>
                <button
                  onClick={() => handleComplete(rem._id)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>✓</span>
                  <span>Mark Done</span>
                </button>
              </div>
            </div>
          ))}

          {/* MISSED REMINDERS */}
          {missedReminders.map(rem => (
            <div key={rem._id} className={`p-4 rounded-2xl border-l-4 border-l-rose-500 flex justify-between items-center ${cardStyle}`}>
              <div>
                <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mb-0.5">Missed Reminder</p>
                <h4 className="text-base font-bold text-white">{rem.title}</h4>
                <p className="text-xs text-slate-400">Scheduled: {new Date(rem.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-bold">
                MISSED
              </span>
            </div>
          ))}

          {/* DELAYED ROUTINES */}
          {incompleteRoutines.map(rout => (
            <div key={rout._id} className={`p-4 rounded-2xl border-l-4 border-l-amber-500 flex justify-between items-center ${cardStyle}`}>
              <div>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-0.5">Late Daily Routine</p>
                <h4 className="text-base font-bold text-white">{rout.title}</h4>
                <p className="text-xs text-slate-400">Scheduled: {rout.scheduledTime} (Category: <span className="capitalize">{rout.category}</span>)</p>
              </div>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold">
                LATE
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
