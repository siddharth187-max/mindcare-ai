import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const Results = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { highContrast } = useOutletContext() || {};

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const pRes = await api.get('/patients/me');
        const pat = pRes.data.patient || pRes.data;
        if (pat && (pat._id || pat.id)) {
          const pid = pat._id || pat.id;
          const res = await api.get(`/games/history/${pid}`);
          const raw = res.data.results || res.data.history || (Array.isArray(res.data) ? res.data : []);
          setHistory(raw);
        } else {
          setError("Patient profile not found.");
        }
      } catch (err) {
        console.error("Error fetching game history:", err);
        setError("Could not load your history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <LoadingSpinner message="Loading your activity progress..." />;

  const formatGameType = (type) => {
    const types = {
      memory: '🃏 Memory Card Match',
      pattern: '🎵 Melody & Pattern Chimes',
      objectRecognition: '🔍 Everyday Object Quiz',
      routineSequence: '📝 Daily Steps in Order'
    };
    return types[type] || type;
  };

  const totalSessions = history.length;
  const avgAccuracy = totalSessions > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / totalSessions) 
    : 0;

  const cardStyle = highContrast 
    ? 'bg-black border-2 border-cyan-400 text-white' 
    : 'bg-slate-900/90 border border-slate-800 text-white shadow-xl';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-900/30 pb-4">
        <Link 
          to="/patient" 
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl shadow-sm font-bold text-sm transition-all flex items-center gap-2 active:scale-95"
        >
          ← Return Home
        </Link>
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white">📊 My Brain Progress</h1>
          <p className="text-sm font-bold text-purple-300 mt-0.5">Summary of all your completed cognitive sessions</p>
        </div>
        <div className="w-28 hidden sm:block"></div>
      </div>

      {/* KPI Stats Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-900/40 text-center shadow-lg">
          <span className="text-xs font-black uppercase tracking-widest text-purple-300">Total Activities Played</span>
          <p className="text-4xl font-black text-purple-400 mt-1">{totalSessions}</p>
          <span className="text-xs text-slate-400 mt-1 block">Memory & Focus Sessions</span>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-900/40 text-center shadow-lg">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-300">Average Precision</span>
          <p className="text-4xl font-black text-emerald-400 mt-1">{avgAccuracy}%</p>
          <span className="text-xs text-slate-400 mt-1 block">Continuous Cognitive Metric</span>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-900/40 text-center shadow-lg">
          <span className="text-xs font-black uppercase tracking-widest text-blue-300">Adaptive Status</span>
          <p className="text-3xl font-black text-blue-400 uppercase mt-2">Active</p>
          <span className="text-xs text-slate-400 mt-1 block">Paced to Your Comfort</span>
        </div>
      </div>

      {error ? (
        <div className="text-center p-8 bg-slate-900 border border-red-500/30 rounded-3xl text-red-400 font-bold text-xl">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className={`text-center p-12 rounded-3xl ${cardStyle}`}>
          <div className="text-7xl mb-4">🎯</div>
          <p className="text-3xl font-extrabold text-white">No activities played yet.</p>
          <p className="text-lg text-purple-300 mt-2">Head over to the Brain Games tab to start having fun!</p>
          <Link 
            to="/patient/games" 
            className="mt-6 inline-block py-3 px-8 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95"
          >
            Play First Game ➔
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.map((game, index) => {
            const dateStr = new Date(game.completedAt || game.playedAt || game.createdAt || Date.now()).toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div 
                key={index} 
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition-all duration-200 shadow-xl flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-extrabold text-white">{formatGameType(game.gameType)}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                    game.difficulty === 'hard' 
                    ? 'bg-rose-950 text-rose-300 border-rose-800' 
                    : game.difficulty === 'medium' 
                    ? 'bg-amber-950 text-amber-300 border-amber-800' 
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}>
                    {game.difficulty || 'EASY'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Accuracy</span>
                    <p className="text-2xl font-black text-emerald-400">{game.accuracy}%</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Score</span>
                    <p className="text-2xl font-black text-purple-400">{game.score}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-sm font-bold text-slate-400 flex justify-between">
                  <span>📅 {dateStr}</span>
                  <span>⏱️ {game.timeTaken ? `${game.timeTaken}s` : 'Completed'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Results;
