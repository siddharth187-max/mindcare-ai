// public/js/components/orientation.js
// Live Dementia Orientation Card: Time, Date, Period of Day, Reassurance, and Quick Caregiver Call

import { speakText, playChime } from '../audio.js';

let clockInterval = null;

export function renderOrientation(container, patientName = 'Arthur', caregiverName = 'Sarah Jenkins', onCallCaregiver) {
  function getTimePeriod(hours) {
    if (hours >= 5 && hours < 12) {
      return {
        label: 'Morning',
        icon: '🌅',
        greeting: `Good morning ${patientName}. You are doing well. It is a peaceful morning.`
      };
    } else if (hours >= 12 && hours < 17) {
      return {
        label: 'Afternoon',
        icon: '☀️',
        greeting: `Good afternoon ${patientName}. Take your time and enjoy your afternoon.`
      };
    } else if (hours >= 17 && hours < 21) {
      return {
        label: 'Evening',
        icon: '🌆',
        greeting: `Good evening ${patientName}. The sun is setting. You are safe and comfortable.`
      };
    } else {
      return {
        label: 'Night',
        icon: '🌙',
        greeting: `Good night ${patientName}. It is resting hours. Time to relax and sleep peacefully.`
      };
    }
  }

  function updateClockDisplay() {
    const now = new Date();
    const hours = now.getHours();
    const period = getTimePeriod(hours);

    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const timeEl = document.getElementById('liveClock');
    const dateEl = document.getElementById('liveDate');
    const periodEl = document.getElementById('periodBadge');
    const greetingEl = document.getElementById('periodGreeting');

    if (timeEl) timeEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = dateStr;
    if (periodEl) periodEl.innerHTML = `${period.icon} ${period.label}`;
    if (greetingEl) greetingEl.textContent = period.greeting;
  }

  const now = new Date();
  const period = getTimePeriod(now.getHours());

  container.innerHTML = `
    <section class="orientation-card" aria-label="Today's orientation and safety information">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div>
          <div class="orientation-time" id="liveClock">
            ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div class="orientation-date" id="liveDate">
            ${now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <span id="periodBadge" style="font-size: var(--font-lg); font-weight: 800; background: var(--primary-light); color: var(--primary); padding: 8px 18px; border-radius: 14px;">
            ${period.icon} ${period.label}
          </span>
          <button id="btnReadOrientation" class="btn btn-sm btn-outline" aria-label="Read time and greeting out loud" title="Read Aloud">
            🔊 Read To Me
          </button>
        </div>
      </div>

      <!-- Calming reassurance message -->
      <div class="orientation-reassurance" role="status">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 28px;">🏡</span>
          <div>
            <div id="periodGreeting" style="font-size: var(--font-lg); font-weight: 700;">${period.greeting}</div>
            <div style="font-size: var(--font-base); font-weight: 500; opacity: 0.9;">You are in your home, safe and cared for.</div>
          </div>
        </div>
      </div>

      <!-- Caregiver quick connect bar -->
      <div class="caregiver-quickbar">
        <div class="caregiver-info">
          <div class="caregiver-avatar" aria-hidden="true">👩‍⚕️</div>
          <div>
            <div style="font-size: var(--font-base); font-weight: 700;">Caregiver on Duty: ${caregiverName}</div>
            <div style="font-size: calc(var(--font-base) * 0.85); color: var(--text-muted); font-weight: 600;">
              Always here to assist with daily routines & medications
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="btnCallCaregiver" class="btn btn-primary" style="min-height: 50px; font-size: var(--font-base);">
            📞 Call ${caregiverName.split(' ')[0]}
          </button>
        </div>
      </div>
    </section>
  `;

  // Start clock interval
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(updateClockDisplay, 1000);

  // Read aloud event
  document.getElementById('btnReadOrientation').onclick = () => {
    const greeting = document.getElementById('periodGreeting').textContent;
    const time = document.getElementById('liveClock').textContent;
    const date = document.getElementById('liveDate').textContent;
    const speech = `It is ${time} on ${date}. ${greeting} Remember, you are safe at home, and your caregiver ${caregiverName} is ready to help you anytime.`;
    speakText(speech);
  };

  document.getElementById('btnCallCaregiver').onclick = () => {
    playChime('reminder');
    onCallCaregiver();
  };
}
