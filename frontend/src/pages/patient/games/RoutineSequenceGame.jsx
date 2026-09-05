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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EADBCC] pb-4">
        <Link 
          to="/patient/games" 
          className="px-5 py-2.5 bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#263B42] border border-[#C8DDD4] rounded-2xl shadow-sm font-bold text-sm sm:text-base transition-all flex items-center gap-2 active:scale-95"
        >
          ← Back to Activities
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-[#263B42]">Daily Steps in Order</h1>
          <p className="text-xs font-bold text-[#397F7A] uppercase tracking-wider mt-0.5">
            {difficulty === 'hard' ? "Evening Sleep Preparation" : "Making a Warm Cup of Tea"}
          </p>
        </div>
        <button 
          onClick={handleResetCurrent} 
          className="px-5 py-2.5 bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#566D75] border border-[#C8DDD4] rounded-2xl shadow-sm font-bold text-sm transition-all active:scale-95"
        >
          🔄 Reset Sequence
        </button>
      </div>

      {!completed ? (
        <div className="space-y-8 max-w-2xl mx-auto">
          {/* Chosen Steps (Target Zone) */}
          <div className="bg-[#FFFDF7] border-2 border-dashed border-[#8DB7A5] p-6 sm:p-7 rounded-3xl shadow-sm">
            <h3 className="text-sm font-extrabold text-[#397F7A] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🎯</span>
              <span>Your Chosen Step Order ({chosenSteps.length} of {originalSteps.length}):</span>
            </h3>
            
            {chosenSteps.length === 0 ? (
              <p className="text-[#566D75] text-center py-6 font-medium text-lg">
                Tap the steps below in the order you would do them!
              </p>
            ) : (
              <div className="space-y-3">
                {chosenSteps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-[#EBF5ED] border border-[#B7D9BE] text-[#263B42] rounded-2xl flex items-center gap-4 shadow-sm animate-fadeIn"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#4F8A5B] text-white font-bold text-base flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-3xl">{step.icon}</span>
                    <span className="text-base sm:text-lg font-bold">{step.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Steps (Source Zone) */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-[#566D75] uppercase tracking-wider mb-2">
              Available Steps (Tap to add in order):
            </h3>
            {availableSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => handleSelectStep(step)}
                className="w-full p-4 sm:p-5 rounded-2xl bg-[#FFFDF7] hover:bg-[#EAF2EE] border border-[#C8DDD4] hover:border-[#397F7A] shadow-sm transition-all text-[#263B42] flex items-center gap-4 text-left active:scale-98 select-none"
              >
                <span className="text-3xl sm:text-4xl p-2 rounded-xl bg-[#EAF2EE] border border-[#C8DDD4]">{step.icon}</span>
                <span className="text-lg sm:text-xl font-bold">{step.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Completion Modal */
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#FFFDF7] border-2 border-[#8DB7A5] shadow-lg text-center animate-fadeIn text-[#263B42]">
          <div className="text-6xl mb-3">📝</div>
          <h2 className="text-3xl font-extrabold text-[#263B42] mb-1.5">
            {resultData?.perfect ? "Flawless Order!" : "Activity Complete!"}
          </h2>
          <p className="text-[#566D75] font-medium mb-6">Great procedural reasoning and memory.</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#F7F3E8] p-4 rounded-2xl border border-[#EADBCC]">
              <span className="text-xs text-[#566D75] uppercase font-bold">Accuracy</span>
              <p className="text-3xl font-extrabold text-[#4F8A5B]">{resultData?.accuracy}%</p>
            </div>
            <div className="bg-[#F7F3E8] p-4 rounded-2xl border border-[#EADBCC]">
              <span className="text-xs text-[#566D75] uppercase font-bold">Score</span>
              <p className="text-3xl font-extrabold text-[#397F7A]">{resultData?.score}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setupGame(difficulty)} 
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
