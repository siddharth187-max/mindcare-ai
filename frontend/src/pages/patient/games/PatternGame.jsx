import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import { playChime, speakText } from '../../../hooks/useVoice';
import ConfettiCanvas from '../../../components/ConfettiCanvas';

const COLORS = [
  { id: 'blue', name: 'Blue Chime', color: 'bg-blue-600', active: 'bg-cyan-400 ring-8 ring-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.8)]', hz: 261.63 },
  { id: 'green', name: 'Green Chime', color: 'bg-emerald-600', active: 'bg-emerald-300 ring-8 ring-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.8)]', hz: 329.63 },
  { id: 'yellow', name: 'Amber Chime', color: 'bg-amber-500', active: 'bg-yellow-200 ring-8 ring-yellow-200 shadow-[0_0_30px_rgba(250,204,21,0.8)]', hz: 392.00 },
  { id: 'red', name: 'Crimson Chime', color: 'bg-rose-600', active: 'bg-rose-300 ring-8 ring-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.8)]', hz: 523.25 }
];

export default function PatternGame() {
  const [patientId, setPatientId] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [sequence, setSequence] = useState([]);
  const [userStep, setUserStep] = useState(0);
  const [round, setRound] = useState(0);
  const [targetRounds, setTargetRounds] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeColor, setActiveColor] = useState(null);
  const [statusText, setStatusText] = useState("Press Start to begin!");
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const isLocked = useRef(true);

  useEffect(() => {
    const fetchPatientAndSetup = async () => {
      try {
        const pRes = await api.get('/patients/me');
        const pat = pRes.data.patient || pRes.data;
        const pId = pat._id || pat.id;
        setPatientId(pId);
        
        try {
          const diffRes = await api.post('/games/next-difficulty', { patientId: pId, gameType: 'pattern' });
          if (diffRes.data && diffRes.data.difficulty) {
            setDifficulty(diffRes.data.difficulty);
            setTargetRounds(diffRes.data.difficulty === 'easy' ? 3 : diffRes.data.difficulty === 'medium' ? 5 : 7);
          }
        } catch (e) {
          console.error("Difficulty fetch error", e);
        }
      } catch (err) {
        console.error("Error loading patient data", err);
      }
    };
    fetchPatientAndSetup();
  }, []);

  const playSound = (hz) => {
    try {
      playChime('note', hz);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  };

  const startRound = () => {
    setHasStarted(true);
    isLocked.current = true;
    const newRound = round + 1;
    setRound(newRound);

    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)].id;
    const newSeq = [...sequence, randomColor];
    setSequence(newSeq);
    setUserStep(0);

    setStatusText(`Round ${newRound} of ${targetRounds}: Listen closely...`);
    speakText("Listen closely");
    playSequence(newSeq);
  };

  const playSequence = async (seq) => {
    setIsPlaying(true);
    await new Promise(r => setTimeout(r, 800));

    for (let i = 0; i < seq.length; i++) {
      const colorId = seq[i];
      const colorObj = COLORS.find(c => c.id === colorId);
      
      setActiveColor(colorId);
      playSound(colorObj.hz);

      await new Promise(r => setTimeout(r, 600));
      setActiveColor(null);
      await new Promise(r => setTimeout(r, 250));
    }

    setIsPlaying(false);
    isLocked.current = false;
    setStatusText("Your turn! Tap the colored chimes in order.");
    speakText("Your turn");
  };

  const handleColorClick = (colorId, hz) => {
    if (isLocked.current || isPlaying || completed) return;

    playSound(hz);
    setActiveColor(colorId);
    setTimeout(() => setActiveColor(null), 300);

    if (colorId === sequence[userStep]) {
      const nextStep = userStep + 1;
      setUserStep(nextStep);

      if (nextStep === sequence.length) {
        // Round completed successfully
        isLocked.current = true;
        if (round === targetRounds) {
          // Game Completed
          handleGameComplete();
        } else {
          setStatusText("Wonderful! Next melody round...");
          playChime('match');
          setTimeout(() => {
            startRound();
          }, 1200);
        }
      }
    } else {
      // Mistake
      setMistakes(m => m + 1);
      isLocked.current = true;
      setStatusText("That's okay! Let's listen again.");
      speakText("That's okay, let's listen again");
      setTimeout(() => {
        playSequence(sequence);
      }, 1200);
    }
  };

  const handleGameComplete = async () => {
    playChime('success');
    const accuracy = Math.max(50, 100 - (mistakes * 10));
    const score = 95;
    const timeTaken = 30;

    speakText("Wonderful memory! You repeated the entire melody!");

    if (patientId) {
      try {
        await api.post('/games/result', {
          patientId,
          gameType: 'pattern',
          score,
          accuracy,
          difficulty,
          timeTaken
        });
      } catch (e) {
        console.error("Failed to save result", e);
      }
    }

    setResultData({ accuracy, mistakes });
    setCompleted(true);
    setShowConfetti(true);
  };

  const resetGame = () => {
    setSequence([]);
    setUserStep(0);
    setRound(0);
    setMistakes(0);
    setCompleted(false);
    setShowConfetti(false);
    setHasStarted(false);
    setStatusText("Press Start to begin!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      {showConfetti && <ConfettiCanvas active={true} />}
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-900/30 pb-4">
        <Link 
          to="/patient/games" 
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl shadow-sm font-bold text-sm transition-all flex items-center gap-2 active:scale-95"
        >
          ← Back to Activities
        </Link>
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white">Melody & Chime Patterns</h1>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">Round {round} of {targetRounds}</p>
        </div>
        <button 
          onClick={resetGame} 
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl shadow-sm font-bold text-sm transition-all active:scale-95"
        >
          🔄 Restart
        </button>
      </div>
      
      {!completed ? (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
          {/* Status Telemetry Banner */}
          <div className="bg-slate-900/90 border border-purple-900/40 p-5 rounded-2xl shadow-xl mb-8 text-center w-full">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-200">{statusText}</h2>
          </div>
          
          {/* Glowing 4-Pad Arcade Grid */}
          <div className="grid grid-cols-2 gap-6 w-full max-w-md mb-8">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onMouseDown={() => handleColorClick(c.id, c.hz)}
                className={`aspect-square rounded-3xl transition-all duration-150 select-none ${
                  activeColor === c.id 
                  ? c.active + ' scale-95 animate-pulseMatch' 
                  : c.color + ' shadow-2xl hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-103 active:scale-95 border-2 border-white/20'
                } ${isLocked.current && !isPlaying && activeColor !== c.id ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label={`Play ${c.name}`}
              />
            ))}
          </div>
          
          {!hasStarted && (
            <button 
              onClick={() => startRound()}
              className="py-4 px-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl text-2xl font-black shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95"
            >
              ▶ Start Melody Game
            </button>
          )}
        </div>
      ) : (
        /* Completion Modal */
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-slate-900 border-2 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.3)] text-center animate-fadeIn text-white">
          <div className="text-7xl mb-4 animate-bounce">🎵</div>
          <h2 className="text-3xl font-black text-cyan-300 mb-2">Melodic Master!</h2>
          <p className="text-slate-300 font-medium mb-6">You repeated all musical sequences with great focus.</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Accuracy</span>
              <p className="text-3xl font-black text-emerald-400">{resultData?.accuracy}%</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Mistakes</span>
              <p className="text-3xl font-black text-blue-400">{resultData?.mistakes}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={resetGame} 
              className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95"
            >
              Play Again
            </button>
            <Link 
              to="/patient/games" 
              className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold border border-slate-700 shadow-md transition-all flex items-center justify-center active:scale-95"
            >
              All Games
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
