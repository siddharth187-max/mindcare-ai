// public/js/components/caregiver.js
// Dedicated Caregiver Portal: Patient Progress, Adherence Tracking, Analytics Charts & Routine Management

import { getCaregiverDashboard, addRoutine, deleteRoutine, addReminder } from '../api.js';
import { playChime, speakText } from '../audio.js';

export async function renderCaregiverPortal(container, patientId, onSwitchToPatient) {
  const dashboard = await getCaregiverDashboard(patientId);
  const { patient, todaysRoutine, stats } = dashboard;

  const adherenceRate = todaysRoutine.length > 0
    ? Math.round((dashboard.completedActivities.length / todaysRoutine.length) * 100)
    : 0;

  container.innerHTML = `
    <section aria-label="Caregiver Portal and Patient Analytics">
      <!-- Portal Top Banner -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <h2>Caregiver Monitoring Portal</h2>
            <span style="background: var(--primary-light); color: var(--primary); font-size: var(--font-base); font-weight: 800; padding: 4px 12px; border-radius: 10px;">
              Admin View
            </span>
          </div>
          <p style="color: var(--text-muted); font-size: var(--font-base); font-weight: 600; margin-top: 4px;">
            Observing: <strong>${patient.name || 'Arthur Pendelton'}</strong> (Age: ${patient.age || 74}, Routine: Morning-Focused)
          </p>
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="btnAddRoutineModal" class="btn btn-outline">
            ➕ Add Routine Task
          </button>
          <button id="btnAddReminderModal" class="btn btn-outline">
            ⏰ Add Reminder
          </button>
          <button id="btnExitToPatient" class="btn btn-primary">
            👤 Switch to Patient View
          </button>
        </div>
      </div>

      <!-- Quick Summary Metric Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value" style="color: var(--success);">${adherenceRate}%</div>
          <div class="stat-label">Today's Routine Adherence</div>
          <div style="font-size: calc(var(--font-base) * 0.85); color: var(--text-muted);">
            ${dashboard.completedActivities.length} of ${todaysRoutine.length} activities completed
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${stats.gamesCompleted}</div>
          <div class="stat-label">Cognitive Sessions Logged</div>
          <div style="font-size: calc(var(--font-base) * 0.85); color: var(--text-muted);">
            Memory, pattern, recognition
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${stats.averageAccuracy}%</div>
          <div class="stat-label">Average Cognitive Accuracy</div>
          <div style="font-size: calc(var(--font-base) * 0.85); color: var(--text-muted);">
            Mean score: ${stats.averageScore} pts
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-value" style="text-transform: uppercase; color: var(--primary);">
            ${stats.currentDifficulty || 'Medium'}
          </div>
          <div class="stat-label">Adaptive Difficulty Level</div>
          <div style="font-size: calc(var(--font-base) * 0.85); color: var(--text-muted);">
            Auto-calculated from performance
          </div>
        </div>
      </div>

      <!-- Cognitive Health 7-Day Trend Chart (SVG) -->
      <div class="chart-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3>7-Day Cognitive Accuracy Trend</h3>
            <p style="color: var(--text-muted); font-size: calc(var(--font-base) * 0.9);">
              Evaluates neurocognitive stability & session engagement
            </p>
          </div>
          <span style="font-size: calc(var(--font-base) * 0.85); font-weight: 700; color: var(--success); background: var(--success-light); padding: 4px 12px; border-radius: 10px;">
            Stable Performance
          </span>
        </div>

        <div style="width: 100%; height: 200px; display: flex; align-items: flex-end; gap: 18px; padding-top: 20px; border-bottom: 2px solid var(--border-color);">
          ${(stats.weeklyPerformance || []).map(day => {
            const heightPercent = Math.max(15, Math.min(100, day.averageAccuracy));
            return `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: flex-end;">
                <div style="font-size: calc(var(--font-base) * 0.8); font-weight: 800; color: var(--primary);">
                  ${day.averageAccuracy}%
                </div>
                <div style="width: 100%; max-width: 44px; height: ${heightPercent}%; background: var(--primary); border-radius: 8px 8px 0 0; transition: height 0.4s ease;"></div>
                <div style="font-size: calc(var(--font-base) * 0.85); font-weight: 700; color: var(--text-muted);">
                  ${day.date}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Routine Management Table -->
      <div class="orientation-card" style="margin-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3>Configured Daily Routines</h3>
          <span style="color: var(--text-muted); font-size: var(--font-base);">${todaysRoutine.length} tasks</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${todaysRoutine.map(r => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-subtle); border-radius: 12px; gap: 12px;">
              <div>
                <div style="font-weight: 700; font-size: var(--font-base);">
                  ${r.title}
                  ${r.completed ? '<span style="color: var(--success); font-size: 0.85em; margin-left: 8px;">✓ Done today</span>' : ''}
                </div>
                <div style="font-size: calc(var(--font-base) * 0.85); color: var(--text-muted);">
                  ⏰ ${r.scheduledTime} | Category: ${r.category} | ${r.description || 'No notes'}
                </div>
              </div>

              <div style="display: flex; gap: 8px;">
                <button class="btn btn-sm btn-danger btn-delete-routine" data-id="${r._id}">
                  Delete
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Add Routine Modal Placeholder -->
      <div id="modalContainer"></div>
    </section>
  `;

  // Attach exit event
  document.getElementById('btnExitToPatient').onclick = () => {
    playChime('click');
    onSwitchToPatient();
  };

  // Attach delete routine events
  container.querySelectorAll('.btn-delete-routine').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      if (confirm('Are you sure you want to remove this routine item?')) {
        playChime('click');
        await deleteRoutine(id);
        renderCaregiverPortal(container, patientId, onSwitchToPatient);
      }
    };
  });

  // Attach modal triggers
  document.getElementById('btnAddRoutineModal').onclick = () => {
    playChime('click');
    showAddRoutineModal(container, patientId, onSwitchToPatient);
  };

  document.getElementById('btnAddReminderModal').onclick = () => {
    playChime('click');
    showAddReminderModal(container, patientId, onSwitchToPatient);
  };
}

function showAddRoutineModal(container, patientId, onSwitchToPatient) {
  const modalContainer = document.getElementById('modalContainer');
  modalContainer.innerHTML = `
    <div class="modal-overlay" id="addRoutineOverlay">
      <div class="modal-content" role="dialog" aria-labelledby="addRoutineTitle">
        <h2 id="addRoutineTitle" style="margin-bottom: 18px;">Add New Routine Task</h2>

        <form id="addRoutineForm">
          <div class="form-group">
            <label class="form-label" for="taskTitle">Task Title *</label>
            <input type="text" id="taskTitle" class="form-input" placeholder="e.g. Afternoon Medication" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="taskDesc">Caregiver Notes / Instructions</label>
            <textarea id="taskDesc" class="form-textarea" placeholder="e.g. Take 1 tablet with fresh water"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="taskTime">Scheduled Time (24h format) *</label>
            <input type="time" id="taskTime" class="form-input" value="14:00" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="taskCategory">Category</label>
            <select id="taskCategory" class="form-select">
              <option value="medicine">💊 Medicine</option>
              <option value="hygiene">🪥 Hygiene</option>
              <option value="meal">🍳 Meal</option>
              <option value="exercise">🚶 Gentle Exercise</option>
              <option value="cognitive">🧠 Brain Activity</option>
              <option value="sleep">🌙 Rest / Sleep</option>
              <option value="other">⭐ Other</option>
            </select>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
            <button type="button" id="btnCancelAddRoutine" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Routine Task</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('btnCancelAddRoutine').onclick = () => {
    modalContainer.innerHTML = '';
  };

  document.getElementById('addRoutineForm').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDesc').value;
    const scheduledTime = document.getElementById('taskTime').value;
    const category = document.getElementById('taskCategory').value;

    playChime('success');
    await addRoutine({
      patientId,
      title,
      description,
      scheduledTime,
      category,
      reminderEnabled: true
    });

    modalContainer.innerHTML = '';
    renderCaregiverPortal(container, patientId, onSwitchToPatient);
  };
}

function showAddReminderModal(container, patientId, onSwitchToPatient) {
  const modalContainer = document.getElementById('modalContainer');
  modalContainer.innerHTML = `
    <div class="modal-overlay" id="addReminderOverlay">
      <div class="modal-content" role="dialog" aria-labelledby="addReminderTitle">
        <h2 id="addReminderTitle" style="margin-bottom: 18px;">Create Alert Reminder</h2>

        <form id="addReminderForm">
          <div class="form-group">
            <label class="form-label" for="remTitle">Reminder Alert Title *</label>
            <input type="text" id="remTitle" class="form-input" placeholder="e.g. Drink a glass of water" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="remTime">Scheduled Time *</label>
            <input type="datetime-local" id="remTime" class="form-input" required />
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
            <button type="button" id="btnCancelAddRem" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary">Set Reminder</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Set default datetime to 30 mins from now
  const now = new Date(Date.now() + 30 * 60000);
  document.getElementById('remTime').value = now.toISOString().slice(0, 16);

  document.getElementById('btnCancelAddRem').onclick = () => {
    modalContainer.innerHTML = '';
  };

  document.getElementById('addReminderForm').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('remTitle').value;
    const scheduledTime = document.getElementById('remTime').value;

    playChime('success');
    await addReminder({
      patientId,
      title,
      scheduledTime: new Date(scheduledTime).toISOString()
    });

    modalContainer.innerHTML = '';
    renderCaregiverPortal(container, patientId, onSwitchToPatient);
  };
}
