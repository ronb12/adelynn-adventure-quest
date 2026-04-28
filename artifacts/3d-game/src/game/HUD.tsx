import { useEffect, useRef, useState } from 'react';
import { useGameStore, SWORD_DEFS } from './store';
import { WEAPONS, WeaponId } from './controls';
import { NPC_DATA } from './npcData';

const WEAPON_ICONS: Record<WeaponId, string> = {
  sword:    '⚔',
  bow:      '🏹',
  moonbow:  '🌙',
  bomb:     '🧪',
  boomerang:'🌑',
  wand:     '🪄',
  frost:    '❄️',
  shuriken: '⭐',
  flare:    '☀️',
  veil:     '💠',
  quake:    '🪨',
  aura:     '💫',
  shadow:   '🌑',
  chain:    '⛓️',
};
const WEAPON_LABELS: Record<WeaponId, string> = {
  sword:    'Sword',
  bow:      'Bow',
  moonbow:  'Moonbow',
  bomb:     'Vial',
  boomerang:'Rang',
  wand:     'Wand',
  frost:    'Frost',
  shuriken: 'Stars',
  flare:    'Flare',
  veil:     'Veil',
  quake:    'Quake',
  aura:     'Aura',
  shadow:   'Shadow',
  chain:    'Chain',
};
const AREA_NAMES: Record<string, string> = {
  field: 'Sunfield Plains', forest: 'Whisper Woods', desert: 'Ashrock Summit', boss: "Malgrath's Lair",
};
const SHARD_INFO = [
  { area: 'field',  name: 'Shard of Dawn',  color: '#ffe060' },
  { area: 'forest', name: 'Shard of Dusk',  color: '#9966ff' },
  { area: 'desert', name: 'Shard of Ember', color: '#ff6030' },
];

// ── Heart Row (supports half-hearts + max hearts display) ─────────
function HeartRow() {
  const hearts    = useGameStore(s => s.hearts);
  const maxHearts = useGameStore(s => s.maxHearts);
  return (
    <div className="flex gap-1 flex-wrap max-w-[200px]">
      {Array.from({ length: maxHearts }).map((_, i) => {
        const full = i < Math.floor(hearts);
        const half = !full && i < hearts;
        return (
          <svg key={i} viewBox="0 0 24 24" className="w-6 h-6 drop-shadow">
            <defs>
              <clipPath id={`h-${i}`}><rect x="0" y="0" width="12" height="24" /></clipPath>
            </defs>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#555" stroke="#333" strokeWidth="1" />
            {(full || half) && (
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="#ee2244" clipPath={half ? `url(#h-${i})` : undefined} />
            )}
          </svg>
        );
      })}
    </div>
  );
}

// ── Heart Pieces indicator ────────────────────────────────────────
function HeartPieceBar() {
  const count = useGameStore(s => s.heartPiecesCollected.length);
  const pieces = count % 4;
  return (
    <div className="flex items-center gap-1 mt-0.5">
      {[0,1,2,3].map(i => (
        <div key={i} className={`w-3 h-3 rounded-full border transition-all ${i < pieces ? 'bg-pink-500 border-pink-300' : 'bg-gray-700 border-gray-600'}`} />
      ))}
      <span className="text-pink-400 text-xs ml-1">×{count}</span>
    </div>
  );
}

// ── Shard Tracker ─────────────────────────────────────────────────
function ShardTracker() {
  const chestsOpened    = useGameStore(s => s.chestsOpened);
  const shardsCollected = useGameStore(s => s.shardsCollected);
  return (
    <div className="bg-black/55 rounded-xl px-2 py-1.5 backdrop-blur-sm flex flex-col items-center gap-0.5">
      <span className="text-amber-400 text-xs font-bold tracking-wider uppercase">Shards</span>
      <div className="flex gap-1.5 items-center">
        {SHARD_INFO.map(s => {
          const have = chestsOpened.includes(s.area);
          return (
            <span key={s.area} className="text-lg transition-all"
              style={{ filter: have ? `drop-shadow(0 0 5px ${s.color})` : 'none', opacity: have ? 1 : 0.2 }}>
              💎
            </span>
          );
        })}
        <span className="text-amber-200 font-bold text-sm">{shardsCollected}/3</span>
      </div>
    </div>
  );
}

// Cooldown bar helper
function CooldownPip({ endTime, duration, color }: { endTime: number; duration: number; color: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      const rem = Math.max(0, endTime - Date.now());
      setPct(rem / duration);
    }, 80);
    return () => clearInterval(iv);
  }, [endTime, duration]);
  if (pct <= 0) return <span className="text-xs font-bold" style={{ color }}>RDY</span>;
  return (
    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden mt-0.5">
      <div className="h-full rounded-full transition-all" style={{ width: `${(1-pct)*100}%`, background: color }} />
    </div>
  );
}

// ── Weapon Bar ────────────────────────────────────────────────────
function WeaponBar() {
  const selected       = useGameStore(s => s.selectedWeapon);
  const arrows         = useGameStore(s => s.arrows);
  const bombs          = useGameStore(s => s.bombs);
  const shurikens      = useGameStore(s => s.shurikens);
  const frostCharges   = useGameStore(s => s.frostCharges);
  const flareCharges   = useGameStore(s => s.flareCharges);
  const veilCrystals   = useGameStore(s => s.veilCrystals);
  const quakeRunes     = useGameStore(s => s.quakeRunes);
  const moonbowAmmo    = useGameStore(s => s.moonbowAmmo);
  const auraEndTime    = useGameStore(s => s.auraEndTime);
  const shadowEndTime  = useGameStore(s => s.shadowEndTime);
  const chainEnd       = useGameStore(s => s.chainCooldownEnd);
  const activeSword    = useGameStore(s => s.activeSword);
  const unlockedSwords = useGameStore(s => s.unlockedSwords);

  const ammo: Partial<Record<WeaponId, number>> = {
    bow: arrows, moonbow: moonbowAmmo,
    bomb: bombs, shuriken: shurikens,
    frost: frostCharges, flare: flareCharges,
    veil: veilCrystals, quake: quakeRunes,
  };
  return (
    <div className="flex flex-col gap-1">
      {/* Active sword info (Z to cycle) */}
      {selected === 'sword' && unlockedSwords.length > 1 && (
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/60 border border-purple-700/60">
          <span className="text-sm">{SWORD_DEFS[activeSword].icon}</span>
          <div className="flex flex-col">
            <span className="text-purple-200 text-xs font-bold leading-tight">{SWORD_DEFS[activeSword].name}</span>
            <span className="text-purple-500 text-xs leading-tight">[Z] to cycle</span>
          </div>
          <span className="text-purple-400 text-xs ml-auto">{unlockedSwords.indexOf(activeSword)+1}/{unlockedSwords.length}</span>
        </div>
      )}
      {/* Sliding window: show 7 weapons centered on selected */}
      <div className="flex gap-1 items-end">
        {(() => {
          const selIdx = WEAPONS.indexOf(selected);
          const half = 3;
          const shown: typeof WEAPONS[number][] = [];
          for (let i = selIdx - half; i <= selIdx + half; i++) {
            const wi = ((i % WEAPONS.length) + WEAPONS.length) % WEAPONS.length;
            shown.push(WEAPONS[wi]);
          }
          return shown.map(w => {
            const active = w === selected;
            const isCooldown = w === 'aura' || w === 'shadow' || w === 'chain';
            const cooldownEnd = w === 'aura' ? auraEndTime : w === 'shadow' ? shadowEndTime : chainEnd;
            const cdDuration = w === 'aura' ? 4000 : w === 'shadow' ? 2500 : 4000;
            return (
              <div key={w}
                className={`flex flex-col items-center px-1.5 py-0.5 rounded-lg border-2 transition-all min-w-[36px]
                  ${active ? 'bg-amber-400/90 border-amber-600 scale-110 shadow-lg' : 'bg-black/50 border-gray-600 opacity-70'}`}>
                <span className="text-sm leading-none">{WEAPON_ICONS[w]}</span>
                <span className={`text-xs font-bold leading-tight ${active ? 'text-amber-900' : 'text-gray-300'}`}>
                  {WEAPON_LABELS[w]}
                </span>
                {ammo[w] !== undefined && (
                  <span className={`text-xs font-mono leading-tight ${active ? 'text-amber-800' : 'text-gray-400'}`}>
                    ×{ammo[w]}
                  </span>
                )}
                {(w === 'wand' || w === 'boomerang') && (
                  <span className={`text-xs leading-tight ${active ? 'text-amber-800' : 'text-gray-500'}`}>∞</span>
                )}
                {isCooldown && active && (
                  <CooldownPip endTime={cooldownEnd} duration={cdDuration} color="#cc44ff" />
                )}
              </div>
            );
          });
        })()}
      </div>
      <div className="text-center text-gray-600 text-xs mt-0.5">
        [{WEAPONS.indexOf(selected)+1}/{WEAPONS.length}] Q/Shift to cycle
      </div>
    </div>
  );
}

// ── Boss HP Bar ───────────────────────────────────────────────────
function BossHPBar() {
  const bossHP    = useGameStore(s => s.bossHP);
  const bossMax   = useGameStore(s => s.bossMaxHP);
  const bossDefeated = useGameStore(s => s.bossDefeated);
  const currentArea  = useGameStore(s => s.currentArea);
  if (currentArea !== 'boss' || bossDefeated) return null;
  const pct = (bossHP / bossMax) * 100;
  const color = pct > 50 ? '#9900ff' : pct > 25 ? '#cc4400' : '#ff0033';
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80">
      <div className="bg-black/80 rounded-xl px-4 py-2 border border-purple-900/60 shadow-2xl">
        <div className="text-purple-300 font-bold text-xs text-center mb-1 tracking-wider">
          ☠ MALGRATH — Shadow Sorcerer ☠
        </div>
        <div className="w-full h-4 bg-gray-900 rounded-full overflow-hidden border border-purple-900/40">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, #ff00ff)` }} />
        </div>
        <div className="text-right text-purple-400 text-xs font-mono mt-0.5">{bossHP}/{bossMax}</div>
      </div>
    </div>
  );
}

// ── Mini-Map ──────────────────────────────────────────────────────
// ── Lore stone positions (mirrored from World.tsx) ────────────────
const MAP_LORE_STONES: Record<string, [number, number][]> = {
  field:  [[15, -5], [-18, -12], [10, -20]],
  forest: [[-6, -10], [14, -8], [-12, -18]],
  desert: [[14, -10], [6, 14], [-18, 14]],
};

// ── Terrain SVG layers per area ────────────────────────────────────
function TerrainLayer({ area, S }: { area: string; S: number }) {
  if (area === 'field') return (
    <svg width={S} height={S} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="fg-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1e4a20" />
          <stop offset="100%" stopColor="#0f2a10" />
        </radialGradient>
      </defs>
      <rect width={S} height={S} fill="url(#fg-bg)" />
      {/* Grass patches */}
      <ellipse cx={S*0.3} cy={S*0.25} rx={14} ry={10} fill="#264e28" opacity={0.6}/>
      <ellipse cx={S*0.75} cy={S*0.4} rx={10} ry={7} fill="#264e28" opacity={0.5}/>
      <ellipse cx={S*0.55} cy={S*0.7} rx={16} ry={9} fill="#1d3e1f" opacity={0.6}/>
      <ellipse cx={S*0.2} cy={S*0.65} rx={9} ry={6} fill="#264e28" opacity={0.4}/>
      {/* Village marker (center-bottom) */}
      <rect x={S*0.47} y={S*0.75} width={4} height={4} fill="#8a6a3a" opacity={0.9}/>
      <rect x={S*0.52} y={S*0.73} width={4} height={4} fill="#7a5a2a" opacity={0.9}/>
      <rect x={S*0.44} y={S*0.72} width={3} height={3} fill="#9a7a4a" opacity={0.8}/>
      {/* Path from village to north portal */}
      <line x1={S*0.5} y1={S*0.7} x2={S*0.5} y2={S*0.05} stroke="#2a5a2a" strokeWidth={1.5} strokeDasharray="2,3" opacity={0.5}/>
      {/* Path to east portal */}
      <line x1={S*0.5} y1={S*0.7} x2={S*0.95} y2={S*0.5} stroke="#2a5a2a" strokeWidth={1.5} strokeDasharray="2,3" opacity={0.4}/>
      {/* Grid lines */}
      <line x1={0} y1={S*0.5} x2={S} y2={S*0.5} stroke="#1a401a" strokeWidth={0.5} opacity={0.4}/>
      <line x1={S*0.5} y1={0} x2={S*0.5} y2={S} stroke="#1a401a" strokeWidth={0.5} opacity={0.4}/>
    </svg>
  );
  if (area === 'forest') return (
    <svg width={S} height={S} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="fo-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#0d2a0e" />
          <stop offset="100%" stopColor="#060f06" />
        </radialGradient>
      </defs>
      <rect width={S} height={S} fill="url(#fo-bg)" />
      {/* Dense tree canopy clusters */}
      <circle cx={S*0.2} cy={S*0.2} r={12} fill="#0f3010" opacity={0.8}/>
      <circle cx={S*0.75} cy={S*0.25} r={10} fill="#0e2d0f" opacity={0.8}/>
      <circle cx={S*0.15} cy={S*0.7} r={14} fill="#0f3010" opacity={0.75}/>
      <circle cx={S*0.8} cy={S*0.72} r={11} fill="#0d2a0d" opacity={0.8}/>
      <circle cx={S*0.5} cy={S*0.35} r={9} fill="#142e14" opacity={0.7}/>
      <circle cx={S*0.4} cy={S*0.75} r={8} fill="#0f2e0f" opacity={0.75}/>
      {/* Spirit tree (distinct color) */}
      <circle cx={S*0.5} cy={S*0.2} r={6} fill="#1a4020" opacity={0.9}/>
      <circle cx={S*0.5} cy={S*0.2} r={3} fill="#2a6030" opacity={0.8}/>
      {/* Clearing in center */}
      <ellipse cx={S*0.5} cy={S*0.55} rx={10} ry={8} fill="#173517" opacity={0.5}/>
      {/* Path */}
      <line x1={S*0.5} y1={S*0.95} x2={S*0.5} y2={S*0.55} stroke="#1a4a1a" strokeWidth={1.5} strokeDasharray="2,3" opacity={0.5}/>
      {/* Grid */}
      <line x1={0} y1={S*0.5} x2={S} y2={S*0.5} stroke="#0d1e0d" strokeWidth={0.5} opacity={0.4}/>
      <line x1={S*0.5} y1={0} x2={S*0.5} y2={S} stroke="#0d1e0d" strokeWidth={0.5} opacity={0.4}/>
    </svg>
  );
  if (area === 'desert') return (
    <svg width={S} height={S} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="de-bg" cx="50%" cy="60%" r="70%">
          <stop offset="0%" stopColor="#4a3010" />
          <stop offset="100%" stopColor="#1e1408" />
        </radialGradient>
      </defs>
      <rect width={S} height={S} fill="url(#de-bg)" />
      {/* Rock formations */}
      <polygon points={`${S*0.15},${S*0.28} ${S*0.25},${S*0.18} ${S*0.32},${S*0.28} ${S*0.22},${S*0.35}`} fill="#3a2810" opacity={0.75}/>
      <polygon points={`${S*0.65},${S*0.6} ${S*0.78},${S*0.52} ${S*0.85},${S*0.65} ${S*0.72},${S*0.72}`} fill="#362509" opacity={0.8}/>
      <polygon points={`${S*0.4},${S*0.75} ${S*0.48},${S*0.68} ${S*0.55},${S*0.78} ${S*0.47},${S*0.83}`} fill="#3a2810" opacity={0.7}/>
      {/* Sandy patches */}
      <ellipse cx={S*0.55} cy={S*0.4} rx={15} ry={10} fill="#5a4020" opacity={0.35}/>
      <ellipse cx={S*0.3} cy={S*0.6} rx={10} ry={7} fill="#4a3515" opacity={0.3}/>
      {/* Temple ruins at top */}
      <rect x={S*0.44} y={S*0.12} width={12} height={8} fill="#2a1e0a" opacity={0.8}/>
      <rect x={S*0.46} y={S*0.1} width={3} height={5} fill="#251808" opacity={0.9}/>
      <rect x={S*0.51} y={S*0.1} width={3} height={5} fill="#251808" opacity={0.9}/>
      {/* Path */}
      <line x1={S*0.05} y1={S*0.5} x2={S*0.5} y2={S*0.5} stroke="#3a2808" strokeWidth={1.5} strokeDasharray="2,3" opacity={0.4}/>
      {/* Grid */}
      <line x1={0} y1={S*0.5} x2={S} y2={S*0.5} stroke="#2a1e08" strokeWidth={0.5} opacity={0.35}/>
      <line x1={S*0.5} y1={0} x2={S*0.5} y2={S} stroke="#2a1e08" strokeWidth={0.5} opacity={0.35}/>
    </svg>
  );
  // Boss area
  return (
    <svg width={S} height={S} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="bo-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#2a0050" />
          <stop offset="100%" stopColor="#080010" />
        </radialGradient>
      </defs>
      <rect width={S} height={S} fill="url(#bo-bg)" />
      {/* Void cracks */}
      <line x1={S*0.5} y1={S*0.5} x2={S*0.2} y2={S*0.1} stroke="#6600cc" strokeWidth={1} opacity={0.5}/>
      <line x1={S*0.5} y1={S*0.5} x2={S*0.8} y2={S*0.2} stroke="#6600cc" strokeWidth={1} opacity={0.4}/>
      <line x1={S*0.5} y1={S*0.5} x2={S*0.15} y2={S*0.75} stroke="#6600cc" strokeWidth={0.8} opacity={0.4}/>
      <line x1={S*0.5} y1={S*0.5} x2={S*0.85} y2={S*0.8} stroke="#6600cc" strokeWidth={0.8} opacity={0.4}/>
      {/* Central void */}
      <circle cx={S*0.5} cy={S*0.5} r={8} fill="#1a0040" opacity={0.9}/>
      <circle cx={S*0.5} cy={S*0.5} r={3} fill="#3300aa" opacity={0.6}/>
    </svg>
  );
}

function MiniMap() {
  const playerPos       = useGameStore(s => s.playerPosition);
  const currentArea     = useGameStore(s => s.currentArea);
  const chestsOpened    = useGameStore(s => s.chestsOpened);
  const shardsCollected = useGameStore(s => s.shardsCollected);
  const loreRead        = useGameStore(s => s.loreRead);

  const prevPosRef  = useRef({ x: playerPos.x, z: playerPos.z });
  const [facing, setFacing] = useState(0);

  useEffect(() => {
    const dx = playerPos.x - prevPosRef.current.x;
    const dz = playerPos.z - prevPosRef.current.z;
    if (Math.abs(dx) > 0.08 || Math.abs(dz) > 0.08) {
      setFacing(Math.atan2(dx, dz) * 180 / Math.PI);
    }
    prevPosRef.current = { x: playerPos.x, z: playerPos.z };
  }, [playerPos]);

  const S = 140;
  const WORLD = 30;

  const toMap = (x: number, z: number) => ({
    x: (x / WORLD + 1) / 2 * S,
    y: (z / WORLD + 1) / 2 * S,
  });

  const player = toMap(playerPos.x, playerPos.z);

  // Portals
  const portalDots: { x: number; z: number; color: string; label: string }[] = [];
  if (currentArea === 'field') {
    portalDots.push({ x: 0, z: -29, color: '#44ee44', label: 'Forest' });
    portalDots.push({ x: 29, z: 0, color: '#ff8822', label: 'Desert' });
    if (shardsCollected >= 3) portalDots.push({ x: -29, z: 0, color: '#aa44ff', label: 'Boss' });
  } else if (currentArea === 'forest') {
    portalDots.push({ x: 0, z: 29, color: '#88aaff', label: 'Field' });
  } else if (currentArea === 'desert') {
    portalDots.push({ x: -29, z: 0, color: '#88aaff', label: 'Field' });
  } else if (currentArea === 'boss') {
    portalDots.push({ x: 0, z: 29, color: '#88aaff', label: 'Field' });
  }

  // Chest
  const chestKey = currentArea === 'boss' ? 'boss-armor' : currentArea;
  const CHEST_XZ: Partial<Record<string, [number, number]>> = {
    field: [0, -22], forest: [0, 0], desert: [0, -24], 'boss-armor': [-8, 8],
  };
  const chestXZ = CHEST_XZ[chestKey];
  const chestOpened = chestsOpened.includes(chestKey);

  // Fairy fountain
  const FOUNTAIN_XZ: Partial<Record<string, [number, number]>> = {
    field: [-20, 20], forest: [18, -18], desert: [20, 20],
  };
  const fountainXZ = FOUNTAIN_XZ[currentArea];

  // Lore stones for current area
  const loreStones = MAP_LORE_STONES[currentArea] ?? [];
  const LORE_IDS: Record<string, string[]> = {
    field:  ['lore-field-1',  'lore-field-2',  'lore-field-3'],
    forest: ['lore-forest-1', 'lore-forest-2', 'lore-forest-3'],
    desert: ['lore-desert-1', 'lore-desert-2', 'lore-desert-3'],
  };
  const loreIds = LORE_IDS[currentArea] ?? [];

  // Area border colors
  const borderColor = currentArea === 'forest' ? '#2a6a2a'
    : currentArea === 'desert' ? '#8a6a2a'
    : currentArea === 'boss' ? '#6600cc'
    : '#2a6a2a';
  const areaColor = currentArea === 'forest' ? '#44cc44'
    : currentArea === 'desert' ? '#ffaa44'
    : currentArea === 'boss' ? '#aa66ff'
    : '#66dd66';

  return (
    <div style={{ position: 'relative', width: S, height: S + 18 }}>
      {/* Outer frame / shadow */}
      <div style={{
        position: 'absolute', inset: 0, top: 0, width: S, height: S,
        borderRadius: 10,
        boxShadow: `0 0 0 1px #000, 0 0 0 2px ${borderColor}55, 0 4px 16px rgba(0,0,0,0.7)`,
        overflow: 'hidden',
      }}>
        {/* Terrain background */}
        <TerrainLayer area={currentArea} S={S} />

        {/* Vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 10,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)',
          pointerEvents: 'none',
        }} />

        {/* SVG markers layer */}
        <svg width={S} height={S} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* Grid cross-hair at center */}
          <line x1={S*0.5} y1={2} x2={S*0.5} y2={S-2} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
          <line x1={2} y1={S*0.5} x2={S-2} y2={S*0.5} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>

          {/* Portals — diamond shape */}
          {portalDots.map((p, i) => {
            const mp = toMap(p.x, p.z);
            const r = 5;
            return (
              <g key={i}>
                <polygon
                  points={`${mp.x},${mp.y-r} ${mp.x+r},${mp.y} ${mp.x},${mp.y+r} ${mp.x-r},${mp.y}`}
                  fill={p.color} opacity={0.9}
                />
                <polygon
                  points={`${mp.x},${mp.y-r} ${mp.x+r},${mp.y} ${mp.x},${mp.y+r} ${mp.x-r},${mp.y}`}
                  fill="none" stroke={p.color} strokeWidth={1.5} opacity={0.6}
                  style={{ filter: `drop-shadow(0 0 4px ${p.color})` }}
                />
              </g>
            );
          })}

          {/* Chest — square with glow */}
          {chestXZ && (() => {
            const mp = toMap(chestXZ[0], chestXZ[1]);
            return (
              <g>
                <rect x={mp.x-4} y={mp.y-4} width={8} height={8} rx={1}
                  fill={chestOpened ? '#555' : '#f0c030'}
                  stroke={chestOpened ? '#444' : '#c09010'}
                  strokeWidth={1}
                  style={chestOpened ? {} : { filter: 'drop-shadow(0 0 4px #f0c030)' }}
                />
                {!chestOpened && (
                  <line x1={mp.x-4} y1={mp.y} x2={mp.x+4} y2={mp.y}
                    stroke="#c09010" strokeWidth={0.8}/>
                )}
              </g>
            );
          })()}

          {/* Fairy Fountain — cyan cross + circle */}
          {fountainXZ && (() => {
            const mp = toMap(fountainXZ[0], fountainXZ[1]);
            return (
              <g style={{ filter: 'drop-shadow(0 0 3px #44ccff)' }}>
                <circle cx={mp.x} cy={mp.y} r={4.5} fill="#0088bb" stroke="#44ccff" strokeWidth={1.2}/>
                <line x1={mp.x-4} y1={mp.y} x2={mp.x+4} y2={mp.y} stroke="#88eeff" strokeWidth={1}/>
                <line x1={mp.x} y1={mp.y-4} x2={mp.x} y2={mp.y+4} stroke="#88eeff" strokeWidth={1}/>
              </g>
            );
          })()}

          {/* Lore stones — purple star ✦ */}
          {loreStones.map(([wx, wz], i) => {
            const mp = toMap(wx, wz);
            const read = loreIds[i] && loreRead.includes(loreIds[i]);
            const col = read ? '#885588' : '#cc66ff';
            const r = 3.5;
            return (
              <g key={i} style={read ? {} : { filter: 'drop-shadow(0 0 3px #cc66ff)' }}>
                {/* 4-pointed star */}
                <polygon
                  points={`${mp.x},${mp.y-r} ${mp.x+1},${mp.y-1} ${mp.x+r},${mp.y} ${mp.x+1},${mp.y+1} ${mp.x},${mp.y+r} ${mp.x-1},${mp.y+1} ${mp.x-r},${mp.y} ${mp.x-1},${mp.y-1}`}
                  fill={col} opacity={read ? 0.6 : 0.95}
                />
              </g>
            );
          })}

          {/* Player — directional arrow */}
          <g transform={`translate(${player.x}, ${player.y}) rotate(${facing})`}>
            {/* Glow ring */}
            <circle cx={0} cy={0} r={7} fill="rgba(233,30,140,0.18)" />
            {/* Arrow body */}
            <polygon points="0,-7 5,5 0,2 -5,5"
              fill="#e91e8c" stroke="white" strokeWidth={1.2}
              style={{ filter: 'drop-shadow(0 0 5px #e91e8c)' }}
            />
          </g>

          {/* Compass — N indicator */}
          <text x={S/2} y={11} textAnchor="middle"
            style={{ fontSize: 8, fill: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', fontWeight: 'bold' }}>N</text>
          <line x1={S/2-4} y1={7} x2={S/2} y2={4} stroke="rgba(255,255,255,0.35)" strokeWidth={0.8}/>
          <line x1={S/2+4} y1={7} x2={S/2} y2={4} stroke="rgba(255,255,255,0.35)" strokeWidth={0.8}/>
        </svg>

        {/* Inner border glow */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 10,
          boxShadow: `inset 0 0 0 1px ${borderColor}66`,
          pointerEvents: 'none',
        }}/>
      </div>

      {/* Legend bar below map */}
      <div style={{
        position: 'absolute', top: S + 3, left: 0, width: S,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {/* Chest legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 6, height: 6, background: chestOpened ? '#666' : '#f0c030', borderRadius: 1 }}/>
          <span style={{ fontSize: 8, color: '#888', fontFamily: 'monospace' }}>chest</span>
        </div>
        {/* Fountain legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#44ccff' }}/>
          <span style={{ fontSize: 8, color: '#888', fontFamily: 'monospace' }}>fairy</span>
        </div>
        {/* Lore legend */}
        {loreStones.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 6, height: 6, background: '#cc66ff', clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }}/>
            <span style={{ fontSize: 8, color: '#888', fontFamily: 'monospace' }}>
              lore {loreRead.filter(id => loreIds.includes(id)).length}/{loreStones.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Item Fanfare Overlay ──────────────────────────────────────────
function ItemFanfare() {
  const fanfare       = useGameStore(s => s.itemFanfare);
  const setItemFanfare = useGameStore(s => s.setItemFanfare);

  useEffect(() => {
    if (!fanfare) return;
    const t = setTimeout(() => setItemFanfare(null), 3200);
    return () => clearTimeout(t);
  }, [fanfare]);

  if (!fanfare) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 9000 }}>
      <div className="flex flex-col items-center gap-3 animate-bounce-in"
        style={{
          animation: 'fadeInScale 0.35s ease-out forwards',
          background: 'radial-gradient(ellipse at 50% 40%, rgba(40,20,80,0.95) 0%, rgba(10,5,25,0.98) 80%)',
          border: '2px solid #f0c030',
          borderRadius: 20,
          padding: '24px 40px',
          boxShadow: '0 0 60px rgba(240,192,48,0.4)',
        }}>
        <div className="text-amber-400 font-bold text-sm tracking-[0.4em] uppercase">— You Got —</div>
        <div className="text-6xl" style={{ filter: 'drop-shadow(0 0 16px gold)' }}>
          {fanfare.icon}
        </div>
        <div className="text-amber-200 font-serif font-bold text-2xl">{fanfare.name}</div>
        <div className="text-gray-300 text-sm text-center max-w-xs">{fanfare.desc}</div>
      </div>
      <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

// ── Auto-Save Toast ───────────────────────────────────────────────
function SaveToast() {
  const lastSaveTime = useGameStore(s => s.lastSaveTime);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastSaveTime) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, [lastSaveTime]);

  if (!visible) return null;
  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/75 border border-amber-700/60 rounded-full px-3 py-1 text-xs text-amber-300 font-mono backdrop-blur-sm"
      style={{ zIndex: 8500, animation: 'fadeInOut 2.2s ease-in-out forwards' }}
    >
      <span>💾</span>
      <span>Auto-saved</span>
    </div>
  );
}

// ── Score Panel (top-right) ───────────────────────────────────────
function ScorePanel() {
  const score        = useGameStore(s => s.score);
  const comboCount   = useGameStore(s => s.comboCount);
  const comboTimer   = useGameStore(s => s.comboTimer);
  const runStartTime = useGameStore(s => s.runStartTime);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!runStartTime) return;
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - runStartTime) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [runStartTime]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const multiplier = Math.min(comboCount, 5);

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="bg-black/55 rounded-lg px-2 py-1 backdrop-blur-sm flex items-center gap-2">
        <span className="text-gray-400 font-mono text-xs">⏱</span>
        <span className="text-white font-mono text-sm font-bold">{mm}:{ss}</span>
      </div>
      <div className="bg-black/55 rounded-lg px-2 py-1 backdrop-blur-sm flex items-center gap-1.5">
        <span className="text-amber-400 text-xs">✦</span>
        <span className="text-amber-200 font-bold text-sm">{score.toLocaleString()}</span>
      </div>
      {multiplier >= 2 && comboTimer > 0 && (
        <div className="bg-purple-900/75 rounded-lg px-2 py-0.5 border border-purple-400/50 backdrop-blur-sm">
          <span className="text-purple-200 font-bold text-xs">×{multiplier} COMBO</span>
        </div>
      )}
    </div>
  );
}

// ── Combo popup (center-top burst) ───────────────────────────────
function ComboPopup() {
  const comboCount = useGameStore(s => s.comboCount);
  const comboTimer = useGameStore(s => s.comboTimer);
  const [shown, setShown] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (comboCount >= 3 && comboCount !== shown) {
      setShown(comboCount);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 900);
      return () => clearTimeout(t);
    }
  }, [comboCount]);

  if (!visible || comboCount < 3 || comboTimer <= 0) return null;
  const mult = Math.min(comboCount, 5);
  const colors = ['', '', '', '#ffcc00', '#ff8800', '#ff4400'];
  return (
    <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ zIndex: 8000, animation: 'comboIn 0.9s ease-out forwards' }}>
      <div className="flex flex-col items-center" style={{ color: colors[mult] ?? '#ff4400' }}>
        <span className="font-bold text-3xl drop-shadow-lg" style={{ textShadow: `0 0 20px ${colors[mult]}` }}>
          ×{mult} COMBO!
        </span>
        <span className="text-sm font-bold opacity-80">{comboCount} kills</span>
      </div>
      <style>{`@keyframes comboIn{0%{opacity:0;transform:translateX(-50%) scale(0.5)}30%{opacity:1;transform:translateX(-50%) scale(1.2)}70%{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(0.95) translateY(-20px)}}`}</style>
    </div>
  );
}

// ── Lore Popup ────────────────────────────────────────────────────
function LorePopup() {
  const nearLore   = useGameStore(s => s.nearLore);
  const loreRead   = useGameStore(s => s.loreRead);
  const markLoreRead = useGameStore(s => s.markLoreRead);
  const [content, setContent] = useState<{ title: string; text: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!nearLore) { setVisible(false); return; }
    // Import lore data
    const LORE: Record<string, { title: string; text: string }> = {
      'lore-field-1': { title: 'Ancient Boundary Stone', text: 'Here stood the Northern Gate of Sunfield, raised in the Age of Accord. The glyph reads: "Let no shadow pass while Solara watches." The carving still glows faintly at noon.' },
      'lore-field-2': { title: "Fallen Knight's Grave", text: "Sir Aldous of the Dawn Order — fell defending Sunfield during Malgrath's first raid. His sword broke, but his shield held firm until the last. They say he still walks these plains in moonlight." },
      'lore-field-3': { title: 'Weathered Map Stone', text: "A carved relief shows ancient Aldenmere — seven shining points mark the Bound Spirits' sanctuaries. All seven glow on this stone. Outside, none do. Seven hopes. One hero." },
      'lore-forest-1': { title: "Druid's Warning", text: '"The trees remember what men forget. Thornwick planted each root as a living prayer. Should the Spirit of the Wild fall silent, the forest will turn against all who enter." — Archdruid Selene, 33 years before Malgrath.' },
      'lore-forest-2': { title: 'Spirit Tree Marker', text: "This ancient oak grew from a seed blessed by Thornwick himself. Its bark used to glow gold at dusk. Malgrath's darkness has turned it grey. Even the oldest things wither without the Crown's light." },
      'lore-forest-3': { title: "Lost Ranger's Journal", text: 'Entry 47: The wolf-things grow bolder — they used to flee torchlight, now they stare through it. Malgrath\'s shadow changed them. Entry 48: (ink-smeared) they found the camp.' },
      'lore-desert-1': { title: 'Temple Fragment', text: 'Part of the great Embris Temple, built above the Spirit Forge where Embris first taught metalworking. The smelting chamber is buried under the summit. Embris melted iron with a song no smith has replicated since.' },
      'lore-desert-2': { title: "Stone Sentinel's Last Order", text: 'Etched at the base of the first frozen soldier: "HOLD. THE. PASS." Captain Dren\'s final command before Malgrath\'s spell swept through the garrison. They obeyed. Perfectly. Forever.' },
      'lore-desert-3': { title: "Glacira's Spring", text: "The cracked basin before you once held the purest water in Aldenmere — Glacira's gift to the desert people. The old maps call it \"The Mercy Pool.\" The people here named their daughters after her for three generations." },
    };
    const lore = LORE[nearLore];
    if (lore) {
      setContent(lore);
      setVisible(true);
      if (!loreRead.includes(nearLore)) markLoreRead(nearLore);
    }
  }, [nearLore]);

  if (!visible || !content) return null;

  return (
    <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pointer-events-none"
      style={{ zIndex: 6500, animation: 'loreIn 0.4s ease-out forwards' }}>
      <div className="rounded-2xl border p-4 shadow-2xl"
        style={{ background: 'rgba(10,5,25,0.93)', borderColor: '#7c44cc' }}>
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-900/50">
          <span className="text-purple-400 text-lg">📜</span>
          <div className="text-purple-200 font-bold text-sm">{content.title}</div>
          {loreRead.includes(nearLore ?? '') && (
            <span className="ml-auto text-xs text-purple-600">Read ✓</span>
          )}
        </div>
        <p className="text-gray-200 text-sm leading-relaxed italic">{content.text}</p>
      </div>
      <style>{`@keyframes loreIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

// ── Main HUD ──────────────────────────────────────────────────────
export function HUD() {
  const {
    gameState, rupees, currentArea, nearChest, nearNPC, activeDialogue,
    isBlocking, armorLevel, nearShop, showShop, nearFountain, shardsCollected, nearLore,
  } = useGameStore();

  const shardInfo = SHARD_INFO.find(s => s.area === currentArea);
  const dialogueNPC = activeDialogue ? NPC_DATA.find(n => n.id === activeDialogue.npcId) : null;

  if (gameState !== 'playing') return null;

  const armorColors = ['', '🔵', '🔴'];

  return (
    <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between select-none">

      {/* Save Toast */}
      <SaveToast />

      {/* Item Fanfare */}
      <ItemFanfare />

      {/* Combo burst */}
      <ComboPopup />

      {/* Lore popup */}
      <LorePopup />

      {/* Top row */}
      <div className="flex justify-between items-start gap-2">
        {/* Left: Hearts + Heart Pieces + Armor */}
        <div className="bg-black/55 rounded-xl px-2 py-1.5 backdrop-blur-sm">
          <HeartRow />
          <HeartPieceBar />
          {armorLevel > 0 && (
            <div className="text-xs text-blue-300 mt-0.5 font-bold">
              {armorColors[armorLevel]} {armorLevel === 1 ? 'Blue' : 'Red'} Tunic
            </div>
          )}
        </div>

        {/* Center: Shard Tracker */}
        <ShardTracker />

        {/* Right: Score + Timer + Area + Rupees + Mini-map */}
        <div className="flex flex-col items-end gap-1">
          <div className="bg-black/55 rounded-lg px-2 py-0.5 text-white font-bold text-xs backdrop-blur-sm">
            {AREA_NAMES[currentArea] ?? currentArea}
          </div>
          <div className="bg-black/55 rounded-lg px-2 py-1 flex items-center gap-1.5 backdrop-blur-sm">
            <div className="w-3 h-4 bg-green-400 rotate-45 border border-green-600" />
            <span className="text-green-300 font-bold text-base">{rupees}</span>
          </div>
          <ScorePanel />
          {/* Mini-map */}
          <MiniMap />
        </div>
      </div>

      {/* Boss HP Bar */}
      <BossHPBar />

      {/* Chest interaction hint */}
      {nearChest && !activeDialogue && !showShop && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="font-bold px-5 py-3 rounded-xl text-base border animate-pulse flex flex-col items-center gap-1"
            style={{
              background: 'rgba(20,10,40,0.88)',
              borderColor: shardInfo?.color ?? '#ffd060',
              color: shardInfo?.color ?? '#ffd060',
            }}>
            <span className="text-2xl">{currentArea === 'boss' ? '🛡️' : '💎'}</span>
            <span>{currentArea === 'boss' ? 'Magic Armor' : (shardInfo?.name ?? 'Treasure')}</span>
            <span className="text-xs text-white/60">Press E to claim</span>
          </div>
        </div>
      )}

      {/* Shop hint */}
      {nearShop && !nearChest && !activeDialogue && !showShop && (
        <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl border border-amber-400/60 animate-pulse"
            style={{ background: 'rgba(10,5,25,0.85)' }}>
            <span className="text-amber-300 font-bold text-sm">🏪 Merchant's Shop</span>
            <span className="text-white/50 text-xs">Press E to shop</span>
          </div>
        </div>
      )}

      {/* Fairy fountain hint */}
      {nearFountain && !nearChest && !activeDialogue && !nearShop && (
        <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl border border-cyan-400/60 animate-pulse"
            style={{ background: 'rgba(0,10,25,0.85)' }}>
            <span className="text-cyan-300 font-bold text-sm">✨ Fairy Fountain</span>
            <span className="text-white/50 text-xs">Press E to fully heal</span>
          </div>
        </div>
      )}

      {/* Boss portal hint */}
      {currentArea === 'field' && shardsCollected >= 3 && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-500/70"
            style={{ background: 'rgba(20,0,40,0.85)' }}>
            <span className="text-purple-300 font-bold text-sm">☠ Malgrath's Lair unlocked! ← West portal</span>
          </div>
        </div>
      )}

      {/* NPC proximity hint */}
      {nearNPC && !nearChest && !activeDialogue && !nearShop && !nearFountain && (() => {
        const npc = NPC_DATA.find(n => n.id === nearNPC);
        return npc ? (
          <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl border border-pink-400/60 animate-pulse"
              style={{ background: 'rgba(10,5,25,0.85)' }}>
              <span className="text-pink-300 font-bold text-sm">{npc.name}</span>
              <span className="text-white/50 text-xs">Press E to talk</span>
            </div>
          </div>
        ) : null;
      })()}

      {/* Dialogue box */}
      {activeDialogue && dialogueNPC && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
          <div className="rounded-2xl border-2 p-4 shadow-2xl"
            style={{ background: 'rgba(8,4,20,0.95)', borderColor: '#e91e8c' }}>
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-pink-900/50">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: dialogueNPC.bodyColor }}>
                <span className="text-base">👤</span>
              </div>
              <div>
                <div className="text-pink-300 font-bold text-sm">{dialogueNPC.name}</div>
                <div className="text-pink-600 text-xs">{dialogueNPC.title}</div>
              </div>
              <div className="ml-auto text-pink-800 text-xs">
                {activeDialogue.line + 1} / {activeDialogue.maxLines}
              </div>
            </div>
            <p className="text-amber-100 text-sm leading-relaxed min-h-[2.5rem]">
              {dialogueNPC.dialogue[activeDialogue.line]}
            </p>
            <div className="mt-2 text-right text-xs text-pink-500 animate-pulse">
              {activeDialogue.line < activeDialogue.maxLines - 1 ? 'Press E to continue ▶' : 'Press E to close ✕'}
            </div>
          </div>
        </div>
      )}

      {/* Bottom: weapon bar + status */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col items-start gap-1">
          {/* Shield indicator */}
          {isBlocking && (
            <div className="bg-blue-900/80 rounded-lg px-3 py-1 border border-blue-400/60 text-blue-300 text-xs font-bold">
              🛡 Blocking
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <WeaponBar />
          <div className="bg-black/55 text-white text-xs font-mono px-3 py-1 rounded-full backdrop-blur-sm">
            WASD move · Space attack · Hold Space=spin · F shield · Q/Shift cycle weapons · Z cycle sword · E interact
          </div>
        </div>

        <div className="w-16" /> {/* spacer */}
      </div>
    </div>
  );
}
