import { useEffect } from 'react';
import { useGameStore } from './store';
import { WEAPONS, WeaponId } from './controls';
import { NPC_DATA } from './npcData';

const WEAPON_ICONS: Record<WeaponId, string> = {
  sword: '⚔', bow: '🏹', bomb: '💣', boomerang: '🪃',
};
const WEAPON_LABELS: Record<WeaponId, string> = {
  sword: 'Sword', bow: 'Bow', bomb: 'Bomb', boomerang: 'Rang',
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

// ── Weapon Bar ────────────────────────────────────────────────────
function WeaponBar() {
  const selected = useGameStore(s => s.selectedWeapon);
  const arrows   = useGameStore(s => s.arrows);
  const bombs    = useGameStore(s => s.bombs);
  const ammo: Partial<Record<WeaponId, number>> = { bow: arrows, bomb: bombs };
  return (
    <div className="flex gap-1 items-end">
      {WEAPONS.map(w => {
        const active = w === selected;
        return (
          <div key={w}
            className={`flex flex-col items-center px-1.5 py-0.5 rounded-lg border-2 transition-all
              ${active ? 'bg-amber-400/90 border-amber-600 scale-110 shadow-lg' : 'bg-black/50 border-gray-600 opacity-70'}`}>
            <span className="text-base leading-none">{WEAPON_ICONS[w]}</span>
            <span className={`text-xs font-bold ${active ? 'text-amber-900' : 'text-gray-300'}`}>
              {WEAPON_LABELS[w]}
            </span>
            {ammo[w] !== undefined && (
              <span className={`text-xs font-mono ${active ? 'text-amber-800' : 'text-gray-400'}`}>
                ×{ammo[w]}
              </span>
            )}
          </div>
        );
      })}
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
function MiniMap() {
  const playerPos    = useGameStore(s => s.playerPosition);
  const currentArea  = useGameStore(s => s.currentArea);
  const chestsOpened = useGameStore(s => s.chestsOpened);
  const shardsCollected = useGameStore(s => s.shardsCollected);

  const SIZE = 100;
  const WORLD = 30; // world is -30 to +30

  const toMap = (x: number, z: number) => ({
    x: (x / WORLD + 1) / 2 * SIZE,
    y: (z / WORLD + 1) / 2 * SIZE,
  });

  const player = toMap(playerPos.x, playerPos.z);

  // Portal dots per area
  const portalDots: { x: number; z: number; color: string }[] = [];
  if (currentArea === 'field') {
    portalDots.push({ x: 0, z: -29, color: '#44ff44' });
    portalDots.push({ x: 29, z: 0, color: '#ff8822' });
    if (shardsCollected >= 3) portalDots.push({ x: -29, z: 0, color: '#9900ff' });
  } else if (currentArea === 'forest') {
    portalDots.push({ x: 0, z: 29, color: '#88aaff' });
  } else if (currentArea === 'desert') {
    portalDots.push({ x: -29, z: 0, color: '#88aaff' });
  } else if (currentArea === 'boss') {
    portalDots.push({ x: 0, z: 29, color: '#88aaff' });
  }

  // Chest dot
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

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      {/* Map background */}
      <div className="absolute inset-0 rounded-lg border border-gray-600/50 overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.7)' }}>
        {/* Area tint */}
        <div className="absolute inset-0 rounded-lg"
          style={{
            background: currentArea === 'forest' ? 'rgba(10,40,10,0.5)'
              : currentArea === 'desert' ? 'rgba(40,30,10,0.5)'
              : currentArea === 'boss' ? 'rgba(20,0,40,0.6)'
              : 'rgba(10,30,10,0.3)',
          }} />
      </div>

      {/* Portals */}
      {portalDots.map((p, i) => {
        const mp = toMap(p.x, p.z);
        return (
          <div key={i} className="absolute rounded-sm" style={{
            left: mp.x - 3, top: mp.y - 3, width: 6, height: 6,
            background: p.color, boxShadow: `0 0 4px ${p.color}`,
          }} />
        );
      })}

      {/* Chest */}
      {chestXZ && (
        <div className="absolute" style={{
          left: toMap(chestXZ[0], chestXZ[1]).x - 4,
          top: toMap(chestXZ[0], chestXZ[1]).y - 4,
          width: 8, height: 8,
          background: chestOpened ? '#888' : '#f0c030',
          border: '1px solid #888',
          borderRadius: 1,
          boxShadow: chestOpened ? 'none' : '0 0 6px #f0c030',
        }} />
      )}

      {/* Fairy Fountain */}
      {fountainXZ && (
        <div className="absolute rounded-full" style={{
          left: toMap(fountainXZ[0], fountainXZ[1]).x - 3,
          top: toMap(fountainXZ[0], fountainXZ[1]).y - 3,
          width: 6, height: 6,
          background: '#44ccff',
          boxShadow: '0 0 5px #44ccff',
        }} />
      )}

      {/* Player dot */}
      <div className="absolute rounded-full" style={{
        left: player.x - 4, top: player.y - 4,
        width: 8, height: 8,
        background: '#e91e8c',
        border: '1.5px solid white',
        boxShadow: '0 0 6px #e91e8c',
        zIndex: 10,
      }} />

      {/* Area label */}
      <div className="absolute bottom-0.5 left-0 right-0 text-center"
        style={{ fontSize: 8, color: '#aaa', fontFamily: 'monospace' }}>
        {AREA_NAMES[currentArea] ?? currentArea}
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

// ── Main HUD ──────────────────────────────────────────────────────
export function HUD() {
  const {
    gameState, rupees, currentArea, nearChest, nearNPC, activeDialogue,
    isBlocking, armorLevel, nearShop, showShop, nearFountain, shardsCollected,
  } = useGameStore();

  const shardInfo = SHARD_INFO.find(s => s.area === currentArea);
  const dialogueNPC = activeDialogue ? NPC_DATA.find(n => n.id === activeDialogue.npcId) : null;

  if (gameState !== 'playing') return null;

  const armorColors = ['', '🔵', '🔴'];

  return (
    <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between select-none">

      {/* Item Fanfare */}
      <ItemFanfare />

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

        {/* Right: Area + Rupees + Mini-map */}
        <div className="flex flex-col items-end gap-1">
          <div className="bg-black/55 rounded-lg px-2 py-0.5 text-white font-bold text-xs backdrop-blur-sm">
            {AREA_NAMES[currentArea] ?? currentArea}
          </div>
          <div className="bg-black/55 rounded-lg px-2 py-1 flex items-center gap-1.5 backdrop-blur-sm">
            <div className="w-3 h-4 bg-green-400 rotate-45 border border-green-600" />
            <span className="text-green-300 font-bold text-base">{rupees}</span>
          </div>
          {/* Mini-map */}
          <div className="bg-black/60 rounded-lg p-0.5 border border-gray-700/50 backdrop-blur-sm">
            <MiniMap />
          </div>
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
            WASD move · Space attack · Hold Space=spin · F shield · Q/Shift cycle · E interact
          </div>
        </div>

        <div className="w-16" /> {/* spacer */}
      </div>
    </div>
  );
}
