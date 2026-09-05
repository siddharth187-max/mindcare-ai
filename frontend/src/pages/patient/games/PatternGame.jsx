import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import { playChime, speakText } from '../../../hooks/useVoice';
import ConfettiCanvas from '../../../components/ConfettiCanvas';

const COLORS = [
  { id: 'blue', name: 'Blue Bell', color: 'bg-[#4A7C9B]', active: 'bg-[#689DBE] ring-8 ring-[#BCD5D3] scale-95', hz: 261.63 },
  { id: 'green', name: 'Sage Bell', color: 'bg-[#8DB7A5]', active: 'bg-[#A9CFBF] ring-8 ring-[#C8DDD4] scale-95', hz: 329.63 },
  { id: 'yellow', name: 'Amber Bell', color: 'bg-[#D9A441]', active: 'bg-[#ECC16E] ring-8 ring-[#EED7A6] scale-95', hz: 392.00 },
  { id: 'red', name: 'Muted Rose Bell', color: 'bg-[#C95C5C]', active: 'bg-[#E08585] ring-8 ring-[#E8B4B4] scale-95', hz: 523.25 }
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
    setStatusText("Your turn! Tap the colored bells in order.");
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EADBCC] pb-4">
        <Link 
          to="/patient/games" 
          className="px-5 py-2.5 bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#263B42] border border-[#C8DDD4] rounded-2xl shadow-sm font-bold text-sm sm:text-base transition-all flex items-center gap-2 active:scale-95"
        >
          ← Back to Activities
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-[#263B42]">Melody & Chime Patterns</h1>
          <p className="text-xs font-bold text-[#D9A441] uppercase tracking-wider mt-0.5">Round {round} of {targetRounds}</p>
        </div>
        <button 
          onClick={resetGame} 
          className="px-5 py-2.5 bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#566D75] border border-[#C8DDD4] rounded-2xl shadow-sm font-bold text-sm transition-all active:scale-95"
        >
          🔄 Restart
        </button>
      </div>
      
      {!completed ? (
        <div className="flex flex-col items-center w-full max-w-xl mx-auto">
          {/* Status Banner */}
          <div className="bg-[#FFFDF7] border border-[#EADBCC] p-5 rounded-2xl shadow-sm mb-8 text-center w-full">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#263B42]">{statusText}</h2>
          </div>
          
          {/* 4-Pad Bell Grid */}
          <div className="grid grid-cols-2 gap-5 w-full max-w-sm mb-8">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onMouseDown={() => handleColorClick(c.id, c.hz)}
                className={`aspect-square rounded-3xl transition-all duration-150 select-none shadow-sm ${
                  activeColor === c.id 
                  ? c.active 
                  : c.color + ' hover:opacity-90 hover:scale-102 active:scale-95'
                } ${isLocked.current && !isPlaying && activeColor !== c.id ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label={`Play ${c.name}`}
              />
            ))}
          </div>
          
          {!hasStarted && (
            <button 
              onClick={() => startRound()}
              className="py-4 px-10 bg-[#397F7A] hover:bg-[#2E6B66] text-white rounded-2xl text-xl font-bold shadow-sm transition-all hover:scale-102 active:scale-98"
            >
              ▶ Start Melody Game
            </button>
          )}
        </div>
      ) : (
        /* Completion Modal */
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#FFFDF7] border-2 border-[#8DB7A5] shadow-lg text-center animate-fadeIn text-[#263B42]">
          <div className="text-6xl mb-3">🎵</div>
          <h2 className="text-3xl font-extrabold text-[#263B42] mb-1.5">Melody Completed!</h2>
          <p className="text-[#566D75] font-medium mb-6">You repeated all musical sequences with great focus.</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#F7F3E8] p-4 rounded-2xl border border-[#EADBCC]">
              <span className="text-xs text-[#566D75] uppercase font-bold">Accuracy</span>
              <p className="text-3xl font-extrabold text-[#4F8A5B]">{resultData?.accuracy}%</p>
            </div>
            <div className="bg-[#F7F3E8] p-4 rounded-2xl border border-[#EADBCC]">
              <span className="text-xs text-[#566D75] uppercase font-bold">Mistakes</span>
              <p className="text-3xl font-extrabold text-[#397F7A]">{resultData?.mistakes}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={resetGame} 
              className="flex-1 py-3.5 px-4 bg-[#397F7A] hover:bg-[#2E6B66] text-white rounded-2xl font-bold shadow-sm transition-all active:scale-98"
            >
              Play Again
            </button>
            <Link 
              to="/patient/games" 
              className="flex-1 py-3.5 px-4 bg-[#F7F3E8] hover:bg-[#EAF2EE] text-[#263B42] rounded-2xl font-bold border border-[#C8DDD4] shadow-sm transition-all flex items-center justify-center active:scale-98"
            >
              All Activities
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
