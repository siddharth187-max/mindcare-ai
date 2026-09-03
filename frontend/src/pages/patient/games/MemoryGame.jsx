import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { playChime, speakText } from '../../../hooks/useVoice';
import ConfettiCanvas from '../../../components/ConfettiCanvas';

const ALL_ITEMS = ['🍎', '🌻', '⏰', '☕', '🐱', '🏡', '🍇', '🎈'];

export default function MemoryGame() {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const isLocked = useRef(false);

  useEffect(() => {
    const fetchPatientAndSetup = async () => {
      try {
        const pRes = await api.get('/patients/me');
        const pat = pRes.data.patient || pRes.data;
        const pId = pat._id || pat.id;
        setPatientId(pId);

        let recDiff = 'easy';
        try {
          const diffRes = await api.post('/games/next-difficulty', { patientId: pId, gameType: 'memory' });
          if (diffRes.data && diffRes.data.difficulty) {
            recDiff = diffRes.data.difficulty;
          }
        } catch (e) {
          console.error("Could not fetch difficulty", e);
        }
        setDifficulty(recDiff);
        setupGame(recDiff);
      } catch (err) {
        console.error("Error loading patient data", err);
        setupGame('easy');
      }
    };
    fetchPatientAndSetup();
  }, []);

  const setupGame = (diff) => {
    let pairCount = 2; // easy
    if (diff === 'medium') pairCount = 3;
    if (diff === 'hard') pairCount = 4;

    const selected = ALL_ITEMS.slice(0, pairCount);
    const deck = [...selected, ...selected].sort(() => Math.random() - 0.5);
    
    setCards(deck.map((item, index) => ({ id: index, item, isFlipped: false, isMatched: false })));
    setFlippedIndices([]);
    setMatchedPairs(0);
    setMoves(0);
    setCompleted(false);
    setResultData(null);
    setShowConfetti(false);
    setStartTime(Date.now());
  };

  const handleCardClick = (index) => {
    if (isLocked.current || cards[index].isFlipped || cards[index].isMatched || completed) return;

    playChime('click');
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      isLocked.current = true;
      const currentMoves = moves + 1;
      setMoves(currentMoves);
      
      const [firstIndex, secondIndex] = newFlipped;
      if (newCards[firstIndex].item === newCards[secondIndex].item) {
        // Match found
        setTimeout(() => {
          playChime('success');
          const matchedCards = [...newCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          
          setMatchedPairs(prev => {
            const newMatched = prev + 1;
            if (newMatched === newCards.length / 2) {
              const totalPairs = newCards.length / 2;
              handleGameComplete(newMatched, currentMoves, totalPairs);
            }
            return newMatched;
          });
          setFlippedIndices([]);
          isLocked.current = false;
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          isLocked.current = false;
        }, 1000);
      }
    }
  };

  const handleGameComplete = async (finalPairs, finalMoves, totalPairs) => {
    const timeTaken = Math.max(1, Math.round((Date.now() - (startTime || Date.now())) / 1000));
    const accuracy = Math.min(100, Math.max(50, Math.round((totalPairs / Math.max(totalPairs, finalMoves)) * 100)));
    const score = Math.round((accuracy * 10) / Math.max(1, timeTaken / 10));

    const praises = ["Wonderful job!", "Great focus!", "Fantastic memory!", "Beautiful work!"];
    const praise = praises[Math.floor(Math.random() * praises.length)];
    speakText(praise);

    if (patientId) {
      try {
        await api.post('/games/result', {
          patientId,
          gameType: 'memory',
          score,
          accuracy,
          difficulty,
          timeTaken
        });
      } catch (e) {
        console.error("Failed to save result", e);
      }
    }

    setResultData({ accuracy, timeTaken, score, praise });
    setCompleted(true);
    setShowConfetti(true);
  };

  const cols = difficulty === 'easy' ? 'grid-cols-2' : difficulty === 'medium' ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-16">
      {showConfetti && <ConfettiCanvas active={true} />}
      
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-900/30 pb-4">
        <Link 
          to="/patient/games" 
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl shadow-sm font-bold text-sm transition-all flex items-center gap-2 active:scale-95"
        >
          ← Back to Activities
        </Link>
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white">Memory Card Match</h1>
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mt-1">Difficulty: {difficulty}</p>
        </div>
        <button 
          onClick={() => setupGame(difficulty)} 
          className="px-5 py-2.5 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/80 rounded-2xl shadow-sm font-bold text-sm transition-all flex items-center gap-1.5 active:scale-95"
        >
          🔄 Restart Shuffle
        </button>
      </div>

      {/* Game Stats Telemetry Banner */}
      <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
        <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
          <span className="text-xs font-bold text-slate-400 uppercase">Moves</span>
          <p className="text-2xl font-black text-white">{moves}</p>
        </div>
        <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
          <span className="text-xs font-bold text-slate-400 uppercase">Pairs</span>
          <p className="text-2xl font-black text-emerald-400">{matchedPairs} / {cards.length / 2}</p>
        </div>
        <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
          <span className="text-xs font-bold text-slate-400 uppercase">Mode</span>
          <p className="text-2xl font-black text-purple-400 uppercase">{difficulty}</p>
        </div>
      </div>

      {/* Memory Card Grid */}
      {!completed ? (
        <div className={`grid ${cols} gap-6 max-w-2xl w-full mx-auto mt-6`}>
          {cards.map((card, idx) => (
            <div 
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={`aspect-square rounded-3xl flex items-center justify-center text-7xl cursor-pointer transition-all duration-300 transform select-none ${
                card.isMatched 
                ? 'bg-emerald-950/80 border-4 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-100 animate-pulseMatch'
                : card.isFlipped 
                ? 'bg-slate-900 border-4 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.5)] scale-105'
                : 'bg-gradient-to-br from-purple-900/80 via-slate-900 to-slate-950 hover:from-purple-800/80 hover:to-slate-900 border-2 border-purple-600/40 hover:border-purple-400 hover:scale-105 active:scale-95 shadow-xl'
              }`}
            >
              <span className={`transition-all duration-300 ${card.isFlipped || card.isMatched ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                {card.isFlipped || card.isMatched ? card.item : ''}
              </span>
              {!(card.isFlipped || card.isMatched) && (
                <span className="text-4xl text-purple-400/80 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">✨</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Completion Celebration Modal */
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-slate-900 border-2 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)] text-center animate-fadeIn text-white">
          <div className="text-7xl mb-4 animate-bounce">🌟</div>
          <h2 className="text-3xl font-black text-purple-300 mb-2">{resultData?.praise || 'Activity Completed!'}</h2>
          <p className="text-slate-300 font-medium mb-6">All pairs matched with great cognitive focus.</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Accuracy</span>
              <p className="text-3xl font-black text-emerald-400">{resultData?.accuracy}%</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Time Taken</span>
              <p className="text-3xl font-black text-blue-400">{resultData?.timeTaken}s</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setupGame(difficulty)} 
              className="flex-1 py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95"
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
