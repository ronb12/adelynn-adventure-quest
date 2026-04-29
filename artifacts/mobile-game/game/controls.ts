export interface TouchInput {
  joyX: number;
  joyY: number;
  attack: boolean;
  attackConsumed: boolean;
  dash: boolean;
  dashConsumed: boolean;
  interact: boolean;
  interactConsumed: boolean;
  fireWeapon: boolean;
  fireWeaponConsumed: boolean;
  cycleSword: boolean;
  cycleSwordConsumed: boolean;
  cycleWeapon: boolean;
  cycleWeaponConsumed: boolean;
}

export const touchInput: TouchInput = {
  joyX: 0, joyY: 0,
  attack: false, attackConsumed: true,
  dash: false, dashConsumed: true,
  interact: false, interactConsumed: true,
  fireWeapon: false, fireWeaponConsumed: true,
  cycleSword: false, cycleSwordConsumed: true,
  cycleWeapon: false, cycleWeaponConsumed: true,
};

export interface PlayerState {
  x: number; z: number;
  facingX: number; facingZ: number;
  swordActive: boolean;
  swordX: number; swordZ: number;
  swordRadius: number;
  dashActive: boolean;
  isRunning: boolean;
  isShadowVeil: boolean;
}

export const playerState: PlayerState = {
  x: 0, z: 0,
  facingX: 0, facingZ: -1,
  swordActive: false,
  swordX: 0, swordZ: 0,
  swordRadius: 1.1,
  dashActive: false,
  isRunning: false,
  isShadowVeil: false,
};

export interface PickupSpawn {
  type: "heart" | "rupee";
  x: number; z: number;
}

export const pendingPickupSpawns: PickupSpawn[] = [];

export const WEAPONS = [
  "sword", "bow", "wand", "bomb", "boomerang",
  "frost", "shuriken", "flare", "moonbow",
  "veil", "quake", "aura", "shadow", "chain",
] as const;
export type WeaponId = typeof WEAPONS[number];

export const WEAPON_ICONS: Record<WeaponId, string> = {
  sword: "⚔️", bow: "🏹", wand: "🪄", bomb: "🧪", boomerang: "🌑",
  frost: "❄️", shuriken: "⭐", flare: "☀️", moonbow: "🌙",
  veil: "💠", quake: "🪨", aura: "💫", shadow: "🌑", chain: "⛓️",
};
export const WEAPON_LABELS: Record<WeaponId, string> = {
  sword: "Sword", bow: "Bow", wand: "Wand", bomb: "Vial", boomerang: "Rang",
  frost: "Frost", shuriken: "Stars", flare: "Flare", moonbow: "Moon",
  veil: "Veil", quake: "Quake", aura: "Aura", shadow: "Shadow", chain: "Chain",
};
