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
          setHistory(histRes.data);
          setAnalytics(analRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading progress data...</div>;
  if (!patientId) return <div className="p-8 text-center text-gray-500">No patient data available.</div>;

  const accuracyData = history.map(h => ({
    date: new Date(h.createdAt).toLocaleDateString(),
    accuracy: h.accuracy,
    score: h.score,
    gameType: h.gameType
  })).slice(viewMode === '7day' ? -7 : -30);

  const gameCounts = {};
  const gameScores = {};
  history.forEach(h => {
    gameCounts[h.gameType] = (gameCounts[h.gameType] || 0) + 1;
    if (!gameScores[h.gameType]) gameScores[h.gameType] = { total: 0, count: 0 };
    gameScores[h.gameType].total += h.score;
    gameScores[h.gameType].count += 1;
  });

  const gamesByTypeData = Object.keys(gameCounts).map(key => ({
    name: key,
    count: gameCounts[key]
  }));

  const avgScoreData = Object.keys(gameScores).map(key => ({
    name: key,
    avgScore: Math.round(gameScores[key].total / gameScores[key].count)
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Cognitive Progress</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('7day')} 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === '7day' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            7 Days
          </button>
          <button 
            onClick={() => setViewMode('30day')} 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === '30day' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Games Played</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">{history.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Overall Accuracy</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            {history.length ? Math.round(history.reduce((acc, curr) => acc + curr.accuracy, 0) / history.length) : 0}%
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Most Played</p>
          <p className="text-3xl font-bold mt-1 capitalize text-gray-900">
            {gamesByTypeData.sort((a,b) => b.count - a.count)[0]?.name || 'N/A'}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Accuracy Over Time</h3>
        <div className="h-72">
          {accuracyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" name="Accuracy" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">Not enough data</div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Games by Type</h3>
          <div className="h-64">
            {gamesByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gamesByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center text-gray-400">No data</div>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Avg Score by Game Type</h3>
          <div className="h-64">
            {avgScoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgScoreData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgScore" name="Avg Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">No data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
