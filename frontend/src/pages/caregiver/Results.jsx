import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const Results = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const pRes = await api.get('/caregiver/patients');
        const pts = pRes.data.patients || pRes.data || [];
        if (pts.length > 0) {
          const pid = pts[0]._id || pts[0].id;
          const histRes = await api.get(`/games/history/${pid}`);
          setHistory(histRes.data.history || histRes.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const getEmoji = (type) => {
    switch(type) {
      case 'memory': return '🃏';
      case 'pattern': return '🎵';
      case 'objectRecognition': return '🔍';
      case 'routineSequence': return '📝';
      default: return '🧠';
    }
  };

  const getAccuracyColor = (acc) => {
    if (acc >= 80) return 'text-[#4F8A5B] font-bold';
    if (acc >= 50) return 'text-[#D9A441] font-bold';
    return 'text-[#C95C5C] font-bold';
  };

  const getDifficultyBadge = (diff) => {
    if (diff === 'easy') return <span className="bg-[#4F8A5B]/15 text-[#4F8A5B] border border-[#4F8A5B]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Easy</span>;
    if (diff === 'medium') return <span className="bg-[#D9A441]/15 text-[#D9A441] border border-[#D9A441]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Medium</span>;
    if (diff === 'hard') return <span className="bg-[#C95C5C]/15 text-[#C95C5C] border border-[#C95C5C]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Hard</span>;
    return <span className="bg-[#8DB7A5]/20 text-[#397F7A] border border-[#8DB7A5]/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{diff}</span>;
  };

  if (loading) return (
    <div className="p-12 text-center text-[#566D75] flex flex-col items-center gap-3">
      <span className="w-8 h-8 border-4 border-[#397F7A] border-t-transparent rounded-full animate-spin"></span>
      <span className="text-lg font-bold text-[#263B42]">Loading session results...</span>
    </div>
  );

  return (
    <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#EADBCC] overflow-hidden animate-fadeIn">
      <div className="px-6 py-5 border-b border-[#EADBCC] bg-[#F7F3E8]/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#263B42]">Game Results History</h2>
          <p className="text-xs text-[#566D75] mt-0.5">Chronological record of completed cognitive exercises</p>
        </div>
        <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#8DB7A5]/20 text-[#397F7A] border border-[#8DB7A5]/40">
          {history.length} Sessions Logged
        </span>
      </div>
      
      {history.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#EADBCC]">
            <thead className="bg-[#F7F3E8]">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-[#566D75] uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-[#566D75] uppercase tracking-wider">Game Type</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-[#566D75] uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-[#566D75] uppercase tracking-wider">Score</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-[#566D75] uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-[#566D75] uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-[#FFFDF7] divide-y divide-[#EADBCC]">
              {history.map((item) => (
                <tr key={item._id} className="hover:bg-[#F7F3E8]/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#263B42] font-medium">
                    {new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#263B42] font-bold flex items-center gap-2 capitalize">
                    <span className="text-xl p-1 bg-[#F7F3E8] rounded-lg border border-[#EADBCC]">{getEmoji(item.gameType)}</span> {item.gameType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getDifficultyBadge(item.difficulty)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-[#397F7A]">
                    {item.score}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getAccuracyColor(item.accuracy)}>{item.accuracy}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#566D75] font-medium">
                    {item.timeTaken ? `${item.timeTaken}s` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-[#566D75]">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-lg font-bold text-[#263B42] mb-1">No game results found</p>
          <p className="text-sm text-[#566D75]">When the patient plays cognitive games, their results will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default Results;
