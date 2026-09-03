import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import { playChime, speakText } from '../../../hooks/useVoice';
import ConfettiCanvas from '../../../components/ConfettiCanvas';

const ROUTINES = {
  easy: [
    { id: 1, text: 'Boil fresh water in the kettle', icon: '🫖' },
    { id: 2, text: 'Place a tea bag in your favorite mug', icon: '☕' },
    { id: 3, text: 'Pour the hot water and let it steep', icon: '💧' }
  ],
  medium: [
    { id: 1, text: 'Boil fresh water in the kettle', icon: '🫖' },
    { id: 2, text: 'Place a tea bag in your favorite mug', icon: '☕' },
    { id: 3, text: 'Pour the hot water and let it steep', icon: '💧' },
    { id: 4, text: 'Add a splash of warm milk', icon: '🥛' },
    { id: 5, text: 'Sit down and enjoy your tea', icon: '😊' }
  ],
  hard: [
    { id: 1, text: 'Change into comfortable nightwear', icon: '👕' },
    { id: 2, text: 'Brush your teeth gently', icon: '🪥' },
    { id: 3, text: 'Take your evening medication', icon: '💊' },
    { id: 4, text: 'Turn on the bedside nightlight', icon: '💡' },
    { id: 5, text: 'Get into bed and close your eyes', icon: '🛏️' },
    { id: 6, text: 'Take slow, deep breaths', icon: '🌙' }
  ]
};

export default function RoutineSequenceGame() {
  const [patientId, setPatientId] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [originalSteps, setOriginalSteps] = useState([]);
  const [availableSteps, setAvailableSteps] = useState([]);
  const [chosenSteps, setChosenSteps] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchPatientAndSetup = async () => {
      try {
        const pRes = await api.get('/patients/me');
        const pat = pRes.data.patient || pRes.data;
        const pId = pat._id || pat.id;
        setPatientId(pId);
        
        let recDiff = 'easy';
        try {
          const diffRes = await api.post('/games/next-difficulty', { patientId: pId, gameType: 'routineSequence' });
          if (diffRes.data && diffRes.data.difficulty) recDiff = diffRes.data.difficulty;
        } catch (e) {}
        
        setDifficulty(recDiff);
        setupGame(recDiff);
      } catch (err) {
        setupGame('easy');
      }
    };
    fetchPatientAndSetup();
  }, []);

  const setupGame = (diff) => {
    const steps = ROUTINES[diff] || ROUTINES.easy;
    setOriginalSteps(steps);
    setAvailableSteps([...steps].sort(() => Math.random() - 0.5));
    setChosenSteps([]);
    setCompleted(false);
    setResultData(null);
    setShowConfetti(false);

    speakText("Tap each step in the correct daily order.");
  };

  const handleSelectStep = (step) => {
    if (completed) return;
    playChime('click');
    
    const newChosen = [...chosenSteps, step];
    const newAvailable = availableSteps.filter(s => s.id !== step.id);
    
    setChosenSteps(newChosen);
    setAvailableSteps(newAvailable);

    if (newAvailable.length === 0) {
      // All selected - verify sequence
      checkSequence(newChosen);
    }
  };

  const handleResetCurrent = () => {
    playChime('click');
    setAvailableSteps([...originalSteps].sort(() => Math.random() - 0.5));
    setChosenSteps([]);
  };

  const checkSequence = async (chosen) => {
    let correctCount = 0;
    for (let i = 0; i < originalSteps.length; i++) {
      if (chosen[i]?.id === originalSteps[i]?.id) {
        correctCount++;
      }
    }

    const accuracy = Math.round((correctCount / originalSteps.length) * 100);
    const score = accuracy;
    const timeTaken = 20;

    if (accuracy === 100) {
      playChime('success');
      speakText("Perfect daily routine sequence!");
    } else {
      playChime('match');
      speakText("Good effort putting the routine in order.");
    }

    if (patientId) {
      try {
        await api.post('/games/result', {
          patientId,
          gameType: 'routineSequence',
          score,
          accuracy,
          difficulty,
          timeTaken
        });
      } catch (e) {
        console.error("Failed to save result", e);
      }
    }

    setResultData({ accuracy, score, perfect: accuracy === 100 });
    setCompleted(true);
    setShowConfetti(true);
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
          <h1 className="text-3xl sm:text-4xl font-black text-white">Daily Steps in Order</h1>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">
            {difficulty === 'hard' ? "Evening Sleep Preparation" : "Making a Warm Cup of Tea"}
          </p>
        </div>
        <button 
          onClick={handleResetCurrent} 
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl shadow-sm font-bold text-sm transition-all active:scale-95"
        >
          🔄 Reset Sequence
        </button>
      </div>

      {!completed ? (
        <div className="space-y-8 max-w-2xl mx-auto">
          {/* Chosen Steps (Target Zone) */}
          <div className="bg-slate-900/90 border-2 border-dashed border-emerald-500/40 p-6 rounded-3xl shadow-xl">
            <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🎯</span>
              <span>Your Chosen Step Order ({chosenSteps.length} of {originalSteps.length}):</span>
            </h3>
            
            {chosenSteps.length === 0 ? (
              <p className="text-slate-400 text-center py-6 font-medium text-lg">
                Tap the steps below in the order you would do them!
              </p>
            ) : (
              <div className="space-y-3">
                {chosenSteps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-white rounded-2xl flex items-center gap-4 shadow-md animate-fadeIn"
                  >
                    <span className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </span>
                    <span className="text-3xl">{step.icon}</span>
                    <span className="text-lg font-bold">{step.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Steps (Source Zone) */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-purple-300 uppercase tracking-wider mb-2">
              Available Steps (Tap in Order):
            </h3>
            {availableSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => handleSelectStep(step)}
                className="w-full p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-purple-500/50 shadow-lg hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all text-white flex items-center gap-4 text-left active:scale-98 select-none"
              >
                <span className="text-4xl p-2 rounded-xl bg-slate-950 border border-slate-800">{step.icon}</span>
                <span className="text-xl font-bold">{step.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Completion Modal */
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.3)] text-center animate-fadeIn text-white">
          <div className="text-7xl mb-4 animate-bounce">📝</div>
          <h2 className="text-3xl font-black text-emerald-300 mb-2">
            {resultData?.perfect ? "Flawless Sequence!" : "Activity Complete!"}
          </h2>
          <p className="text-slate-300 font-medium mb-6">Great procedural memory and daily task reasoning.</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Accuracy</span>
              <p className="text-3xl font-black text-emerald-400">{resultData?.accuracy}%</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Score</span>
              <p className="text-3xl font-black text-blue-400">{resultData?.score}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setupGame(difficulty)} 
              className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95"
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
