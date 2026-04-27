import { create } from 'zustand';
import * as THREE from 'three';

export type GameState = 'title' | 'playing' | 'gameover' | 'victory';

interface GameStore {
  gameState: GameState;
  hearts: number;
  maxHearts: number;
  rupees: number;
  playerPosition: THREE.Vector3;
  swordActive: boolean;
  swordPosition: THREE.Vector3;
  setGameState: (state: GameState) => void;
  addRupees: (amount: number) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  setPlayerPosition: (pos: THREE.Vector3) => void;
  setSwordState: (active: boolean, pos: THREE.Vector3) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'title',
  hearts: 3,
  maxHearts: 3,
  rupees: 0,
  playerPosition: new THREE.Vector3(0, 0, 0),
  swordActive: false,
  swordPosition: new THREE.Vector3(0, 0, 0),
  setGameState: (state) => set({ gameState: state }),
  addRupees: (amount) => set((state) => ({ rupees: state.rupees + amount })),
  damagePlayer: (amount) => set((state) => {
    const newHearts = Math.max(0, state.hearts - amount);
    if (newHearts === 0) {
      return { hearts: 0, gameState: 'gameover' };
    }
    return { hearts: newHearts };
  }),
  healPlayer: (amount) => set((state) => ({
    hearts: Math.min(state.maxHearts, state.hearts + amount)
  })),
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setSwordState: (active, pos) => set({ swordActive: active, swordPosition: pos }),
  resetGame: () => set({
    gameState: 'playing',
    hearts: 3,
    rupees: 0,
    playerPosition: new THREE.Vector3(0, 0, 0),
    swordActive: false,
  }),
}));
