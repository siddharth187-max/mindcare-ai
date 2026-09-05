import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { playChime, speakText } from '../../../hooks/useVoice';

const games = [
  {
    id: 'memory',
    title: 'Memory Card Match',
    emoji: '🃏',
    tag: 'Gentle Focus',
    tagColor: 'bg-[#EAF2EE] text-[#397F7A] border-[#C8DDD4]',
    description: 'Find matching pairs of familiar everyday items like apples, sunflowers, and teacups.',
    path: '/patient/games/memory',
    btnColor: 'bg-[#397F7A] hover:bg-[#2E6B66] text-white',
    iconBg: 'bg-[#EAF2EE] text-[#397F7A] border-[#C8DDD4]'
  },
  {
    id: 'pattern',
    title: 'Melody & Pattern Chimes',
    emoji: '🎵',
    tag: 'Musical Memory',
    tagColor: 'bg-[#FBF4E4] text-[#D9A441] border-[#EED7A6]',
    description: 'Listen to calming chime tones and tap the friendly colored bells in order.',
    path: '/patient/games/pattern',
    btnColor: 'bg-[#D9A441] hover:bg-[#C89433] text-white',
    iconBg: 'bg-[#FBF4E4] text-[#D9A441] border-[#EED7A6]'
  },
  {
    id: 'object',
    title: 'Everyday Object Quiz',
    emoji: '🔍',
    tag: 'Visual Focus',
    tagColor: 'bg-[#EBF3F2] text-[#397F7A] border-[#BCD5D3]',
    description: 'Look at familiar household objects and discover what we use them for.',
    path: '/patient/games/object',
    btnColor: 'bg-[#397F7A] hover:bg-[#2E6B66] text-white',
    iconBg: 'bg-[#EBF3F2] text-[#397F7A] border-[#BCD5D3]'
  },
  {
    id: 'sequence',
    title: 'Daily Steps in Order',
    emoji: '📝',
    tag: 'Procedural Memory',
    tagColor: 'bg-[#EAF2EE] text-[#263B42] border-[#8DB7A5]',
    description: 'Arrange daily activities in comfortable order, such as brewing a warm cup of tea.',
    path: '/patient/games/sequence',
    btnColor: 'bg-[#8DB7A5] hover:bg-[#79A391] text-[#263B42]',
    iconBg: 'bg-[#EAF2EE] text-[#263B42] border-[#8DB7A5]'
  }
];

export default function GameHub() {
  const handlePlayClick = (title) => {
    playChime('click');
    speakText(`Opening ${title}. Enjoy the activity.`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Hub Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EADBCC] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#263B42]">
              🧠 Brain Activities
            </h1>
            <span className="hidden sm:inline-flex px-3.5 py-1 rounded-full text-xs font-bold bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4]">
              Adaptive Pacing
            </span>
          </div>
          <p className="text-base sm:text-lg text-[#566D75] font-medium mt-1">
            Calming, sensory-friendly memory exercises designed for focus and reassurance.
          </p>
        </div>

        <Link 
          to="/patient" 
          className="min-h-12 px-5 py-2.5 bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#263B42] border border-[#C8DDD4] rounded-2xl shadow-sm font-bold text-sm sm:text-base transition-all flex items-center gap-2 active:scale-95"
        >
          ← Return Home
        </Link>
      </div>

      {/* 4 Interactive Game Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {games.map((game) => (
          <div 
            key={game.id} 
            className="bg-[#FFFDF7] border border-[#EADBCC] rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-[#8DB7A5] hover:shadow-md shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`text-4xl w-16 h-16 rounded-2xl border flex items-center justify-center ${game.iconBg}`}>
                {game.emoji}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${game.tagColor}`}>
                {game.tag}
              </span>
            </div>

            <div className="my-2">
              <h2 className="text-2xl font-extrabold mb-1.5 text-[#263B42]">
                {game.title}
              </h2>
              <p className="text-base text-[#566D75] font-medium leading-relaxed">
                {game.description}
              </p>
            </div>

            <Link 
              to={game.path} 
              onClick={() => handlePlayClick(game.title)}
              className={`w-full min-h-14 py-3.5 px-6 ${game.btnColor} rounded-2xl text-lg font-bold transition-all active:scale-98 flex items-center justify-center gap-2 mt-6 shadow-sm`}
            >
              <span>Play {game.title.split(' ')[0]}</span>
              <span className="text-xl">➔</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
