// public/js/components/header.js
// Header with dementia accessibility controls, live time display, and view switcher

import { toggleSound, speakText, playChime } from '../audio.js';
import { getCurrentRole, setToken } from '../api.js';

let currentScale = 1;

export function renderHeader(container, onTabChange, onEmergencyClick) {
  const role = getCurrentRole();

  container.innerHTML = `
    <header class="app-header" role="banner">
      <div class="container header-content">
        <!-- Brand & Title -->
        <div class="brand" id="brandLogo" tabindex="0" role="button" aria-label="MindCare Home">
          <div class="brand-icon" aria-hidden="true">🌿</div>
          <div>
            <div class="brand-name">MindCare</div>
            <div style="font-size: calc(var(--font-base) * 0.8); color: var(--text-muted); font-weight: 600;">
              Cognitive & Daily Living Companion
            </div>
          </div>
        </div>

        <!-- Accessibility & View Switcher -->
        <div class="accessibility-controls" role="toolbar" aria-label="Accessibility and view tools">
          <!-- Font Size Scaler -->
          <div style="display: flex; gap: 4px; background: var(--bg-subtle); padding: 4px; border-radius: 12px;">
            <button id="btnFontDec" class="btn btn-sm btn-outline" aria-label="Decrease text size" title="Standard Text">
              A-
            </button>
            <button id="btnFontReset" class="btn btn-sm btn-outline" aria-label="Reset text size" title="Medium Text">
              A
            </button>
            <button id="btnFontInc" class="btn btn-sm btn-outline" aria-label="Increase text size" title="Large Text">
              A+
            </button>
          </div>

          <!-- High Contrast Mode Toggle -->
          <button id="btnContrast" class="btn btn-sm btn-outline" aria-label="Toggle High Contrast Mode" title="High Contrast Mode">
            🌓 Contrast
          </button>

          <!-- Voice / Audio Toggle -->
          <button id="btnSound" class="btn btn-sm btn-outline" aria-label="Toggle Voice and Sounds" title="Voice & Sound Assistance">
            🔊 Sound On
          </button>

          <!-- Emergency / Call Caregiver -->
          <button id="btnEmergencyHeader" class="btn btn-sm btn-danger" aria-label="Call Caregiver or Emergency Assistance" title="Call Caregiver">
            🚨 Call Help
          </button>

          <!-- Role / View Switcher -->
          <button id="btnRoleSwitch" class="btn btn-sm btn-primary" aria-label="Switch between Patient and Caregiver view">
            ${role === 'caregiver' ? '👤 Patient View' : '🩺 Caregiver View'}
          </button>
        </div>
      </div>
    </header>
  `;

  // Attach event listeners
  document.getElementById('brandLogo').onclick = () => {
    playChime('click');
    onTabChange('routine');
  };

  document.getElementById('btnFontDec').onclick = () => {
    currentScale = Math.max(0.9, currentScale - 0.15);
    document.documentElement.style.setProperty('--scale', currentScale);
    playChime('click');
  };

  document.getElementById('btnFontReset').onclick = () => {
    currentScale = 1;
    document.documentElement.style.setProperty('--scale', currentScale);
    playChime('click');
  };

  document.getElementById('btnFontInc').onclick = () => {
    currentScale = Math.min(1.4, currentScale + 0.15);
    document.documentElement.style.setProperty('--scale', currentScale);
    playChime('click');
  };

  const btnContrast = document.getElementById('btnContrast');
  btnContrast.onclick = () => {
    document.body.classList.toggle('high-contrast');
    const enabled = document.body.classList.contains('high-contrast');
    btnContrast.style.borderColor = enabled ? '#FFD740' : '';
    playChime('click');
    speakText(enabled ? 'High contrast enabled' : 'Normal view restored');
  };

  const btnSound = document.getElementById('btnSound');
  btnSound.onclick = () => {
    const soundOn = toggleSound();
    btnSound.innerHTML = soundOn ? '🔊 Sound On' : '🔇 Muted';
    if (soundOn) {
      playChime('success');
      speakText('Sound assistance enabled');
    }
  };

  document.getElementById('btnEmergencyHeader').onclick = () => {
    playChime('reminder');
    onEmergencyClick();
  };

  const btnRoleSwitch = document.getElementById('btnRoleSwitch');
  btnRoleSwitch.onclick = () => {
    playChime('click');
    const newRole = getCurrentRole() === 'caregiver' ? 'patient' : 'caregiver';
    setToken(newRole === 'caregiver' ? 'demo-token-caregiver' : 'demo-token-patient', newRole);
    btnRoleSwitch.innerHTML = newRole === 'caregiver' ? '👤 Patient View' : '🩺 Caregiver View';
    speakText(newRole === 'caregiver' ? 'Switching to Caregiver Portal' : 'Switching to Patient View');
    onTabChange(newRole === 'caregiver' ? 'caregiver' : 'routine');
  };
}
