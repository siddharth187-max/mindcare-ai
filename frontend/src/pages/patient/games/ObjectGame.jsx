import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import { playChime, speakText } from '../../../hooks/useVoice';
import ConfettiCanvas from '../../../components/ConfettiCanvas';

const ALL_QUESTIONS = [
  { text: "Which of these do we use to brush our teeth in the morning?", options: [{ icon: '🪥', label: 'Toothbrush', correct: true }, { icon: '🥄', label: 'Soup Spoon' }, { icon: '🔑', label: 'Door Key' }] },
  { text: "Which item tells us what time of day it is?", options: [{ icon: '☕', label: 'Tea Cup' }, { icon: '⏰', label: 'Clock', correct: true }, { icon: '👞', label: 'Shoe' }] },
  { text: "Which of these helps us read small book letters clearly?", options: [{ icon: '👓', label: 'Spectacles', correct: true }, { icon: '🍎', label: 'Apple' }, { icon: '🕯️', label: 'Candle' }] },
  { text: "Which one do we wear on our feet when going outside?", options: [{ icon: '🧤', label: 'Gloves' }, { icon: '👟', label: 'Shoes', correct: true }, { icon: '🎩', label: 'Hat' }] },
  { text: "Which of these do we use to eat soup?", options: [{ icon: '🥄', label: 'Spoon', correct: true }, { icon: '✂️', label: 'Scissors' }, { icon: '🖊️', label: 'Pen' }] }
];

export default function ObjectGame() {
  const [patientId, setPatientId] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [hasTriedCurrent, setHasTriedCurrent] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fadedOptions, setFadedOptions] = useState([]);

  useEffect(() => {
    const fetchPatientAndSetup = async () => {
      try {
        const pRes = await api.get('/patients/me');
        const pat = pRes.data.patient || pRes.data;
        const pId = pat._id || pat.id;
        setPatientId(pId);
        
        let recDiff = 'easy';
        try {
          const diffRes = await api.post('/games/next-difficulty', { patientId: pId, gameType: 'objectRecognition' });
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
    let qCount = 3;
    if (diff === 'medium') qCount = 4;
    if (diff === 'hard') qCount = 5;
    
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, qCount);
    const prepped = shuffled.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));

    setQuestions(prepped);
    setCurrentIndex(0);
    setFirstTryCorrect(0);
    setHasTriedCurrent(false);
    setCompleted(false);
    setResultData(null);
    setShowConfetti(false);
    setFadedOptions([]);

    if (prepped.length > 0) {
      speakText(prepped[0].text);
    }
  };

  const handleOptionClick = (opt, index) => {
    if (fadedOptions.includes(index) || completed) return;

    if (opt.correct) {
      playChime('success');
      if (!hasTriedCurrent) {
        setFirstTryCorrect(c => c + 1);
      }

      speakText("Wonderful! That is correct.");

      const nextIndex = currentIndex + 1;
      if (nextIndex < questions.length) {
        setTimeout(() => {
          setCurrentIndex(nextIndex);
          setHasTriedCurrent(false);
          setFadedOptions([]);
          speakText(questions[nextIndex].text);
        }, 1200);
      } else {
        setTimeout(() => {
          handleGameComplete(firstTryCorrect + (!hasTriedCurrent ? 1 : 0), questions.length);
        }, 1000);
      }
    } else {
      playChime('click');
      setHasTriedCurrent(true);
      setFadedOptions(prev => [...prev, index]);
      speakText("Good try! Let us try another choice.");
    }
  };

  const handleGameComplete = async (finalFirstTries, totalQ) => {
    const accuracy = Math.round((finalFirstTries / totalQ) * 100);
    const score = accuracy;
    const timeTaken = 25;

    if (patientId) {
      try {
        await api.post('/games/result', {
          patientId,
          gameType: 'objectRecognition',
          score,
          accuracy,
          difficulty,
          timeTaken
        });
      } catch (e) {
        console.error("Failed to save result", e);
      }
    }

    setResultData({ accuracy, score });
    setCompleted(true);
    setShowConfetti(true);
  };

  const currentQ = questions[currentIndex];

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
          <h1 className="text-3xl font-extrabold text-[#263B42]">Everyday Object Quiz</h1>
          <p className="text-xs font-bold text-[#397F7A] uppercase tracking-wider mt-0.5">Question {currentIndex + 1} of {questions.length}</p>
        </div>
        <button 
          onClick={() => setupGame(difficulty)} 
          className="px-5 py-2.5 bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#566D75] border border-[#C8DDD4] rounded-2xl shadow-sm font-bold text-sm transition-all active:scale-95"
        >
          🔄 Restart
        </button>
      </div>

      {!completed && currentQ ? (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-6">
          {/* Question Card with Sound Button */}
          <div className="bg-[#FFFDF7] border border-[#EADBCC] p-7 sm:p-8 rounded-3xl shadow-sm text-center w-full">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#263B42] mb-6 leading-relaxed">
              {currentQ.text}
            </h2>
            <button 
              onClick={() => speakText(currentQ.text)} 
              className="px-6 py-2.5 bg-[#EAF2EE] hover:bg-[#D7E8E0] text-[#397F7A] border border-[#C8DDD4] rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 mx-auto active:scale-95 shadow-sm"
            >
              <span>🔊</span>
              <span>Read Question Aloud</span>
            </button>
          </div>

          {/* Choice Option Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {currentQ.options.map((opt, i) => {
              const isFaded = fadedOptions.includes(i);
              return (
                <button
                  key={i}
                  disabled={isFaded}
                  onClick={() => handleOptionClick(opt, i)}
                  className={`p-6 rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-200 border-2 select-none shadow-sm ${
                    isFaded 
                    ? 'bg-[#FBF4E4] border-[#EED7A6] text-[#566D75] opacity-50 cursor-not-allowed scale-98' 
                    : 'bg-[#FFFDF7] hover:bg-[#EAF2EE] border-[#C8DDD4] hover:border-[#397F7A] hover:-translate-y-1 active:scale-98 text-[#263B42]'
                  }`}
                >
                  <span className="text-5xl sm:text-6xl mb-3">{opt.icon}</span>
                  <span className="text-lg sm:text-xl font-bold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : completed ? (
        /* Completion Modal */
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#FFFDF7] border-2 border-[#8DB7A5] shadow-lg text-center animate-fadeIn text-[#263B42]">
          <div className="text-6xl mb-3">🔍</div>
          <h2 className="text-3xl font-extrabold text-[#263B42] mb-1.5">Quiz Completed!</h2>
          <p className="text-[#566D75] font-medium mb-6">Fantastic recognition and everyday memory.</p>

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
      ) : null}
    </div>
  );
}
