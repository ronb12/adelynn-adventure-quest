/**
 * Procedural audio engine — all sounds synthesised with the Web Audio API.
 * No external files required.
 */

// ── Setup ────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;
let _masterGain: GainNode | null = null;
let _musicGain: GainNode | null = null;
let _sfxGain: GainNode | null = null;
let _gestured = false;
let _pendingArea: string | null = null;

function _createCtx() {
  if (_ctx) return;
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

function _onFirstGesture() {
  if (_gestured) return;
  _gestured = true;
  document.removeEventListener('pointerdown', _onFirstGesture, true);
  document.removeEventListener('keydown', _onFirstGesture, true);
  _createCtx();
  if (_ctx!.state === 'suspended') void _ctx!.resume();
  // Play any music that was requested before the gesture
  if (_pendingArea) {
    const area = _pendingArea;
    _pendingArea = null;
    playMusic(area);
  }
}
document.addEventListener('pointerdown', _onFirstGesture, true);
document.addEventListener('keydown', _onFirstGesture, true);

function getCtx(): AudioContext | null {
  if (!_gestured || !_ctx) return null;
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

function getMusicDest(): AudioNode | null {
  return _gestured ? _musicGain : null;
}

function getSfxDest(): AudioNode | null {
  return _gestured ? _sfxGain : null;
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
    bpm: 96,
    melody: ['C5','_','E5','_','G5','_','E5','_','A5','_','G5','_','E5','C5','_','_',
             'F5','_','E5','_','D5','_','E5','_','C5','_','G4','_','A4','_','_','_'],
    bass:   ['C3','_','G3','_','C3','_','G3','_','F3','_','C3','_','G3','_','E3','_',
             'F3','_','C3','_','G3','_','E3','_','F3','_','G3','_','C3','_','G3','_'],
    arp:    ['C4','E4','G4','C5','A3','C4','E4','A4','F3','A3','C4','F4','G3','B3','D4','G4'],
  },
  forest: {
    bpm: 72,
    melody: ['A4','_','_','C5','E5','_','D5','C5','B4','_','G4','_','A4','_','_','_',
             'F4','_','A4','C5','E5','_','D5','C5','B4','_','G4','A4','_','_','_','_'],
    bass:   ['A3','_','A3','_','F3','_','F3','_','E3','_','E3','_','A3','_','_','_',
             'F3','_','F3','_','C3','_','C3','_','E3','_','E3','_','A3','_','_','_'],
  },
  desert: {
    bpm: 104,
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
  type: OscillatorType, vol: number, dest: AudioNode | null,
  pitchEnd?: number,
) {
  if (freq === 0 || !dest) return;
  const ctx = getCtx();
  if (!ctx) return;
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
  if (!ctx) return;
  const seq = SEQUENCES[_activeArea];
  if (!seq) return;
  const stepsPerBeat = 4;
  const stepDur = (60 / seq.bpm) / stepsPerBeat;
  const dest = getMusicDest();
  if (!dest) return;

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
  // Defer until user has interacted
  if (!_gestured) {
    _pendingArea = area;
    return;
  }
  const ctx = getCtx();
  if (!ctx) return;
  stopScheduler();
  _activeArea = area;
  _beatStep = 0;
  _nextBeatTime = ctx.currentTime + 0.05;
  _schedulerTimer = setInterval(schedulerTick, TICK_MS);
  schedulerTick();

  // Fade music gain in
  const g = _musicGain!;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 0.8);
}

export function stopMusic() {
  stopScheduler();
  _activeArea = null;
  _pendingArea = null;
  const ctx = getCtx();
  if (ctx && _musicGain) {
    _musicGain.gain.cancelScheduledValues(ctx.currentTime);
    _musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  }
}

// ── Sound effects ────────────────────────────────────────────────

/** Short noise burst for sword swing */
export function sfxSword() {
  const ctx  = getCtx();
  const dest = getSfxDest();
  if (!ctx || !dest) return;
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
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(2200, now, 0.12, 'sine', 0.22, dest, 700);
  schedNote(1100, now + 0.04, 0.08, 'sine', 0.1, dest, 400);
}

/** Bomb place thud */
export function sfxBomb() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(120, now, 0.12, 'sine', 0.6, dest, 55);
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
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
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
  schedNote(70, now, 0.3, 'sine', 0.9, dest, 30);
  schedNote(140, now, 0.15, 'sine', 0.5, dest, 55);
}

/** Boomerang throw — spinning wobble */
export function sfxBoomerang() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(380, now, 0.35, 'sawtooth', 0.14, dest, 520);
  schedNote(190, now, 0.35, 'square',   0.07, dest, 260);
}

/** Enemy takes a hit */
export function sfxHit() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(520, now, 0.07, 'square', 0.28, dest, 180);
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
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  const freqs = [440, 330, 220, 110];
  freqs.forEach((f, i) => schedNote(f, now + i * 0.065, 0.09, 'square', 0.22, dest));
}

/** Player takes damage */
export function sfxPlayerHurt() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(110, now, 0.28, 'sawtooth', 0.45, dest, 80);
  schedNote(150, now, 0.28, 'sawtooth', 0.25, dest, 100);
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
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(NOTE.E5, now,        0.11, 'sine', 0.35, dest);
  schedNote(NOTE.G5, now + 0.09, 0.11, 'sine', 0.35, dest);
  schedNote(NOTE.C5, now + 0.05, 0.22, 'triangle', 0.12, dest);
}

/** Portal travel — rising sweep */
export function sfxPortal() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(200, now, 0.45, 'sine',     0.38, dest, 900);
  schedNote(100, now, 0.45, 'triangle', 0.18, dest, 450);
  [600, 800, 1000, 1200].forEach((f, i) =>
    schedNote(f, now + i * 0.08, 0.12, 'sine', 0.1, dest));
}

/** Chest opening fanfare */
export function sfxChestOpen() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  const melody = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C5 * 2];
  melody.forEach((f, i) => {
    schedNote(f, now + i * 0.12, 0.18, 'square',   0.28, dest);
    schedNote(f * 0.5, now + i * 0.12, 0.18, 'triangle', 0.14, dest);
  });
  schedNote(NOTE.C5 * 2, now + melody.length * 0.12, 0.6, 'sine', 0.22, dest);
}

/** Title screen ready ding */
export function sfxTitleReady() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(NOTE.G4, now,        0.18, 'square', 0.2, dest);
  schedNote(NOTE.B4, now + 0.15, 0.18, 'square', 0.2, dest);
  schedNote(NOTE.D5, now + 0.30, 0.18, 'square', 0.2, dest);
  schedNote(NOTE.G5, now + 0.45, 0.35, 'square', 0.25, dest);
}

/** Victory fanfare */
export function sfxVictory() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
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
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  const notes = [NOTE.G4, NOTE.F4, NOTE.E4, NOTE.Eb4, NOTE.D4, NOTE.C4];
  notes.forEach((f, i) => {
    schedNote(f, now + i * 0.15, 0.2, 'square',   0.22, dest);
    schedNote(f / 2, now + i * 0.15, 0.2, 'triangle', 0.1, dest);
  });
}

/** Jump boing */
export function sfxJump() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(NOTE.C4, now,        0.06, 'sine', 0.28, dest, NOTE.G4);
  schedNote(NOTE.G4, now + 0.05, 0.08, 'sine', 0.22, dest, NOTE.C5);
  schedNote(NOTE.C5, now + 0.10, 0.12, 'sine', 0.18, dest, NOTE.G5);
}

/** Lore stone read — mystical chime */
export function sfxLoreRead() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  const melody = [NOTE.E5, NOTE.G5, NOTE.B5, NOTE.E5 * 2];
  melody.forEach((f, i) => {
    schedNote(f,       now + i * 0.14, 0.22, 'sine',     0.22, dest);
    schedNote(f * 0.5, now + i * 0.14, 0.22, 'triangle', 0.10, dest);
  });
  schedNote(NOTE.B5, now + melody.length * 0.14, 0.5, 'sine', 0.16, dest);
}

/** Status effect applied (burn / poison / freeze) */
export function sfxStatusEffect() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(880, now,        0.06, 'sawtooth', 0.18, dest, 440);
  schedNote(440, now + 0.05, 0.10, 'sawtooth', 0.12, dest, 220);
  schedNote(220, now + 0.12, 0.14, 'sine',     0.10, dest, 110);
}

/** Quest completed — short triumphant ding */
export function sfxQuestComplete() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  const notes = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C5 * 2];
  notes.forEach((f, i) => {
    schedNote(f,       now + i * 0.09, 0.15, 'square',   0.25, dest);
    schedNote(f * 0.5, now + i * 0.09, 0.15, 'triangle', 0.12, dest);
  });
  schedNote(NOTE.C5 * 2, now + notes.length * 0.09, 0.5, 'sine', 0.28, dest);
}

/** Combo milestone — ascending whoosh at ×5 */
export function sfxCombo() {
  const ctx  = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now  = ctx.currentTime;
  schedNote(NOTE.C4, now,        0.06, 'square', 0.20, dest, NOTE.C5);
  schedNote(NOTE.E4, now + 0.06, 0.06, 'square', 0.20, dest, NOTE.E5);
  schedNote(NOTE.G4, now + 0.12, 0.06, 'square', 0.20, dest, NOTE.G5);
  schedNote(NOTE.C5, now + 0.18, 0.18, 'square', 0.26, dest, NOTE.C5 * 2);
}

export function sfxDodge() {
  const ctx = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(dest);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.13);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
  osc.start(now); osc.stop(now + 0.13);
}

export function sfxGroundSlam() {
  const ctx = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now = ctx.currentTime;
  // Deep rumble
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(dest);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.38);
  gain.gain.setValueAtTime(0.55, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
  osc.start(now); osc.stop(now + 0.38);
  // High crack
  const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain();
  osc2.connect(gain2); gain2.connect(dest);
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(900, now);
  osc2.frequency.exponentialRampToValueAtTime(200, now + 0.06);
  gain2.gain.setValueAtTime(0.25, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc2.start(now); osc2.stop(now + 0.08);
}

export function sfxParry() {
  const ctx = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now = ctx.currentTime;
  // Metallic clang
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.14), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.035));
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 1800;
  const gain = ctx.createGain();
  src.connect(filter); filter.connect(gain); gain.connect(dest);
  gain.gain.setValueAtTime(0.45, now);
  src.start(now);
  // Resonant ping
  schedNote(NOTE.A4 * 2, now, 0.22, 'sine', 0.22, dest, NOTE.A4 * 2);
}

export function sfxShieldBash() {
  const ctx = getCtx(); const dest = getSfxDest();
  if (!ctx || !dest) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(dest);
  osc.type = 'square';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.start(now); osc.stop(now + 0.18);
  schedNote(NOTE.E3 ?? 164.8, now + 0.04, 0.12, 'triangle', 0.18, dest, NOTE.E3 ?? 164.8);
}
