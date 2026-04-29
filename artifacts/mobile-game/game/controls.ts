export interface TouchInput {
  joyX: number;
  joyY: number;
  attack: boolean;
  attackConsumed: boolean;
  dash: boolean;
  dashConsumed: boolean;
}

export const touchInput: TouchInput = {
  joyX: 0,
  joyY: 0,
  attack: false,
  attackConsumed: true,
  dash: false,
  dashConsumed: true,
};

export interface PlayerState {
  x: number;
  z: number;
  facingX: number;
  facingZ: number;
  swordActive: boolean;
  swordX: number;
  swordZ: number;
  swordRadius: number;
  dashActive: boolean;
}

export const playerState: PlayerState = {
  x: 0,
  z: 0,
  facingX: 0,
  facingZ: -1,
  swordActive: false,
  swordX: 0,
  swordZ: 0,
  swordRadius: 1.1,
  dashActive: false,
};

export interface PickupSpawn {
  type: "heart" | "rupee";
  x: number;
  z: number;
}

export const pendingPickupSpawns: PickupSpawn[] = [];
