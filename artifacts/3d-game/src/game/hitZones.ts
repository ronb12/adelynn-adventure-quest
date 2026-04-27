import * as THREE from 'three';

// Module-level singleton — updated every frame by Weapons, read by Enemy.
// Avoids Zustand re-renders for per-frame hit data.
export interface HitZone {
  id: number;
  pos: THREE.Vector3;
  radius: number;
  damage?: number;
  stun?: boolean;
  slow?: boolean;
}

export const hitZones = {
  arrows:    [] as HitZone[],
  boomerang: null as HitZone | null,
  explosions: [] as HitZone[],
  wand:      [] as HitZone[],
  shurikens: [] as HitZone[],
  // New weapons
  moonbow:   [] as HitZone[],   // crescent fan arrows
  frost:     [] as HitZone[],   // ice bolt — slows enemies
  chain:     null as HitZone | null, // grapple anchor — stuns
  aura:      [] as HitZone[],   // orbiting crystal shield damage
};
