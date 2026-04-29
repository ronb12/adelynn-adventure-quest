import { create } from 'zustand';
import * as THREE from 'three';
import { WeaponId, WEAPONS } from './controls';
import { NPC_DATA } from './npcData';
import { saveGame, loadGame, deleteSave, getAreaSpawn, SaveData } from './saveManager';

export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';
export type AreaId = 'field' | 'forest' | 'desert' | 'boss' | 'jungle' | 'ice' | 'volcano' | 'sky' | 'crypt' | 'void' | 'cave' | 'home';
export type SleepPhase = 'none' | 'changing' | 'walking' | 'lying' | 'sleeping' | 'waking' | 'rising';

export type SwordId =
  | 'crystal' | 'flame' | 'thunder' | 'frost' | 'shadow'
  | 'holy'    | 'viper' | 'storm'   | 'dragon' | 'cosmos';

export const SWORD_DEFS: Record<SwordId, {
  name: string; damage: number; desc: string; icon: string;
  blade: string; guard: string; grip: string;
  emissive: string; emissiveInt: number; light: string;
}> = {
  crystal: { name: 'Crystal Sword',  damage: 1.0, desc: 'Your trusty starting blade.',        icon: '⚔️',  blade: '#f48fb1', guard: '#b0bec5', grip: '#e91e8c', emissive: '#ff80c0', emissiveInt: 0.4, light: '#ff80c0' },
  flame:   { name: 'Flame Sword',    damage: 1.5, desc: 'Fiery blade. +50% damage.',           icon: '🔥',  blade: '#ff7733', guard: '#cc3300', grip: '#880000', emissive: '#ff5500', emissiveInt: 1.5, light: '#ff6600' },
  thunder: { name: 'Thunder Blade',  damage: 1.2, desc: 'Crackles with lightning energy.',     icon: '⚡',  blade: '#ffee22', guard: '#aa8800', grip: '#443300', emissive: '#ffcc00', emissiveInt: 1.8, light: '#ffdd00' },
  frost:   { name: 'Frost Edge',     damage: 1.1, desc: 'Ice-cold precision blade.',           icon: '❄️',  blade: '#80d4ff', guard: '#4488bb', grip: '#003366', emissive: '#00aaff', emissiveInt: 1.2, light: '#44ccff' },
  shadow:  { name: 'Shadow Blade',   damage: 1.3, desc: 'Strikes from the darkness.',          icon: '🌑',  blade: '#9933ff', guard: '#440088', grip: '#1a0033', emissive: '#6600cc', emissiveInt: 1.5, light: '#8800ff' },
  holy:    { name: 'Holy Blade',     damage: 2.0, desc: 'Sacred light. Double damage!',        icon: '✨',  blade: '#fffff0', guard: '#ddcc66', grip: '#996600', emissive: '#ffffc0', emissiveInt: 2.2, light: '#ffffaa' },
  viper:   { name: 'Viper Fang',     damage: 1.2, desc: 'Venomous strike from the shadows.',   icon: '🐍',  blade: '#22dd55', guard: '#115522', grip: '#002200', emissive: '#00ff55', emissiveInt: 1.2, light: '#00ee44' },
  storm:   { name: 'Storm Sword',    damage: 1.4, desc: 'Wind-forged. Wider spin radius.',      icon: '🌪️', blade: '#00d4cc', guard: '#005566', grip: '#001a1a', emissive: '#00cccc', emissiveInt: 1.5, light: '#00ddcc' },
  dragon:  { name: 'Dragon Blade',   damage: 2.5, desc: 'Immense power. 2.5× base damage!',    icon: '🐉',  blade: '#ff2200', guard: '#880000', grip: '#330000', emissive: '#cc1100', emissiveInt: 2.0, light: '#ff3300' },
  cosmos:  { name: 'Cosmos Blade',   damage: 2.0, desc: 'Star-forged. The ultimate weapon.',   icon: '🌟',  blade: '#cc00ff', guard: '#660099', grip: '#220033', emissive: '#aa00ff', emissiveInt: 2.5, light: '#cc00ff' },
};

// Sword chest definitions — shared between Player.tsx (proximity) and World.tsx (visuals)
export const SWORD_CHESTS: { key: string; pos: [number, number, number]; area: AreaId; swordId: SwordId }[] = [
  { key: 'sword-flame',   pos: [20, 0, -20],  area: 'field',  swordId: 'flame'   },
  { key: 'sword-viper',   pos: [-20, 0, 20],  area: 'field',  swordId: 'viper'   },
  { key: 'sword-thunder', pos: [-15, 0, -20], area: 'desert', swordId: 'thunder' },
  { key: 'sword-storm',   pos: [15, 0, 20],   area: 'desert', swordId: 'storm'   },
  { key: 'sword-frost',   pos: [-18, 0, 15],  area: 'forest', swordId: 'frost'   },
  { key: 'sword-shadow',  pos: [18, 0, 15],   area: 'forest', swordId: 'shadow'  },
  { key: 'sword-holy',    pos: [10, 0, 5],    area: 'boss',   swordId: 'holy'    },
  { key: 'sword-dragon',  pos: [-10, 0, -5],  area: 'boss',   swordId: 'dragon'  },
  { key: 'sword-cosmos',  pos: [0, 0, -15],   area: 'boss',   swordId: 'cosmos'  },
];

export interface WeaponPickup {
  key: string;
  weaponId: WeaponId;
  area: AreaId;
  pos: [number, number, number];
  label: string;
  icon: string;
  color: string;
  desc: string;
  starterAmmo?: {
    arrows?: number; bombs?: number; shurikens?: number;
    frostCharges?: number; flareCharges?: number;
    veilCrystals?: number; quakeRunes?: number; moonbowAmmo?: number;
  };
}

export const WEAPON_PICKUPS: WeaponPickup[] = [
  // ── Sunfield Plains ── (easy, beginner tools)
  { key: 'weapon-bow',       weaponId: 'bow',      area: 'field',  pos: [22, 0, 6],    label: 'Aldenmere Bow',  icon: '🏹', color: '#88aaff', desc: 'Fire arrows to strike distant foes.',         starterAmmo: { arrows: 20 } },
  { key: 'weapon-boomerang', weaponId: 'boomerang', area: 'field',  pos: [-22, 0, -5],  label: 'Shadowrang',     icon: '🌒', color: '#ffaa44', desc: 'Returning arc weapon. Unlimited uses.' },
  // ── Whisper Woods ── (magical tools)
  { key: 'weapon-wand',      weaponId: 'wand',     area: 'forest', pos: [20, 0, 5],    label: 'Wand of Sparks', icon: '🪄', color: '#ff88dd', desc: 'Fires magic orbs. Unlimited uses.' },
  { key: 'weapon-frost',     weaponId: 'frost',    area: 'forest', pos: [-8, 0, 20],   label: 'Frost Scepter',  icon: '❄️', color: '#44ccff', desc: 'Ice bolt that slows enemies.',                starterAmmo: { frostCharges: 10 } },
  { key: 'weapon-moonbow',   weaponId: 'moonbow',  area: 'forest', pos: [4, 0, -22],   label: 'Moonbow',        icon: '🌙', color: '#8844cc', desc: 'Moon-crescent fan-shot. Powerful ranged.',    starterAmmo: { moonbowAmmo: 15 } },
  // ── Ashrock Summit ── (explosive tools)
  { key: 'weapon-bomb',      weaponId: 'bomb',     area: 'desert', pos: [-20, 0, -16], label: 'Ember Vial',     icon: '🧪', color: '#ff4422', desc: 'Throwable explosive. Area damage.',           starterAmmo: { bombs: 8 } },
  { key: 'weapon-shuriken',  weaponId: 'shuriken', area: 'desert', pos: [20, 0, -14],  label: 'Void Stars',     icon: '⭐', color: '#00ffcc', desc: 'Spread-throw spinning stars.',                starterAmmo: { shurikens: 25 } },
  { key: 'weapon-flare',     weaponId: 'flare',    area: 'desert', pos: [-8, 0, -22],  label: "Solara's Flare", icon: '☀️', color: '#ff8800', desc: 'Area fire burst. Hits all nearby.',           starterAmmo: { flareCharges: 5 } },
  // ── Malgrath's Lair ── (ultimate weapons)
  { key: 'weapon-shadow',    weaponId: 'shadow',   area: 'boss',   pos: [-18, 0, -8],  label: 'Shadow Veil',    icon: '🌑', color: '#aa00ff', desc: 'Vanish from sight for 2.5 seconds.' },
  { key: 'weapon-veil',      weaponId: 'veil',     area: 'boss',   pos: [18, 0, -8],   label: "Glacira's Veil", icon: '💠', color: '#00aaff', desc: 'Instantly freeze all nearby enemies.',        starterAmmo: { veilCrystals: 3 } },
  { key: 'weapon-quake',     weaponId: 'quake',    area: 'boss',   pos: [14, 0, 14],   label: 'Cragus Strike',  icon: '🪨', color: '#aa8844', desc: 'Ground slam stuns all on-screen foes.',       starterAmmo: { quakeRunes: 3 } },
  { key: 'weapon-aura',      weaponId: 'aura',     area: 'boss',   pos: [-14, 0, 14],  label: 'Aura Ring',      icon: '💫', color: '#ffff44', desc: 'Orbiting crystal shield for 4 seconds.' },
  { key: 'weapon-chain',     weaponId: 'chain',    area: 'boss',   pos: [0, 0, 14],    label: 'Chain Anchor',   icon: '⛓️', color: '#8888aa', desc: 'Grapple and stun with a chain throw.' },
];

export interface AreaTransition {
  area: AreaId;
  spawnPos: THREE.Vector3;
}

export interface ItemFanfare {
  name: string;
  icon: string;
  desc: string;
}

interface GameStore {
  gameState: GameState;
  hearts: number;
  maxHearts: number;
  rupees: number;
  arrows: number;
  bombs: number;
  shurikens: number;
  // New weapon ammo
  frostCharges: number;
  flareCharges: number;
  veilCrystals: number;
  quakeRunes: number;
  moonbowAmmo: number;
  // Cooldown-based weapon timers (ms timestamps — 0 = ready)
  auraEndTime: number;
  shadowEndTime: number;
  chainCooldownEnd: number;
  hurtCooldownEnd: number; // iframes after taking damage

  playerPosition: THREE.Vector3;
  playerDirection: THREE.Vector3;
  swordActive: boolean;
  swordPosition: THREE.Vector3;
  spinActive: boolean;
  spinPosition: THREE.Vector3;
  isBlocking: boolean;
  selectedWeapon: WeaponId;
  activeSword: SwordId;
  unlockedSwords: SwordId[];
  currentArea: AreaId;
  pendingTransition: AreaTransition | null;
  pendingWeaponFire: WeaponId | null;
  nearChest: boolean;
  nearWeaponPickup: string | null;
  unlockedWeapons: WeaponId[];
  shardsCollected: number;
  chestsOpened: string[];
  nearNPC: string | null;
  activeDialogue: { npcId: string; line: number; maxLines: number } | null;
  talkedToNPCs: string[];
  heartPiecesCollected: string[];
  armorLevel: 0 | 1 | 2;
  itemFanfare: ItemFanfare | null;
  bossHP: number;
  bossMaxHP: number;
  bossDefeated: boolean;
  showShop: boolean;
  nearShop: boolean;
  nearFountain: boolean;
  nearBed: boolean;
  areasVisited: AreaId[];
  eliteKills: number;
  guardianDefeated: AreaId[];
  currentGuardianHP: number;
  currentGuardianMaxHP: number;

  setGameState: (state: GameState) => void;
  togglePause: () => void;
  addRupees: (amount: number) => void;
  addArrows: (amount: number) => void;
  addBombs:  (amount: number) => void;
  addShurikens: (amount: number) => void;
  addFrostCharges: (n: number) => void;
  addFlareCharges: (n: number) => void;
  addVeilCrystals: (n: number) => void;
  addQuakeRunes: (n: number) => void;
  addMoonbowAmmo: (n: number) => void;
  useArrow: () => boolean;
  useBomb: () => boolean;
  useShuriken: () => boolean;
  useFrostCharge: () => boolean;
  useFlareCharge: () => boolean;
  useVeilCrystal: () => boolean;
  useQuakeRune: () => boolean;
  useMoonbowAmmo: () => boolean;
  activateAura: () => void;
  activateShadow: () => void;
  activateChain: () => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  fullHeal: () => void;
  setPlayerPosition: (pos: THREE.Vector3) => void;
  setPlayerDirection: (dir: THREE.Vector3) => void;
  setSwordState: (active: boolean, pos: THREE.Vector3) => void;
  setSpinState: (active: boolean, pos: THREE.Vector3) => void;
  setBlocking: (v: boolean) => void;
  setSelectedWeapon: (w: WeaponId) => void;
  cycleWeapon: (dir: 1 | -1) => void;
  cycleSword: (dir: 1 | -1) => void;
  unlockSword: (id: SwordId) => void;
  fireWeapon: (w: WeaponId) => void;
  clearPendingWeaponFire: () => void;
  triggerAreaTransition: (t: AreaTransition) => void;
  setNearChest: (v: boolean) => void;
  setNearWeaponPickup: (id: string | null) => void;
  unlockWeaponPickup: (weaponId: WeaponId, pickupKey: string) => void;
  openChest: (area: string) => void;
  setNearNPC: (id: string | null) => void;
  startDialogue: (npcId: string) => void;
  advanceDialogue: () => void;
  collectHeartPiece: (id: string) => void;
  setItemFanfare: (item: ItemFanfare | null) => void;
  damageBoss: (amount: number) => void;
  setNearShop: (v: boolean) => void;
  openShop: () => void;
  closeShop: () => void;
  buyItem: (item: 'arrows' | 'bombs' | 'heart' | 'shurikens' | 'frost' | 'flare' | 'veil' | 'quake' | 'moonbow', cost: number) => boolean;
  setNearFountain: (v: boolean) => void;
  useFountain: () => void;
  sleepPhase: SleepPhase;
  sleepOverlayOpacity: number;
  setNearBed: (v: boolean) => void;
  startSleep: () => void;
  setSleepPhase: (phase: SleepPhase) => void;
  finishSleeping: () => void;
  endSleepSequence: () => void;
  setArmorLevel: (level: 0 | 1 | 2) => void;
  resetGame: () => void;
  lastSaveTime: number;
  // Score / combo / timer
  score: number;
  comboCount: number;
  comboTimer: number;
  runStartTime: number;
  addKill: (pts: number) => void;
  tickCombo: (delta: number) => void;
  // Lore stones
  nearLore: string | null;
  loreRead: string[];
  setNearLore: (id: string | null) => void;
  markLoreRead: (id: string) => void;
  addEliteKill: () => void;
  spawnGuardian: (area: AreaId, maxHP: number) => void;
  damageGuardian: (dmg: number) => void;
  triggerSave: () => void;
  performSave: () => void;
  loadFromSave: () => boolean;
  deleteSaveData: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'title',
  hearts: 5,
  maxHearts: 5,
  rupees: 0,
  arrows: 10,
  bombs: 5,
  shurikens: 15,
  frostCharges: 8,
  flareCharges: 3,
  veilCrystals: 3,
  quakeRunes: 2,
  moonbowAmmo: 10,
  auraEndTime: 0,
  shadowEndTime: 0,
  chainCooldownEnd: 0,
  hurtCooldownEnd: 0,
  playerPosition: new THREE.Vector3(0, 0, 0),
  playerDirection: new THREE.Vector3(0, 0, -1),
  swordActive: false,
  swordPosition: new THREE.Vector3(0, 0, 0),
  spinActive: false,
  spinPosition: new THREE.Vector3(0, 0, 0),
  isBlocking: false,
  selectedWeapon: 'sword',
  activeSword: 'crystal',
  unlockedSwords: ['crystal'],
  currentArea: 'field',
  pendingTransition: null,
  pendingWeaponFire: null,
  nearChest: false,
  nearWeaponPickup: null,
  unlockedWeapons: ['sword'],
  shardsCollected: 0,
  chestsOpened: [],
  nearNPC: null,
  activeDialogue: null,
  talkedToNPCs: [],
  heartPiecesCollected: [],
  armorLevel: 0,
  itemFanfare: null,
  bossHP: 20,
  bossMaxHP: 20,
  bossDefeated: false,
  showShop: false,
  nearShop: false,
  nearFountain: false,
  nearBed: false,
  sleepPhase: 'none' as SleepPhase,
  sleepOverlayOpacity: 0,
  areasVisited: ['field' as AreaId],
  eliteKills: 0,
  lastSaveTime: 0,
  score: 0,
  comboCount: 0,
  comboTimer: 0,
  runStartTime: 0,
  nearLore: null,
  loreRead: [],
  guardianDefeated: [],
  currentGuardianHP: 0,
  currentGuardianMaxHP: 0,

  setGameState: (state) => set((s) => ({
    gameState: state,
    runStartTime: state === 'playing' && s.runStartTime === 0 ? Date.now() : s.runStartTime,
  })),
  togglePause: () => set((s) => {
    if (s.gameState === 'playing') return { gameState: 'paused' as GameState };
    if (s.gameState === 'paused')  return { gameState: 'playing' as GameState };
    return {};
  }),
  addRupees: (amount) => set((s) => ({ rupees: s.rupees + amount })),
  addArrows: (amount) => set((s) => ({ arrows: Math.min(s.arrows + amount, 99) })),
  addBombs:  (amount) => set((s) => ({ bombs:  Math.min(s.bombs  + amount, 20) })),
  addShurikens: (amount) => set((s) => ({ shurikens: Math.min(s.shurikens + amount, 60) })),
  addFrostCharges: (n) => set((s) => ({ frostCharges: Math.min(s.frostCharges + n, 20) })),
  addFlareCharges: (n) => set((s) => ({ flareCharges: Math.min(s.flareCharges + n, 10) })),
  addVeilCrystals: (n) => set((s) => ({ veilCrystals: Math.min(s.veilCrystals + n, 10) })),
  addQuakeRunes: (n) => set((s) => ({ quakeRunes: Math.min(s.quakeRunes + n, 8) })),
  addMoonbowAmmo: (n) => set((s) => ({ moonbowAmmo: Math.min(s.moonbowAmmo + n, 60) })),

  useArrow: () => {
    const arrows = get().arrows;
    if (arrows <= 0) return false;
    set({ arrows: arrows - 1 });
    return true;
  },
  useBomb: () => {
    const bombs = get().bombs;
    if (bombs <= 0) return false;
    set({ bombs: bombs - 1 });
    return true;
  },
  useShuriken: () => {
    const shurikens = get().shurikens;
    if (shurikens <= 0) return false;
    set({ shurikens: shurikens - 1 });
    return true;
  },
  useFrostCharge: () => {
    const n = get().frostCharges;
    if (n <= 0) return false;
    set({ frostCharges: n - 1 });
    return true;
  },
  useFlareCharge: () => {
    const n = get().flareCharges;
    if (n <= 0) return false;
    set({ flareCharges: n - 1 });
    return true;
  },
  useVeilCrystal: () => {
    const n = get().veilCrystals;
    if (n <= 0) return false;
    set({ veilCrystals: n - 1 });
    return true;
  },
  useQuakeRune: () => {
    const n = get().quakeRunes;
    if (n <= 0) return false;
    set({ quakeRunes: n - 1 });
    return true;
  },
  useMoonbowAmmo: () => {
    const n = get().moonbowAmmo;
    if (n <= 0) return false;
    set({ moonbowAmmo: n - 1 });
    return true;
  },
  activateAura: () => set({ auraEndTime: Date.now() + 4000 }),
  activateShadow: () => set({ shadowEndTime: Date.now() + 2500 }),
  activateChain: () => set({ chainCooldownEnd: Date.now() + 4000 }),

  damagePlayer: (amount) => set((s) => {
    const now = Date.now();
    // Shadow Veil immunity
    if (s.shadowEndTime > now) return {};
    // Invincibility frames — 1.5s after each hit
    if (s.hurtCooldownEnd > now) return {};
    const reduction = s.armorLevel === 2 ? 0.5 : s.armorLevel === 1 ? 0.75 : 1.0;
    const blockReduction = s.isBlocking ? 0.25 : 1.0;
    const finalAmount = amount * reduction * blockReduction;
    const newHearts = Math.max(0, s.hearts - finalAmount);
    if (newHearts === 0) return { hearts: 0, gameState: 'gameover' as GameState, hurtCooldownEnd: now + 1500 };
    return { hearts: newHearts, hurtCooldownEnd: now + 1500 };
  }),
  healPlayer: (amount) => set((s) => ({ hearts: Math.min(s.maxHearts, s.hearts + amount) })),
  fullHeal: () => set((s) => ({ hearts: s.maxHearts })),

  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerDirection: (dir) => set({ playerDirection: dir }),
  setSwordState: (active, pos) => set({ swordActive: active, swordPosition: pos }),
  setSpinState: (active, pos) => set({ spinActive: active, spinPosition: pos }),
  setBlocking: (v) => set({ isBlocking: v }),
  setSelectedWeapon: (w) => set({ selectedWeapon: w }),

  cycleWeapon: (dir) => set((s) => {
    const avail = s.unlockedWeapons;
    if (avail.length <= 1) return {};
    const idx = avail.indexOf(s.selectedWeapon);
    const safeIdx = idx >= 0 ? idx : 0;
    const next = (safeIdx + dir + avail.length) % avail.length;
    return { selectedWeapon: avail[next] };
  }),

  cycleSword: (dir) => set((s) => {
    const ids = s.unlockedSwords;
    if (ids.length <= 1) return {};
    const idx = ids.indexOf(s.activeSword);
    const next = (idx + dir + ids.length) % ids.length;
    return { activeSword: ids[next] };
  }),

  unlockSword: (id) => set((s) => {
    if (s.unlockedSwords.includes(id)) return {};
    const unlockedSwords = [...s.unlockedSwords, id];
    return { unlockedSwords, activeSword: id };
  }),

  fireWeapon: (w) => set({ pendingWeaponFire: w }),
  clearPendingWeaponFire: () => set({ pendingWeaponFire: null }),
  triggerAreaTransition: (t) => set((s) => ({
    currentArea: t.area,
    pendingTransition: t,
    areasVisited: s.areasVisited.includes(t.area) ? s.areasVisited : [...s.areasVisited, t.area],
  })),
  setNearChest: (v) => set({ nearChest: v }),
  setNearWeaponPickup: (id) => set({ nearWeaponPickup: id }),

  unlockWeaponPickup: (weaponId, pickupKey) => set((s) => {
    if (s.chestsOpened.includes(pickupKey)) return {};
    const pickup = WEAPON_PICKUPS.find(p => p.key === pickupKey);
    const ammo = pickup?.starterAmmo ?? {};
    const alreadyHave = s.unlockedWeapons.includes(weaponId);
    return {
      chestsOpened: [...s.chestsOpened, pickupKey],
      unlockedWeapons: alreadyHave ? s.unlockedWeapons : [...s.unlockedWeapons, weaponId],
      selectedWeapon: weaponId,
      arrows:       ammo.arrows       ? Math.min(s.arrows       + ammo.arrows,       99) : s.arrows,
      bombs:        ammo.bombs        ? Math.min(s.bombs        + ammo.bombs,        20) : s.bombs,
      shurikens:    ammo.shurikens    ? Math.min(s.shurikens    + ammo.shurikens,    60) : s.shurikens,
      frostCharges: ammo.frostCharges ? Math.min(s.frostCharges + ammo.frostCharges, 20) : s.frostCharges,
      flareCharges: ammo.flareCharges ? Math.min(s.flareCharges + ammo.flareCharges, 10) : s.flareCharges,
      veilCrystals: ammo.veilCrystals ? Math.min(s.veilCrystals + ammo.veilCrystals, 10) : s.veilCrystals,
      quakeRunes:   ammo.quakeRunes   ? Math.min(s.quakeRunes   + ammo.quakeRunes,    8) : s.quakeRunes,
      moonbowAmmo:  ammo.moonbowAmmo  ? Math.min(s.moonbowAmmo  + ammo.moonbowAmmo,  60) : s.moonbowAmmo,
      itemFanfare: pickup ? { name: pickup.label, icon: pickup.icon, desc: pickup.desc } : null,
    };
  }),

  openChest: (area) => set((s) => {
    if (s.chestsOpened.includes(area)) return {};
    const newOpened = [...s.chestsOpened, area];

    // Armor chest
    if (area === 'boss-armor') {
      return {
        chestsOpened: newOpened,
        armorLevel: Math.min(2, s.armorLevel + 1) as 0 | 1 | 2,
        itemFanfare: {
          name: s.armorLevel === 0 ? 'Blue Tunic' : 'Red Tunic',
          icon: '🛡️',
          desc: s.armorLevel === 0
            ? 'Reduces damage taken by 25%!'
            : 'Reduces damage taken by 50%!',
        },
      };
    }

    // Sword chests
    const swordChest = SWORD_CHESTS.find(c => c.key === area);
    if (swordChest) {
      const { swordId } = swordChest;
      const def = SWORD_DEFS[swordId];
      const alreadyHave = s.unlockedSwords.includes(swordId);
      return {
        chestsOpened: newOpened,
        unlockedSwords: alreadyHave ? s.unlockedSwords : [...s.unlockedSwords, swordId],
        activeSword: swordId,
        itemFanfare: {
          name: def.name,
          icon: def.icon,
          desc: alreadyHave ? 'You already have this blade!' : def.desc,
        },
      };
    }

    // Crystal shard chests
    const rupeesGain = 25 + Math.floor(Math.random() * 20);
    const newRupees  = s.rupees + rupeesGain;
    const newShards  = s.shardsCollected + 1;
    const shardNames: Record<string, string> = {
      field: 'Shard of Dawn', forest: 'Shard of Dusk', desert: 'Shard of Ember'
    };
    const fanfare: ItemFanfare = {
      name: shardNames[area] ?? 'Crystal Shard',
      icon: '💎',
      desc: `Crystal Shard ${newShards}/3 collected! +${rupeesGain} Rupees`,
    };
    return {
      chestsOpened: newOpened,
      shardsCollected: newShards,
      rupees: newRupees,
      itemFanfare: fanfare,
    };
  }),

  setNearNPC: (id) => set({ nearNPC: id }),

  startDialogue: (npcId) => set((s) => {
    const npc = NPC_DATA.find(n => n.id === npcId);
    if (!npc) return {};
    const alreadyTalked = s.talkedToNPCs.includes(npcId);
    return {
      activeDialogue: { npcId, line: 0, maxLines: npc.dialogue.length },
      talkedToNPCs: alreadyTalked ? s.talkedToNPCs : [...s.talkedToNPCs, npcId],
    };
  }),

  advanceDialogue: () => set((s) => {
    if (!s.activeDialogue) return {};
    const next = s.activeDialogue.line + 1;
    if (next >= s.activeDialogue.maxLines) return { activeDialogue: null };
    return { activeDialogue: { ...s.activeDialogue, line: next } };
  }),

  collectHeartPiece: (id) => set((s) => {
    if (s.heartPiecesCollected.includes(id)) return {};
    const newCollected = [...s.heartPiecesCollected, id];
    const newMax = 3 + Math.floor(newCollected.length / 4);
    return {
      heartPiecesCollected: newCollected,
      maxHearts: newMax,
      itemFanfare: {
        name: `Heart Piece (${newCollected.length % 4 === 0 ? '4/4' : `${newCollected.length % 4}/4`})`,
        icon: '❤️',
        desc: newCollected.length % 4 === 0
          ? 'New Heart Container! Max hearts increased!'
          : `${4 - (newCollected.length % 4)} more pieces for a new heart!`,
      },
    };
  }),

  setItemFanfare: (item) => set({ itemFanfare: item }),

  damageBoss: (amount) => set((s) => {
    const newHP = Math.max(0, s.bossHP - amount);
    if (newHP <= 0) {
      return { bossHP: 0, bossDefeated: true, gameState: 'victory' as GameState };
    }
    return { bossHP: newHP };
  }),

  setNearShop: (v) => set({ nearShop: v }),
  openShop: () => set({ showShop: true }),
  closeShop: () => set({ showShop: false }),

  buyItem: (item, cost) => {
    const s = get();
    if (s.rupees < cost) return false;
    const spend = { rupees: s.rupees - cost };
    if (item === 'arrows')    set({ ...spend, arrows: Math.min(s.arrows + 10, 99) });
    else if (item === 'bombs') set({ ...spend, bombs: Math.min(s.bombs + 5, 20) });
    else if (item === 'shurikens') set({ ...spend, shurikens: Math.min(s.shurikens + 15, 60) });
    else if (item === 'heart') set((st) => ({ rupees: st.rupees - cost, hearts: Math.min(st.hearts + 1, st.maxHearts) }));
    else if (item === 'frost') set({ ...spend, frostCharges: Math.min(s.frostCharges + 5, 20) });
    else if (item === 'flare') set({ ...spend, flareCharges: Math.min(s.flareCharges + 3, 10) });
    else if (item === 'veil')  set({ ...spend, veilCrystals: Math.min(s.veilCrystals + 3, 10) });
    else if (item === 'quake') set({ ...spend, quakeRunes: Math.min(s.quakeRunes + 2, 8) });
    else if (item === 'moonbow') set({ ...spend, moonbowAmmo: Math.min(s.moonbowAmmo + 10, 60) });
    return true;
  },

  setNearFountain: (v) => set({ nearFountain: v }),
  useFountain: () => set((s) => ({ hearts: s.maxHearts })),
  setNearBed: (v) => set({ nearBed: v }),
  startSleep: () => {
    const s = get();
    if (s.gameState !== 'playing' || s.sleepPhase !== 'none') return;
    set({ sleepPhase: 'changing', sleepOverlayOpacity: 0 });
  },
  setSleepPhase: (phase) => set({ sleepPhase: phase, sleepOverlayOpacity: phase === 'none' ? 0 : get().sleepOverlayOpacity }),
  finishSleeping: () => {
    set((st) => ({ hearts: st.maxHearts }));
    get().performSave();
    set({ itemFanfare: { name: "Good morning, Adelynn!", icon: '☀️', desc: 'All hearts restored — progress saved.' } });
  },
  endSleepSequence: () => set({ sleepPhase: 'none', sleepOverlayOpacity: 0 }),
  setArmorLevel: (level) => set({ armorLevel: level }),

  addKill: (pts) => set((s) => {
    const multiplier = Math.min(s.comboCount + 1, 5);
    const earned = pts * multiplier;
    return { score: s.score + earned, comboCount: s.comboCount + 1, comboTimer: 3.5 };
  }),
  tickCombo: (delta) => set((s) => {
    if (s.comboTimer <= 0) return {};
    const newTimer = s.comboTimer - delta;
    if (newTimer <= 0) return { comboTimer: 0, comboCount: 0 };
    return { comboTimer: newTimer };
  }),
  setNearLore: (id) => set({ nearLore: id }),
  markLoreRead: (id) => set((s) => ({ loreRead: [...s.loreRead.filter(x => x !== id), id] })),
  addEliteKill: () => set((s) => ({
    eliteKills: s.eliteKills + 1,
    score: s.score + 500,
    comboCount: s.comboCount + 3,
    comboTimer: 5.0,
  })),

  spawnGuardian: (area, maxHP) => set((s) => {
    if (s.guardianDefeated.includes(area)) return {};
    return { currentGuardianHP: maxHP, currentGuardianMaxHP: maxHP };
  }),

  damageGuardian: (dmg) => set((s) => {
    const newHP = Math.max(0, s.currentGuardianHP - dmg);
    if (newHP <= 0) {
      return {
        currentGuardianHP: 0,
        guardianDefeated: [...s.guardianDefeated, s.currentArea],
        rupees: s.rupees + 15,
        hearts: Math.min(s.hearts + 1, s.maxHearts),
        score: s.score + 2000,
        comboCount: s.comboCount + 5,
        comboTimer: 5.0,
        itemFanfare: { name: 'Area Guardian Defeated!', icon: '👑', desc: '+15 Rupees · +1 Heart' },
      };
    }
    return { currentGuardianHP: newHP };
  }),

  resetGame: () => set({
    gameState: 'playing',
    hearts: 5,
    maxHearts: 5,
    rupees: 0,
    arrows: 10,
    bombs: 5,
    shurikens: 15,
    frostCharges: 8,
    flareCharges: 3,
    veilCrystals: 3,
    quakeRunes: 2,
    moonbowAmmo: 10,
    auraEndTime: 0,
    shadowEndTime: 0,
    chainCooldownEnd: 0,
    hurtCooldownEnd: 0,
    playerPosition: new THREE.Vector3(0, 0, 0),
    playerDirection: new THREE.Vector3(0, 0, -1),
    swordActive: false,
    spinActive: false,
    isBlocking: false,
    selectedWeapon: 'sword',
    activeSword: 'crystal',
    unlockedSwords: ['crystal'],
    currentArea: 'field',
    pendingTransition: null,
    pendingWeaponFire: null,
    nearChest: false,
    nearWeaponPickup: null,
    unlockedWeapons: ['sword'],
    shardsCollected: 0,
    chestsOpened: [],
    nearNPC: null,
    activeDialogue: null,
    talkedToNPCs: [],
    heartPiecesCollected: [],
    armorLevel: 0,
    itemFanfare: null,
    bossHP: 20,
    bossMaxHP: 20,
    bossDefeated: false,
    showShop: false,
    nearShop: false,
    nearFountain: false,
    nearBed: false,
    sleepPhase: 'none' as SleepPhase,
    sleepOverlayOpacity: 0,
    lastSaveTime: 0,
    score: 0,
    comboCount: 0,
    comboTimer: 0,
    runStartTime: Date.now(),
    nearLore: null,
    loreRead: [],
    areasVisited: ['field' as AreaId],
    eliteKills: 0,
    guardianDefeated: [],
    currentGuardianHP: 0,
    currentGuardianMaxHP: 0,
  }),

  triggerSave: () => set({ lastSaveTime: Date.now() }),

  performSave: () => {
    const s = get();
    if (s.gameState !== 'playing') return;
    const data: SaveData = {
      version: 1,
      timestamp: Date.now(),
      hearts: s.hearts,
      maxHearts: s.maxHearts,
      rupees: s.rupees,
      arrows: s.arrows,
      bombs: s.bombs,
      shurikens: s.shurikens,
      frostCharges: s.frostCharges,
      flareCharges: s.flareCharges,
      veilCrystals: s.veilCrystals,
      quakeRunes: s.quakeRunes,
      moonbowAmmo: s.moonbowAmmo,
      activeSword: s.activeSword,
      unlockedSwords: s.unlockedSwords,
      unlockedWeapons: s.unlockedWeapons,
      selectedWeapon: s.selectedWeapon,
      currentArea: s.currentArea,
      chestsOpened: s.chestsOpened,
      shardsCollected: s.shardsCollected,
      heartPiecesCollected: s.heartPiecesCollected,
      armorLevel: s.armorLevel,
      bossHP: s.bossHP,
      bossDefeated: s.bossDefeated,
      talkedToNPCs: s.talkedToNPCs,
      guardianDefeated: s.guardianDefeated,
    };
    saveGame(data);
    set({ lastSaveTime: Date.now() });
  },

  loadFromSave: () => {
    const data = loadGame();
    if (!data) return false;
    const area = (data.currentArea ?? 'field') as AreaId;
    const spawnPos = getAreaSpawn(area);
    set({
      gameState: 'playing',
      hearts: data.hearts ?? 5,
      maxHearts: data.maxHearts ?? 5,
      rupees: data.rupees ?? 0,
      arrows: data.arrows ?? 10,
      bombs: data.bombs ?? 5,
      shurikens: data.shurikens ?? 15,
      frostCharges: data.frostCharges ?? 8,
      flareCharges: data.flareCharges ?? 3,
      veilCrystals: data.veilCrystals ?? 3,
      quakeRunes: data.quakeRunes ?? 2,
      moonbowAmmo: data.moonbowAmmo ?? 10,
      auraEndTime: 0,
      shadowEndTime: 0,
      chainCooldownEnd: 0,
      hurtCooldownEnd: 0,
      activeSword: (data.activeSword ?? 'crystal') as SwordId,
      unlockedSwords: (data.unlockedSwords ?? ['crystal']) as SwordId[],
      unlockedWeapons: ((data.unlockedWeapons ?? ['sword']) as WeaponId[]),
      selectedWeapon: (data.selectedWeapon ?? 'sword') as WeaponId,
      nearWeaponPickup: null,
      currentArea: area,
      chestsOpened: data.chestsOpened ?? [],
      shardsCollected: data.shardsCollected ?? 0,
      heartPiecesCollected: data.heartPiecesCollected ?? [],
      armorLevel: (data.armorLevel ?? 0) as 0 | 1 | 2,
      bossHP: data.bossHP ?? 20,
      bossDefeated: data.bossDefeated ?? false,
      talkedToNPCs: data.talkedToNPCs ?? [],
      guardianDefeated: (data.guardianDefeated ?? []) as AreaId[],
      currentGuardianHP: 0,
      currentGuardianMaxHP: 0,
      playerPosition: spawnPos.clone(),
      playerDirection: new THREE.Vector3(0, 0, -1),
      swordActive: false,
      spinActive: false,
      isBlocking: false,
      pendingTransition: { area, spawnPos },
      pendingWeaponFire: null,
      nearChest: false,
      nearNPC: null,
      activeDialogue: null,
      itemFanfare: null,
      showShop: false,
      nearShop: false,
      nearFountain: false,
      nearBed: false,
      bossMaxHP: 20,
      lastSaveTime: 0,
      score: 0,
      comboCount: 0,
      comboTimer: 0,
      runStartTime: Date.now(),
      nearLore: null,
      loreRead: [],
      areasVisited: [area],
      eliteKills: 0,
    });
    return true;
  },

  deleteSaveData: () => { deleteSave(); },
}));
