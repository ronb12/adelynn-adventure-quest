import { useEffect, useRef, useState } from 'react';
import { useGameStore } from './store';
import { Button } from '@/components/ui/button';
import { getSaveMeta, formatSaveTime, AREA_DISPLAY, deleteSave } from './saveManager';
import {
  getLeaderboard, addLeaderboardEntry, formatLeaderboardTime,
  type LeaderboardEntry,
} from './leaderboardManager';

const STORY = {
  title: "Adelynn's Adventure Quest",
  subtitle: 'The Shattered Crown',
  lore: 'Malgrath shattered the Crown of Radiance into three Crystal Shards. Adelynn must recover them all and restore the kingdom of Aldenmere!',
  shards: [
    { area: 'field',  name: 'Shard of Dawn',  place: 'Sunfield Plains' },
    { area: 'forest', name: 'Shard of Dusk',   place: 'Whisper Woods'  },
    { area: 'desert', name: 'Shard of Ember',  place: 'Ashrock Summit' },
  ],
};

const ARMOR_LABELS = ['No Armor', 'Blue Tunic', 'Red Tunic'];
const AREA_NAMES: Record<string, string> = {
  field: 'Sunfield Plains', forest: 'Whisper Woods',
  desert: 'Ashrock Summit', boss: 'Malgrath\'s Lair',
};

const ALL_AREA_META: { id: string; name: string; icon: string }[] = [
  { id: 'field',   name: 'Sunfield Plains',   icon: '🌾' },
  { id: 'forest',  name: 'Whisper Woods',     icon: '🌲' },
  { id: 'desert',  name: 'Ashrock Summit',    icon: '🏔' },
  { id: 'jungle',  name: 'Thornwick Jungle',  icon: '🌿' },
  { id: 'ice',     name: "Glacira's Domain",  icon: '❄' },
  { id: 'volcano', name: 'Embris Depths',     icon: '🔥' },
  { id: 'sky',     name: 'Sky Sanctum',       icon: '☁' },
  { id: 'crypt',   name: "Warrior's Crypt",   icon: '💀' },
  { id: 'void',    name: 'The Shattered Void',icon: '🌀' },
  { id: 'cave',    name: "Adelynn's Cave",    icon: '💎' },
  { id: 'home',    name: 'Home Village',      icon: '🏠' },
  { id: 'boss',    name: "Malgrath's Lair",   icon: '👁' },
];

// ── Leaderboard Table ─────────────────────────────────────────────
function LeaderboardTable({ refresh = 0 }: { refresh?: number }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard().then(data => { setEntries(data.slice(0, 10)); setLoading(false); });
  }, [refresh]);

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8 font-serif italic text-sm animate-pulse">
        Loading global scores…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 font-serif italic text-sm">
        No scores yet — complete a run to appear here!
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <p className="text-xs text-amber-600/70 text-center mb-1 font-serif">🌐 Global Leaderboard</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-amber-400/70 border-b border-amber-900/40">
            <th className="text-left py-1 pr-2">#</th>
            <th className="text-left py-1 pr-2">Name</th>
            <th className="text-right py-1 pr-2">Score</th>
            <th className="text-right py-1 pr-2">Time</th>
            <th className="text-right py-1 pr-2">💎</th>
            <th className="text-right py-1">📖</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i} className={`border-b border-white/5 ${i === 0 ? 'text-amber-300' : i < 3 ? 'text-amber-100' : 'text-gray-300'}`}>
              <td className="py-1 pr-2 font-bold">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</td>
              <td className="py-1 pr-2 font-serif max-w-[80px] truncate">{e.name}</td>
              <td className="py-1 pr-2 text-right font-mono font-bold">{e.score.toLocaleString()}</td>
              <td className="py-1 pr-2 text-right font-mono">{formatLeaderboardTime(e.timeSeconds)}</td>
              <td className="py-1 pr-2 text-right">{e.shards}/3</td>
              <td className="py-1 text-right">{e.loreRead}/9</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Score Submit Form ─────────────────────────────────────────────
function ScoreSubmitForm({
  score, runStartTime, shards, lore, area,
  accentColor = 'amber',
  onSubmitted,
}: {
  score: number; runStartTime: number; shards: number; lore: number; area: string;
  accentColor?: 'amber' | 'red';
  onSubmitted?: () => void;
}) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const timeSeconds = runStartTime > 0
    ? Math.max(1, Math.floor((Date.now() - runStartTime) / 1000))
    : 0;

  const handleSubmit = async () => {
    const trimmed = name.trim().slice(0, 20);
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await addLeaderboardEntry({ name: trimmed, score, timeSeconds, shards, loreRead: lore, area });
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setError('Could not save score — try again');
    } finally {
      setSubmitting(false);
    }
  };

  const border = accentColor === 'red' ? 'border-red-700/60' : 'border-amber-700/60';
  const bg     = accentColor === 'red' ? 'bg-red-900/20' : 'bg-amber-900/20';
  const btn    = accentColor === 'red'
    ? 'bg-red-700 hover:bg-red-600 border-red-500'
    : 'bg-amber-700 hover:bg-amber-600 border-amber-500';

  if (submitted) {
    return (
      <div className={`w-full rounded-xl px-4 py-3 ${bg} border ${border} text-center`}>
        <span className="text-green-400 font-bold text-sm">✓ Score saved to global leaderboard!</span>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-xl px-4 py-3 ${bg} border ${border}`}>
      <p className="text-amber-300/80 text-xs font-serif mb-2 text-center">Save your score to the global leaderboard</p>
      {error && <p className="text-red-400 text-xs mb-1 text-center">{error}</p>}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          maxLength={20}
          placeholder="Enter your name…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); handleSubmit(); } }}
          className="flex-1 bg-black/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
        />
        <Button
          size="sm"
          disabled={!name.trim() || submitting}
          className={`${btn} text-white text-xs font-serif border cursor-pointer disabled:opacity-40`}
          onClick={handleSubmit}
        >
          {submitting ? '…' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// ── Pause Screen ──────────────────────────────────────────────────
export function PauseScreen() {
  const togglePause      = useGameStore(s => s.togglePause);
  const setGameState     = useGameStore(s => s.setGameState);
  const score            = useGameStore(s => s.score);
  const shards           = useGameStore(s => s.shardsCollected);
  const lore             = useGameStore(s => s.loreRead);
  const currentArea      = useGameStore(s => s.currentArea);
  const runStartTime     = useGameStore(s => s.runStartTime);
  const areasVisited     = useGameStore(s => s.areasVisited);
  const guardianDefeated = useGameStore(s => s.guardianDefeated);
  const completedQuests  = useGameStore(s => s.completedQuests);
  const totalKills       = useGameStore(s => s.totalKills);
  const elapsed = formatTime(runStartTime);

  const [showLB, setShowLB] = useState(false);
  const [showMap, setShowMap] = useState(false);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto select-none overflow-y-auto"
      style={{ backdropFilter: 'blur(5px)', background: 'rgba(4,2,16,0.72)' }}
    >
      <div className="bg-[#0d0820] border-2 border-purple-700/60 rounded-2xl px-6 py-6 flex flex-col items-center gap-3 w-full max-w-md shadow-2xl my-4 mx-4">

        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px #c084fc)' }}>⏸</span>
          <h2 className="text-3xl font-bold font-serif tracking-widest text-amber-300">Paused</h2>
        </div>

        {/* Run stats */}
        <div className="flex gap-2 w-full justify-center flex-wrap">
          {[
            { label: 'Score',  value: score.toLocaleString(),  color: 'text-amber-400' },
            { label: 'Time',   value: elapsed,                  color: 'text-white' },
            { label: 'Shards', value: `${shards}/3`,            color: 'text-blue-300' },
            { label: 'Lore',   value: `${lore.length}/27`,      color: 'text-purple-300' },
            { label: 'Kills',  value: String(totalKills),       color: 'text-red-300' },
            { label: 'Quests', value: `${completedQuests.length}/10`, color: 'text-green-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center bg-black/40 rounded-xl px-3 py-2 border border-purple-900/40">
              <span className={`${color} font-bold text-sm font-mono`}>{value}</span>
              <span className="text-gray-500 text-xs mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Area */}
        <p className="text-xs text-gray-400 font-serif -mt-1">
          📍 {AREA_NAMES[currentArea] ?? currentArea}
        </p>

        {/* Controls cheatsheet */}
        <div className="w-full bg-black/30 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-400 font-mono">
          <span><span className="text-amber-400">WASD</span> — Move</span>
          <span><span className="text-amber-400">Shift</span> — Run</span>
          <span><span className="text-amber-400">Space</span> — Attack</span>
          <span><span className="text-amber-400">E</span> — Interact</span>
          <span><span className="text-amber-400">V</span> — Jump</span>
          <span><span className="text-amber-400">R</span> — Dodge roll</span>
          <span><span className="text-amber-400">Q</span> — Cycle weapon</span>
          <span><span className="text-amber-400">Z</span> — Cycle sword</span>
          <span><span className="text-amber-400">F</span> — Shield block</span>
          <span><span className="text-amber-400">F (on press)</span> — Parry</span>
          <span><span className="text-amber-400">F+Space</span> — Shield bash</span>
          <span><span className="text-amber-400">V+Space</span> — Ground slam</span>
          <span><span className="text-amber-400">Esc</span> — Pause</span>
          <span><span className="text-amber-400">Hold+Space</span> — Spin</span>
        </div>

        {/* World Map toggle */}
        <button
          onClick={() => setShowMap(v => !v)}
          className="w-full text-xs text-purple-300/80 hover:text-purple-200 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-800/40 rounded-lg py-2 cursor-pointer transition-colors font-serif"
        >
          🗺 {showMap ? 'Hide World Map ▲' : 'Show World Map ▼'}
        </button>

        {showMap && (
          <div className="w-full bg-black/40 rounded-xl p-3 border border-purple-900/40">
            <p className="text-purple-400 text-xs font-bold mb-2 text-center">World Map — Aldenmere</p>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_AREA_META.map(area => {
                const visited = areasVisited.includes(area.id as any);
                const defeated = guardianDefeated.includes(area.id as any);
                const isCurrent = area.id === currentArea;
                return (
                  <div
                    key={area.id}
                    className="rounded-lg px-2 py-1.5 flex flex-col items-center gap-0.5"
                    style={{
                      background: visited
                        ? isCurrent ? 'rgba(120,60,220,0.4)' : 'rgba(40,20,80,0.6)'
                        : 'rgba(20,10,40,0.4)',
                      border: `1px solid ${isCurrent ? '#a855f7' : visited ? '#4c1d95' : '#1e1030'}`,
                    }}
                  >
                    <span className="text-base leading-none" style={{ filter: visited ? 'none' : 'grayscale(100%) opacity(30%)' }}>
                      {area.icon}
                    </span>
                    <span className="text-center text-white font-bold leading-tight" style={{ fontSize: '0.6rem' }}>
                      {visited ? area.name : '???'}
                    </span>
                    {visited && (
                      <div className="flex gap-1 mt-0.5">
                        {defeated && <span style={{ fontSize: '0.55rem' }} className="text-yellow-400">👑</span>}
                        {isCurrent && <span style={{ fontSize: '0.55rem' }} className="text-purple-400">📍</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-gray-600 text-xs text-center mt-2 font-mono">
              📍 current &nbsp; 👑 guardian defeated
            </p>
          </div>
        )}

        {/* Leaderboard toggle */}
        {showLB ? (
          <div className="w-full bg-black/40 rounded-xl p-3 border border-amber-900/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-400 text-xs font-bold">🏆 Top Scores</span>
              <button onClick={() => setShowLB(false)} className="text-gray-500 hover:text-gray-300 text-xs cursor-pointer">✕ Close</button>
            </div>
            <LeaderboardTable />
          </div>
        ) : (
          <button
            onClick={() => setShowLB(true)}
            className="text-xs text-amber-400/70 hover:text-amber-300 underline cursor-pointer transition-colors"
          >
            🏆 View Leaderboard
          </button>
        )}

        {/* Action buttons */}
        <Button
          onClick={togglePause}
          className="w-full bg-purple-700 hover:bg-purple-600 text-white font-serif border border-purple-500 cursor-pointer"
        >
          ▶ Resume <span className="text-purple-300 text-xs ml-1">(Esc)</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => setGameState('title')}
          className="w-full border-gray-600 text-gray-300 hover:border-red-600 hover:text-red-400 font-serif cursor-pointer"
        >
          ↩ Main Menu
        </Button>
      </div>
    </div>
  );
}

// ── Title Screen ─────────────────────────────────────────────────
export function TitleScreen() {
  const setGameState  = useGameStore(state => state.setGameState);
  const resetGame     = useGameStore(state => state.resetGame);
  const loadFromSave  = useGameStore(state => state.loadFromSave);
  const deleteSaveData = useGameStore(state => state.deleteSaveData);
  const [saveMeta, setSaveMeta] = useState(getSaveMeta());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tab, setTab] = useState<'main' | 'leaderboard'>('main');

  const startNewGame = () => resetGame();

  const continueGame = () => {
    loadFromSave();
  };

  const handleDeleteSave = () => {
    if (confirmDelete) {
      deleteSaveData();
      setSaveMeta(null);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (saveMeta) continueGame(); else startNewGame();
      }
      if (e.key === 'Escape') setConfirmDelete(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveMeta]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-start pt-10 pointer-events-auto select-none overflow-y-auto overflow-x-hidden"
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}title-bg.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(8,4,24,0.55) 0%, rgba(8,4,24,0.75) 60%, rgba(8,4,24,0.92) 100%)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-4 w-full max-w-lg">

        {/* Tab buttons */}
        <div className="flex gap-2 mb-1">
          <button
            onClick={() => setTab('main')}
            className={`text-xs px-4 py-1.5 rounded-full font-serif border transition-colors cursor-pointer
              ${tab === 'main' ? 'bg-amber-700 border-amber-500 text-amber-100' : 'bg-black/40 border-gray-700 text-gray-400 hover:border-amber-700 hover:text-amber-300'}`}
          >
            ⚔ Quest
          </button>
          <button
            onClick={() => setTab('leaderboard')}
            className={`text-xs px-4 py-1.5 rounded-full font-serif border transition-colors cursor-pointer
              ${tab === 'leaderboard' ? 'bg-amber-700 border-amber-500 text-amber-100' : 'bg-black/40 border-gray-700 text-gray-400 hover:border-amber-700 hover:text-amber-300'}`}
          >
            🏆 Scores
          </button>
        </div>

        {/* Leaderboard tab */}
        {tab === 'leaderboard' && (
          <div className="w-full bg-black/60 border border-amber-900/50 rounded-2xl px-5 py-4">
            <h3 className="text-amber-400 font-bold font-serif text-center mb-3">🏆 Hall of Heroes</h3>
            <LeaderboardTable />
            <Button
              size="sm"
              className="w-full mt-4 bg-amber-700 hover:bg-amber-600 text-amber-100 font-serif border border-amber-500 cursor-pointer"
              onClick={() => setTab('main')}
            >
              ↩ Back to Quest
            </Button>
          </div>
        )}

        {/* Main tab content */}
        {tab === 'main' && <div className="w-full flex flex-col items-center gap-3">

        {/* Title */}
        <div className="text-5xl mb-0" style={{ filter: 'drop-shadow(0 0 14px #f0c030)' }}>♛</div>
        <h1 className="text-3xl font-bold font-serif tracking-widest text-amber-300 drop-shadow-lg text-center leading-tight">
          {STORY.title}
        </h1>
        <h2 className="text-sm font-serif tracking-[0.3em] text-amber-500 -mt-1">
          {STORY.subtitle}
        </h2>

        {/* Lore */}
        <p className="text-amber-100/80 text-sm text-center leading-relaxed bg-black/40 rounded-xl px-5 py-3 border border-amber-900/40">
          {STORY.lore}
        </p>

        {/* Shards row */}
        <div className="flex gap-3">
          {STORY.shards.map(s => (
            <div key={s.area} className="flex flex-col items-center gap-0.5 bg-black/40 rounded-lg px-3 py-2 border border-purple-900/40">
              <span className="text-xl">💎</span>
              <span className="text-xs text-purple-300 font-bold">{s.name}</span>
              <span className="text-xs text-gray-400">{s.place}</span>
            </div>
          ))}
        </div>

        {/* Save slot — shown if save exists */}
        {saveMeta && (
          <div className="w-full bg-black/50 border border-amber-700/60 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-amber-400 text-sm">💾</span>
              <span className="text-amber-300 font-bold text-sm">Saved Game</span>
              <span className="text-amber-700 text-xs ml-auto">{formatSaveTime(saveMeta.timestamp)}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-300 mb-2">
              <span>📍 {AREA_DISPLAY[saveMeta.area] ?? saveMeta.area}</span>
              <span>💎 {saveMeta.shards}/3 shards</span>
              <span>❤️ {saveMeta.hearts}/{saveMeta.maxHearts}</span>
              {saveMeta.armorLevel > 0 && <span>🛡️ {ARMOR_LABELS[saveMeta.armorLevel]}</span>}
              {saveMeta.swordsUnlocked > 1 && <span>⚔️ {saveMeta.swordsUnlocked} swords</span>}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-amber-100 font-serif border border-amber-400 cursor-pointer text-sm"
                onClick={continueGame}
              >
                ▶ Continue Quest
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={`text-xs border cursor-pointer transition-colors
                  ${confirmDelete
                    ? 'border-red-500 bg-red-900/60 text-red-200 hover:bg-red-800'
                    : 'border-gray-600 text-gray-400 hover:border-red-600 hover:text-red-400'}`}
                onClick={handleDeleteSave}
                title="Delete save data"
              >
                {confirmDelete ? '⚠ Confirm Delete' : '🗑'}
              </Button>
            </div>
            {confirmDelete && (
              <p className="text-red-400 text-xs text-center mt-1">All progress will be lost! Click again to confirm.</p>
            )}
          </div>
        )}

        {/* New game button */}
        <Button
          size={saveMeta ? 'sm' : 'lg'}
          className={`${saveMeta
            ? 'text-sm px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300'
            : 'text-lg px-10 py-5 bg-amber-700 hover:bg-amber-600 text-amber-100 border border-amber-500'
          } font-serif tracking-wider cursor-pointer`}
          onClick={startNewGame}
        >
          {saveMeta ? '+ New Game' : '▶ Begin the Quest'}
        </Button>

        <p className="text-xs text-gray-500 font-mono">
          WASD move · Shift run · Space attack · V jump · Q weapon · E interact · {saveMeta ? 'Enter to continue' : 'Enter/Space to start'}
        </p>
        </div>}
      </div>
    </div>
  );
}

// ── Game Over Screen ─────────────────────────────────────────────
function formatTime(ms: number | null): string {
  if (!ms) return '00:00';
  const s = Math.floor((Date.now() - ms) / 1000);
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

export function GameOverScreen() {
  const resetGame    = useGameStore(state => state.resetGame);
  const loadFromSave = useGameStore(state => state.loadFromSave);
  const shardsCount  = useGameStore(state => state.shardsCollected);
  const score        = useGameStore(state => state.score);
  const runStartTime = useGameStore(state => state.runStartTime);
  const loreRead     = useGameStore(state => state.loreRead);
  const [saveMeta]   = useState(getSaveMeta());
  const elapsed = formatTime(runStartTime);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') resetGame(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #2a0808 0%, #0a0606 100%)' }}>

      <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 12px #ff2200)' }}>💀</div>

      <h1 className="text-5xl font-bold font-serif tracking-widest text-red-500 drop-shadow-lg mb-2">
        Darkness Falls
      </h1>
      <p className="text-red-300 text-base mb-3 font-serif italic">
        "Adelynn falls… but the legend lives on."
      </p>
      <p className="text-gray-400 text-sm mb-4">
        {shardsCount === 0
          ? 'Your quest ends before it began.'
          : `You claimed ${shardsCount} of 3 Crystal Shards before falling.`}
      </p>

      {/* Run stats */}
      <div className="flex gap-4 mb-5">
        <div className="flex flex-col items-center bg-black/40 rounded-xl px-5 py-2 border border-red-900/50">
          <span className="text-amber-400 font-bold text-lg">{score.toLocaleString()}</span>
          <span className="text-gray-500 text-xs mt-0.5">Score</span>
        </div>
        <div className="flex flex-col items-center bg-black/40 rounded-xl px-5 py-2 border border-red-900/50">
          <span className="text-white font-mono font-bold text-lg">{elapsed}</span>
          <span className="text-gray-500 text-xs mt-0.5">Time</span>
        </div>
        <div className="flex flex-col items-center bg-black/40 rounded-xl px-5 py-2 border border-red-900/50">
          <span className="text-purple-300 font-bold text-lg">{loreRead.length}/9</span>
          <span className="text-gray-500 text-xs mt-0.5">Lore</span>
        </div>
      </div>

      {/* Score submit */}
      <div className="w-full max-w-sm mb-3 px-4">
        <ScoreSubmitForm
          score={score}
          runStartTime={runStartTime}
          shards={shardsCount}
          lore={loreRead.length}
          area="gameover"
          accentColor="red"
        />
      </div>

      {shardsCount > 0 && (
        <div className="flex gap-3 mb-4">
          {STORY.shards.map((s, i) => (
            <div key={s.area} className={`text-2xl ${i < shardsCount ? 'opacity-100' : 'opacity-20'}`}>💎</div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 items-center">
        {/* Load save button — shown if a save exists */}
        {saveMeta && (
          <Button
            size="lg"
            className="text-base px-8 py-3 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif border border-amber-600 cursor-pointer"
            onClick={() => loadFromSave()}
          >
            💾 Load Saved Game — {AREA_DISPLAY[saveMeta.area] ?? saveMeta.area}
          </Button>
        )}
        <Button
          size="lg"
          className="text-lg px-8 py-4 bg-red-900 hover:bg-red-800 text-red-100 font-serif border border-red-700 cursor-pointer"
          onClick={() => resetGame()}
        >
          ↩ Rise Again (New Game)
        </Button>
      </div>

      <p className="mt-3 text-xs text-gray-600 font-mono">Press Enter to retry from scratch</p>
    </div>
  );
}

// ── Victory Screen ───────────────────────────────────────────────
export function VictoryScreen() {
  const resetGame  = useGameStore(state => state.resetGame);
  const rupees     = useGameStore(state => state.rupees);
  const score      = useGameStore(state => state.score);
  const runStartTime = useGameStore(state => state.runStartTime);
  const loreRead   = useGameStore(state => state.loreRead);
  const deleteSaveData = useGameStore(state => state.deleteSaveData);
  const elapsed = formatTime(runStartTime);

  useEffect(() => {
    // Clear save on true victory
    deleteSaveData();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') resetGame(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto select-none overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #201040 0%, #0c1028 100%)' }}>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(240,192,48,0.22) 0%, transparent 70%)' }} />
      </div>

      <div className="text-7xl mb-3" style={{ filter: 'drop-shadow(0 0 28px #f0c030)' }}>♛</div>

      <h1 className="text-4xl font-bold font-serif tracking-widest text-amber-300 drop-shadow-lg mb-2">
        The Crown Restored!
      </h1>
      <p className="text-amber-200/80 font-serif text-base italic mb-4 text-center max-w-sm">
        "Aldenmere shines once more!"
      </p>

      <div className="flex gap-4 mb-4">
        {STORY.shards.map(s => (
          <div key={s.area} className="flex flex-col items-center gap-1 bg-amber-900/30 rounded-xl px-4 py-2 border border-amber-500/40">
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px #a080ff)' }}>💎</span>
            <span className="text-xs text-amber-300 font-bold">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Run stats */}
      <div className="flex gap-3 mb-4">
        <div className="flex flex-col items-center bg-amber-900/25 rounded-xl px-4 py-2 border border-amber-600/40">
          <span className="text-amber-300 font-bold text-lg">{score.toLocaleString()}</span>
          <span className="text-amber-600/80 text-xs mt-0.5">Score</span>
        </div>
        <div className="flex flex-col items-center bg-amber-900/25 rounded-xl px-4 py-2 border border-amber-600/40">
          <span className="text-white font-mono font-bold text-lg">{elapsed}</span>
          <span className="text-amber-600/80 text-xs mt-0.5">Time</span>
        </div>
        <div className="flex flex-col items-center bg-amber-900/25 rounded-xl px-4 py-2 border border-amber-600/40">
          <span className="text-green-300 font-bold text-lg">{rupees}</span>
          <span className="text-amber-600/80 text-xs mt-0.5">Rupees</span>
        </div>
        <div className="flex flex-col items-center bg-amber-900/25 rounded-xl px-4 py-2 border border-amber-600/40">
          <span className="text-purple-300 font-bold text-lg">{loreRead.length}/9</span>
          <span className="text-amber-600/80 text-xs mt-0.5">Lore</span>
        </div>
      </div>

      {/* Score submit */}
      <div className="w-full max-w-sm mb-5 px-4">
        <ScoreSubmitForm
          score={score}
          runStartTime={runStartTime}
          shards={3}
          lore={loreRead.length}
          area="victory"
          accentColor="amber"
        />
      </div>

      <Button
        size="lg"
        className="text-lg px-10 py-4 bg-amber-700 hover:bg-amber-600 text-amber-100 font-serif tracking-wider border border-amber-400 cursor-pointer"
        onClick={() => resetGame()}
      >
        ↩ Play Again
      </Button>
      <p className="mt-3 text-xs text-gray-500 font-mono">Press Enter to play again</p>
    </div>
  );
}
