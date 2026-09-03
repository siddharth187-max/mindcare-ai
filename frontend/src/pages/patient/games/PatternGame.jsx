import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import { playChime, speakText } from '../../../hooks/useVoice';
import ConfettiCanvas from '../../../components/ConfettiCanvas';

const COLORS = [
  { id: 'blue', color: 'bg-blue-500', active: 'bg-blue-300', hz: 261.63 },
  { id: 'green', color: 'bg-green-500', active: 'bg-green-300', hz: 329.63 },
  { id: 'yellow', color: 'bg-yellow-400', active: 'bg-yellow-200', hz: 392.00 },
  { id: 'red', color: 'bg-red-500', active: 'bg-red-300', hz: 523.25 }
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
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const startRound = (currentSequence) => {
    isLocked.current = true;
    setIsPlaying(true);
    setHasStarted(true);
    
    const newSeq = currentSequence ? [...currentSequence] : [...sequence];
    if (!currentSequence) {
      newSeq.push(COLORS[Math.floor(Math.random() * COLORS.length)].id);
      setSequence(newSeq);
      setRound(r => r + 1);
    }
    
    setStatusText(`Round ${round + (currentSequence ? 0 : 1)} of ${targetRounds}: Listen closely...`);
    speakText("Listen");
    
    let step = 0;
    const interval = setInterval(() => {
      if (step >= newSeq.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsPlaying(false);
          setActiveColor(null);
          setStatusText("Now your turn!");
          speakText("Your turn");
          isLocked.current = false;
          setUserStep(0);
        }, 500);
        return;
      }
      
      const colId = newSeq[step];
      const colObj = COLORS.find(c => c.id === colId);
      setActiveColor(colId);
      playSound(colObj.hz);
      
      setTimeout(() => {
        setActiveColor(null);
      }, 400);
      
      step++;
    }, 1000);
  };

  const handleColorClick = (colorId, hz) => {
    if (isLocked.current || isPlaying) return;
    
    playSound(hz);
    setActiveColor(colorId);
    setTimeout(() => setActiveColor(null), 300);
    
    if (colorId === sequence[userStep]) {
      // Correct step
      const nextStep = userStep + 1;
      setUserStep(nextStep);
      
      if (nextStep === sequence.length) {
        // Round complete
        isLocked.current = true;
        if (round === targetRounds) {
          handleGameComplete();
        } else {
          setStatusText("Great job! Get ready for the next one...");
          setTimeout(() => startRound(), 1500);
        }
      }
    } else {
      // Mistake
      isLocked.current = true;
      setMistakes(m => m + 1);
      playChime('error');
      setStatusText("That's okay! Let's listen again.");
      speakText("That's okay! Let's listen again.");
      setTimeout(() => {
        startRound(sequence);
      }, 2000);
    }
  };

  const handleGameComplete = async () => {
    setStatusText("Wonderful playing!");
    speakText("Wonderful playing!");
    
    let accuracy = 100 - (mistakes * 10);
    if (accuracy < 50) accuracy = 50;
    
    const score = 95;
    
    if (patientId) {
      try {
        await api.post('/games/result', {
          patientId,
          gameType: 'pattern',
          score,
          accuracy,
          difficulty,
          timeTaken: round * 5 
        });
      } catch(e) {}
    }
    
    setResultData({ accuracy, score });
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
    <div className="min-h-screen bg-indigo-50 p-6 flex flex-col items-center">
      {showConfetti && <ConfettiCanvas active={true} />}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <Link to="/patient/games" className="text-xl px-6 py-3 bg-white text-indigo-700 rounded-xl shadow font-semibold hover:bg-indigo-50">
          ← Back to Activities
        </Link>
        <h1 className="text-4xl font-bold text-indigo-800">Melody Patterns</h1>
      </div>
      
      {!completed ? (
        <div className="flex flex-col items-center w-full max-w-3xl">
          <div className="bg-white p-6 rounded-2xl shadow mb-10 text-center w-full">
            <h2 className="text-3xl font-bold text-slate-700">{statusText}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-8 w-full max-w-lg mb-12">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onMouseDown={() => handleColorClick(c.id, c.hz)}
                className={`aspect-square rounded-[3rem] transition-all duration-150 select-none ${
                  activeColor === c.id 
                  ? c.active + ' scale-95 brightness-125 ring-8 ring-white/70 shadow-2xl animate-pulseMatch' 
                  : c.color + ' shadow-xl hover:shadow-2xl hover:scale-103 hover:brightness-110 active:scale-95'
                } ${isLocked.current && !isPlaying && activeColor !== c.id ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label={`Play ${c.id} tone`}
              />
            ))}
          </div>
          
          {!hasStarted && (
            <button 
              onClick={() => startRound()}
              className="py-5 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-3xl font-bold shadow-lg transition-transform hover:scale-105"
            >
              ▶ Start Game
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-2xl w-full text-center mt-10">
          <div className="text-8xl mb-6">🎵</div>
          <h2 className="text-5xl font-bold text-indigo-700 mb-6">Beautiful Melody!</h2>
          <div className="text-3xl text-slate-600 mb-10">Accuracy: <span className="font-bold text-indigo-600">{resultData.accuracy}%</span></div>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={resetGame}
              className="py-5 px-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-3xl font-bold transition-colors w-full"
            >
              Play Again
            </button>
            <Link 
              to="/patient/games"
              className="py-5 px-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-3xl font-bold transition-colors w-full"
            >
              Choose Another Game
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
