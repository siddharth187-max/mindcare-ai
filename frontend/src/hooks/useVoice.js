import { useCallback } from 'react';

let audioCtx = null;
let soundEnabled = true;
let isAudioUnlocked = false;

// Audio Context Singleton with aggressive mobile resume
export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Global mobile touch unlocker for iOS Safari and Android Chrome
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const unlockMobileAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      isAudioUnlocked = true;
    } catch (e) {
      console.warn('Audio unlock error:', e);
    }
  };

  ['touchstart', 'touchend', 'click', 'keydown', 'pointerdown'].forEach((evt) => {
    document.addEventListener(evt, unlockMobileAudio, { passive: true });
  });
}

// Mobile Haptic Vibration Alert
export function triggerHapticAlert(pattern = [250, 100, 250, 100, 350]) {
  try {
    if ('navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    console.warn('Vibration error:', e);
  }
}

// Mobile Web Push/Browser Notification
export function triggerBrowserNotification(title, body) {
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          vibrate: [200, 100, 200],
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, { body, icon: '/favicon.svg' });
          }
        });
      }
    }
  } catch (e) {
    console.warn('Notification error:', e);
  }
}

// Specialized popping / flash alarm for reminder due (with phone vibration)
export function playPopFlashSound() {
  if (!soundEnabled) return;
  
  // Trigger Phone Vibration
  triggerHapticAlert([200, 100, 200, 100, 300]);

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // Pop 1 (high resonant bubble pop)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.09);

    // Pop 2 (second higher bubble pop)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
    gain2.gain.setValueAtTime(0.4, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.22);

    // Gentle 3-note melodic chime following the pop (C5 -> E5 -> G5)
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.25 + i * 0.14);
      gain.gain.setValueAtTime(0.3, now + 0.25 + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + i * 0.14 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.25 + i * 0.14);
      osc.stop(now + 0.25 + i * 0.14 + 0.5);
    });
  } catch (e) {
    console.warn('Audio pop error:', e);
  }
}

// Urgent Caregiver Escalation Sound (Alert for patient not responding after 3 attempts)
export function playCaregiverEscalationSound() {
  if (!soundEnabled) return;
  
  // Strong Phone Vibration for Caregiver
  triggerHapticAlert([500, 200, 500, 200, 600]);

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // Two-tone attention beacon pulse (880Hz -> 660Hz) repeated twice
    [0, 0.35].forEach((offset) => {
      const oscA = ctx.createOscillator();
      const gainA = ctx.createGain();
      oscA.type = 'sine';
      oscA.frequency.setValueAtTime(880, now + offset);
      gainA.gain.setValueAtTime(0.35, now + offset);
      gainA.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
      oscA.connect(gainA);
      gainA.connect(ctx.destination);
      oscA.start(now + offset);
      oscA.stop(now + offset + 0.15);

      const oscB = ctx.createOscillator();
      const gainB = ctx.createGain();
      oscB.type = 'triangle';
      oscB.frequency.setValueAtTime(659.25, now + offset + 0.16);
      gainB.gain.setValueAtTime(0.35, now + offset + 0.16);
      gainB.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.32);
      oscB.connect(gainB);
      gainB.connect(ctx.destination);
      oscB.start(now + offset + 0.16);
      oscB.stop(now + offset + 0.32);
    });
  } catch (e) {
    console.warn('Caregiver alarm error:', e);
  }
}

export function playChime(type = 'success', noteFreq = null) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    if (noteFreq) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
      return;
    }

    switch (type) {
      case 'pop':
      case 'flash':
      case 'reminderDue':
        playPopFlashSound();
        break;
      case 'urgent':
      case 'caregiverAlert':
        playCaregiverEscalationSound();
        break;
      case 'success': {
        triggerHapticAlert([100, 50, 150]);
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.25, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.4);
        });
        break;
      }
      case 'match': {
        [659.25, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.2, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.4);
        });
        break;
      }
      case 'reminder': {
        [587.33, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.25);
          gain.gain.setValueAtTime(0.25, now + i * 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.25);
          osc.stop(now + i * 0.25 + 0.6);
        });
        break;
      }
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      default: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    }
  } catch (e) {
    console.warn('AudioContext error:', e);
  }
}

export function speakText(text) {
  if (!soundEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.88;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const natural = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (natural) utterance.voice = natural;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('SpeechSynthesis error:', e);
  }
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  return soundEnabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function useVoice() {
  const speak = useCallback((text) => speakText(text), []);
  const chime = useCallback((type, freq) => playChime(type, freq), []);
  const playPop = useCallback(() => playPopFlashSound(), []);
  const playCaregiverAlert = useCallback(() => playCaregiverEscalationSound(), []);
  const vibrate = useCallback((pattern) => triggerHapticAlert(pattern), []);
  const notify = useCallback((title, body) => triggerBrowserNotification(title, body), []);
  return { speak, chime, playPop, playCaregiverAlert, vibrate, notify, toggleSound, isSoundEnabled };
}
