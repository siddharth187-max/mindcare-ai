import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const Results = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { highContrast } = useOutletContext();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const pRes = await api.get('/patients/me');
        const pat = pRes.data.patient || pRes.data;
        if (pat && (pat._id || pat.id)) {
          const pid = pat._id || pat.id;
          const res = await api.get(`/games/history/${pid}`);
          setHistory(res.data.results || res.data.history || (Array.isArray(res.data) ? res.data : []));
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

  if (loading) return <LoadingSpinner message="Loading your progress..." />;

  const textStyle = highContrast ? 'text-yellow-300' : 'text-gray-900';
  const cardStyle = highContrast ? 'bg-black border-2 border-yellow-300 text-yellow-300' : 'bg-white shadow-xl';

  const formatGameType = (type) => {
    const types = {
      memory: '🧠 Memory Match',
      pattern: '🔢 Pattern Recognition',
      objectRecognition: '🍎 Object Find',
      routineSequence: '📋 Routine Sequence'
    };
    return types[type] || type;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h1 className={`text-5xl font-bold mb-4 ${textStyle}`}>📊 My Progress</h1>
        <p className={`text-2xl ${highContrast ? 'text-yellow-100' : 'text-gray-600'}`}>
          Great job keeping your brain active! Here are your recent activities.
        </p>
      </div>

      {error ? (
        <div className="text-center p-8 bg-white rounded-3xl shadow-lg">
          <p className="text-2xl text-red-600 font-bold">{error}</p>
        </div>
      ) : history.length === 0 ? (
        <div className={`text-center p-12 rounded-3xl ${cardStyle}`}>
          <div className="text-8xl mb-6">🎯</div>
          <p className="text-3xl font-bold">No games played yet.</p>
          <p className="text-2xl mt-4">Head over to the Brain Activities tab to start playing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.map((game, index) => (
            <div key={index} className={`p-6 rounded-3xl ${cardStyle} flex flex-col justify-between`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-3xl font-bold">{formatGameType(game.gameType)}</h3>
                <span className={`px-4 py-1 rounded-full text-lg font-bold uppercase ${
                  highContrast 
                  ? 'border border-yellow-300' 
                  : (game.difficulty === 'easy' ? 'bg-green-100 text-green-800' : game.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')
                }`}>
                  {game.difficulty}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <p className="text-2xl flex justify-between">
                  <span>Score:</span> 
                  <span className="font-bold text-[#2E7D32]">{game.score}</span>
                </p>
                <p className="text-2xl flex justify-between">
                  <span>Accuracy:</span> 
                  <span className="font-bold">{game.accuracy}%</span>
                </p>
              </div>

              <div className={`pt-4 border-t ${highContrast ? 'border-yellow-300' : 'border-gray-200'} text-lg flex justify-between`}>
                <span>{new Date(game.completedAt || game.playedAt || game.createdAt || Date.now()).toLocaleDateString()}</span>
                <span>⏱️ {game.timeTaken ? `${game.timeTaken}s` : '-'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Results;
