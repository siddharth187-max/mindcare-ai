// public/js/components/reminders.js
// Active Real-Time Dementia Reminders and Gentle Audio Chime Alert

import { getPendingReminders, completeReminder } from '../api.js';
import { playChime, speakText } from '../audio.js';

let reminderCheckInterval = null;
let activeReminderShown = false;

export function initReminderService(patientId, triggerConfetti) {
  if (reminderCheckInterval) clearInterval(reminderCheckInterval);

  async function checkReminders() {
    if (activeReminderShown) return;

    const pending = await getPendingReminders(patientId);
    if (!pending || pending.length === 0) return;

    const now = new Date().getTime();
    for (const rem of pending) {
      const scheduledTime = new Date(rem.scheduledTime).getTime();
      // If scheduled time is within 2 minutes or overdue
      if (scheduledTime <= now + 60000) {
        showReminderAlert(rem, triggerConfetti);
        break;
      }
    }
  }

  reminderCheckInterval = setInterval(checkReminders, 15000);
  // Initial check after 2 seconds
  setTimeout(checkReminders, 2000);
}

function showReminderAlert(reminder, triggerConfetti) {
  activeReminderShown = true;
  playChime('reminder');
  speakText(`Gentle reminder for Arthur: ${reminder.title}.`);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'activeReminderOverlay';

  overlay.innerHTML = `
    <div class="modal-content" role="alertdialog" style="text-align: center; border-color: var(--primary);">
      <div style="font-size: 64px; margin-bottom: 12px;" aria-hidden="true">⏰</div>
      <span style="background: var(--primary-light); color: var(--primary); font-size: var(--font-base); font-weight: 800; padding: 6px 16px; border-radius: 12px;">
        Gentle Reminder
      </span>

      <h2 style="margin: 16px 0; font-size: var(--font-2xl);">
        ${reminder.title}
      </h2>

      <p style="font-size: var(--font-lg); color: var(--text-muted); font-weight: 600; margin-bottom: 28px;">
        It is time for your scheduled activity. Take your time.
      </p>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <button id="btnCompleteActiveRem" class="btn btn-success" style="font-size: var(--font-xl); padding: 18px 24px;">
          ✓ I Did This Now
        </button>
        <button id="btnSnoozeActiveRem" class="btn btn-outline" style="font-size: var(--font-base);">
          ⏳ Remind Me Again in 5 Minutes
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('btnCompleteActiveRem').onclick = async () => {
    playChime('success');
    if (triggerConfetti) triggerConfetti();
    speakText('Wonderful! Marked as finished.');
    await completeReminder(reminder._id);
    overlay.remove();
    activeReminderShown = false;
  };

  document.getElementById('btnSnoozeActiveRem').onclick = () => {
    playChime('click');
    speakText('We will remind you in a few minutes.');
    overlay.remove();
    setTimeout(() => {
      activeReminderShown = false;
    }, 5 * 60000);
  };
}
