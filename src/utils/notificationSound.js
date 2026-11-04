// The bell heard when a notification arrives while the page is open.
// It is synthesized with the Web Audio API (a struck-bell tone: a few decaying partials), so there is no audio file to ship.
// Browsers only allow sound after the person has interacted with the page, so the audio context is unlocked on the
// first click, tap or key press; a notification that arrives before that stays silent instead of throwing.
// Calls closer than MIN_GAP_MS count as one (a push and the live feed can report the same event).

const MIN_GAP_MS = 1500;
// Frequency ratio and loudness of each partial of the bell, over a 880 Hz fundamental.
const PARTIALS = [[1, 0.55], [2.76, 0.25], [5.4, 0.12], [8.93, 0.06]];
const FUNDAMENTAL = 880;
const RING_SECONDS = 1.4;

let context = null;
let lastPlayedAt = 0;
let listening = false;

const audioContext = () => {
  if (context) return context;
  const Context = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
  if (!Context) return null;
  try { context = new Context(); } catch { context = null; }
  return context;
};

const unlock = () => {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
};

/** Call once at startup: the first interaction with the page lets later notifications make sound. */
export const armNotificationSound = () => {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  const events = ['pointerdown', 'keydown', 'touchstart'];
  const onGesture = () => {
    unlock();
    events.forEach((name) => document.removeEventListener(name, onGesture, true));
  };
  events.forEach((name) => document.addEventListener(name, onGesture, true));
};

/** Rings the bell once. Returns true when a sound was started. */
export const playNotificationSound = () => {
  const now = Date.now();
  if (now - lastPlayedAt < MIN_GAP_MS) return false;
  const ctx = audioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (ctx.state !== 'running') return false; // not unlocked yet: no interaction so far
  lastPlayedAt = now;
  try {
    const start = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
    PARTIALS.forEach(([ratio, level]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = FUNDAMENTAL * ratio;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(level, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + RING_SECONDS / Math.sqrt(ratio));
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + RING_SECONDS + 0.05);
    });
    return true;
  } catch {
    return false;
  }
};
