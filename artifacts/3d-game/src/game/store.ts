import { create } from 'zustand';
import * as THREE from 'three';
import { WeaponId, WEAPONS } from './controls';
import { NPC_DATA } from './npcData';

export type GameState = 'title' | 'playing' | 'gameover' | 'victory';
export type AreaId = 'field' | 'forest' | 'desert' | 'boss';

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
  playerPosition: THREE.Vector3;
  playerDirection: THREE.Vector3;
  swordActive: boolean;
  swordPosition: THREE.Vector3;
  spinActive: boolean;
  spinPosition: THREE.Vector3;
  isBlocking: boolean;
  selectedWeapon: WeaponId;
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
  useArrow: () => boolean;
  useBomb: () => boolean;
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
  buyItem: (item: 'arrows' | 'bombs' | 'heart', cost: number) => boolean;
  setNearFountain: (v: boolean) => void;
  useFountain: () => void;
  setArmorLevel: (level: 0 | 1 | 2) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'title',
  hearts: 3,
  maxHearts: 3,
  rupees: 0,
  arrows: 10,
  bombs: 5,
  playerPosition: new THREE.Vector3(0, 0, 0),
  playerDirection: new THREE.Vector3(0, 0, -1),
  swordActive: false,
  swordPosition: new THREE.Vector3(0, 0, 0),
  spinActive: false,
  spinPosition: new THREE.Vector3(0, 0, 0),
  isBlocking: false,
  selectedWeapon: 'sword',
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

  setGameState: (state) => set({ gameState: state }),
  addRupees: (amount) => set((s) => ({ rupees: s.rupees + amount })),
  addArrows: (amount) => set((s) => ({ arrows: Math.min(s.arrows + amount, 99) })),
  addBombs:  (amount) => set((s) => ({ bombs:  Math.min(s.bombs  + amount, 20) })),
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

  damagePlayer: (amount) => set((s) => {
    // Armor reduces damage
    const reduction = s.armorLevel === 2 ? 0.5 : s.armorLevel === 1 ? 0.75 : 1.0;
    // Blocking reduces damage further
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
  fireWeapon: (w) => set({ pendingWeaponFire: w }),
  clearPendingWeaponFire: () => set({ pendingWeaponFire: null }),
  triggerAreaTransition: (t) => set({ currentArea: t.area, pendingTransition: t }),
  setNearChest: (v) => set({ nearChest: v }),

  openChest: (area) => set((s) => {
    if (s.chestsOpened.includes(area)) return {};
    const newOpened = [...s.chestsOpened, area];
    // Armor chest in boss area
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
    // Every 4 pieces = +1 max heart
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
    if (item === 'arrows') set({ rupees: s.rupees - cost, arrows: Math.min(s.arrows + 10, 99) });
    else if (item === 'bombs') set({ rupees: s.rupees - cost, bombs: Math.min(s.bombs + 5, 20) });
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
    playerPosition: new THREE.Vector3(0, 0, 0),
    playerDirection: new THREE.Vector3(0, 0, -1),
    swordActive: false,
    spinActive: false,
    isBlocking: false,
    selectedWeapon: 'sword',
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
  }),
}));
