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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EADBCC] pb-4">
        <Link 
          to="/patient" 
          className="px-5 py-2.5 bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#263B42] border border-[#C8DDD4] rounded-2xl shadow-sm font-bold text-sm sm:text-base transition-all flex items-center gap-2 active:scale-95"
        >
          ← Return Home
        </Link>
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#263B42]">📊 My Progress</h1>
          <p className="text-sm font-medium text-[#566D75] mt-0.5">Summary of all completed cognitive activities</p>
        </div>
        <div className="w-28 hidden sm:block"></div>
      </div>

      {/* KPI Stats Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] text-center shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#566D75]">Total Activities</span>
          <p className="text-4xl font-extrabold text-[#397F7A] mt-1">{totalSessions}</p>
          <span className="text-xs text-[#566D75] mt-1 block">Memory & Focus Sessions</span>
        </div>

        <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] text-center shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#566D75]">Average Accuracy</span>
          <p className="text-4xl font-extrabold text-[#4F8A5B] mt-1">{avgAccuracy}%</p>
          <span className="text-xs text-[#566D75] mt-1 block">Continuous Cognitive Metric</span>
        </div>

        <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] text-center shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#566D75]">Adaptive Status</span>
          <p className="text-3xl font-extrabold text-[#397F7A] uppercase mt-2">Active</p>
          <span className="text-xs text-[#566D75] mt-1 block">Paced to Your Comfort</span>
        </div>
      </div>

      {error ? (
        <div className="text-center p-8 bg-[#FFFDF7] border border-[#E8B4B4] rounded-3xl text-[#C95C5C] font-bold text-lg">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center p-12 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] shadow-sm">
          <div className="text-6xl mb-3">🎯</div>
          <p className="text-2xl font-extrabold text-[#263B42]">No activities played yet.</p>
          <p className="text-base text-[#566D75] mt-1">Head over to Memory Games to start having fun!</p>
          <Link 
            to="/patient/games" 
            className="mt-6 inline-block py-3 px-8 bg-[#397F7A] hover:bg-[#2E6B66] text-white rounded-2xl font-bold shadow-sm transition-all active:scale-95"
          >
            Play First Activity ➔
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
                className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#EADBCC] hover:border-[#8DB7A5] transition-all duration-200 shadow-sm flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-extrabold text-[#263B42]">{formatGameType(game.gameType)}</h3>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase border ${
                    game.difficulty === 'hard' 
                    ? 'bg-[#FAECEC] text-[#C95C5C] border-[#E8B4B4]' 
                    : game.difficulty === 'medium' 
                    ? 'bg-[#FBF4E4] text-[#D9A441] border-[#EED7A6]' 
                    : 'bg-[#EBF5ED] text-[#4F8A5B] border-[#B7D9BE]'
                  }`}>
                    {game.difficulty || 'EASY'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 my-3">
                  <div className="p-3 bg-[#F7F3E8] rounded-2xl border border-[#EADBCC] text-center">
                    <span className="text-xs font-bold text-[#566D75] uppercase">Accuracy</span>
                    <p className="text-2xl font-extrabold text-[#4F8A5B]">{game.accuracy}%</p>
                  </div>
                  <div className="p-3 bg-[#F7F3E8] rounded-2xl border border-[#EADBCC] text-center">
                    <span className="text-xs font-bold text-[#566D75] uppercase">Score</span>
                    <p className="text-2xl font-extrabold text-[#397F7A]">{game.score}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EADBCC] text-sm font-semibold text-[#566D75] flex justify-between">
                  <span>📅 {dateStr}</span>
                  <span>⏱️ {game.timeTaken ? `${game.timeTaken}s` : 'Done'}</span>
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
