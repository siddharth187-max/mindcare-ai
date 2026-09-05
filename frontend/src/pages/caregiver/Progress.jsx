import React, { useState, useEffect } from 'react';
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

  if (loading) return (
    <div className="p-12 text-center text-[#566D75] flex flex-col items-center gap-3">
      <span className="w-8 h-8 border-4 border-[#397F7A] border-t-transparent rounded-full animate-spin"></span>
      <span className="text-lg font-bold text-[#263B42]">Analyzing cognitive performance metrics...</span>
    </div>
  );

  if (!patientId) return (
    <div className="p-12 text-center text-[#566D75] bg-[#FFFDF7] rounded-3xl border border-dashed border-[#EADBCC]">
      <p className="text-xl font-bold text-[#263B42]">No patient profile assigned yet.</p>
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
      <div className="bg-[#FFFDF7] border border-[#EADBCC] p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#263B42]">
            Cognitive Trends & Analytics
          </h2>
          <p className="text-sm font-medium text-[#566D75] mt-1">
            Continuous monitoring of patient cognitive precision, recall rates, and domain engagement over time.
          </p>
        </div>

        <div className="flex rounded-xl p-1 bg-[#F7F3E8] border border-[#EADBCC]">
          <button 
            onClick={() => setViewMode('7day')} 
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              viewMode === '7day' 
              ? 'bg-[#397F7A] text-white shadow-sm' 
              : 'text-[#566D75] hover:text-[#263B42]'
            }`}
          >
            Last 7 Sessions
          </button>
          <button 
            onClick={() => setViewMode('30day')} 
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              viewMode === '30day' 
              ? 'bg-[#397F7A] text-white shadow-sm' 
              : 'text-[#566D75] hover:text-[#263B42]'
            }`}
          >
            Last 30 Sessions
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#566D75]">Total Cognitive Sessions</p>
          <p className="text-3xl font-extrabold mt-1 text-[#397F7A]">{history.length}</p>
          <span className="text-xs text-[#4F8A5B] font-bold mt-2 inline-block">● Telemetry Active</span>
        </div>

        <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#566D75]">Overall Average Accuracy</p>
          <p className={`text-3xl font-extrabold mt-1 ${overallAvg >= 80 ? 'text-[#4F8A5B]' : overallAvg >= 50 ? 'text-[#D9A441]' : 'text-[#C95C5C]'}`}>
            {overallAvg}%
          </p>
          <span className="text-xs font-bold text-[#566D75] mt-2 inline-block">Adaptive Engine Baseline</span>
        </div>

        <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#566D75]">Most Engaged Domain</p>
          <p className="text-3xl font-extrabold mt-1 capitalize text-[#263B42]">
            {gamesByTypeData.sort((a,b) => b.count - a.count)[0]?.name || 'Memory Match'}
          </p>
          <span className="text-xs font-bold text-[#566D75] mt-2 inline-block">Top Activity</span>
        </div>
      </div>

      {/* Accuracy Over Time LineChart */}
      <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#263B42]">Accuracy & Cognitive Trend Line</h3>
            <p className="text-xs text-[#566D75]">Session accuracy trajectory</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#8DB7A5]/20 text-[#397F7A] border border-[#8DB7A5]/40">
            Precision Curve
          </span>
        </div>

        <div className="h-72 w-full">
          {accuracyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EADBCC" />
                <XAxis dataKey="date" stroke="#566D75" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke="#566D75" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFDF7', 
                    borderColor: '#EADBCC',
                    borderRadius: '16px',
                    color: '#263B42',
                    boxShadow: '0 4px 12px rgba(38, 59, 66, 0.08)',
                    fontWeight: 'bold'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  name="Accuracy (%)" 
                  dataKey="accuracy" 
                  stroke="#397F7A" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#397F7A' }}
                  activeDot={{ r: 8, stroke: '#8DB7A5', strokeWidth: 2 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-[#566D75] font-medium">
              No cognitive telemetry recorded yet. Play a game in the Patient View to populate.
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Bar Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <h3 className="text-lg font-bold text-[#263B42] mb-4">Sessions by Cognitive Domain</h3>
          <div className="h-64">
            {gamesByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gamesByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EADBCC" />
                  <XAxis dataKey="name" stroke="#566D75" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#566D75" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFDF7', 
                      borderColor: '#EADBCC',
                      borderRadius: '16px',
                      color: '#263B42'
                    }} 
                  />
                  <Bar dataKey="count" name="Sessions Played" fill="#8DB7A5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[#566D75]">No session data</div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <h3 className="text-lg font-bold text-[#263B42] mb-4">Average Score by Domain</h3>
          <div className="h-64">
            {avgScoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EADBCC" />
                  <XAxis dataKey="name" stroke="#566D75" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#566D75" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFDF7', 
                      borderColor: '#EADBCC',
                      borderRadius: '16px',
                      color: '#263B42'
                    }} 
                  />
                  <Bar dataKey="avgScore" name="Avg Score" fill="#397F7A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[#566D75]">No score data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
