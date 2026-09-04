import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';

const Reminders = () => {
  const { darkMode } = useOutletContext() || {};
  const [patientId, setPatientId] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed', 'missed'
  const [showModal, setShowModal] = useState(false);
  
  // Format local date/time for <input type="datetime-local"> without UTC shift
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

  const [form, setForm] = useState({ title: '', scheduledTime: getLocalDefaultTime() });

  const fetchReminders = async (pid) => {
    try {
      const res = await api.get(`/reminders/patient/${pid}`);
      setReminders(res.data.reminders || res.data || []);
    } catch (err) {
      console.error("Error loading reminders:", err);
      try {
        const pRes = await api.get(`/reminders/pending/${pid}`);
        setReminders(pRes.data.reminders || pRes.data || []);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const pRes = await api.get('/caregiver/patients');
        const pts = pRes.data.patients || pRes.data || [];
        if (pts.length > 0) {
          const pid = pts[0]._id || pts[0].id;
          setPatientId(pid);
          await fetchReminders(pid);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.scheduledTime) return;

    try {
      // Parse local time explicitly so timezone offset is preserved
      const localDate = new Date(form.scheduledTime);
      const isoTime = isNaN(localDate.getTime()) ? form.scheduledTime : localDate.toISOString();

      await api.post('/reminders', {
        title: form.title,
        scheduledTime: isoTime,
        patientId
      });
      setShowModal(false);
      setForm({ title: '', scheduledTime: getLocalDefaultTime() });
      await fetchReminders(patientId);
    } catch (err) {
      console.error("Error creating reminder:", err);
      alert(err.response?.data?.message || "Failed to create reminder.");
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.patch(`/reminders/${id}/complete`);
      await fetchReminders(patientId);
    } catch (err) {
      console.error("Error completing reminder:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this reminder?")) return;
    try {
      await api.delete(`/reminders/${id}`);
      await fetchReminders(patientId);
    } catch (err) {
      console.error("Error deleting reminder:", err);
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'missed') return r.status === 'missed';
    return true;
  });

  const cardStyle = darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const subTextStyle = darkMode ? 'text-slate-400' : 'text-slate-500';

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
        <span className="text-lg font-bold">Loading patient reminders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Top Header & Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/40 pb-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Care Reminders & Scheduled Alerts
          </h2>
          <p className={`text-sm font-medium ${subTextStyle} mt-0.5`}>
            Schedule medication alerts, hydration reminders, and family check-ins in your exact local time.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({ title: '', scheduledTime: getLocalDefaultTime() });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm flex items-center gap-2"
        >
          <span>+</span>
          <span>Create New Reminder</span>
        </button>
      </div>

      {/* Filter Tabs & Counter */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className={`flex rounded-xl p-1 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          {[
            { key: 'all', label: 'All', count: reminders.length },
            { key: 'pending', label: 'Active', count: reminders.filter(r => r.status === 'pending').length },
            { key: 'completed', label: 'Completed', count: reminders.filter(r => r.status === 'completed').length },
            { key: 'missed', label: 'Overdue / Missed', count: reminders.filter(r => r.status === 'missed').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                filter === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs ${
                filter === tab.key ? 'bg-blue-800 text-white' : 'bg-slate-800/40 opacity-75'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reminder Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredReminders.length > 0 ? (
          filteredReminders.map(rem => {
            const isCompleted = rem.status === 'completed';
            const isMissed = rem.status === 'missed';
            const dateObj = new Date(rem.scheduledTime);
            const dateStr = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

            return (
              <div 
                key={rem._id} 
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${cardStyle} ${
                  isCompleted 
                  ? 'border-emerald-500/30' 
                  : isMissed 
                  ? 'border-rose-500/30' 
                  : 'border-blue-500/30 hover:border-blue-500/50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${
                      isCompleted 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : isMissed 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {rem.status}
                    </span>

                    <button 
                      onClick={() => handleDelete(rem._id)}
                      className="text-slate-400 hover:text-rose-400 text-lg px-1 transition-colors"
                      title="Delete reminder"
                    >
                      ×
                    </button>
                  </div>

                  <h4 className="text-lg font-bold mb-2 text-white">{rem.title}</h4>
                  <p className={`text-sm ${subTextStyle} mb-6 flex items-center gap-1.5 font-medium`}>
                    <span>⏰</span>
                    <span>{dateStr} at <strong className="text-blue-400 font-bold">{timeStr}</strong></span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex gap-2">
                  {!isCompleted && (
                    <button
                      onClick={() => handleComplete(rem._id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-xl font-bold transition text-xs shadow-sm active:scale-95"
                    >
                      ✓ Mark Completed
                    </button>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-emerald-400 font-bold py-2 flex items-center gap-1">
                      <span>✅</span> Completed {rem.completedAt ? new Date(rem.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <div className="text-4xl mb-3">⏰</div>
            <p className="text-lg font-bold text-slate-300">No {filter !== 'all' ? filter : ''} reminders found</p>
            <p className="text-sm text-slate-500 mt-1">Click "+ Create New Reminder" above to set a timed reminder for the patient.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xl font-extrabold mb-1">Create Patient Reminder</h3>
            <p className="text-xs text-slate-400 mb-4">Saved in your exact local time zone and sent to patient view.</p>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Reminder Title</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Afternoon Medication" 
                  className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Scheduled Date & Time (Your Local Time)</label>
                <input 
                  required 
                  type="datetime-local" 
                  className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
                  value={form.scheduledTime} 
                  onChange={e => setForm({...form, scheduledTime: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 text-sm"
                >
                  Save & Broadcast Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
