import { useGameStore } from './store';
import { WEAPONS, WeaponId } from './controls';

const WEAPON_ICONS: Record<WeaponId, string> = {
  sword:     '⚔',
  bow:       '🏹',
  bomb:      '💣',
  boomerang: '🪃',
};

const WEAPON_LABELS: Record<WeaponId, string> = {
  sword:     'Sword',
  bow:       'Bow',
  bomb:      'Bomb',
  boomerang: 'Rang',
};

const AREA_NAMES: Record<string, string> = {
  field:  'Hyrule Field',
  forest: 'Lost Woods',
  desert: 'Death Mountain',
};

function HeartRow() {
  const hearts    = useGameStore(s => s.hearts);
  const maxHearts = useGameStore(s => s.maxHearts);
  return (
    <div className="flex gap-1">
      {Array.from({ length: maxHearts }).map((_, i) => {
        const full = i < Math.floor(hearts);
        const half = !full && i < hearts;
        return (
          <svg key={i} viewBox="0 0 24 24" className="w-7 h-7 drop-shadow">
            <defs>
              <clipPath id={`half-${i}`}>
                <rect x="0" y="0" width="12" height="24" />
              </clipPath>
            </defs>
            {/* Empty heart */}
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#555" stroke="#333" strokeWidth="1" />
            {/* Full or half fill */}
            {(full || half) && (
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="#ee2244"
                clipPath={half ? `url(#half-${i})` : undefined}
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}

function WeaponBar() {
  const selected = useGameStore(s => s.selectedWeapon);
  const arrows   = useGameStore(s => s.arrows);
  const bombs    = useGameStore(s => s.bombs);

  const ammo: Partial<Record<WeaponId, number>> = { bow: arrows, bomb: bombs };

  return (
    <div className="flex gap-1.5 items-end">
      {WEAPONS.map(w => {
        const active = w === selected;
        return (
          <div
            key={w}
            className={`flex flex-col items-center px-2 py-1 rounded-lg border-2 transition-all
              ${active
                ? 'bg-amber-400/90 border-amber-600 scale-110 shadow-lg'
                : 'bg-black/50 border-gray-600 opacity-70'
              }`}
          >
            <span className="text-xl leading-none">{WEAPON_ICONS[w]}</span>
            <span className={`text-xs font-bold mt-0.5 ${active ? 'text-amber-900' : 'text-gray-300'}`}>
              {WEAPON_LABELS[w]}
            </span>
            {ammo[w] !== undefined && (
              <span className={`text-xs font-mono ${active ? 'text-amber-800' : 'text-gray-400'}`}>
                x{ammo[w]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function HUD() {
  const { gameState, rupees, currentArea, nearChest } = useGameStore();

  if (gameState !== 'playing') return null;

  return (
    <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between select-none">
      {/* Top row */}
      <div className="flex justify-between items-start">
        {/* Hearts */}
        <div className="bg-black/55 rounded-xl px-3 py-2 backdrop-blur-sm">
          <HeartRow />
        </div>

        {/* Area name + Rupees */}
        <div className="flex flex-col items-end gap-1">
          <div className="bg-black/55 rounded-xl px-3 py-1 text-white font-bold text-sm backdrop-blur-sm">
            {AREA_NAMES[currentArea] ?? currentArea}
          </div>
          <div className="bg-black/55 rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-sm">
            <div className="w-4 h-5 bg-green-400 rotate-45 border border-green-600 shadow-sm" />
            <span className="text-green-300 font-bold text-xl">{rupees}</span>
          </div>
        </div>
      </div>

      {/* Chest interaction hint */}
      {nearChest && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="bg-amber-900/90 text-amber-200 font-bold px-5 py-2 rounded-xl text-base border border-amber-500 animate-pulse">
            Press E to open the chest
          </div>
        </div>
      )}

      {/* Bottom: weapon bar + controls */}
      <div className="flex flex-col items-center gap-2">
        <WeaponBar />
        <div className="bg-black/55 text-white text-xs font-mono px-4 py-1.5 rounded-full backdrop-blur-sm">
          WASD move&nbsp; • &nbsp;SPACE use weapon&nbsp; • &nbsp;Q/Shift cycle weapon&nbsp; • &nbsp;E interact&nbsp; • &nbsp;Portals: walk through the gates
        </div>
      </div>
    </div>
  );
}
