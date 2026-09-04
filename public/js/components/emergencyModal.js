// public/js/components/emergencyModal.js
// Dementia Reassurance & Caregiver Emergency Assistance Modal

import { speakText, playChime } from '../audio.js';

export function showEmergencyModal(patientName = 'Arthur', caregiverName = 'Sarah Jenkins', caregiverPhone = '(555) 382-9012') {
  playChime('reminder');
  speakText(`You are safe ${patientName}. We are reaching out to your caregiver ${caregiverName}. Take a deep breath.`);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'emergencyModalOverlay';

  overlay.innerHTML = `
    <div class="modal-content" role="alertdialog" aria-labelledby="emergTitle" style="border-color: var(--danger); text-align: center;">
      <div style="font-size: 64px; margin-bottom: 12px;" aria-hidden="true">🏡</div>
      <h2 id="emergTitle" style="color: var(--danger); margin-bottom: 8px;">
        You Are Safe at Home
      </h2>
      <p style="font-size: var(--font-lg); font-weight: 700; color: var(--text-main); margin-bottom: 20px;">
        Take a slow, deep breath. Help and reassurance are right here.
      </p>

      <!-- Home Address Reminder Card -->
      <div style="background: var(--bg-subtle); padding: 16px 20px; border-radius: 16px; margin-bottom: 24px; text-align: left;">
        <div style="font-size: calc(var(--font-base) * 0.85); color: var(--text-muted); font-weight: 700; text-transform: uppercase;">
          📍 Your Home Address
        </div>
        <div style="font-size: var(--font-lg); font-weight: 800; color: var(--text-main); margin-top: 4px;">
          442 Maplewood Drive, Apt 3B
        </div>
        <div style="font-size: var(--font-base); color: var(--text-muted);">
          Your door is locked and the living room is warm.
        </div>
      </div>

      <!-- Primary Caregiver Direct Action -->
      <div style="background: var(--success-light); border: 2px solid var(--success); padding: 20px; border-radius: 20px; margin-bottom: 24px;">
        <div style="font-size: var(--font-base); font-weight: 700; color: var(--success);">
          Primary Caregiver Contact
        </div>
        <div style="font-size: var(--font-xl); font-weight: 900; margin: 6px 0; color: var(--text-main);">
          ${caregiverName}
        </div>
        <div style="font-size: var(--font-lg); font-weight: 800; color: var(--primary); margin-bottom: 16px;">
          📞 ${caregiverPhone}
        </div>

        <a href="tel:${caregiverPhone.replace(/[^0-9]/g, '')}" class="btn btn-success" style="width: 100%; font-size: var(--font-lg); text-decoration: none;">
          📞 Call ${caregiverName.split(' ')[0]} Now
        </a>
      </div>

      <!-- Urgent Services & Dismiss Button -->
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <a href="tel:911" class="btn btn-danger" style="font-size: var(--font-base); text-decoration: none;">
          🚨 Call Emergency Medical Help (911)
        </a>
        <button id="btnCloseEmergency" class="btn btn-outline" style="font-size: var(--font-base);">
          ✓ I Feel Calm & Safe Now (Close)
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('btnCloseEmergency').onclick = () => {
    playChime('click');
    speakText('Glad you are feeling comfortable.');
    overlay.remove();
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}
