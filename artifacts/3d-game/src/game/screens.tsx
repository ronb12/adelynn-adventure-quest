import { useGameStore } from './store';
import { Button } from '@/components/ui/button';

// ── Story constants ───────────────────────────────────────────────
const STORY = {
  title: "Hero's Quest",
  subtitle: 'The Shattered Crown',
  lore: [
    'The kingdom of Aldenmere once thrived under the light of the',
    'Crown of Radiance — a sacred relic that kept darkness at bay.',
    '',
    'Then came Malgrath, the Shadow Sorcerer.',
    'He shattered the Crown into three Crystal Shards and scattered',
    'them across the land, plunging the realm into chaos.',
    '',
    'You are the last guardian. Seek the three shards,',
    'reunite the Crown, and end Malgrath\'s curse forever.',
  ],
  shards: [
    { area: 'field',  name: 'Shard of Dawn',  place: 'Sunfield Plains' },
    { area: 'forest', name: 'Shard of Dusk',   place: 'Whisper Woods'   },
    { area: 'desert', name: 'Shard of Ember',  place: 'Ashrock Summit'  },
  ],
};

// ── Title Screen ─────────────────────────────────────────────────
export function TitleScreen() {
  const setGameState = useGameStore(state => state.setGameState);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto select-none overflow-hidden"
      style={{
        backgroundImage: 'url(/title-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>

      {/* Dark gradient overlay so text stays readable over the image */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(8,4,24,0.55) 0%, rgba(8,4,24,0.72) 60%, rgba(8,4,24,0.88) 100%)' }} />

      {/* Crown icon */}
      <div className="text-7xl mb-2" style={{ filter: 'drop-shadow(0 0 18px #f0c030)' }}>♛</div>

      {/* Title */}
      <h1 className="text-5xl font-bold font-serif tracking-widest text-amber-300 drop-shadow-lg mb-1">
        {STORY.title}
      </h1>
      <h2 className="text-xl font-serif tracking-[0.3em] text-amber-500 mb-8">
        {STORY.subtitle}
      </h2>

      {/* Lore */}
      <div className="max-w-md text-center mb-8 space-y-0.5 bg-black/40 rounded-xl px-6 py-4 border border-amber-900/40">
        {STORY.lore.map((line, i) =>
          line === '' ? <div key={i} className="h-2" /> :
          <p key={i} className="text-amber-100/80 text-sm leading-relaxed">{line}</p>
        )}
      </div>

      {/* Shard targets */}
      <div className="flex gap-4 mb-8">
        {STORY.shards.map(s => (
          <div key={s.area} className="flex flex-col items-center gap-1 bg-black/40 rounded-lg px-4 py-3 border border-purple-900/40">
            <span className="text-2xl">💎</span>
            <span className="text-xs text-purple-300 font-bold">{s.name}</span>
            <span className="text-xs text-gray-400">{s.place}</span>
          </div>
        ))}
      </div>

      <Button
        size="lg"
        className="text-xl px-10 py-6 bg-amber-700 hover:bg-amber-600 text-amber-100 font-serif tracking-wider border border-amber-500"
        onClick={() => setGameState('playing')}
      >
        Begin the Quest
      </Button>

      <p className="mt-5 text-xs text-gray-500 font-mono">
        WASD move · Space attack · Q/Shift cycle weapon · E open chest
      </p>
    </div>
  );
}

// ── Game Over Screen ─────────────────────────────────────────────
export function GameOverScreen() {
  const resetGame    = useGameStore(state => state.resetGame);
  const shardsCount  = useGameStore(state => state.shardsCollected);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #2a0808 0%, #0a0606 100%)' }}>

      <div className="text-6xl mb-6" style={{ filter: 'drop-shadow(0 0 12px #ff2200)' }}>💀</div>

      <h1 className="text-6xl font-bold font-serif tracking-widest text-red-500 drop-shadow-lg mb-3">
        Darkness Falls
      </h1>
      <p className="text-red-300 text-lg mb-4 font-serif italic">
        "Aldenmere's last hope perishes…"
      </p>
      <p className="text-gray-400 text-sm mb-8">
        {shardsCount === 0
          ? 'Your quest ends before it began.'
          : `You claimed ${shardsCount} of 3 Crystal Shards before falling.`}
      </p>

      {shardsCount > 0 && (
        <div className="flex gap-3 mb-8">
          {STORY.shards.map((s, i) => (
            <div key={s.area} className={`text-2xl ${i < shardsCount ? 'opacity-100' : 'opacity-20'}`}>💎</div>
          ))}
        </div>
      )}

      <Button
        size="lg"
        className="text-xl px-8 py-5 bg-red-900 hover:bg-red-800 text-red-100 font-serif border border-red-700"
        onClick={() => resetGame()}
      >
        Rise Again
      </Button>
    </div>
  );
}

// ── Victory Screen ───────────────────────────────────────────────
export function VictoryScreen() {
  const resetGame = useGameStore(state => state.resetGame);
  const rupees    = useGameStore(state => state.rupees);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto select-none overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #201040 0%, #0c1028 100%)' }}>

      {/* Radiant glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(240,192,48,0.22) 0%, transparent 70%)' }} />
      </div>

      <div className="text-7xl mb-4" style={{ filter: 'drop-shadow(0 0 28px #f0c030)' }}>♛</div>

      <h1 className="text-5xl font-bold font-serif tracking-widest text-amber-300 drop-shadow-lg mb-2">
        The Crown Restored!
      </h1>
      <p className="text-amber-200/80 font-serif text-lg italic mb-6 text-center max-w-sm">
        "The darkness crumbles. The light of Aldenmere shines once more.
        Malgrath's curse is broken — the realm is saved!"
      </p>

      {/* All three shards */}
      <div className="flex gap-5 mb-6">
        {STORY.shards.map(s => (
          <div key={s.area} className="flex flex-col items-center gap-1 bg-amber-900/30 rounded-xl px-5 py-3 border border-amber-500/40">
            <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 8px #a080ff)' }}>💎</span>
            <span className="text-xs text-amber-300 font-bold">{s.name}</span>
            <span className="text-xs text-amber-100/60">{s.place}</span>
          </div>
        ))}
      </div>

      <p className="text-amber-400 text-lg mb-8">
        Rupees gathered on your quest: <span className="font-bold text-amber-200">{rupees}</span>
      </p>

      <Button
        size="lg"
        className="text-xl px-10 py-5 bg-amber-700 hover:bg-amber-600 text-amber-100 font-serif tracking-wider border border-amber-400"
        onClick={() => resetGame()}
      >
        Play Again
      </Button>
    </div>
  );
}
