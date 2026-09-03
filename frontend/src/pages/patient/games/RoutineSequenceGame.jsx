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
    setShowConfetti(false);
  };

  const handleStepSelect = (step) => {
    playChime('click');
    speakText(step.text);
    
    setAvailableSteps(prev => prev.filter(s => s.id !== step.id));
    setChosenSteps(prev => {
      const newChosen = [...prev, step];
      if (newChosen.length === originalSteps.length) {
        setTimeout(() => evaluateResult(newChosen), 1000);
      }
      return newChosen;
    });
  };

  const undoStep = (step) => {
    playChime('click');
    setChosenSteps(prev => prev.filter(s => s.id !== step.id));
    setAvailableSteps(prev => [...prev, step]);
  };

  const evaluateResult = async (finalChosen) => {
    let correctPositions = 0;
    finalChosen.forEach((step, idx) => {
      if (step.id === originalSteps[idx].id) correctPositions++;
    });
    
    const accuracy = correctPositions === originalSteps.length ? 100 : Math.round((correctPositions / originalSteps.length) * 100);
    const score = accuracy;
    
    if (accuracy === 100) {
      playChime('success');
      speakText("Perfect order! Well done.");
    } else {
      speakText("Good effort! You got some steps right.");
    }

    if (patientId) {
      try {
        await api.post('/games/result', {
          patientId,
          gameType: 'routineSequence',
          score,
          accuracy,
          difficulty,
          timeTaken: 30
        });
      } catch (e) {}
    }
    
    setResultData({ accuracy, correctPositions, total: originalSteps.length });
    setCompleted(true);
    setShowConfetti(accuracy >= 80);
  };

  const title = difficulty === 'hard' ? "Getting Ready for a Good Night's Sleep" : "How to make a warm cup of tea?";

  return (
    <div className="min-h-screen bg-rose-50 p-6 flex flex-col items-center pb-20">
      {showConfetti && <ConfettiCanvas active={true} />}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8">
        <Link to="/patient/games" className="text-xl px-6 py-3 bg-white text-rose-700 rounded-xl shadow font-semibold hover:bg-rose-50">
          ← Back to Activities
        </Link>
        <button onClick={() => setupGame(difficulty)} className="text-xl px-6 py-3 bg-rose-100 text-rose-800 rounded-xl shadow font-semibold hover:bg-rose-200">
          🔄 Restart
        </button>
      </div>

      <h1 className="text-4xl font-bold text-rose-800 mb-8 text-center bg-white py-4 px-8 rounded-full shadow-sm">
        {title}
      </h1>

      {!completed ? (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Available Steps */}
          <div className="bg-white rounded-3xl shadow p-6 border-2 border-rose-100">
            <h2 className="text-2xl font-bold text-slate-700 mb-6 text-center">Tap the next step:</h2>
            <div className="flex flex-col gap-4">
              {availableSteps.map(step => (
                <button
                  key={step.id}
                  onClick={() => handleStepSelect(step)}
                  className="w-full text-left p-5 bg-rose-50 hover:bg-rose-100 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1"
                >
                  <span className="text-5xl">{step.icon}</span>
                  <span className="text-2xl font-semibold text-slate-800 leading-tight">{step.text}</span>
                </button>
              ))}
              {availableSteps.length === 0 && (
                <div className="text-2xl text-slate-400 text-center italic py-10">All steps selected!</div>
              )}
            </div>
          </div>

          {/* Chosen Steps */}
          <div className="bg-rose-100 rounded-3xl shadow-inner p-6 border-2 border-rose-200">
            <h2 className="text-2xl font-bold text-slate-700 mb-6 text-center">Your Chosen Order:</h2>
            <div className="flex flex-col gap-4 min-h-[300px]">
              {chosenSteps.map((step, idx) => (
                <div
                  key={step.id}
                  onClick={() => undoStep(step)}
                  className="w-full text-left p-5 bg-white rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-red-50 border-l-8 border-green-400 shadow-sm"
                  title="Tap to remove"
                >
                  <span className="text-2xl font-bold text-slate-400 w-8">{idx + 1}.</span>
                  <span className="text-5xl">{step.icon}</span>
                  <span className="text-2xl font-semibold text-slate-800 leading-tight">{step.text}</span>
                </div>
              ))}
              {chosenSteps.length === 0 && (
                <div className="text-2xl text-rose-400 text-center italic py-10 opacity-70">
                  Select items from the left to build the routine...
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-2xl w-full text-center mt-4">
          <div className="text-8xl mb-6">{resultData.accuracy === 100 ? '🌟' : '👍'}</div>
          <h2 className="text-5xl font-bold text-rose-700 mb-6">
            {resultData.accuracy === 100 ? 'Perfect Order!' : 'Good Try!'}
          </h2>
          <div className="text-3xl text-slate-600 mb-4">
            You got <span className="font-bold text-rose-600">{resultData.correctPositions}</span> out of {resultData.total} right.
          </div>
          <div className="text-3xl text-slate-600 mb-10">Accuracy: <span className="font-bold text-rose-600">{resultData.accuracy}%</span></div>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setupGame(difficulty)}
              className="py-5 px-8 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-3xl font-bold transition-colors w-full"
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
