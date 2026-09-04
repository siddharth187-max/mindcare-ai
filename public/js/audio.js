// public/js/audio.js
// Native Web Speech (TTS) & Web Audio API synthesizer for dementia accessibility

let audioCtx = null;
let soundEnabled = true;
let voiceEnabled = true;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Synthesize pleasant, non-startling acoustic chimes
export function playChime(type = 'success', noteFreq = null) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine'; // sine wave is soft, pure and non-abrasive
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (noteFreq) {
      // Direct frequency for Simon pattern game
      osc.frequency.setValueAtTime(noteFreq, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
      return;
    }

    switch (type) {
      case 'success': {
        // Soft major triad arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz)
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = 'triangle';
          noteOsc.frequency.setValueAtTime(freq, now + i * 0.1);
          noteGain.gain.setValueAtTime(0.18, now + i * 0.1);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.start(now + i * 0.1);
          noteOsc.stop(now + i * 0.1 + 0.4);
        });
        break;
      }
      case 'match': {
        // Uplifting two-tone chime
        [659.25, 880].forEach((freq, i) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, now + i * 0.12);
          noteGain.gain.setValueAtTime(0.15, now + i * 0.12);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.start(now + i * 0.12);
          noteOsc.stop(now + i * 0.12 + 0.4);
        });
        break;
      }
      case 'reminder': {
        // Gentle bell double-chime
        [587.33, 880].forEach((freq, i) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, now + i * 0.25);
          noteGain.gain.setValueAtTime(0.2, now + i * 0.25);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.6);
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.start(now + i * 0.25);
          noteOsc.stop(now + i * 0.25 + 0.6);
        });
        break;
      }
      case 'click': {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      default: {
        osc.frequency.setValueAtTime(523.25, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    }
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
}

// Dementia-optimized Text-to-Speech (Calm, unhurried, warm rate)
export function speakText(text, onEnd = null) {
  if (!voiceEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.rate = 0.88;   // Gentle, unhurried pace for cognitive processing
    utterance.pitch = 1.05;  // Slightly warmer, reassuring pitch
    utterance.volume = 1.0;

    // Pick best natural sounding English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("SpeechSynthesis error:", e);
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  voiceEnabled = soundEnabled;
  return soundEnabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}
