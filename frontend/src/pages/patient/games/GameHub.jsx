import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { playChime, speakText } from '../../../hooks/useVoice';

const games = [
  {
    id: 'memory',
    title: 'Memory Card Match',
    emoji: '🃏',
    tag: 'Gentle Focus',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Find matching pairs of friendly everyday items like apples, flowers, and teacups.',
    path: '/patient/games/memory',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700'
  },
  {
    id: 'pattern',
    title: 'Melody & Pattern Chimes',
    emoji: '🎵',
    tag: 'Musical Memory',
    tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Listen to calming colored chimes and tap the colors in the gentle melodic sequence.',
    path: '/patient/games/pattern',
    btnColor: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    id: 'object',
    title: 'Everyday Object Quiz',
    emoji: '🔍',
    tag: 'Visual Focus',
    tagColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Identify familiar household items and discover what they are used for.',
    path: '/patient/games/object',
    btnColor: 'bg-purple-600 hover:bg-purple-700'
  },
  {
    id: 'sequence',
    title: 'Daily Steps in Order',
    emoji: '📝',
    tag: 'Procedural Memory',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Arrange familiar daily activities in order, such as making a warm cup of herbal tea.',
    path: '/patient/games/sequence',
    btnColor: 'bg-amber-600 hover:bg-amber-700'
  }
];

export default function GameHub() {
  const outletCtx = useOutletContext() || {};
  const highContrast = outletCtx.highContrast ?? false;

  const handlePlayClick = (title) => {
    playChime('click');
    speakText(`Opening ${title}. Enjoy the activity.`);
  };

  const cardStyle = highContrast ? 'bg-black border-2 border-yellow-300' : 'bg-white/95 backdrop-blur-md shadow-lg hover:shadow-2xl border border-slate-100';
  const textStyle = highContrast ? 'text-yellow-300' : 'text-slate-800';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Hub Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className={`text-3xl sm:text-4xl font-extrabold ${textStyle}`}>
              Cognitive & Brain Activities
            </h1>
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              AI Adaptive Engine
            </span>
          </div>
          <p className="text-lg text-slate-600 font-medium mt-1">
            Gentle, engaging brain exercises designed to support memory, focus, and daily recognition.
          </p>
        </div>

        <Link 
          to="/patient" 
          className="min-h-12 px-5 py-2.5 bg-white text-slate-700 border-2 border-slate-200 rounded-xl shadow-sm font-bold text-base hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
        >
          ← Return Home
        </Link>
      </div>

      {/* 4 Interactive Game Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {games.map((game) => (
          <div 
            key={game.id} 
            className={`${cardStyle} rounded-3xl p-8 flex flex-col justify-between transition-all hover:scale-102 relative overflow-hidden`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-6xl p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                {game.emoji}
              </div>
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${game.tagColor}`}>
                {game.tag}
              </span>
            </div>

            <div className="my-3">
              <h2 className={`text-2xl sm:text-3xl font-extrabold mb-2 ${textStyle}`}>
                {game.title}
              </h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                {game.description}
              </p>
            </div>

            <Link 
              to={game.path} 
              onClick={() => handlePlayClick(game.title)}
              className={`w-full py-4 px-6 ${game.btnColor} text-white rounded-2xl text-xl font-extrabold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6 active:scale-98`}
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
