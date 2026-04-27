import * as THREE from 'three';

// Module-level singleton — updated every frame by Weapons, read by Enemy.
// Avoids Zustand re-renders for per-frame hit data.
export interface HitZone {
  id: number;
  pos: THREE.Vector3;
  radius: number;
  stun?: boolean; // does not kill, only stuns
}

export const hitZones = {
  arrows: [] as HitZone[],
  boomerang: null as HitZone | null,
  explosions: [] as HitZone[], // single-frame explosion hits
};
