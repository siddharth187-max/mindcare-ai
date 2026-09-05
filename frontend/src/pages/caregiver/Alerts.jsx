import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useVoice } from '../../hooks/useVoice';

const Alerts = () => {
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
      alert("✅ Reminder prompt resent to patient with gentle chime alert!");
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
    <div className="p-12 text-center text-[#566D75] flex flex-col items-center gap-3">
      <span className="w-8 h-8 border-4 border-[#397F7A] border-t-transparent rounded-full animate-spin"></span>
      <span className="text-lg font-bold text-[#263B42]">Scanning patient telemetry & alarms...</span>
    </div>
  );

  const hasAlerts = escalatedReminders.length > 0 || missedReminders.length > 0 || incompleteRoutines.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16">
      <div className="bg-[#FFFDF7] border border-[#EADBCC] p-6 sm:p-8 rounded-3xl shadow-sm">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#263B42]">
          🚨 Caregiver Attention & Escalation Alerts
        </h2>
        <p className="text-sm text-[#566D75] mt-1 font-medium">
          Real-time alerts for unresponded medication alarms, late routines, and patient safety notifications.
        </p>
      </div>
      
      {!hasAlerts ? (
        <div className="p-10 rounded-3xl border border-[#4F8A5B]/30 bg-[#F0FDF4] text-center shadow-sm">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-2xl font-bold mb-1 text-[#4F8A5B]">
            No Active Escalations! Everything is on Track.
          </h3>
          <p className="text-sm text-[#566D75]">
            {patient?.name || 'Patient'} has acknowledged all scheduled reminders and routines on time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* URGENT 3-PROMPT UNRESPONDED ALERTS */}
          {escalatedReminders.map(rem => (
            <div 
              key={rem._id} 
              className="p-6 rounded-3xl bg-[#FFF5F5] border-2 border-[#C95C5C] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase bg-[#C95C5C] text-white">
                    🚨 3 Alerts Ignored
                  </span>
                  <span className="text-xs text-[#566D75] font-mono">
                    Scheduled: {new Date(rem.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <h4 className="text-xl font-extrabold text-[#263B42]">{rem.title}</h4>
                <p className="text-xs text-[#566D75] mt-0.5 font-medium">
                  Patient did not respond after 3 gentle audio/visual reminder prompts.
                </p>
              </div>

              <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    playCaregiverAlert();
                    alert(`Calling ${patient?.name || 'Patient'} primary phone line...`);
                  }}
                  className="px-4 py-2.5 bg-[#C95C5C] hover:bg-[#b04a4a] text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>📞</span>
                  <span>Call Patient</span>
                </button>
                <button
                  onClick={() => handleResend(rem._id)}
                  className="px-4 py-2.5 bg-[#D9A441] hover:bg-[#c29032] text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>🔁</span>
                  <span>Resend Alarm</span>
                </button>
                <button
                  onClick={() => handleComplete(rem._id)}
                  className="px-4 py-2.5 bg-[#4F8A5B] hover:bg-[#41754c] text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>✓</span>
                  <span>Mark Done</span>
                </button>
              </div>
            </div>
          ))}

          {/* MISSED REMINDERS */}
          {missedReminders.map(rem => (
            <div key={rem._id} className="p-5 rounded-2xl border-l-4 border-l-[#C95C5C] border border-[#EADBCC] bg-[#FFFDF7] flex justify-between items-center shadow-sm">
              <div>
                <p className="text-xs text-[#C95C5C] font-bold uppercase tracking-wider mb-0.5">Missed Reminder</p>
                <h4 className="text-base font-bold text-[#263B42]">{rem.title}</h4>
                <p className="text-xs text-[#566D75]">Scheduled: {new Date(rem.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
              <span className="bg-[#FFF5F5] text-[#C95C5C] border border-[#C95C5C]/30 px-3 py-1 rounded-full text-xs font-bold">
                MISSED
              </span>
            </div>
          ))}

          {/* DELAYED ROUTINES */}
          {incompleteRoutines.map(rout => (
            <div key={rout._id} className="p-5 rounded-2xl border-l-4 border-l-[#D9A441] border border-[#EADBCC] bg-[#FFFDF7] flex justify-between items-center shadow-sm">
              <div>
                <p className="text-xs text-[#D9A441] font-bold uppercase tracking-wider mb-0.5">Late Daily Routine</p>
                <h4 className="text-base font-bold text-[#263B42]">{rout.title}</h4>
                <p className="text-xs text-[#566D75]">Scheduled: {rout.scheduledTime} (Category: <span className="capitalize">{rout.category}</span>)</p>
              </div>
              <span className="bg-[#FFF9E6] text-[#D9A441] border border-[#D9A441]/30 px-3 py-1 rounded-full text-xs font-bold">
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
