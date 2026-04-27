import { create } from 'zustand';
import * as THREE from 'three';
import { WeaponId, WEAPONS } from './controls';

export type GameState = 'title' | 'playing' | 'gameover' | 'victory';
export type AreaId = 'field' | 'forest' | 'desert';

export interface AreaTransition {
  area: AreaId;
  spawnPos: THREE.Vector3;
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
  selectedWeapon: WeaponId;
  currentArea: AreaId;
  pendingTransition: AreaTransition | null;
  pendingWeaponFire: WeaponId | null;
  nearChest: boolean;

  setGameState: (state: GameState) => void;
  addRupees: (amount: number) => void;
  addArrows: (amount: number) => void;
  addBombs: (amount: number) => void;
  useArrow: () => boolean;
  useBomb: () => boolean;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  setPlayerPosition: (pos: THREE.Vector3) => void;
  setPlayerDirection: (dir: THREE.Vector3) => void;
  setSwordState: (active: boolean, pos: THREE.Vector3) => void;
  setSelectedWeapon: (w: WeaponId) => void;
  cycleWeapon: (dir: 1 | -1) => void;
  fireWeapon: (w: WeaponId) => void;
  clearPendingWeaponFire: () => void;
  triggerAreaTransition: (t: AreaTransition) => void;
  setNearChest: (v: boolean) => void;
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
  selectedWeapon: 'sword',
  currentArea: 'field',
  pendingTransition: null,
  pendingWeaponFire: null,
  nearChest: false,

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
    const newHearts = Math.max(0, s.hearts - amount);
    if (newHearts === 0) return { hearts: 0, gameState: 'gameover' as GameState };
    return { hearts: newHearts };
  }),
  healPlayer: (amount) => set((s) => ({ hearts: Math.min(s.maxHearts, s.hearts + amount) })),
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerDirection: (dir) => set({ playerDirection: dir }),
  setSwordState: (active, pos) => set({ swordActive: active, swordPosition: pos }),
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
  resetGame: () => set({
    gameState: 'playing',
    hearts: 3,
    rupees: 0,
    arrows: 10,
    bombs: 5,
    playerPosition: new THREE.Vector3(0, 0, 0),
    playerDirection: new THREE.Vector3(0, 0, -1),
    swordActive: false,
    selectedWeapon: 'sword',
    currentArea: 'field',
    pendingTransition: null,
    pendingWeaponFire: null,
    nearChest: false,
  }),
}));
