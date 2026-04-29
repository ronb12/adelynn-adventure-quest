import * as THREE from 'three';

const SAVE_KEY = 'adelynn_quest_save_v1';
const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  timestamp: number;
  // Resources
  hearts: number;
  maxHearts: number;
  rupees: number;
  arrows: number;
  bombs: number;
  shurikens: number;
  frostCharges?: number;
  flareCharges?: number;
  veilCrystals?: number;
  quakeRunes?: number;
  moonbowAmmo?: number;
  // Swords & weapons
  activeSword: string;
  unlockedSwords: string[];
  unlockedWeapons?: string[];
  selectedWeapon: string;
  // Progress
  currentArea: string;
  chestsOpened: string[];
  shardsCollected: number;
  heartPiecesCollected: string[];
  armorLevel: number;
  bossHP: number;
  bossDefeated: boolean;
  talkedToNPCs: string[];
  guardianDefeated?: string[];
}

export function hasSave(): boolean {
  try { return localStorage.getItem(SAVE_KEY) !== null; }
  catch { return false; }
}

export interface SaveMeta {
  timestamp: number;
  area: string;
  shards: number;
  hearts: number;
  maxHearts: number;
  armorLevel: number;
  swordsUnlocked: number;
}

export function getSaveMeta(): SaveMeta | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) return null;
    return {
      timestamp: data.timestamp,
      area: data.currentArea,
      shards: data.shardsCollected,
      hearts: data.hearts,
      maxHearts: data.maxHearts,
      armorLevel: data.armorLevel ?? 0,
      swordsUnlocked: (data.unlockedSwords ?? ['crystal']).length,
    };
  } catch { return null; }
}

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
  } catch (e) {
    console.warn('[SaveSystem] Failed to save:', e);
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) return null;
    return data;
  } catch { return null; }
}

export function deleteSave(): void {
  try { localStorage.removeItem(SAVE_KEY); }
  catch { /* ignore */ }
}

const AREA_SPAWNS: Record<string, THREE.Vector3> = {
  field:   new THREE.Vector3(0, 0, 5),
  forest:  new THREE.Vector3(0, 0, 5),
  desert:  new THREE.Vector3(0, 0, 5),
  boss:    new THREE.Vector3(0, 0, 8),
  jungle:  new THREE.Vector3(0, 0, 5),
  ice:     new THREE.Vector3(0, 0, 5),
  volcano: new THREE.Vector3(0, 0, 5),
  sky:     new THREE.Vector3(0, 0, 5),
  crypt:   new THREE.Vector3(0, 0, 5),
  void:    new THREE.Vector3(0, 0, 5),
  cave:    new THREE.Vector3(0, 0, 22),
  home:    new THREE.Vector3(0, 0, 0),
};

export function getAreaSpawn(area: string): THREE.Vector3 {
  return AREA_SPAWNS[area]?.clone() ?? new THREE.Vector3(0, 0, 0);
}

export function formatSaveTime(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const AREA_DISPLAY: Record<string, string> = {
  field:   'Sunfield Plains',
  forest:  'Whisper Woods',
  desert:  'Ashrock Summit',
  boss:    "Malgrath's Lair",
  jungle:  'Verdant Ruins',
  ice:     'Frostpeak Tundra',
  volcano: 'Ember Depths',
  sky:     'Celestial Skylands',
  crypt:   'Shadowed Crypts',
  void:    'The Fractured Void',
  cave:    'Crystal Caverns',
  home:    "Adelynn's Home",
};
