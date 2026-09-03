import React from 'react';
import { Link } from 'react-router-dom';
import { playChime, speakText } from '../../../hooks/useVoice';

const games = [
  {
    id: 'memory',
    title: 'Memory Card Match',
    emoji: '🃏',
    description: 'Find pairs of friendly everyday items',
    path: '/patient/games/memory'
  },
  {
    id: 'pattern',
    title: 'Melody & Pattern Chimes',
    emoji: '🎵',
    description: 'Listen to calming colored chimes and repeat',
    path: '/patient/games/pattern'
  },
  {
    id: 'object',
    title: 'Everyday Object Quiz',
    emoji: '🔍',
    description: 'Identify everyday household items',
    path: '/patient/games/object'
  },
  {
    id: 'sequence',
    title: 'Daily Steps in Order',
    emoji: '📝',
    description: 'Arrange familiar daily steps in order',
    path: '/patient/games/sequence'
  }
];

export default function GameHub() {
  const handlePlayClick = (title) => {
    speakText(`Let's play ${title}`);
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6 flex flex-col items-center pb-24">
      <div className="max-w-4xl w-full">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-slate-800">Mind Games</h1>
          <Link to="/patient/dashboard" className="px-6 py-3 bg-white text-slate-600 rounded-xl shadow font-semibold text-xl hover:bg-slate-50">
            ← Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {games.map((game) => (
            <div key={game.id} className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow p-8 flex flex-col items-center text-center">
              <div className="text-8xl mb-6">{game.emoji}</div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">{game.title}</h2>
              <p className="text-2xl text-slate-600 mb-8 flex-grow">{game.description}</p>
              <Link 
                to={game.path} 
                onClick={() => handlePlayClick(game.title)}
                className="w-full py-5 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl text-3xl font-bold transition-colors shadow-md"
              >
                Play Now
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
