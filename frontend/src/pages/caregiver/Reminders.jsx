import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const Reminders = () => {
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

  if (loading) {
    return (
      <div className="p-12 text-center text-[#566D75] flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-4 border-[#397F7A] border-t-transparent rounded-full animate-spin"></span>
        <span className="text-lg font-bold text-[#263B42]">Loading patient reminders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Top Header & Create Button */}
      <div className="bg-[#FFFDF7] border border-[#EADBCC] p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#263B42]">
            Care Reminders & Scheduled Alerts
          </h2>
          <p className="text-sm font-medium text-[#566D75] mt-1">
            Schedule medication alerts, hydration reminders, and family check-ins in your exact local time.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({ title: '', scheduledTime: getLocalDefaultTime() });
            setShowModal(true);
          }}
          className="bg-[#397F7A] hover:bg-[#2E6B66] text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm active:scale-95 text-sm sm:text-base flex items-center gap-2"
        >
          <span>+</span>
          <span>Create New Reminder</span>
        </button>
      </div>

      {/* Filter Tabs & Counter */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex rounded-xl p-1 bg-[#F7F3E8] border border-[#EADBCC]">
          {[
            { key: 'all', label: 'All', count: reminders.length },
            { key: 'pending', label: 'Active', count: reminders.filter(r => r.status === 'pending').length },
            { key: 'completed', label: 'Completed', count: reminders.filter(r => r.status === 'completed').length },
            { key: 'missed', label: 'Overdue / Missed', count: reminders.filter(r => r.status === 'missed').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                filter === tab.key
                ? 'bg-[#397F7A] text-white shadow-sm'
                : 'text-[#566D75] hover:text-[#263B42]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                filter === tab.key ? 'bg-white/20 text-white' : 'bg-[#EADBCC] text-[#263B42]'
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
                className={`p-6 rounded-3xl border bg-[#FFFDF7] transition-all duration-200 flex flex-col justify-between shadow-sm ${
                  isCompleted 
                  ? 'border-[#4F8A5B]/40' 
                  : isMissed 
                  ? 'border-[#C95C5C]/40' 
                  : 'border-[#EADBCC] hover:border-[#8DB7A5]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                      isCompleted 
                      ? 'bg-[#4F8A5B]/15 text-[#4F8A5B] border-[#4F8A5B]/30' 
                      : isMissed 
                      ? 'bg-[#C95C5C]/15 text-[#C95C5C] border-[#C95C5C]/30' 
                      : 'bg-[#D9A441]/15 text-[#D9A441] border-[#D9A441]/30'
                    }`}>
                      {rem.status}
                    </span>

                    <button 
                      onClick={() => handleDelete(rem._id)}
                      className="text-[#566D75] hover:text-[#C95C5C] text-lg px-1 transition-colors"
                      title="Delete reminder"
                    >
                      ×
                    </button>
                  </div>

                  <h4 className="text-lg font-bold mb-2 text-[#263B42]">{rem.title}</h4>
                  <p className="text-sm text-[#566D75] mb-6 flex items-center gap-1.5 font-medium">
                    <span>⏰</span>
                    <span>{dateStr} at <strong className="text-[#397F7A] font-bold">{timeStr}</strong></span>
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EADBCC] flex gap-2">
                  {!isCompleted && (
                    <button
                      onClick={() => handleComplete(rem._id)}
                      className="flex-1 bg-[#4F8A5B] hover:bg-[#41754c] text-white py-2 px-3 rounded-xl font-bold transition text-xs shadow-sm active:scale-95"
                    >
                      ✓ Mark Completed
                    </button>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-[#4F8A5B] font-bold py-2 flex items-center gap-1">
                      <span>✅</span> Completed {rem.completedAt ? new Date(rem.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 text-center text-[#566D75] bg-[#FFFDF7] rounded-3xl border border-dashed border-[#EADBCC]">
            <div className="text-4xl mb-3">⏰</div>
            <p className="text-lg font-bold text-[#263B42]">No {filter !== 'all' ? filter : ''} reminders found</p>
            <p className="text-sm text-[#566D75] mt-1">Click "+ Create New Reminder" above to set a timed reminder for the patient.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#263B42]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EADBCC] bg-[#FFFDF7] text-[#263B42]">
            <h3 className="text-xl font-bold mb-1 text-[#263B42]">Create Patient Reminder</h3>
            <p className="text-xs text-[#566D75] mb-4">Saved in your exact local time zone and sent to patient view.</p>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Reminder Title</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Afternoon Medication" 
                  className="w-full border border-[#EADBCC] p-3 rounded-xl font-medium outline-none bg-white text-[#263B42] focus:border-[#397F7A]" 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#566D75]">Scheduled Date & Time (Your Local Time)</label>
                <input 
                  required 
                  type="datetime-local" 
                  className="w-full border border-[#EADBCC] p-3 rounded-xl font-medium outline-none bg-white text-[#263B42] focus:border-[#397F7A]" 
                  value={form.scheduledTime} 
                  onChange={e => setForm({...form, scheduledTime: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-[#EADBCC]">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-sm font-bold text-[#566D75] hover:text-[#263B42] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-[#397F7A] hover:bg-[#2E6B66] text-white rounded-xl font-bold shadow-sm transition-all active:scale-95 text-sm"
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
