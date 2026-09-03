import React, { useState, useEffect } from 'react';
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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!patients.length) return <div className="p-8 text-center text-gray-500">No patients assigned to you yet.</div>;
  if (!dashboardData) return null;

  const patient = dashboardData.patient || {};
  const stats = dashboardData.stats || {};
  const todayRoutines = dashboardData.todaysRoutine || dashboardData.todayRoutines || [];
  const completedCount = dashboardData.completedActivities?.length || todayRoutines.filter(r => r.completed).length;
  const adherence = todayRoutines.length > 0 ? `${Math.round((completedCount / todayRoutines.length) * 100)}%` : '0%';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{patient?.name}'s Dashboard</h2>
          {patient?.age && <p className="text-gray-500">Age: {patient.age}</p>}
        </div>
        {patients.length > 1 && (
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
          >
            {patients.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Routine Adherence</p>
          <p className="text-2xl font-bold text-green-600">
            {adherence}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Cognitive Sessions</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.gamesCompleted || stats?.totalSessions || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Avg Accuracy</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.averageAccuracy || 0}%</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Difficulty</p>
          <p className="text-2xl font-bold text-blue-600 uppercase tracking-wider text-sm mt-1">
            {stats?.currentDifficulty || 'EASY'}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Cognitive Accuracy Trend</h3>
          <div className="h-64">
            {stats?.weeklyPerformance?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="averageAccuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No data for the last 7 days.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Routines</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReminderModal(true)}
                className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-md font-medium hover:bg-indigo-100"
              >
                + Reminder
              </button>
              <button
                onClick={() => setShowRoutineModal(true)}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md font-medium hover:bg-blue-100"
              >
                + Routine
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-64 space-y-3 pr-2">
            {todayRoutines?.length > 0 ? (
              todayRoutines.map((routine) => (
                <div key={routine._id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{routine.title}</p>
                    <p className="text-sm text-gray-500">
                      {routine.scheduledTime} • <span className="capitalize">{routine.category}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {routine.completed ? (
                      <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Done</span>
                    ) : (
                      <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                    )}
                    <button onClick={() => handleDeleteRoutine(routine._id)} className="text-red-500 hover:text-red-700 text-lg">
                      ×
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No routines scheduled for today.</p>
            )}
          </div>
        </div>
      </div>

      {showRoutineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add Routine</h3>
            <form onSubmit={handleAddRoutine} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input required type="text" className="w-full border p-2 rounded" value={routineForm.title} onChange={e => setRoutineForm({...routineForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full border p-2 rounded" value={routineForm.description} onChange={e => setRoutineForm({...routineForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input required type="time" className="w-full border p-2 rounded" value={routineForm.scheduledTime} onChange={e => setRoutineForm({...routineForm, scheduledTime: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full border p-2 rounded" value={routineForm.category} onChange={e => setRoutineForm({...routineForm, category: e.target.value})}>
                    <option value="medicine">Medicine</option>
                    <option value="hygiene">Hygiene</option>
                    <option value="meal">Meal</option>
                    <option value="exercise">Exercise</option>
                    <option value="cognitive">Cognitive</option>
                    <option value="sleep">Sleep</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowRoutineModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add Reminder</h3>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input required type="text" className="w-full border p-2 rounded" value={reminderForm.title} onChange={e => setReminderForm({...reminderForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date & Time</label>
                <input required type="datetime-local" className="w-full border p-2 rounded" value={reminderForm.scheduledTime} onChange={e => setReminderForm({...reminderForm, scheduledTime: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowReminderModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
