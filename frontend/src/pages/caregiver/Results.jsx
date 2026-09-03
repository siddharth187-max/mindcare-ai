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
      default: return '🎮';
    }
  };

  const getAccuracyColor = (acc) => {
    if (acc >= 80) return 'text-green-600 font-semibold';
    if (acc >= 50) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getDifficultyBadge = (diff) => {
    if (diff === 'easy') return <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide">Easy</span>;
    if (diff === 'medium') return <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide">Medium</span>;
    if (diff === 'hard') return <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide">Hard</span>;
    return <span className="bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide">{diff}</span>;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading results...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Game Results History</h2>
      </div>
      
      {history.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2 capitalize">
                    <span className="text-lg">{getEmoji(item.gameType)}</span> {item.gameType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getDifficultyBadge(item.difficulty)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.score}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getAccuracyColor(item.accuracy)}>{item.accuracy}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.timeTaken ? `${item.timeTaken}s` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-lg font-medium text-gray-900 mb-2">No game results found</p>
          <p className="text-sm">When the patient plays cognitive games, their results will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default Results;
