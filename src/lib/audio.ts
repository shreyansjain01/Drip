/**
 * Audio synthesis for Drip app using Web Audio API.
 * 100% self-contained, zero external asset downloads, zero latency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a satisfying, crisp "Liquid Drip Pop" when an expense is logged.
 */
export function playExpenseAddedSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Trigger haptic feedback if available on mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 15, 30]);
    }

    // 1. Primary resonant bubble sweep (droplet "plink")
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    // Rapid pitch sweep imitating a water droplet drop into glass
    osc1.frequency.setValueAtTime(420, now);
    osc1.frequency.exponentialRampToValueAtTime(980, now + 0.08);
    osc1.frequency.exponentialRampToValueAtTime(1280, now + 0.16);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.28, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);

    // 2. Secondary soft harmonic sheen for warmth
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(840, now);
    osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.09);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now);
    osc2.stop(now + 0.25);
  } catch (err) {
    // Graceful fallback
  }
}

/**
 * Play a triumphant, sparkling celebratory chime arpeggio when a goal is reached or created.
 */
export function playGoalAchievedSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Extended celebratory haptic pattern
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 40, 50, 40, 120]);
    }

    // Melodic notes in C Major / Pentatonic shimmer (C5, E5, G5, C6)
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.4 },  // C5
      { freq: 659.25, time: 0.08, dur: 0.45 }, // E5
      { freq: 783.99, time: 0.16, dur: 0.5 },  // G5
      { freq: 1046.50, time: 0.24, dur: 0.8 }, // C6 (triumph peak)
      { freq: 1318.51, time: 0.32, dur: 1.0 }  // E6 (sparkle tail)
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Subtle vibrato shimmer
      const noteStart = now + time;
      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + dur);
    });
  } catch (err) {
    // Graceful fallback
  }
}

/**
 * Optional subtle tactile key tap click for the numeric keypad.
 */
export function playKeyTapSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {}
}
