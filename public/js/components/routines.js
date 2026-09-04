// public/js/components/routines.js
// Dementia-Friendly Daily Routine Checklist with Audio Narration and Positive Reinforcement

import { getTodayRoutines, completeRoutine } from '../api.js';
import { speakText, playChime } from '../audio.js';

let currentFilter = 'all';

export async function renderRoutines(container, patientId, triggerConfetti) {
  const routines = await getTodayRoutines(patientId);

  const categoryIcons = {
    medicine: '💊',
    hygiene: '🪥',
    meal: '🍳',
    exercise: '🚶',
    cognitive: '🧠',
    sleep: '🌙',
    other: '⭐'
  };

  const categoryLabels = {
    medicine: 'Medication',
    hygiene: 'Personal Care',
    meal: 'Meal & Nutrition',
    exercise: 'Gentle Movement',
    cognitive: 'Brain Activity',
    sleep: 'Rest & Sleep',
    other: 'Daily Task'
  };

  function getFilteredRoutines() {
    if (currentFilter === 'all') return routines;
    return routines.filter(r => {
      const hour = parseInt(r.scheduledTime.split(':')[0], 10);
      if (currentFilter === 'morning') return hour >= 5 && hour < 12;
      if (currentFilter === 'afternoon') return hour >= 12 && hour < 17;
      if (currentFilter === 'evening') return hour >= 17;
      return true;
    });
  }

  const completedCount = routines.filter(r => r.completed).length;
  const totalCount = routines.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  container.innerHTML = `
    <section class="routine-section" aria-label="Today's routine checklist">
      <div class="section-header">
        <div>
          <h2>Today's Activities & Routine</h2>
          <p style="color: var(--text-muted); font-size: var(--font-base); font-weight: 600; margin-top: 4px;">
            Take your time. Mark each activity as you finish it.
          </p>
        </div>

        <!-- Visual Progress Badge -->
        <div style="text-align: right; background: var(--bg-card); padding: 12px 20px; border-radius: 16px; border: 2px solid var(--border-color); box-shadow: var(--card-shadow);">
          <div style="font-size: var(--font-lg); font-weight: 800; color: var(--success);">
            ${completedCount} of ${totalCount} Done (${progressPercent}%)
          </div>
          <div style="width: 160px; height: 10px; background: var(--bg-subtle); border-radius: 10px; overflow: hidden; margin-top: 6px;">
            <div style="width: ${progressPercent}%; height: 100%; background: var(--success); transition: width 0.4s ease;"></div>
          </div>
        </div>
      </div>

      <!-- Routine Time Filters -->
      <div class="nav-tabs" role="tablist" style="margin-bottom: 24px;">
        <button class="nav-tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
          📅 All Today (${totalCount})
        </button>
        <button class="nav-tab ${currentFilter === 'morning' ? 'active' : ''}" data-filter="morning">
          🌅 Morning
        </button>
        <button class="nav-tab ${currentFilter === 'afternoon' ? 'active' : ''}" data-filter="afternoon">
          ☀️ Afternoon
        </button>
        <button class="nav-tab ${currentFilter === 'evening' ? 'active' : ''}" data-filter="evening">
          🌆 Evening & Night
        </button>
      </div>

      <!-- Routine Cards List -->
      <div class="routine-list" id="routineItemsContainer">
        ${renderRoutineCards(getFilteredRoutines(), categoryIcons, categoryLabels)}
      </div>
    </section>
  `;

  // Attach filter events
  container.querySelectorAll('.nav-tab').forEach(tab => {
    tab.onclick = () => {
      playChime('click');
      currentFilter = tab.dataset.filter;
      renderRoutines(container, patientId, triggerConfetti);
    };
  });

  // Attach routine card buttons
  attachCardEvents(container, patientId, triggerConfetti);
}

function renderRoutineCards(filteredList, categoryIcons, categoryLabels) {
  if (filteredList.length === 0) {
    return `
      <div class="routine-card" style="justify-content: center; text-align: center; padding: 40px;">
        <div>
          <div style="font-size: 48px; margin-bottom: 12px;">🌟</div>
          <h3>No tasks scheduled for this period!</h3>
          <p style="color: var(--text-muted); margin-top: 8px;">You can relax, have a glass of water, or enjoy a cognitive game.</p>
        </div>
      </div>
    `;
  }

  return filteredList.map(item => {
    const icon = categoryIcons[item.category] || '⭐';
    const categoryName = categoryLabels[item.category] || 'Task';
    const timeFormatted = formatTime(item.scheduledTime);

    return `
      <article class="routine-card ${item.completed ? 'completed' : ''}" data-id="${item._id}" aria-label="${item.title}">
        <div class="routine-left">
          <div class="routine-icon-box" aria-hidden="true">${icon}</div>
          <div class="routine-details">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span class="routine-time-badge">⏰ ${timeFormatted}</span>
              <span style="font-size: calc(var(--font-base) * 0.85); font-weight: 700; color: var(--text-muted);">
                ${categoryName}
              </span>
            </div>
            <h3 class="routine-title" style="margin-top: 4px;">
              ${item.title}
              ${item.completed ? '<span style="color: var(--success); font-size: var(--font-base);">✓ Completed</span>' : ''}
            </h3>
            ${item.description ? `<p style="color: var(--text-muted); font-size: var(--font-base);">${item.description}</p>` : ''}
          </div>
        </div>

        <div class="routine-actions">
          <!-- Text to Speech narration button -->
          <button class="btn btn-outline btn-icon btn-speak" data-text="${item.title}. ${item.description || ''}. Scheduled for ${timeFormatted}." aria-label="Listen to ${item.title}" title="Listen Aloud">
            🔊
          </button>

          <!-- Completion Toggle -->
          ${item.completed ? `
            <button class="btn btn-success" disabled style="opacity: 0.9; cursor: default;">
              ✓ Done!
            </button>
          ` : `
            <button class="btn btn-primary btn-complete" data-id="${item._id}" data-title="${item.title}">
              ✓ I Did This
            </button>
          `}
        </div>
      </article>
    `;
  }).join('');
}

function attachCardEvents(container, patientId, triggerConfetti) {
  // Speech narration
  container.querySelectorAll('.btn-speak').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      playChime('click');
      speakText(btn.dataset.text);
    };
  });

  // Completion action
  container.querySelectorAll('.btn-complete').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const routineId = btn.dataset.id;
      const routineTitle = btn.dataset.title;

      playChime('success');
      if (triggerConfetti) triggerConfetti();

      // Warm affirming voice encouragement
      const encouragements = [
        `Wonderful job! You completed ${routineTitle}.`,
        `Great work! That task is finished.`,
        `Well done! Taking good care of yourself today.`
      ];
      const speech = encouragements[Math.floor(Math.random() * encouragements.length)];
      speakText(speech);

      await completeRoutine(routineId);
      renderRoutines(container, patientId, triggerConfetti);
    };
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m < 10 ? '0' + m : m} ${period}`;
}
