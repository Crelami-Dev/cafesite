"use client";

/**
 * Mesin Audio & Haptik Khas CafeSite ("Artisan Cafe Counter Bell & Warm Chime").
 *
 * Meracik motif nada khas CafeSite dalam harmoni Dmin9 / Fmaj9:
 * - Frasa pembuka hangat bernuansa kayu/marimba untuk menarik perhatian tanpa kaget
 * - Disusul double-tap denting bel kuningan meja barista (rasio inharmonik 2.756x)
 * - Dilengkapi warm filtered room delay (190ms) dan DynamicsCompressor agar jernih
 *   di speaker HP maupun desktop, serta pola getar panjang berirama.
 */

export const CAFESITE_VIBRATION_PATTERN = [
  450, 140, 450, 140, 750, 220, 450, 140, 850,
];

interface BellNote {
  delay: number;
  freq: number;
  duration: number;
  gain: number;
  bellStrike?: boolean;
  warmBody?: boolean;
}

const SIGNATURE_MOTIF: BellNote[] = [
  // Frasa 1: Panggilan hangat marimba/chime ("Ca-fe-Si-te")
  { delay: 0.0, freq: 440.0, duration: 0.48, gain: 0.2, warmBody: true }, // A4
  { delay: 0.13, freq: 659.25, duration: 0.55, gain: 0.22 }, // E5
  { delay: 0.26, freq: 880.0, duration: 0.65, gain: 0.24 }, // A5
  { delay: 0.4, freq: 1174.66, duration: 0.9, gain: 0.22, bellStrike: true }, // D6

  // Frasa 2: Double-tap denting bel kuningan barista + akor Fmaj9 hangat
  { delay: 0.86, freq: 1318.51, duration: 0.45, gain: 0.26, bellStrike: true }, // E6 (Tap 1)
  { delay: 1.03, freq: 1567.98, duration: 1.45, gain: 0.3, bellStrike: true }, // G6 (Tap 2 Shimmer)
  { delay: 1.03, freq: 698.46, duration: 1.25, gain: 0.2 }, // F5 (Harmony)
  { delay: 1.03, freq: 523.25, duration: 1.2, gain: 0.16, warmBody: true }, // C5 (Warm Mid)
  { delay: 1.03, freq: 349.23, duration: 1.15, gain: 0.14, warmBody: true }, // F4 (Body Bass)
];

function triggerBellNote(
  ctx: BaseAudioContext,
  destination: AudioNode,
  now: number,
  note: BellNote,
): void {
  const start = now + note.delay;
  const stop = start + note.duration;

  // 1. Fundamental tone (bulat & hangat)
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = note.warmBody ? "triangle" : "sine";
  osc.frequency.setValueAtTime(note.freq, start);

  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(note.gain, start + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, stop);

  osc.connect(env);
  env.connect(destination);
  osc.start(start);
  osc.stop(stop + 0.06);

  // 2. Harmonik oktaf ke-2 (kilau instrumen kuningan)
  if (!note.warmBody) {
    const overtone = ctx.createOscillator();
    const overEnv = ctx.createGain();
    overtone.type = "sine";
    overtone.frequency.setValueAtTime(note.freq * 2, start);

    overEnv.gain.setValueAtTime(0.0001, start);
    overEnv.gain.linearRampToValueAtTime(note.gain * 0.24, start + 0.008);
    overEnv.gain.exponentialRampToValueAtTime(
      0.0001,
      start + note.duration * 0.5,
    );

    overtone.connect(overEnv);
    overEnv.connect(destination);
    overtone.start(start);
    overtone.stop(start + note.duration * 0.55);
  }

  // 3. Transient inharmonik bel meja kasir (rasio akustik 2.756x)
  if (note.bellStrike) {
    const strike = ctx.createOscillator();
    const strikeEnv = ctx.createGain();
    strike.type = "sine";
    strike.frequency.setValueAtTime(note.freq * 2.756, start);

    strikeEnv.gain.setValueAtTime(0.0001, start);
    strikeEnv.gain.linearRampToValueAtTime(note.gain * 0.16, start + 0.004);
    strikeEnv.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

    strike.connect(strikeEnv);
    strikeEnv.connect(destination);
    strike.start(start);
    strike.stop(start + 0.22);
  }
}

/**
 * Merender graph audio bel khas CafeSite ke `BaseAudioContext` (AudioContext maupun OfflineAudioContext).
 */
export function scheduleCafeSiteBell(ctx: BaseAudioContext): boolean {
  try {
    const now = ctx.currentTime + 0.02;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.knee.setValueAtTime(16, now);
    compressor.ratio.setValueAtTime(6, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.2, now);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.82, now);

    // Warm Cafe Room Delay (Echo halus 190ms tersaring lembut)
    const delay = ctx.createDelay(1.0);
    delay.delayTime.setValueAtTime(0.19, now);

    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = "lowpass";
    delayFilter.frequency.setValueAtTime(2100, now);

    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.24, now);

    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.28, now);

    delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(delay);
    delayFilter.connect(wetGain);

    masterGain.connect(compressor);
    masterGain.connect(delay);
    wetGain.connect(compressor);
    compressor.connect(ctx.destination);

    for (const note of SIGNATURE_MOTIF) {
      triggerBellNote(ctx, masterGain, now, note);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Memicu bunyi alarm khas CafeSite lengkap dengan kompresor, EQ hangat,
 * delay ruang kafe, dan pola getar panjang.
 */
export function playCafeSiteAlarm(
  ctx: AudioContext | null,
  withVibration = true,
): boolean {
  if (
    withVibration &&
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    try {
      navigator.vibrate(CAFESITE_VIBRATION_PATTERN);
    } catch {
      /* Abaikan bila perangkat tidak mendukung vibrate */
    }
  }

  if (!ctx || ctx.state !== "running") return false;
  return scheduleCafeSiteBell(ctx);
}

export function stopCafeSiteVibration(): void {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    try {
      navigator.vibrate(0);
    } catch {
      /* Abaikan */
    }
  }
}
