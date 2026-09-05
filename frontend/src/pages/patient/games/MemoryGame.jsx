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

    const praises = ["Wonderful job!", "Great focus!", "Fantastic memory!", "Splendid matching!"];
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
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      {showConfetti && <ConfettiCanvas active={true} />}
      
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EADBCC] pb-4">
        <Link 
          to="/patient/games" 
          className="px-5 py-2.5 bg-[#FFFDF7] hover:bg-[#EAF2EE] text-[#263B42] border border-[#C8DDD4] rounded-2xl shadow-sm font-bold text-sm sm:text-base transition-all flex items-center gap-2 active:scale-95"
        >
          ← Back to Activities
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-[#263B42]">Memory Card Match</h1>
          <p className="text-xs font-bold text-[#397F7A] uppercase tracking-wider mt-0.5">Mode: {difficulty}</p>
        </div>
        <button 
          onClick={() => setupGame(difficulty)} 
          className="px-5 py-2.5 bg-[#EAF2EE] hover:bg-[#D7E8E0] text-[#397F7A] border border-[#C8DDD4] rounded-2xl shadow-sm font-bold text-sm transition-all flex items-center gap-1.5 active:scale-95"
        >
          🔄 Shuffle
        </button>
      </div>

      {/* Game Stats Telemetry Banner */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        <div className="p-3 bg-[#FFFDF7] rounded-2xl border border-[#EADBCC] text-center shadow-sm">
          <span className="text-xs font-bold text-[#566D75] uppercase">Moves</span>
          <p className="text-2xl font-extrabold text-[#263B42]">{moves}</p>
        </div>
        <div className="p-3 bg-[#FFFDF7] rounded-2xl border border-[#EADBCC] text-center shadow-sm">
          <span className="text-xs font-bold text-[#566D75] uppercase">Pairs</span>
          <p className="text-2xl font-extrabold text-[#4F8A5B]">{matchedPairs} / {cards.length / 2}</p>
        </div>
        <div className="p-3 bg-[#FFFDF7] rounded-2xl border border-[#EADBCC] text-center shadow-sm">
          <span className="text-xs font-bold text-[#566D75] uppercase">Level</span>
          <p className="text-2xl font-extrabold text-[#397F7A] uppercase">{difficulty}</p>
        </div>
      </div>

      {/* Memory Card Grid */}
      {!completed ? (
        <div className={`grid ${cols} gap-4 sm:gap-6 max-w-xl w-full mx-auto mt-6`}>
          {cards.map((card, idx) => (
            <div 
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={`aspect-square rounded-3xl flex items-center justify-center text-6xl sm:text-7xl cursor-pointer transition-all duration-200 transform select-none ${
                card.isMatched 
                ? 'bg-[#EBF5ED] border-4 border-[#4F8A5B] shadow-sm scale-100 animate-pulseMatch'
                : card.isFlipped 
                ? 'bg-[#FFFDF7] border-4 border-[#397F7A] shadow-md scale-105'
                : 'bg-[#397F7A] hover:bg-[#2E6B66] text-white border-2 border-[#2E6B66] hover:scale-105 active:scale-95 shadow-sm'
              }`}
            >
              <span className={`transition-all duration-200 ${card.isFlipped || card.isMatched ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                {card.isFlipped || card.isMatched ? card.item : ''}
              </span>
              {!(card.isFlipped || card.isMatched) && (
                <span className="text-4xl text-white/90">🌿</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Completion Celebration Modal */
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#FFFDF7] border-2 border-[#8DB7A5] shadow-lg text-center animate-fadeIn text-[#263B42]">
          <div className="text-6xl mb-3">🌟</div>
          <h2 className="text-3xl font-extrabold text-[#263B42] mb-1.5">{resultData?.praise || 'Activity Completed!'}</h2>
          <p className="text-[#566D75] font-medium mb-6">All pairs matched with great focus.</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#F7F3E8] p-4 rounded-2xl border border-[#EADBCC]">
              <span className="text-xs text-[#566D75] uppercase font-bold">Accuracy</span>
              <p className="text-3xl font-extrabold text-[#4F8A5B]">{resultData?.accuracy}%</p>
            </div>
            <div className="bg-[#F7F3E8] p-4 rounded-2xl border border-[#EADBCC]">
              <span className="text-xs text-[#566D75] uppercase font-bold">Time Taken</span>
              <p className="text-3xl font-extrabold text-[#397F7A]">{resultData?.timeTaken}s</p>
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
