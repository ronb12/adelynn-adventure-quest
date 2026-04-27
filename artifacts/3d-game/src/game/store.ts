import { create } from 'zustand';
import * as THREE from 'three';
import { WeaponId, WEAPONS } from './controls';
import { NPC_DATA } from './npcData';
import { saveGame, loadGame, deleteSave, getAreaSpawn, SaveData } from './saveManager';

export type GameState = 'title' | 'playing' | 'gameover' | 'victory';
export type AreaId = 'field' | 'forest' | 'desert' | 'boss';

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

  setGameState: (state: GameState) => void;
  addRupees: (amount: number) => void;
  addArrows: (amount: number) => void;
  addBombs:  (amount: number) => void;
  addShurikens: (amount: number) => void;
  useArrow: () => boolean;
  useBomb: () => boolean;
  useShuriken: () => boolean;
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
  buyItem: (item: 'arrows' | 'bombs' | 'heart' | 'shurikens', cost: number) => boolean;
  setNearFountain: (v: boolean) => void;
  useFountain: () => void;
  setArmorLevel: (level: 0 | 1 | 2) => void;
  resetGame: () => void;
  lastSaveTime: number;
  triggerSave: () => void;
  performSave: () => void;
  loadFromSave: () => boolean;
  deleteSaveData: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'title',
  hearts: 3,
  maxHearts: 3,
  rupees: 0,
  arrows: 10,
  bombs: 5,
  shurikens: 15,
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
  lastSaveTime: 0,

  setGameState: (state) => set({ gameState: state }),
  addRupees: (amount) => set((s) => ({ rupees: s.rupees + amount })),
  addArrows: (amount) => set((s) => ({ arrows: Math.min(s.arrows + amount, 99) })),
  addBombs:  (amount) => set((s) => ({ bombs:  Math.min(s.bombs  + amount, 20) })),
  addShurikens: (amount) => set((s) => ({ shurikens: Math.min(s.shurikens + amount, 60) })),

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

  damagePlayer: (amount) => set((s) => {
    const reduction = s.armorLevel === 2 ? 0.5 : s.armorLevel === 1 ? 0.75 : 1.0;
    const blockReduction = s.isBlocking ? 0.25 : 1.0;
    const finalAmount = amount * reduction * blockReduction;
    const newHearts = Math.max(0, s.hearts - finalAmount);
    if (newHearts === 0) return { hearts: 0, gameState: 'gameover' as GameState };
    return { hearts: newHearts };
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
    const idx = WEAPONS.indexOf(s.selectedWeapon);
    const next = (idx + dir + WEAPONS.length) % WEAPONS.length;
    return { selectedWeapon: WEAPONS[next] };
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
  triggerAreaTransition: (t) => set({ currentArea: t.area, pendingTransition: t }),
  setNearChest: (v) => set({ nearChest: v }),

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
    if (item === 'arrows')    set({ rupees: s.rupees - cost, arrows: Math.min(s.arrows + 10, 99) });
    else if (item === 'bombs') set({ rupees: s.rupees - cost, bombs: Math.min(s.bombs + 5, 20) });
    else if (item === 'shurikens') set({ rupees: s.rupees - cost, shurikens: Math.min(s.shurikens + 15, 60) });
    else if (item === 'heart') set((st) => ({ rupees: st.rupees - cost, hearts: Math.min(st.hearts + 1, st.maxHearts) }));
    return true;
  },

  setNearFountain: (v) => set({ nearFountain: v }),
  useFountain: () => set((s) => ({ hearts: s.maxHearts })),
  setArmorLevel: (level) => set({ armorLevel: level }),

  resetGame: () => set({
    gameState: 'playing',
    hearts: 3,
    maxHearts: 3,
    rupees: 0,
    arrows: 10,
    bombs: 5,
    shurikens: 15,
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
    lastSaveTime: 0,
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
      activeSword: s.activeSword,
      unlockedSwords: s.unlockedSwords,
      selectedWeapon: s.selectedWeapon,
      currentArea: s.currentArea,
      chestsOpened: s.chestsOpened,
      shardsCollected: s.shardsCollected,
      heartPiecesCollected: s.heartPiecesCollected,
      armorLevel: s.armorLevel,
      bossHP: s.bossHP,
      bossDefeated: s.bossDefeated,
      talkedToNPCs: s.talkedToNPCs,
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
      hearts: data.hearts ?? 3,
      maxHearts: data.maxHearts ?? 3,
      rupees: data.rupees ?? 0,
      arrows: data.arrows ?? 10,
      bombs: data.bombs ?? 5,
      shurikens: data.shurikens ?? 15,
      activeSword: (data.activeSword ?? 'crystal') as SwordId,
      unlockedSwords: (data.unlockedSwords ?? ['crystal']) as SwordId[],
      selectedWeapon: (data.selectedWeapon ?? 'sword') as WeaponId,
      currentArea: area,
      chestsOpened: data.chestsOpened ?? [],
      shardsCollected: data.shardsCollected ?? 0,
      heartPiecesCollected: data.heartPiecesCollected ?? [],
      armorLevel: (data.armorLevel ?? 0) as 0 | 1 | 2,
      bossHP: data.bossHP ?? 20,
      bossDefeated: data.bossDefeated ?? false,
      talkedToNPCs: data.talkedToNPCs ?? [],
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
      bossMaxHP: 20,
      lastSaveTime: 0,
    });
    return true;
  },

  deleteSaveData: () => { deleteSave(); },
}));
