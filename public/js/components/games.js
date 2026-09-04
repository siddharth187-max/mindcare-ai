// public/js/components/games.js
// Dementia-Friendly Cognitive Games Suite with Adaptive Difficulty Integration

import { recordGameResult, calculateNextDifficulty } from '../api.js';
import { speakText, playChime } from '../audio.js';

let activeGame = null;

export function renderGamesHub(container, patientId, triggerConfetti) {
  if (activeGame === 'memory') {
    renderMemoryGame(container, patientId, triggerConfetti);
    return;
  } else if (activeGame === 'pattern') {
    renderPatternGame(container, patientId, triggerConfetti);
    return;
  } else if (activeGame === 'objectRecognition') {
    renderObjectGame(container, patientId, triggerConfetti);
    return;
  } else if (activeGame === 'routineSequence') {
    renderRoutineSequenceGame(container, patientId, triggerConfetti);
    return;
  }

  // Games Hub Main View
  container.innerHTML = `
    <section aria-label="Cognitive games and brain exercises">
      <div class="section-header">
        <div>
          <h2>Cognitive & Brain Activities</h2>
          <p style="color: var(--text-muted); font-size: var(--font-base); font-weight: 600; margin-top: 4px;">
            Enjoy gentle, fun activities designed to stimulate memory, focus, and daily recognition.
          </p>
        </div>
      </div>

      <div class="games-grid">
        <!-- Game 1: Memory Match -->
        <div class="game-tile" id="tileMemory" tabindex="0" role="button" aria-label="Play Memory Card Match">
          <span class="game-difficulty-badge diff-easy">Gentle Focus</span>
          <div>
            <div class="game-tile-icon">🃏</div>
            <h3>Memory Card Match</h3>
            <p style="color: var(--text-muted); margin-top: 8px;">
              Find pairs of friendly everyday items like apples, flowers, and teacups.
            </p>
          </div>
          <button class="btn btn-primary" style="width: 100%;">Play Memory Match</button>
        </div>

        <!-- Game 2: Pattern Sequence -->
        <div class="game-tile" id="tilePattern" tabindex="0" role="button" aria-label="Play Pattern Sequence">
          <span class="game-difficulty-badge diff-easy">Musical Memory</span>
          <div>
            <div class="game-tile-icon">🎵</div>
            <h3>Melody & Pattern Chimes</h3>
            <p style="color: var(--text-muted); margin-top: 8px;">
              Listen to calming colored chimes and repeat the gentle melody.
            </p>
          </div>
          <button class="btn btn-primary" style="width: 100%;">Play Chimes</button>
        </div>

        <!-- Game 3: Object Recognition -->
        <div class="game-tile" id="tileObject" tabindex="0" role="button" aria-label="Play Everyday Object Recognition">
          <span class="game-difficulty-badge diff-medium">Visual Focus</span>
          <div>
            <div class="game-tile-icon">🔍</div>
            <h3>Everyday Object Quiz</h3>
            <p style="color: var(--text-muted); margin-top: 8px;">
              Identify everyday household items and match what they are used for.
            </p>
          </div>
          <button class="btn btn-primary" style="width: 100%;">Play Object Quiz</button>
        </div>

        <!-- Game 4: Routine Sequencer -->
        <div class="game-tile" id="tileRoutineSeq" tabindex="0" role="button" aria-label="Play Routine Step Sequencer">
          <span class="game-difficulty-badge diff-medium">Daily Steps</span>
          <div>
            <div class="game-tile-icon">📝</div>
            <h3>Daily Steps in Order</h3>
            <p style="color: var(--text-muted); margin-top: 8px;">
              Arrange familiar daily steps in order, such as making a warm cup of tea.
            </p>
          </div>
          <button class="btn btn-primary" style="width: 100%;">Play Daily Steps</button>
        </div>
      </div>
    </section>
  `;

  document.getElementById('tileMemory').onclick = () => {
    activeGame = 'memory';
    playChime('click');
    speakText('Memory card match. Tap cards to find the matching pairs.');
    renderGamesHub(container, patientId, triggerConfetti);
  };

  document.getElementById('tilePattern').onclick = () => {
    activeGame = 'pattern';
    playChime('click');
    speakText('Melody and Pattern Chimes. Watch the colors light up, then tap them in order.');
    renderGamesHub(container, patientId, triggerConfetti);
  };

  document.getElementById('tileObject').onclick = () => {
    activeGame = 'objectRecognition';
    playChime('click');
    speakText('Everyday Object Quiz. Look at the question and tap the correct everyday item.');
    renderGamesHub(container, patientId, triggerConfetti);
  };

  document.getElementById('tileRoutineSeq').onclick = () => {
    activeGame = 'routineSequence';
    playChime('click');
    speakText('Daily steps in order. Tap the steps in the right order.');
    renderGamesHub(container, patientId, triggerConfetti);
  };
}

// ----------------------------------------------------
// GAME 1: MEMORY CARD MATCH
// ----------------------------------------------------
function renderMemoryGame(container, patientId, triggerConfetti) {
  const items = ['🍎', '🌻', '⏰', '☕', '🐱', '🏡'];
  let difficulty = 'easy'; // 2 pairs (4 cards) for easy, 3 pairs (6 cards) for medium
  const pairCount = difficulty === 'easy' ? 2 : 3;
  const gameItems = items.slice(0, pairCount);
  const deck = [...gameItems, ...gameItems].sort(() => Math.random() - 0.5);

  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  const startTime = Date.now();

  container.innerHTML = `
    <div style="max-width: 700px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <button id="btnBackToHub" class="btn btn-outline">← Back to Activities</button>
        <h3>Memory Match (Find ${pairCount} Pairs)</h3>
        <button id="btnRestartMemory" class="btn btn-sm btn-outline">🔄 Shuffle</button>
      </div>

      <div class="memory-board" id="memoryBoard" style="grid-template-columns: repeat(${pairCount === 2 ? 2 : 3}, 1fr);">
        ${deck.map((emoji, idx) => `
          <div class="memory-card hidden" data-index="${idx}" data-emoji="${emoji}" tabindex="0" role="button" aria-label="Card ${idx + 1}"></div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('btnBackToHub').onclick = () => {
    activeGame = null;
    playChime('click');
    renderGamesHub(container, patientId, triggerConfetti);
  };

  document.getElementById('btnRestartMemory').onclick = () => {
    playChime('click');
    renderMemoryGame(container, patientId, triggerConfetti);
  };

  const cards = container.querySelectorAll('.memory-card');
  cards.forEach(card => {
    card.onclick = () => {
      if (flippedCards.length >= 2 || card.classList.contains('matched') || !card.classList.contains('hidden')) {
        return;
      }

      playChime('click');
      card.classList.remove('hidden');
      card.textContent = card.dataset.emoji;
      flippedCards.push(card);

      if (flippedCards.length === 2) {
        moves++;
        const [c1, c2] = flippedCards;
        if (c1.dataset.emoji === c2.dataset.emoji) {
          playChime('match');
          c1.classList.add('matched');
          c2.classList.add('matched');
          matchedPairs++;
          flippedCards = [];

          if (matchedPairs === pairCount) {
            const timeTaken = Math.round((Date.now() - startTime) / 1000);
            const accuracy = Math.max(50, Math.round((pairCount / moves) * 100));
            const score = Math.round((accuracy * 10) / Math.max(1, timeTaken / 10));

            handleGameCompletion(container, patientId, 'memory', score, accuracy, difficulty, timeTaken, triggerConfetti);
          }
        } else {
          setTimeout(() => {
            c1.classList.add('hidden');
            c1.textContent = '';
            c2.classList.add('hidden');
            c2.textContent = '';
            flippedCards = [];
          }, 1100);
        }
      }
    };
  });
}

// ----------------------------------------------------
// GAME 2: PATTERN SEQUENCE (SIMON CHIMES)
// ----------------------------------------------------
function renderPatternGame(container, patientId, triggerConfetti) {
  const tones = [
    { id: 'blue', freq: 261.63, label: 'Ocean Blue', colorClass: 'pattern-blue' },
    { id: 'green', freq: 329.63, label: 'Meadow Green', colorClass: 'pattern-green' },
    { id: 'yellow', freq: 392.00, label: 'Sunbeam Yellow', colorClass: 'pattern-yellow' },
    { id: 'red', freq: 523.25, label: 'Sunset Coral', colorClass: 'pattern-red' }
  ];

  let sequence = [];
  let playerStep = 0;
  let round = 1;
  const targetRounds = 3;
  const startTime = Date.now();
  let isPlayingSeq = false;

  container.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; text-align: center;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <button id="btnBackToHub" class="btn btn-outline">← Back</button>
        <h3 id="patternStatus">Round 1 of ${targetRounds}: Watch the lights!</h3>
        <div></div>
      </div>

      <div class="pattern-board">
        ${tones.map(t => `
          <button class="pattern-btn ${t.colorClass}" data-id="${t.id}" data-freq="${t.freq}" aria-label="${t.label} chime"></button>
        `).join('')}
      </div>

      <div style="margin-top: 16px;">
        <button id="btnStartPattern" class="btn btn-primary" style="font-size: var(--font-lg);">▶ Start Round</button>
      </div>
    </div>
  `;

  document.getElementById('btnBackToHub').onclick = () => {
    activeGame = null;
    playChime('click');
    renderGamesHub(container, patientId, triggerConfetti);
  };

  const startBtn = document.getElementById('btnStartPattern');
  const statusEl = document.getElementById('patternStatus');

  function playTone(id) {
    const toneObj = tones.find(t => t.id === id);
    if (toneObj) {
      playChime('note', toneObj.freq);
      const btn = container.querySelector(`[data-id="${id}"]`);
      if (btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 400);
      }
    }
  }

  function nextRound() {
    isPlayingSeq = true;
    playerStep = 0;
    const randomTone = tones[Math.floor(Math.random() * tones.length)].id;
    sequence.push(randomTone);
    statusEl.textContent = `Round ${round} of ${targetRounds}: Listen closely...`;
    speakText('Listen');

    let i = 0;
    const interval = setInterval(() => {
      playTone(sequence[i]);
      i++;
      if (i >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => {
          isPlayingSeq = false;
          statusEl.textContent = 'Now your turn! Tap the colors in the same order.';
          speakText('Your turn');
        }, 500);
      }
    }, 800);
  }

  startBtn.onclick = () => {
    startBtn.style.display = 'none';
    sequence = [];
    round = 1;
    nextRound();
  };

  container.querySelectorAll('.pattern-btn').forEach(btn => {
    btn.onclick = () => {
      if (isPlayingSeq || sequence.length === 0) return;
      const clickedId = btn.dataset.id;
      playTone(clickedId);

      if (clickedId === sequence[playerStep]) {
        playerStep++;
        if (playerStep === sequence.length) {
          playChime('match');
          if (round >= targetRounds) {
            const timeTaken = Math.round((Date.now() - startTime) / 1000);
            handleGameCompletion(container, patientId, 'pattern', 95, 100, 'easy', timeTaken, triggerConfetti);
          } else {
            round++;
            setTimeout(nextRound, 1000);
          }
        }
      } else {
        // Gentle reassurance, not a penalty
        statusEl.textContent = "That's okay! Let's listen again.";
        speakText("That's okay! Let's try again.");
        setTimeout(() => {
          playerStep = 0;
          isPlayingSeq = true;
          let i = 0;
          const retryInt = setInterval(() => {
            playTone(sequence[i]);
            i++;
            if (i >= sequence.length) {
              clearInterval(retryInt);
              isPlayingSeq = false;
              statusEl.textContent = 'Now try again!';
            }
          }, 800);
        }, 1200);
      }
    };
  });
}

// ----------------------------------------------------
// GAME 3: OBJECT RECOGNITION QUIZ
// ----------------------------------------------------
function renderObjectGame(container, patientId, triggerConfetti) {
  const questions = [
    {
      text: "Which of these do we use to brush our teeth in the morning?",
      options: [
        { icon: '🪥', label: 'Toothbrush', correct: true },
        { icon: '🥄', label: 'Soup Spoon', correct: false },
        { icon: '🔑', label: 'Door Key', correct: false }
      ]
    },
    {
      text: "Which item tells us what time of day it is?",
      options: [
        { icon: '☕', label: 'Tea Cup', correct: false },
        { icon: '⏰', label: 'Clock', correct: true },
        { icon: '👞', label: 'Shoe', correct: false }
      ]
    },
    {
      text: "Which of these helps us read small book letters clearly?",
      options: [
        { icon: '👓', label: 'Spectacles', correct: true },
        { icon: '🍎', label: 'Apple', correct: false },
        { icon: '🕯️', label: 'Candle', correct: false }
      ]
    }
  ];

  let currentQ = 0;
  let correctCount = 0;
  const startTime = Date.now();

  function showQuestion() {
    const q = questions[currentQ];
    container.innerHTML = `
      <div style="max-width: 650px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <button id="btnBackToHub" class="btn btn-outline">← Back</button>
          <h4>Question ${currentQ + 1} of ${questions.length}</h4>
          <button id="btnHearQuestion" class="btn btn-sm btn-outline">🔊 Hear Question</button>
        </div>

        <div class="orientation-card" style="text-align: center;">
          <h2 style="margin-bottom: 24px; font-size: var(--font-xl);">${q.text}</h2>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;">
            ${q.options.map((opt, i) => `
              <button class="btn btn-outline opt-btn" data-correct="${opt.correct}" style="min-height: 120px; flex-direction: column; gap: 8px;">
                <span style="font-size: 48px;">${opt.icon}</span>
                <span style="font-size: var(--font-lg); font-weight: 700;">${opt.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnBackToHub').onclick = () => {
      activeGame = null;
      playChime('click');
      renderGamesHub(container, patientId, triggerConfetti);
    };

    document.getElementById('btnHearQuestion').onclick = () => {
      speakText(q.text);
    };
    speakText(q.text);

    container.querySelectorAll('.opt-btn').forEach(btn => {
      btn.onclick = () => {
        const isCorrect = btn.dataset.correct === 'true';
        if (isCorrect) {
          playChime('success');
          btn.style.background = 'var(--success-light)';
          btn.style.borderColor = 'var(--success)';
          correctCount++;
          speakText('Wonderful! That is correct.');
        } else {
          playChime('click');
          btn.style.opacity = '0.5';
          speakText('Good try! Let us try the other option.');
          return;
        }

        setTimeout(() => {
          currentQ++;
          if (currentQ < questions.length) {
            showQuestion();
          } else {
            const timeTaken = Math.round((Date.now() - startTime) / 1000);
            const accuracy = Math.round((correctCount / questions.length) * 100);
            handleGameCompletion(container, patientId, 'objectRecognition', 100, accuracy, 'easy', timeTaken, triggerConfetti);
          }
        }, 1300);
      };
    });
  }

  showQuestion();
}

// ----------------------------------------------------
// GAME 4: ROUTINE STEP SEQUENCER
// ----------------------------------------------------
function renderRoutineSequenceGame(container, patientId, triggerConfetti) {
  const steps = [
    { id: 1, text: 'Boil fresh water in the kettle', icon: '🫖' },
    { id: 2, text: 'Place a tea bag in your favorite mug', icon: '☕' },
    { id: 3, text: 'Pour the hot water and let it steep', icon: '💧' }
  ];

  const shuffled = [...steps].sort(() => Math.random() - 0.5);
  let playerSequence = [];
  const startTime = Date.now();

  container.innerHTML = `
    <div style="max-width: 650px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <button id="btnBackToHub" class="btn btn-outline">← Back</button>
        <h3>How to make a warm cup of tea?</h3>
        <div></div>
      </div>

      <div class="orientation-card">
        <p style="font-size: var(--font-base); color: var(--text-muted); margin-bottom: 16px; font-weight: 600;">
          Tap the steps below in the order they happen (Step 1, then Step 2, then Step 3):
        </p>

        <div class="sequence-dropzone" id="shuffledZone">
          ${shuffled.map(s => `
            <div class="sequence-item" data-id="${s.id}" tabindex="0" role="button">
              <span><span style="font-size: 28px; margin-right: 12px;">${s.icon}</span> ${s.text}</span>
              <span class="btn btn-sm btn-primary">Select Step</span>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 2px dashed var(--border-color);">
          <h4>Your Chosen Order:</h4>
          <div id="chosenZone" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px; min-height: 50px;">
            <p style="color: var(--text-muted); font-style: italic;" id="emptyOrderHint">Tap a step above to place it here...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnBackToHub').onclick = () => {
    activeGame = null;
    playChime('click');
    renderGamesHub(container, patientId, triggerConfetti);
  };

  const chosenZone = document.getElementById('chosenZone');
  const hint = document.getElementById('emptyOrderHint');

  container.querySelectorAll('#shuffledZone .sequence-item').forEach(item => {
    item.onclick = () => {
      const stepId = parseInt(item.dataset.id, 10);
      playChime('click');
      item.style.display = 'none';
      if (hint) hint.style.display = 'none';

      playerSequence.push(stepId);
      const stepObj = steps.find(s => s.id === stepId);

      const stepBadge = document.createElement('div');
      stepBadge.className = 'sequence-item';
      stepBadge.style.background = 'var(--success-light)';
      stepBadge.style.borderColor = 'var(--success)';
      stepBadge.innerHTML = `
        <span><strong>Step ${playerSequence.length}:</strong> ${stepObj.icon} ${stepObj.text}</span>
        <span style="color: var(--success); font-weight: bold;">✓ Added</span>
      `;
      chosenZone.appendChild(stepBadge);

      if (playerSequence.length === steps.length) {
        // Check accuracy
        const isCorrect = playerSequence.every((val, index) => val === steps[index].id);
        const accuracy = isCorrect ? 100 : 75;
        const timeTaken = Math.round((Date.now() - startTime) / 1000);

        setTimeout(() => {
          handleGameCompletion(container, patientId, 'routineSequence', 90, accuracy, 'easy', timeTaken, triggerConfetti);
        }, 1000);
      }
    };
  });
}

// ----------------------------------------------------
// GAME COMPLETION & ADAPTIVE DIFFICULTY TRIGGER
// ----------------------------------------------------
async function handleGameCompletion(container, patientId, gameType, score, accuracy, difficulty, timeTaken, triggerConfetti) {
  playChime('success');
  if (triggerConfetti) triggerConfetti();

  const res = await recordGameResult({
    patientId,
    gameType,
    score,
    accuracy,
    difficulty,
    timeTaken
  });

  const nextDiff = (res && res.recommendedNextDifficulty)
    ? res.recommendedNextDifficulty
    : calculateNextDifficulty(difficulty, accuracy);

  const praises = [
    "Marvelous job! You exercised your brain today.",
    "Wonderful effort! Every little exercise keeps the mind active and bright.",
    "Well done! You did brilliantly."
  ];
  const praise = praises[Math.floor(Math.random() * praises.length)];
  speakText(praise);

  container.innerHTML = `
    <div class="orientation-card" style="max-width: 600px; margin: 30px auto; text-align: center; animation: fadeIn 0.3s ease;">
      <div style="font-size: 64px; margin-bottom: 12px;">🌟</div>
      <h2>Activity Completed!</h2>
      <p style="font-size: var(--font-lg); color: var(--success); font-weight: 700; margin: 12px 0;">
        ${praise}
      </p>

      <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); margin: 24px 0;">
        <div class="stat-card">
          <div class="stat-value">${accuracy}%</div>
          <div class="stat-label">Accuracy</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${timeTaken}s</div>
          <div class="stat-label">Time Enjoyed</div>
        </div>
      </div>

      <div style="background: var(--bg-subtle); padding: 14px 20px; border-radius: 14px; margin-bottom: 24px; font-weight: 600;">
        Adaptive Level for Next Time: <strong style="text-transform: uppercase; color: var(--primary);">${nextDiff}</strong>
      </div>

      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="btnReturnToGames" class="btn btn-primary" style="font-size: var(--font-lg);">
          ← Return to Activities
        </button>
      </div>
    </div>
  `;

  document.getElementById('btnReturnToGames').onclick = () => {
    activeGame = null;
    playChime('click');
    renderGamesHub(container, patientId, triggerConfetti);
  };
}
