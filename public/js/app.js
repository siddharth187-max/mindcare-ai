// public/js/app.js
// Main MindCare Application Entry & Coordinator

import { renderHeader } from './components/header.js';
import { renderOrientation } from './components/orientation.js';
import { renderRoutines } from './components/routines.js';
import { renderGamesHub } from './components/games.js';
import { renderCaregiverPortal } from './components/caregiver.js';
import { showEmergencyModal } from './components/emergencyModal.js';
import { initReminderService } from './components/reminders.js';
import { getActivePatientId, getCurrentRole, getPatientProfile } from './api.js';

let activeTab = 'routine'; // 'routine' | 'games' | 'caregiver'
const patientId = getActivePatientId();

// Lightweight Canvas Confetti
function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.4,
    size: Math.random() * 8 + 6,
    color: ['#1565C0', '#2E7D32', '#F57C00', '#E91E63', '#9C27B0', '#FFD700'][Math.floor(Math.random() * 6)],
    speedY: Math.random() * 3 + 2,
    speedX: Math.random() * 4 - 2,
    rotation: Math.random() * 360
  }));

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += 4;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    frame++;
    if (frame < 90) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  animate();
}

async function init() {
  const headerContainer = document.getElementById('headerRoot');
  const mainContainer = document.getElementById('mainContentRoot');

  // Fetch patient and caregiver names
  const profile = await getPatientProfile(patientId);
  const patientName = profile.name || 'Arthur';
  const caregiverName = (profile.caregiver && profile.caregiver.name) || 'Sarah Jenkins';
  const caregiverPhone = (profile.caregiver && profile.caregiver.phone) || '(555) 382-9012';

  function onEmergencyClick() {
    showEmergencyModal(patientName, caregiverName, caregiverPhone);
  }

  function handleTabChange(tab) {
    activeTab = tab;
    render();
  }

  function render() {
    renderHeader(headerContainer, handleTabChange, onEmergencyClick);

    mainContainer.innerHTML = '';

    // If caregiver tab is chosen, render Caregiver Portal
    if (activeTab === 'caregiver') {
      renderCaregiverPortal(mainContainer, patientId, () => handleTabChange('routine'));
      return;
    }

    // Otherwise render Patient View:
    // 1. Orientation Card
    const orientationDiv = document.createElement('div');
    renderOrientation(orientationDiv, patientName, caregiverName, onEmergencyClick);
    mainContainer.appendChild(orientationDiv);

    // 2. Navigation Tabs (Daily Routine vs Games)
    const navTabs = document.createElement('div');
    navTabs.className = 'nav-tabs';
    navTabs.innerHTML = `
      <button class="nav-tab ${activeTab === 'routine' ? 'active' : ''}" id="tabRoutines" style="font-size: var(--font-lg); min-height: 58px;">
        📋 Today's Routine & Checklist
      </button>
      <button class="nav-tab ${activeTab === 'games' ? 'active' : ''}" id="tabGames" style="font-size: var(--font-lg); min-height: 58px;">
        🧠 Brain Activities & Games
      </button>
    `;
    mainContainer.appendChild(navTabs);

    document.getElementById('tabRoutines').onclick = () => handleTabChange('routine');
    document.getElementById('tabGames').onclick = () => handleTabChange('games');

    // 3. Dynamic Section Content
    const sectionDiv = document.createElement('div');
    mainContainer.appendChild(sectionDiv);

    if (activeTab === 'routine') {
      renderRoutines(sectionDiv, patientId, triggerConfetti);
    } else if (activeTab === 'games') {
      renderGamesHub(sectionDiv, patientId, triggerConfetti);
    }
  }

  // Initialize reminder polling
  initReminderService(patientId, triggerConfetti);

  // Initial render
  render();
}

window.addEventListener('DOMContentLoaded', init);
