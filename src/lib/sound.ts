const SOUND_KEY = 'mc:soundEnabled';
let audioCtx: AudioContext | null = null;
let armed = false;
let lastPlay = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SOUND_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
  } catch {}
}

export function armSoundEngine() {
  if (typeof window === 'undefined') return;
  if (armed) return;
  armed = true;
  const ctx = getAudioContext();
  if (!ctx) return;
  const tryResume = () => { ctx.resume?.(); };
  window.addEventListener('click', tryResume, { once: true, passive: true });
  window.addEventListener('touchstart', tryResume, { once: true, passive: true });
}

export async function playDing() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const nowMs = Date.now();
  if (nowMs - lastPlay < 1000) {
    // Throttle duplicate calls across components within 1s window
    return;
  }
  lastPlay = nowMs;
  try { await ctx.resume?.(); } catch {}
  const now = ctx.currentTime;

  // Dynamic compressor to increase perceived loudness without clipping
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.setValueAtTime(-20, now);
  comp.knee.setValueAtTime(30, now);
  comp.ratio.setValueAtTime(12, now);
  comp.attack.setValueAtTime(0.002, now);
  comp.release.setValueAtTime(0.2, now);

  // Master gain kept high for a strong signal; compressor protects from clipping
  const master = ctx.createGain();
  master.gain.setValueAtTime(1.0, now);
  comp.connect(master);
  master.connect(ctx.destination);

  // Two quick tones (ascending), similar to popular messengers but not identical
  // Tone A
  const oscA = ctx.createOscillator();
  const gA = ctx.createGain();
  oscA.type = 'sine';
  oscA.frequency.setValueAtTime(880, now);
  oscA.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
  gA.gain.setValueAtTime(0.0001, now);
  gA.gain.exponentialRampToValueAtTime(0.9, now + 0.02);
  gA.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  oscA.connect(gA);
  gA.connect(comp);
  oscA.start(now);
  oscA.stop(now + 0.2);

  // Tone B (slightly later and higher)
  const tB = now + 0.1;
  const oscB = ctx.createOscillator();
  const gB = ctx.createGain();
  oscB.type = 'sine';
  oscB.frequency.setValueAtTime(1200, tB);
  oscB.frequency.exponentialRampToValueAtTime(1600, tB + 0.12);
  gB.gain.setValueAtTime(0.0001, tB);
  gB.gain.exponentialRampToValueAtTime(0.9, tB + 0.02);
  gB.gain.exponentialRampToValueAtTime(0.0001, tB + 0.18);
  oscB.connect(gB);
  gB.connect(comp);
  oscB.start(tB);
  oscB.stop(tB + 0.2);
}
