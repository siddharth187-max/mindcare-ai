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
    
    // Shuffle and pick
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, qCount);
    // Shuffle options within each question
    const prepped = shuffled.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));
    
    setQuestions(prepped);
    setCurrentIndex(0);
    setFirstTryCorrect(0);
    setHasTriedCurrent(false);
    setCompleted(false);
    setShowConfetti(false);
    setFadedOptions([]);
    
    if (prepped.length > 0) {
      setTimeout(() => speakText(prepped[0].text), 1000);
    }
  };

  const handleOptionClick = (option, idx) => {
    if (fadedOptions.includes(idx)) return;
    
    if (option.correct) {
      playChime('success');
      speakText('Wonderful!');
      if (!hasTriedCurrent) {
        setFirstTryCorrect(prev => prev + 1);
      }
      
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setHasTriedCurrent(false);
          setFadedOptions([]);
          speakText(questions[nextIndex].text);
        } else {
          handleGameComplete();
        }
      }, 1500);
    } else {
      playChime('click');
      speakText('Good try! Let us try the other option.');
      setHasTriedCurrent(true);
      setFadedOptions(prev => [...prev, idx]);
    }
  };

  const handleGameComplete = async () => {
    const accuracy = Math.round((firstTryCorrect / questions.length) * 100) || 50;
    
    if (patientId) {
      try {
        await api.post('/games/result', {
          patientId,
          gameType: 'objectRecognition',
          score: accuracy,
          accuracy,
          difficulty,
          timeTaken: questions.length * 10
        });
      } catch (e) {}
    }
    
    setResultData({ accuracy });
    setCompleted(true);
    setShowConfetti(true);
    speakText("You finished all questions beautifully!");
  };

  const readQuestion = () => {
    if (questions[currentIndex]) {
      speakText(questions[currentIndex].text);
    }
  };

  if (questions.length === 0) return <div className="p-10 text-2xl">Loading...</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-yellow-50 p-6 flex flex-col items-center">
      {showConfetti && <ConfettiCanvas active={true} />}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <Link to="/patient/games" className="text-xl px-6 py-3 bg-white text-yellow-700 rounded-xl shadow font-semibold hover:bg-yellow-50">
          ← Back to Activities
        </Link>
        <h1 className="text-4xl font-bold text-yellow-800">Everyday Objects</h1>
      </div>
      
      {!completed ? (
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="bg-white p-8 rounded-3xl shadow-lg w-full text-center mb-10 relative">
            <h2 className="text-4xl font-bold text-slate-800 leading-tight">{currentQ.text}</h2>
            <button 
              onClick={readQuestion}
              className="mt-6 px-6 py-3 bg-blue-100 text-blue-700 rounded-full font-bold text-xl inline-flex items-center gap-2 hover:bg-blue-200 transition-colors"
            >
              🔊 Hear Question
            </button>
            <div className="absolute top-4 right-6 text-xl font-bold text-slate-400">
              {currentIndex + 1} / {questions.length}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(opt, idx)}
                className={`flex flex-col items-center p-8 bg-white rounded-3xl shadow-md transition-all duration-300
                  ${fadedOptions.includes(idx) ? 'opacity-30 scale-95 cursor-not-allowed' : 'hover:-translate-y-2 hover:shadow-xl hover:border-yellow-300 border-4 border-transparent'}
                `}
              >
                <div className="text-8xl mb-6">{opt.icon}</div>
                <div className="text-3xl font-bold text-slate-700">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-2xl w-full text-center mt-10">
          <div className="text-8xl mb-6">🏆</div>
          <h2 className="text-5xl font-bold text-yellow-700 mb-6">Fantastic Job!</h2>
          <div className="text-3xl text-slate-600 mb-10">Accuracy: <span className="font-bold text-yellow-600">{resultData.accuracy}%</span></div>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setupGame(difficulty)}
              className="py-5 px-8 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl text-3xl font-bold transition-colors w-full"
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
