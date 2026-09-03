import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { playChime, speakText } from '../../../hooks/useVoice';
import ConfettiCanvas from '../../../components/ConfettiCanvas';

const ALL_ITEMS = ['🍎', '🌻', '⏰', '☕', '🐱', '🏡'];

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
      setMoves(m => m + 1);
      
      const [firstIndex, secondIndex] = newFlipped;
      if (newCards[firstIndex].item === newCards[secondIndex].item) {
        // Match
        setTimeout(() => {
          playChime('success');
          const matchedCards = [...newCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setMatchedPairs(prev => {
            const newMatched = prev + 1;
            if (newMatched === newCards.length / 2) {
              handleGameComplete(newMatched, moves + 1, diff => diff === 'easy' ? 2 : diff === 'medium' ? 3 : 4);
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
        }, 1100);
      }
    }
  };

  const handleGameComplete = async (pairs, totalMoves, diffFunc) => {
    const timeTaken = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
    const accuracy = Math.max(50, Math.round((pairs / totalMoves) * 100));
    const score = Math.round((accuracy * 10) / Math.max(1, timeTaken / 10));

    const praises = ["Wonderful job!", "You did great!", "Fantastic memory!", "Beautiful work!"];
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
    <div className="min-h-screen bg-teal-50 p-6 flex flex-col items-center">
      {showConfetti && <ConfettiCanvas active={true} />}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <Link to="/patient/games" className="text-xl px-6 py-3 bg-white text-teal-700 rounded-xl shadow font-semibold hover:bg-teal-50">
          ← Back to Activities
        </Link>
        <h1 className="text-4xl font-bold text-teal-800">Memory Match</h1>
        <button onClick={() => setupGame(difficulty)} className="text-xl px-6 py-3 bg-teal-100 text-teal-800 rounded-xl shadow font-semibold hover:bg-teal-200">
          🔄 Shuffle
        </button>
      </div>

      {!completed ? (
        <div className={`grid ${cols} gap-6 max-w-3xl w-full mx-auto mt-8`}>
          {cards.map((card, idx) => (
            <div 
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={`aspect-square rounded-3xl flex items-center justify-center text-7xl cursor-pointer transition-all duration-300 transform shadow-lg
                ${card.isFlipped || card.isMatched ? 'bg-white rotate-0' : 'bg-teal-500 hover:bg-teal-400 rotate-y-180'}
                ${card.isMatched ? 'border-8 border-green-400' : ''}
              `}
            >
              <span className={`transition-opacity duration-300 ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}`}>
                {card.isFlipped || card.isMatched ? card.item : '✨'}
              </span>
              {!(card.isFlipped || card.isMatched) && (
                <span className="absolute text-5xl text-white opacity-100">✨</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-2xl w-full text-center mt-10">
          <div className="text-8xl mb-6">⭐</div>
          <h2 className="text-5xl font-bold text-teal-700 mb-6">{resultData.praise}</h2>
          <div className="text-3xl text-slate-600 mb-4">Accuracy: <span className="font-bold text-teal-600">{resultData.accuracy}%</span></div>
          <div className="text-3xl text-slate-600 mb-10">Time: <span className="font-bold text-teal-600">{resultData.timeTaken} seconds</span></div>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setupGame(difficulty)}
              className="py-5 px-8 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl text-3xl font-bold transition-colors w-full"
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
