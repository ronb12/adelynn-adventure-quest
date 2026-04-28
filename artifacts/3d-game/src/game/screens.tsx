import { useEffect, useState } from 'react';
import { useGameStore } from './store';
import { Button } from '@/components/ui/button';
import { getSaveMeta, formatSaveTime, AREA_DISPLAY, deleteSave } from './saveManager';

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

// ── Title Screen ─────────────────────────────────────────────────
export function TitleScreen() {
  const setGameState  = useGameStore(state => state.setGameState);
  const resetGame     = useGameStore(state => state.resetGame);
  const loadFromSave  = useGameStore(state => state.loadFromSave);
  const deleteSaveData = useGameStore(state => state.deleteSaveData);
  const [saveMeta, setSaveMeta] = useState(getSaveMeta());
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto select-none overflow-hidden"
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
          WASD move · Space attack · Q/Shift cycle weapon · E interact · {saveMeta ? 'Enter to continue' : 'Enter/Space to start'}
        </p>
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
      <div className="flex gap-3 mb-6">
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
