/**
 * Procedural audio engine — all sounds synthesised with the Web Audio API.
 * No external files required.
 */

// ── Setup ────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;
let _masterGain: GainNode | null = null;
let _musicGain: GainNode | null = null;
let _sfxGain: GainNode | null = null;

function getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext();
    _masterGain = _ctx.createGain();
    _masterGain.gain.value = 0.85;
    _masterGain.connect(_ctx.destination);

    _musicGain = _ctx.createGain();
    _musicGain.gain.value = 0.38;
    _musicGain.connect(_masterGain);

    _sfxGain = _ctx.createGain();
    _sfxGain.gain.value = 1.0;
    _sfxGain.connect(_masterGain);
  }
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

function getMusicDest(): AudioNode {
  getCtx();
  return _musicGain!;
}

function getSfxDest(): AudioNode {
  getCtx();
  return _sfxGain!;
}

// ── Note table ───────────────────────────────────────────────────
const NOTE: Record<string, number> = {
  _: 0,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  Gb3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  Gb4: 370.00, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46,
  G5: 783.99, Ab5: 830.61, A5: 880.00,
};

// ── Sequencer ────────────────────────────────────────────────────
interface Sequence {
  bpm: number;
  melody: string[];
  bass: string[];
  arp?: string[];
}

const SEQUENCES: Record<string, Sequence> = {
  title: {
    bpm: 120,
    melody: ['E5','_','E5','_','E5','_','C5','E5','G5','_','_','_','G4','_','_','_',
             'C5','_','G4','_','E4','_','_','_','A4','_','B4','Bb4','A4','_','_','_'],
    bass:   ['C3','_','G3','_','C3','_','G3','_','A3','_','E3','_','F3','_','C3','_',
             'F3','_','C3','_','G3','_','E3','_','F3','_','C3','_','G3','_','G3','_'],
  },
  field: {
    bpm: 168,
    melody: ['C5','_','E5','_','G5','_','E5','_','A5','_','G5','_','E5','C5','_','_',
             'F5','_','E5','_','D5','_','E5','_','C5','_','G4','_','A4','_','_','_'],
    bass:   ['C3','_','G3','_','C3','_','G3','_','F3','_','C3','_','G3','_','E3','_',
             'F3','_','C3','_','G3','_','E3','_','F3','_','G3','_','C3','_','G3','_'],
    arp:    ['C4','E4','G4','C5','A3','C4','E4','A4','F3','A3','C4','F4','G3','B3','D4','G4'],
  },
  forest: {
    bpm: 108,
    melody: ['A4','_','_','C5','E5','_','D5','C5','B4','_','G4','_','A4','_','_','_',
             'F4','_','A4','C5','E5','_','D5','C5','B4','_','G4','A4','_','_','_','_'],
    bass:   ['A3','_','A3','_','F3','_','F3','_','E3','_','E3','_','A3','_','_','_',
             'F3','_','F3','_','C3','_','C3','_','E3','_','E3','_','A3','_','_','_'],
  },
  desert: {
    bpm: 152,
    melody: ['D5','_','F5','_','Eb5','D5','_','A4','Bb4','_','A4','_','F4','_','D4','_',
             'D5','_','C5','Bb4','A4','_','Bb4','_','A4','_','F4','_','D4','_','_','_'],
    bass:   ['D3','_','D3','_','Bb3','_','A3','_','D3','_','D3','_','A3','_','A3','_',
             'D3','_','Bb3','_','A3','_','A3','_','D3','_','D3','_','A3','_','A3','_'],
    arp:    ['D4','F4','A4','D5','D4','F4','Bb4','D5','D4','F4','A4','D5','D4','A3','F3','D3'],
  },
};

let _schedulerTimer: ReturnType<typeof setInterval> | null = null;
let _beatStep = 0;
let _nextBeatTime = 0;
let _activeArea: string | null = null;

const LOOK_AHEAD = 0.18; // seconds
const TICK_MS    = 55;

function schedNote(
  freq: number, startTime: number, duration: number,
  type: OscillatorType, vol: number, dest: AudioNode,
  pitchEnd?: number,
) {
  if (freq === 0) return;
  const ctx = getCtx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (pitchEnd !== undefined) osc.frequency.linearRampToValueAtTime(pitchEnd, startTime + duration);
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.012);
  gain.gain.setValueAtTime(vol * 0.85, startTime + duration * 0.6);
  gain.gain.linearRampToValueAtTime(0.001, startTime + duration * 0.98);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

function schedulerTick() {
  if (!_activeArea) return;
  const ctx = getCtx();
  const seq = SEQUENCES[_activeArea];
  if (!seq) return;
  const stepsPerBeat = 4;
  const stepDur = (60 / seq.bpm) / stepsPerBeat;
  const dest = getMusicDest();

  while (_nextBeatTime < ctx.currentTime + LOOK_AHEAD) {
    const step = _beatStep % seq.melody.length;

    // Melody (square wave)
    const mFreq = NOTE[seq.melody[step]] ?? 0;
    schedNote(mFreq, _nextBeatTime, stepDur * 0.88, 'square', 0.18, dest);

    // Bass (sawtooth, every 2 steps)
    if (step % 2 === 0) {
      const bFreq = NOTE[seq.bass[step]] ?? 0;
      schedNote(bFreq, _nextBeatTime, stepDur * 1.9, 'sawtooth', 0.12, dest);
    }

    // Arpeggio (triangle)
    if (seq.arp) {
      const aStep = _beatStep % seq.arp.length;
      const aFreq = NOTE[seq.arp[aStep]] ?? 0;
      schedNote(aFreq, _nextBeatTime, stepDur * 0.6, 'triangle', 0.09, dest);
    }

    _nextBeatTime += stepDur;
    _beatStep++;
  }
}

function stopScheduler() {
  if (_schedulerTimer !== null) {
    clearInterval(_schedulerTimer);
    _schedulerTimer = null;
  }
}

// ── Public music API ─────────────────────────────────────────────
export function playMusic(area: string) {
  if (_activeArea === area) return;
  stopScheduler();
  _activeArea = area;
  _beatStep = 0;
  _nextBeatTime = getCtx().currentTime + 0.05;
  _schedulerTimer = setInterval(schedulerTick, TICK_MS);
  schedulerTick();

  // Fade music gain in
  const g = _musicGain!;
  g.gain.cancelScheduledValues(getCtx().currentTime);
  g.gain.setValueAtTime(0, getCtx().currentTime);
  g.gain.linearRampToValueAtTime(0.38, getCtx().currentTime + 0.8);
}

export function stopMusic() {
  stopScheduler();
  _activeArea = null;
  if (_musicGain) {
    const ctx = getCtx();
    _musicGain.gain.cancelScheduledValues(ctx.currentTime);
    _musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  }
}

// ── Sound effects ────────────────────────────────────────────────

/** Short noise burst for sword swing */
export function sfxSword() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  const dur  = 0.18;

  // Noise
  const buf  = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.setValueAtTime(900, now);
  bpf.frequency.linearRampToValueAtTime(300, now + dur);
  bpf.Q.value = 2.5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.55, now);
  gain.gain.linearRampToValueAtTime(0, now + dur);
  src.connect(bpf); bpf.connect(gain); gain.connect(dest);
  src.start(now); src.stop(now + dur);

  // Pitch sweep overlay
  schedNote(320, now, 0.14, 'square', 0.08, dest, 140);
}

/** Zip of arrow */
export function sfxArrow() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  schedNote(2200, now, 0.12, 'sine', 0.22, dest, 700);
  schedNote(1100, now + 0.04, 0.08, 'sine', 0.1, dest, 400);
}

/** Bomb place thud */
export function sfxBomb() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  schedNote(120, now, 0.12, 'sine', 0.6, dest, 55);
  // Fuse sparkle
  const sparkBuf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
  const d = sparkBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = sparkBuf;
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = 4000;
  const g = ctx.createGain(); g.gain.value = 0.15;
  src.connect(hpf); hpf.connect(g); g.connect(dest);
  src.start(now); src.stop(now + 0.06);
}

/** Boom when bomb explodes */
export function sfxExplosion() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  const dur  = 0.55;

  const buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 400;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(lpf); lpf.connect(gain); gain.connect(dest);
  src.start(now); src.stop(now + dur);
  // Sub thump
  schedNote(70, now, 0.3, 'sine', 0.9, dest, 30);
  schedNote(140, now, 0.15, 'sine', 0.5, dest, 55);
}

/** Boomerang throw — spinning wobble */
export function sfxBoomerang() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  schedNote(380, now, 0.35, 'sawtooth', 0.14, dest, 520);
  schedNote(190, now, 0.35, 'square',   0.07, dest, 260);
}

/** Enemy takes a hit */
export function sfxHit() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  schedNote(520, now, 0.07, 'square', 0.28, dest, 180);
  // Crunch noise
  const buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.07), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 1800; bpf.Q.value = 1.5;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.35, now); g.gain.linearRampToValueAtTime(0, now + 0.07);
  src.connect(bpf); bpf.connect(g); g.connect(dest);
  src.start(now); src.stop(now + 0.08);
}

/** Enemy dies — descending 4-tone arpeggio */
export function sfxDeath() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  const freqs = [440, 330, 220, 110];
  freqs.forEach((f, i) => {
    schedNote(f, now + i * 0.065, 0.09, 'square', 0.22, dest);
  });
}

/** Player takes damage */
export function sfxPlayerHurt() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  schedNote(110, now, 0.28, 'sawtooth', 0.45, dest, 80);
  schedNote(150, now, 0.28, 'sawtooth', 0.25, dest, 100);
  // Flash noise
  const buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.22, now); g.gain.linearRampToValueAtTime(0, now + 0.12);
  src.connect(g); g.connect(dest);
  src.start(now); src.stop(now + 0.12);
}

/** Rupee / pickup sparkle */
export function sfxPickup() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  schedNote(NOTE.E5, now,        0.11, 'sine', 0.35, dest);
  schedNote(NOTE.G5, now + 0.09, 0.11, 'sine', 0.35, dest);
  schedNote(NOTE.C5, now + 0.05, 0.22, 'triangle', 0.12, dest);
}

/** Portal travel — rising sweep */
export function sfxPortal() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  schedNote(200, now, 0.45, 'sine',     0.38, dest, 900);
  schedNote(100, now, 0.45, 'triangle', 0.18, dest, 450);
  // Shimmer
  const shimmerFreqs = [600, 800, 1000, 1200];
  shimmerFreqs.forEach((f, i) => {
    schedNote(f, now + i * 0.08, 0.12, 'sine', 0.1, dest);
  });
}

/** Chest opening fanfare */
export function sfxChestOpen() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  const melody = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C5 * 2];
  melody.forEach((f, i) => {
    schedNote(f, now + i * 0.12, 0.18, 'square',   0.28, dest);
    schedNote(f * 0.5, now + i * 0.12, 0.18, 'triangle', 0.14, dest);
  });
  // Final sustain
  schedNote(NOTE.C5 * 2, now + melody.length * 0.12, 0.6, 'sine', 0.22, dest);
}

/** Title screen ready ding */
export function sfxTitleReady() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  schedNote(NOTE.G4, now,        0.18, 'square', 0.2, dest);
  schedNote(NOTE.B4, now + 0.15, 0.18, 'square', 0.2, dest);
  schedNote(NOTE.D5, now + 0.30, 0.18, 'square', 0.2, dest);
  schedNote(NOTE.G5, now + 0.45, 0.35, 'square', 0.25, dest);
}

/** Victory fanfare */
export function sfxVictory() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  const notes = [
    NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5,
    NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C5 * 2,
  ];
  notes.forEach((f, i) => {
    schedNote(f, now + i * 0.1, 0.14, 'square',   0.28, dest);
    schedNote(f / 2, now + i * 0.1, 0.14, 'triangle', 0.14, dest);
  });
  schedNote(NOTE.C5 * 2, now + notes.length * 0.1, 0.8, 'sine', 0.3, dest);
}

/** Game over drone */
export function sfxGameOver() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  const now  = ctx.currentTime;
  const notes = [NOTE.G4, NOTE.F4, NOTE.E4, NOTE.Eb4, NOTE.D4, NOTE.C4];
  notes.forEach((f, i) => {
    schedNote(f, now + i * 0.15, 0.2, 'square',   0.22, dest);
    schedNote(f / 2, now + i * 0.15, 0.2, 'triangle', 0.1, dest);
  });
}
