import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { playChime, speakText } from '../../../hooks/useVoice';

const games = [
  {
    id: 'memory',
    title: 'Memory Card Match',
    emoji: '🃏',
    tag: 'Gentle Focus',
    tagColor: 'bg-purple-950/80 text-purple-300 border-purple-800/80 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    description: 'Find matching pairs of friendly everyday items like apples, flowers, and teacups.',
    path: '/patient/games/memory',
    btnColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    accentBorder: 'border-b-purple-500'
  },
  {
    id: 'pattern',
    title: 'Melody & Pattern Chimes',
    emoji: '🎵',
    tag: 'Musical Memory',
    tagColor: 'bg-blue-950/80 text-blue-300 border-blue-800/80 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    description: 'Listen to calming colored chimes and tap the colors in the gentle melodic sequence.',
    path: '/patient/games/pattern',
    btnColor: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    accentBorder: 'border-b-blue-500'
  },
  {
    id: 'object',
    title: 'Everyday Object Quiz',
    emoji: '🔍',
    tag: 'Visual Focus',
    tagColor: 'bg-pink-950/80 text-pink-300 border-pink-800/80 shadow-[0_0_15px_rgba(236,72,153,0.2)]',
    description: 'Identify familiar household items and discover what they are used for.',
    path: '/patient/games/object',
    btnColor: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]',
    accentBorder: 'border-b-pink-500'
  },
  {
    id: 'sequence',
    title: 'Daily Steps in Order',
    emoji: '📝',
    tag: 'Procedural Memory',
    tagColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    description: 'Arrange familiar daily activities in order, such as making a warm cup of herbal tea.',
    path: '/patient/games/sequence',
    btnColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    accentBorder: 'border-b-emerald-500'
  }
];

export default function GameHub() {
  const outletCtx = useOutletContext() || {};
  const highContrast = outletCtx.highContrast ?? false;

  const handlePlayClick = (title) => {
    playChime('click');
    speakText(`Opening ${title}. Enjoy the activity.`);
  };

  const cardStyle = highContrast 
    ? 'bg-black border-2 border-yellow-300 text-yellow-300' 
    : 'bg-slate-900/90 border border-slate-800 text-white shadow-xl';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Hub Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-900/30 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-white">
              Cognitive & Brain Activities
            </h1>
            <span className="hidden sm:inline-flex px-3.5 py-1 rounded-full text-xs font-extrabold bg-purple-950 text-purple-300 border border-purple-700 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              AI Adaptive Scaling
            </span>
          </div>
          <p className="text-lg text-purple-200/80 font-medium mt-1">
            Gentle, sensory-safe brain exercises designed to support memory, focus, and daily recognition.
          </p>
        </div>

        <Link 
          to="/patient" 
          className="min-h-12 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl shadow-md font-bold text-base transition-all flex items-center gap-2 active:scale-95"
        >
          ← Return Home
        </Link>
      </div>

      {/* 4 Interactive Game Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {games.map((game) => (
          <div 
            key={game.id} 
            className={`${cardStyle} rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(168,85,247,0.2)] hover:border-purple-500/40 relative overflow-hidden border-b-4 ${game.accentBorder}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-6xl p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                {game.emoji}
              </div>
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${game.tagColor}`}>
                {game.tag}
              </span>
            </div>

            <div className="my-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-white">
                {game.title}
              </h2>
              <p className="text-lg text-slate-300 font-medium leading-relaxed">
                {game.description}
              </p>
            </div>

            <Link 
              to={game.path} 
              onClick={() => handlePlayClick(game.title)}
              className={`w-full py-4 px-6 ${game.btnColor} text-white rounded-2xl text-xl font-extrabold transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 mt-6`}
            >
              <span>Play {game.title.split(' ')[0]}</span>
              <span className="text-2xl">➔</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
