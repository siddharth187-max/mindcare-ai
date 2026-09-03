import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const Progress = () => {
  const { darkMode } = useOutletContext() || {};
  const [patientId, setPatientId] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('7day'); // '7day' or '30day'

  useEffect(() => {
    const init = async () => {
      try {
        const pRes = await api.get('/caregiver/patients');
        const pts = pRes.data.patients || pRes.data || [];
        if (pts.length > 0) {
          const pid = pts[0]._id || pts[0].id;
          setPatientId(pid);
          
          const [histRes, analRes] = await Promise.all([
            api.get(`/games/history/${pid}`),
            api.get(`/analytics/${pid}`)
          ]);

          const rawHistory = histRes.data.results || histRes.data.history || (Array.isArray(histRes.data) ? histRes.data : []);
          setHistory(rawHistory);
          setAnalytics(analRes.data);
        }
      } catch (err) {
        console.error("Error loading progress data:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const cardStyle = darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const subTextStyle = darkMode ? 'text-slate-400' : 'text-slate-500';

  if (loading) return (
    <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
      <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
      <span className="text-lg font-bold">Analyzing cognitive performance metrics...</span>
    </div>
  );

  if (!patientId) return (
    <div className="p-12 text-center text-slate-500 bg-slate-900/5 rounded-2xl border border-dashed border-slate-300">
      <p className="text-xl font-bold">No patient profile assigned yet.</p>
    </div>
  );

  const accuracyData = history.map((h, i) => ({
    date: h.completedAt ? new Date(h.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : `Sess ${i + 1}`,
    accuracy: h.accuracy ?? 0,
    score: h.score ?? 0,
    gameType: h.gameType || 'activity'
  })).slice(viewMode === '7day' ? -7 : -30);

  const gameCounts = {};
  const gameScores = {};
  history.forEach(h => {
    const type = h.gameType || 'unknown';
    gameCounts[type] = (gameCounts[type] || 0) + 1;
    if (!gameScores[type]) gameScores[type] = { total: 0, count: 0 };
    gameScores[type].total += (h.score || 0);
    gameScores[type].count += 1;
  });

  const gamesByTypeData = Object.keys(gameCounts).map(key => ({
    name: key === 'objectRecognition' ? 'Object Find' : key === 'routineSequence' ? 'Routine Step' : key,
    count: gameCounts[key]
  }));

  const avgScoreData = Object.keys(gameScores).map(key => ({
    name: key === 'objectRecognition' ? 'Object Find' : key === 'routineSequence' ? 'Routine Step' : key,
    avgScore: Math.round(gameScores[key].total / gameScores[key].count)
  }));

  const overallAvg = history.length 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / history.length) 
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Cognitive Trends & Telemetry
          </h2>
          <p className={`text-sm font-medium ${subTextStyle} mt-0.5`}>
            Continuous monitoring of patient cognitive precision and engagement over time.
          </p>
        </div>

        <div className={`flex rounded-xl p-1 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button 
            onClick={() => setViewMode('7day')} 
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              viewMode === '7day' 
              ? 'bg-blue-600 text-white shadow-md' 
              : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 7 Sessions
          </button>
          <button 
            onClick={() => setViewMode('30day')} 
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              viewMode === '30day' 
              ? 'bg-blue-600 text-white shadow-md' 
              : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 30 Sessions
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border ${cardStyle}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${subTextStyle}`}>Total Cognitive Sessions</p>
          <p className="text-3xl font-extrabold mt-1 text-blue-500">{history.length}</p>
          <span className="text-xs text-emerald-500 font-bold mt-2 inline-block">● Telemetry Active</span>
        </div>

        <div className={`p-5 rounded-2xl border ${cardStyle}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${subTextStyle}`}>Overall Average Accuracy</p>
          <p className={`text-3xl font-extrabold mt-1 ${overallAvg >= 80 ? 'text-emerald-500' : overallAvg >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
            {overallAvg}%
          </p>
          <span className="text-xs font-bold opacity-80 mt-2 inline-block">Adaptive Engine Baseline</span>
        </div>

        <div className={`p-5 rounded-2xl border ${cardStyle}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${subTextStyle}`}>Most Engaged Domain</p>
          <p className="text-3xl font-extrabold mt-1 capitalize text-purple-500">
            {gamesByTypeData.sort((a,b) => b.count - a.count)[0]?.name || 'Memory Match'}
          </p>
          <span className="text-xs font-bold opacity-80 mt-2 inline-block">Top Activity</span>
        </div>
      </div>

      {/* Accuracy Over Time LineChart */}
      <div className={`p-6 rounded-2xl border ${cardStyle}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold">Accuracy & Cognitive Trend Line</h3>
            <p className={`text-xs ${subTextStyle}`}>Session accuracy trajectory</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Precision Curve
          </span>
        </div>

        <div className="h-72 w-full">
          {accuracyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="date" stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderColor: darkMode ? '#334155' : '#cbd5e1',
                    borderRadius: '12px',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    fontWeight: 'bold'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  name="Accuracy (%)" 
                  dataKey="accuracy" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#3b82f6' }}
                  activeDot={{ r: 8, stroke: '#60a5fa', strokeWidth: 2 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 font-medium">
              No cognitive telemetry recorded yet. Play a game in the Patient View to populate.
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Bar Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border ${cardStyle}`}>
          <h3 className="text-lg font-bold mb-4">Sessions by Cognitive Domain</h3>
          <div className="h-64">
            {gamesByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gamesByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#cbd5e1',
                      borderRadius: '12px' 
                    }} 
                  />
                  <Bar dataKey="count" name="Sessions Played" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">No session data</div>
            )}
          </div>
        </div>

        <div className={`p-6 rounded-2xl border ${cardStyle}`}>
          <h3 className="text-lg font-bold mb-4">Average Score by Domain</h3>
          <div className="h-64">
            {avgScoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#cbd5e1',
                      borderRadius: '12px' 
                    }} 
                  />
                  <Bar dataKey="avgScore" name="Avg Score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">No score data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
