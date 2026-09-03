import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const Alerts = () => {
  const [missedReminders, setMissedReminders] = useState([]);
  const [incompleteRoutines, setIncompleteRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const pRes = await api.get('/caregiver/patients');
        const pts = pRes.data.patients || pRes.data || [];
        if (pts.length > 0) {
          const pid = pts[0]._id || pts[0].id;
          
          const [remRes, routRes] = await Promise.all([
            api.get(`/reminders/missed/${pid}`),
            api.get(`/routines/today/${pid}`)
          ]);

          setMissedReminders(remRes.data.reminders || remRes.data || []);
          
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
    fetchAlerts();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading alerts...</div>;

  const hasAlerts = missedReminders.length > 0 || incompleteRoutines.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">Attention Required</h2>
      
      {!hasAlerts ? (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-xl font-bold mb-1">No alerts! Everything is on track.</h3>
          <p className="text-sm opacity-80">All scheduled routines and reminders have been completed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missedReminders.map(rem => (
            <div key={rem._id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
              <div>
                <p className="text-xs text-red-800 font-bold uppercase tracking-wider mb-1">Missed Reminder</p>
                <h4 className="text-lg font-bold text-gray-900">{rem.title}</h4>
                <p className="text-sm text-gray-600">Scheduled: {new Date(rem.scheduledTime).toLocaleString()}</p>
              </div>
              <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap self-start sm:self-auto">
                MISSED
              </span>
            </div>
          ))}

          {incompleteRoutines.map(rout => (
            <div key={rout._id} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
              <div>
                <p className="text-xs text-orange-800 font-bold uppercase tracking-wider mb-1">Delayed Routine</p>
                <h4 className="text-lg font-bold text-gray-900">{rout.title}</h4>
                <p className="text-sm text-gray-600">Scheduled: {rout.scheduledTime} (Category: <span className="capitalize">{rout.category}</span>)</p>
              </div>
              <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap self-start sm:self-auto">
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
