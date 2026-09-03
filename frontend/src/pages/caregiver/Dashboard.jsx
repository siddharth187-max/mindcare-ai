import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
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
  const [reminderForm, setReminderForm] = useState({
    title: '',
    scheduledTime: '',
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

  const fetchDashboardData = async (patientId) => {
    try {
      setLoading(true);
      const response = await api.get(`/caregiver/dashboard/${patientId}`);
      setDashboardData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchDashboardData(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleAddRoutine = async (e) => {
    e.preventDefault();
    try {
      await api.post('/routines', { ...routineForm, patientId: selectedPatientId });
      setShowRoutineModal(false);
      fetchDashboardData(selectedPatientId);
      setRoutineForm({ title: '', description: '', scheduledTime: '', category: 'other' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reminders', { ...reminderForm, patientId: selectedPatientId });
      setShowReminderModal(false);
      setReminderForm({ title: '', scheduledTime: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoutine = async (id) => {
    if (!window.confirm('Delete this routine?')) return;
    try {
      await api.delete(`/routines/${id}`);
      fetchDashboardData(selectedPatientId);
    } catch (err) {
      console.error(err);
    }
  };

  const cardStyle = darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900 shadow-sm';
  const subTextStyle = darkMode ? 'text-slate-400' : 'text-slate-500';

  if (loading) return (
    <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
      <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
      <span className="text-lg font-bold">Connecting to patient telemetry stream...</span>
    </div>
  );
  
  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  if (!patients.length) return <div className="p-8 text-center text-slate-500">No patients assigned to you yet.</div>;
  if (!dashboardData) return null;

  const patient = dashboardData.patient || {};
  const stats = dashboardData.stats || {};
  const todayRoutines = dashboardData.todaysRoutine || dashboardData.todayRoutines || [];
  const completedCount = dashboardData.completedActivities?.length || todayRoutines.filter(r => r.completed).length;
  const adherence = todayRoutines.length > 0 ? `${Math.round((completedCount / todayRoutines.length) * 100)}%` : '0%';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Patient Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className={`text-2xl sm:text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {patient?.name}'s Telemetry
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              ● Monitored
            </span>
          </div>
          {patient?.age && <p className={`text-sm font-semibold ${subTextStyle} mt-0.5`}>Age: {patient.age} • Care Profile Active</p>}
        </div>

        {patients.length > 1 && (
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className={`border rounded-xl shadow-sm p-2.5 font-bold text-sm outline-none ${
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
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${subTextStyle}`}>Adaptive Engine</p>
          <p className="text-2xl font-extrabold text-amber-500 uppercase tracking-wider mt-1">
            {stats?.currentDifficulty || 'EASY'}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Active Scaling</span>
        </div>
      </div>

      {/* Charts & Routine Side-by-Side */}
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

        {/* Today's Routines */}
        <div className={`p-6 rounded-2xl border flex flex-col ${cardStyle}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Today's Routine Checklist</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReminderModal(true)}
                className="text-xs bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl font-bold transition-colors"
              >
                + Reminder
              </button>
              <button
                onClick={() => setShowRoutineModal(true)}
                className="text-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl font-bold transition-colors"
              >
                + Routine
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-64 space-y-2.5 pr-1">
            {todayRoutines?.length > 0 ? (
              todayRoutines.map((routine) => (
                <div 
                  key={routine._id} 
                  className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
                    darkMode ? 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm">{routine.title}</p>
                    <p className={`text-xs ${subTextStyle}`}>
                      ⏰ {routine.scheduledTime} • <span className="capitalize">{routine.category}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {routine.completed ? (
                      <span className="text-xs font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full border border-emerald-500/20">Done</span>
                    ) : (
                      <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full border border-amber-500/20">Pending</span>
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
                  className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
                  placeholder="e.g. Afternoon Walk" 
                  value={routineForm.title} 
                  onChange={e => setRoutineForm({...routineForm, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Description</label>
                <textarea 
                  className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
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
                    className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
                    value={routineForm.scheduledTime} 
                    onChange={e => setRoutineForm({...routineForm, scheduledTime: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Category</label>
                  <select 
                    className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
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
            <h3 className="text-xl font-extrabold mb-4">Add Safety Reminder</h3>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Reminder Title</label>
                <input 
                  required 
                  type="text" 
                  className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
                  placeholder="e.g. Drink warm herbal tea" 
                  value={reminderForm.title} 
                  onChange={e => setReminderForm({...reminderForm, title: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Scheduled Date & Time</label>
                <input 
                  required 
                  type="datetime-local" 
                  className={`w-full border p-3 rounded-xl font-medium outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} 
                  value={reminderForm.scheduledTime} 
                  onChange={e => setReminderForm({...reminderForm, scheduledTime: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-700/50">
                <button type="button" onClick={() => setShowReminderModal(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95">Save Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
