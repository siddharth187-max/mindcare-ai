import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const Reminders = () => {
  const [patientId, setPatientId] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', scheduledTime: '' });

  const fetchReminders = async (pid) => {
    try {
      const res = await api.get(`/reminders/pending/${pid}`);
      setReminders(res.data.reminders || res.data || []);
    } catch (err) {
      console.error(err);
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
    try {
      await api.post('/reminders', { ...form, patientId });
      setShowModal(false);
      setForm({ title: '', scheduledTime: '' });
      fetchReminders(patientId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.patch(`/reminders/${id}/complete`);
      fetchReminders(patientId);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading reminders...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Active Reminders</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm text-sm"
        >
          + Create Reminder
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reminders.length > 0 ? (
          reminders.map(rem => (
            <div key={rem._id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">{rem.title}</h4>
                <p className="text-sm text-gray-600 mb-6 flex items-center gap-2">
                  <span className="text-lg">⏰</span>
                  {new Date(rem.scheduledTime).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleComplete(rem._id)}
                className="w-full bg-green-50 text-green-700 py-2 rounded-md font-medium hover:bg-green-100 transition border border-green-200 text-sm"
              >
                Mark Complete
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="text-3xl mb-3">🕰️</div>
            <p className="text-lg font-medium text-gray-900">No active reminders</p>
            <p className="text-sm">Create a new reminder to notify the patient.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Create New Reminder</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Reminder Content</label>
                <input required type="text" placeholder="e.g. Call grandson" className="w-full border border-gray-300 p-2 rounded focus:ring-blue-500 focus:border-blue-500 outline-none" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Date & Time</label>
                <input required type="datetime-local" className="w-full border border-gray-300 p-2 rounded focus:ring-blue-500 focus:border-blue-500 outline-none" value={form.scheduledTime} onChange={e => setForm({...form, scheduledTime: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 font-medium transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition shadow-sm">Save Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
