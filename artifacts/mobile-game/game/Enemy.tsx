import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { useGameStore, AreaId, SWORD_DEFS } from "./store";
import { playerState, pendingPickupSpawns, weaponHitZones, weaponEffects } from "./controls";

export type EnemyType =
  | "slime" | "goblin" | "briarwolf" | "thornspitter" | "emberscorpion" | "voidwraith" | "boss" | "bat" | "knight"
  | "skeleton" | "lizardman" | "rockgolem" | "icewolf" | "lavabeast" | "crystalspider"
  | "thunderbird" | "shadowslime" | "cavedemon" | "jungletroll" | "frostphantom" | "volcanodemon"
  // 30 new regular enemy types
  | "zombie" | "mummy" | "watersprite" | "fishman" | "crab"
  | "darkelf" | "shadowknight" | "firedrake" | "pyrogolem" | "treeant"
  | "mossgolem" | "bandit" | "assassin" | "roguearcher" | "crystalgolem"
  | "gemwyrm" | "stormeagle" | "thunderserpent" | "icesprite" | "glaciergolem"
  | "sandworm" | "duneserpent" | "swampghost" | "swampcrawler" | "skullarcher"
  | "phantomblade" | "thiefscout" | "ironguard" | "mirecrawler" | "bonedragon"
  // 8 dungeon boss types
  | "swampguardian" | "skulllord" | "thiefking" | "icepalaceguardian"
  | "mirebeast" | "dragonoverlord" | "shadowlord" | "malgrathtrue";

interface EnemyDef {
  hp: number; speed: number; contactDamage: number; pts: number; size: number;
  color: string; emissive: string; behavior: "chase" | "charge" | "ranged";
  chargeInterval?: number; chargeDuration?: number;
  rangedInterval?: number; projectileSpeed?: number; projectileDamage?: number;
}

const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  slime:         { hp: 1, speed: 2.5, contactDamage: 0.5,  pts: 10,  size: 0.45, color: "#44bb44", emissive: "#225522", behavior: "chase" },
  goblin:        { hp: 2, speed: 3.5, contactDamage: 0.5,  pts: 20,  size: 0.5,  color: "#bb6622", emissive: "#552211", behavior: "charge", chargeInterval: 2.5, chargeDuration: 0.5 },
  briarwolf:     { hp: 2, speed: 5.5, contactDamage: 0.75, pts: 25,  size: 0.55, color: "#2a5a18", emissive: "#112a0a", behavior: "charge", chargeInterval: 1.8, chargeDuration: 0.4 },
  thornspitter:  { hp: 2, speed: 1.5, contactDamage: 0.5,  pts: 30,  size: 0.45, color: "#88aa22", emissive: "#445511", behavior: "ranged", rangedInterval: 2.2, projectileSpeed: 8,  projectileDamage: 0.5 },
  emberscorpion: { hp: 3, speed: 1.8, contactDamage: 0.5,  pts: 35,  size: 0.52, color: "#cc4411", emissive: "#661100", behavior: "ranged", rangedInterval: 1.6, projectileSpeed: 9,  projectileDamage: 0.5 },
  voidwraith:    { hp: 3, speed: 2.2, contactDamage: 0.5,  pts: 40,  size: 0.5,  color: "#7722cc", emissive: "#330066", behavior: "ranged", rangedInterval: 1.2, projectileSpeed: 10, projectileDamage: 0.5 },
  bat:           { hp: 2, speed: 4.0, contactDamage: 0.5,  pts: 25,  size: 0.42, color: "#4a235a", emissive: "#220033", behavior: "chase" },
  knight:        { hp: 4, speed: 1.4, contactDamage: 0.75, pts: 45,  size: 0.5,  color: "#a04020", emissive: "#502010", behavior: "charge", chargeInterval: 2.2, chargeDuration: 0.55 },
  boss:          { hp: 20,speed: 3.5, contactDamage: 1.0,  pts: 500, size: 1.8,  color: "#550033", emissive: "#220011", behavior: "charge", chargeInterval: 2.0, chargeDuration: 0.8, rangedInterval: 1.5, projectileSpeed: 12, projectileDamage: 0.75 },
  // Expanded 12 enemy types
  skeleton:      { hp: 2, speed: 2.2, contactDamage: 0.5,  pts: 22,  size: 0.48, color: "#d4caa8", emissive: "#886655", behavior: "chase" },
  lizardman:     { hp: 3, speed: 4.2, contactDamage: 0.75, pts: 35,  size: 0.52, color: "#228833", emissive: "#114411", behavior: "charge", chargeInterval: 2.0, chargeDuration: 0.45 },
  rockgolem:     { hp: 6, speed: 1.2, contactDamage: 1.0,  pts: 55,  size: 0.75, color: "#7a8877", emissive: "#334433", behavior: "chase" },
  icewolf:       { hp: 2, speed: 6.2, contactDamage: 0.75, pts: 30,  size: 0.52, color: "#99ccff", emissive: "#2244aa", behavior: "charge", chargeInterval: 1.5, chargeDuration: 0.35 },
  lavabeast:     { hp: 5, speed: 2.0, contactDamage: 0.75, pts: 50,  size: 0.62, color: "#cc5500", emissive: "#882200", behavior: "ranged", rangedInterval: 1.8, projectileSpeed: 9, projectileDamage: 0.75 },
  crystalspider: { hp: 2, speed: 3.5, contactDamage: 0.5,  pts: 28,  size: 0.44, color: "#8844cc", emissive: "#441188", behavior: "chase" },
  thunderbird:   { hp: 3, speed: 5.0, contactDamage: 0.5,  pts: 40,  size: 0.50, color: "#4488ff", emissive: "#224488", behavior: "charge", chargeInterval: 2.0, chargeDuration: 0.5 },
  shadowslime:   { hp: 2, speed: 3.0, contactDamage: 0.5,  pts: 25,  size: 0.45, color: "#440066", emissive: "#220033", behavior: "chase" },
  cavedemon:     { hp: 3, speed: 3.2, contactDamage: 0.75, pts: 38,  size: 0.50, color: "#334455", emissive: "#112233", behavior: "chase" },
  jungletroll:   { hp: 5, speed: 1.6, contactDamage: 1.0,  pts: 52,  size: 0.70, color: "#225522", emissive: "#112211", behavior: "charge", chargeInterval: 3.0, chargeDuration: 0.7 },
  frostphantom:  { hp: 3, speed: 2.5, contactDamage: 0.5,  pts: 42,  size: 0.50, color: "#aaddff", emissive: "#4488cc", behavior: "ranged", rangedInterval: 2.0, projectileSpeed: 8, projectileDamage: 0.75 },
  volcanodemon:  { hp: 6, speed: 1.8, contactDamage: 1.0,  pts: 60,  size: 0.70, color: "#882200", emissive: "#ff4400", behavior: "ranged", rangedInterval: 1.4, projectileSpeed: 11, projectileDamage: 0.75 },
  // 30 new regular enemy types
  zombie:        { hp: 2, speed: 1.5, contactDamage: 0.5,  pts: 18,  size: 0.48, color: "#5a7a4a", emissive: "#2a3a1a", behavior: "chase" },
  mummy:         { hp: 3, speed: 1.8, contactDamage: 0.5,  pts: 28,  size: 0.50, color: "#c8b97a", emissive: "#6a5a30", behavior: "ranged", rangedInterval: 2.5, projectileSpeed: 7,  projectileDamage: 0.5 },
  watersprite:   { hp: 1, speed: 4.5, contactDamage: 0.25, pts: 15,  size: 0.38, color: "#00bcd4", emissive: "#006677", behavior: "chase" },
  fishman:       { hp: 3, speed: 4.8, contactDamage: 0.75, pts: 38,  size: 0.52, color: "#1a6688", emissive: "#0a3344", behavior: "charge", chargeInterval: 1.8, chargeDuration: 0.4 },
  crab:          { hp: 2, speed: 2.8, contactDamage: 0.5,  pts: 22,  size: 0.48, color: "#e64a19", emissive: "#7a2000", behavior: "charge", chargeInterval: 2.2, chargeDuration: 0.5 },
  darkelf:       { hp: 2, speed: 5.5, contactDamage: 0.5,  pts: 32,  size: 0.46, color: "#4a148c", emissive: "#1a0030", behavior: "ranged", rangedInterval: 1.8, projectileSpeed: 10, projectileDamage: 0.5 },
  shadowknight:  { hp: 5, speed: 2.5, contactDamage: 0.75, pts: 55,  size: 0.55, color: "#1a0030", emissive: "#0a0018", behavior: "charge", chargeInterval: 1.5, chargeDuration: 0.45 },
  firedrake:     { hp: 3, speed: 3.8, contactDamage: 0.75, pts: 42,  size: 0.55, color: "#e53935", emissive: "#7a0000", behavior: "ranged", rangedInterval: 2.0, projectileSpeed: 10, projectileDamage: 0.75 },
  pyrogolem:     { hp: 6, speed: 1.5, contactDamage: 1.0,  pts: 58,  size: 0.72, color: "#ff6d00", emissive: "#992200", behavior: "ranged", rangedInterval: 1.6, projectileSpeed: 9,  projectileDamage: 0.75 },
  treeant:       { hp: 7, speed: 1.0, contactDamage: 1.0,  pts: 62,  size: 0.80, color: "#3e5c1a", emissive: "#1a2a08", behavior: "chase" },
  mossgolem:     { hp: 5, speed: 1.3, contactDamage: 0.75, pts: 48,  size: 0.70, color: "#2d5a27", emissive: "#112211", behavior: "charge", chargeInterval: 3.0, chargeDuration: 0.8 },
  bandit:        { hp: 2, speed: 4.0, contactDamage: 0.5,  pts: 30,  size: 0.48, color: "#795548", emissive: "#3e2723", behavior: "charge", chargeInterval: 2.0, chargeDuration: 0.4 },
  assassin:      { hp: 2, speed: 7.0, contactDamage: 0.75, pts: 38,  size: 0.44, color: "#212121", emissive: "#0a0a0a", behavior: "charge", chargeInterval: 1.2, chargeDuration: 0.3 },
  roguearcher:   { hp: 2, speed: 3.0, contactDamage: 0.5,  pts: 32,  size: 0.46, color: "#5d4037", emissive: "#2a1a0a", behavior: "ranged", rangedInterval: 1.8, projectileSpeed: 11, projectileDamage: 0.5 },
  crystalgolem:  { hp: 7, speed: 1.0, contactDamage: 1.0,  pts: 65,  size: 0.78, color: "#aa66ff", emissive: "#551188", behavior: "chase" },
  gemwyrm:       { hp: 4, speed: 3.0, contactDamage: 0.75, pts: 48,  size: 0.58, color: "#cc44ee", emissive: "#660088", behavior: "ranged", rangedInterval: 1.8, projectileSpeed: 10, projectileDamage: 0.75 },
  stormeagle:    { hp: 3, speed: 6.0, contactDamage: 0.75, pts: 44,  size: 0.52, color: "#78909c", emissive: "#37474f", behavior: "charge", chargeInterval: 1.5, chargeDuration: 0.3 },
  thunderserpent:{ hp: 4, speed: 3.5, contactDamage: 0.75, pts: 50,  size: 0.55, color: "#ffee22", emissive: "#886600", behavior: "ranged", rangedInterval: 1.6, projectileSpeed: 12, projectileDamage: 0.75 },
  icesprite:     { hp: 1, speed: 5.0, contactDamage: 0.25, pts: 18,  size: 0.36, color: "#b3e5fc", emissive: "#4488aa", behavior: "chase" },
  glaciergolem:  { hp: 8, speed: 0.9, contactDamage: 1.0,  pts: 70,  size: 0.85, color: "#e3f2fd", emissive: "#4488bb", behavior: "charge", chargeInterval: 4.0, chargeDuration: 1.0 },
  sandworm:      { hp: 4, speed: 2.8, contactDamage: 0.75, pts: 45,  size: 0.60, color: "#c4a35a", emissive: "#7a5a20", behavior: "charge", chargeInterval: 2.5, chargeDuration: 0.6 },
  duneserpent:   { hp: 3, speed: 4.5, contactDamage: 0.5,  pts: 38,  size: 0.52, color: "#d4a22a", emissive: "#8a5500", behavior: "ranged", rangedInterval: 2.0, projectileSpeed: 9,  projectileDamage: 0.5 },
  swampghost:    { hp: 2, speed: 3.2, contactDamage: 0.5,  pts: 35,  size: 0.46, color: "#80cbc4", emissive: "#004d40", behavior: "chase" },
  swampcrawler:  { hp: 3, speed: 2.2, contactDamage: 0.75, pts: 40,  size: 0.55, color: "#558b2f", emissive: "#1b5e20", behavior: "charge", chargeInterval: 2.5, chargeDuration: 0.55 },
  skullarcher:   { hp: 2, speed: 2.0, contactDamage: 0.5,  pts: 30,  size: 0.46, color: "#d4caa8", emissive: "#886655", behavior: "ranged", rangedInterval: 1.8, projectileSpeed: 9,  projectileDamage: 0.5 },
  phantomblade:  { hp: 3, speed: 4.0, contactDamage: 0.75, pts: 45,  size: 0.50, color: "#b0bec5", emissive: "#546e7a", behavior: "charge", chargeInterval: 1.6, chargeDuration: 0.35 },
  thiefscout:    { hp: 2, speed: 6.5, contactDamage: 0.5,  pts: 35,  size: 0.44, color: "#4a148c", emissive: "#1a0030", behavior: "charge", chargeInterval: 1.5, chargeDuration: 0.3 },
  ironguard:     { hp: 5, speed: 1.8, contactDamage: 0.75, pts: 50,  size: 0.56, color: "#546e7a", emissive: "#1c313a", behavior: "charge", chargeInterval: 2.5, chargeDuration: 0.6 },
  mirecrawler:   { hp: 3, speed: 2.5, contactDamage: 0.5,  pts: 36,  size: 0.52, color: "#827717", emissive: "#4a4000", behavior: "chase" },
  bonedragon:    { hp: 12,speed: 2.2, contactDamage: 1.0,  pts: 150, size: 1.2,  color: "#d4caa8", emissive: "#886655", behavior: "ranged", rangedInterval: 1.2, projectileSpeed: 12, projectileDamage: 1.0 },
  // 8 dungeon boss types
  swampguardian:     { hp: 25, speed: 2.8, contactDamage: 1.0, pts: 600, size: 2.0, color: "#1a5c1a", emissive: "#0a2a0a", behavior: "charge", chargeInterval: 1.8, chargeDuration: 0.7, rangedInterval: 1.6, projectileSpeed: 10, projectileDamage: 0.75 },
  skulllord:         { hp: 28, speed: 3.0, contactDamage: 1.0, pts: 650, size: 2.0, color: "#c8c0a0", emissive: "#665540", behavior: "ranged", rangedInterval: 1.2, projectileSpeed: 11, projectileDamage: 0.75, chargeInterval: 2.5, chargeDuration: 0.8 },
  thiefking:         { hp: 22, speed: 4.5, contactDamage: 1.0, pts: 600, size: 1.7, color: "#4a148c", emissive: "#1a0030", behavior: "charge", chargeInterval: 1.2, chargeDuration: 0.5, rangedInterval: 2.0, projectileSpeed: 12, projectileDamage: 0.75 },
  icepalaceguardian: { hp: 30, speed: 2.5, contactDamage: 1.0, pts: 700, size: 2.2, color: "#b3e5fc", emissive: "#2244aa", behavior: "ranged", rangedInterval: 1.2, projectileSpeed: 11, projectileDamage: 1.0, chargeInterval: 2.0, chargeDuration: 0.9 },
  mirebeast:         { hp: 28, speed: 2.2, contactDamage: 1.0, pts: 650, size: 2.1, color: "#558b2f", emissive: "#1b5e20", behavior: "charge", chargeInterval: 2.0, chargeDuration: 0.8, rangedInterval: 2.0, projectileSpeed: 9,  projectileDamage: 0.75 },
  dragonoverlord:    { hp: 35, speed: 3.2, contactDamage: 1.5, pts: 800, size: 2.5, color: "#880000", emissive: "#ff3300", behavior: "ranged", rangedInterval: 1.0, projectileSpeed: 13, projectileDamage: 1.0, chargeInterval: 1.5, chargeDuration: 0.7 },
  shadowlord:        { hp: 30, speed: 3.5, contactDamage: 1.0, pts: 750, size: 2.0, color: "#0a0018", emissive: "#7c4dff", behavior: "ranged", rangedInterval: 1.0, projectileSpeed: 13, projectileDamage: 1.0, chargeInterval: 1.5, chargeDuration: 0.6 },
  malgrathtrue:      { hp: 50, speed: 4.0, contactDamage: 1.5, pts: 1000,size: 2.8, color: "#220033", emissive: "#cc00ff", behavior: "charge", chargeInterval: 1.0, chargeDuration: 0.6, rangedInterval: 0.8, projectileSpeed: 15, projectileDamage: 1.25 },
};

interface EnemyData {
  id: string; type: EnemyType; hp: number;
  x: number; z: number;
  iframes: number; hurtFlash: number;
  chargeTimer: number; isCharging: boolean; chargeDx: number; chargeDz: number;
  rangedTimer: number;
  frozenTimer: number;
}

interface Projectile {
  id: string; x: number; z: number; dx: number; dz: number;
  speed: number; damage: number; timeLeft: number; type: string;
}

const AREA_CONFIGS: Record<AreaId, Array<{ type: EnemyType; count: number; radius: number }>> = {
  field:    [{ type: "slime",        count: 8,  radius: 14 }, { type: "goblin",       count: 4, radius: 16 }],
  forest:   [{ type: "briarwolf",    count: 6,  radius: 14 }, { type: "thornspitter", count: 4, radius: 16 }, { type: "bat",         count: 4, radius: 12 }],
  desert:   [{ type: "emberscorpion",count: 6,  radius: 14 }, { type: "voidwraith",   count: 4, radius: 16 }, { type: "knight",      count: 3, radius: 12 }],
  boss:     [{ type: "boss",         count: 1,  radius: 0  }],
  cave:     [{ type: "skeleton",     count: 7,  radius: 13 }, { type: "cavedemon",    count: 4, radius: 15 }, { type: "rockgolem",   count: 2, radius: 11 }],
  jungle:   [{ type: "lizardman",    count: 6,  radius: 14 }, { type: "jungletroll",  count: 3, radius: 16 }, { type: "briarwolf",   count: 4, radius: 12 }],
  ice:      [{ type: "icewolf",      count: 7,  radius: 14 }, { type: "frostphantom", count: 3, radius: 16 }, { type: "skeleton",    count: 4, radius: 12 }],
  volcano:  [{ type: "lavabeast",    count: 5,  radius: 13 }, { type: "volcanodemon", count: 3, radius: 16 }, { type: "emberscorpion",count:4, radius: 11 }],
  sky:      [{ type: "thunderbird",  count: 7,  radius: 14 }, { type: "bat",          count: 5, radius: 12 }, { type: "voidwraith",  count: 3, radius: 16 }],
  shadow:   [{ type: "shadowslime",  count: 8,  radius: 13 }, { type: "voidwraith",   count: 5, radius: 15 }, { type: "cavedemon",   count: 3, radius: 11 }],
  dungeon1:  [{ type: "crystalspider",count: 6, radius: 12 }, { type: "skeleton",        count: 5, radius: 14 }, { type: "bat",             count: 4, radius: 10 }, { type: "crystalgolem",  count: 2, radius: 11 }],
  dungeon2:  [{ type: "volcanodemon", count: 4, radius: 13 }, { type: "lavabeast",       count: 4, radius: 15 }, { type: "emberscorpion",  count: 3, radius: 11 }, { type: "firedrake",     count: 3, radius: 13 }],
  dungeon3:  [{ type: "frostphantom", count: 4, radius: 13 }, { type: "icewolf",         count: 5, radius: 15 }, { type: "crystalspider",  count: 3, radius: 11 }, { type: "icesprite",     count: 4, radius: 12 }],
  dungeon4:  [{ type: "swampguardian",count: 1, radius: 0  }, { type: "fishman",         count: 6, radius: 12 }, { type: "watersprite",    count: 5, radius: 10 }, { type: "swampcrawler",  count: 4, radius: 14 }, { type: "crab",          count: 4, radius: 11 }],
  dungeon5:  [{ type: "skulllord",    count: 1, radius: 0  }, { type: "zombie",          count: 6, radius: 12 }, { type: "skeleton",       count: 5, radius: 14 }, { type: "skullarcher",   count: 4, radius: 13 }, { type: "mummy",         count: 3, radius: 10 }],
  dungeon6:  [{ type: "thiefking",    count: 1, radius: 0  }, { type: "bandit",          count: 6, radius: 12 }, { type: "assassin",       count: 4, radius: 14 }, { type: "roguearcher",   count: 4, radius: 13 }, { type: "thiefscout",    count: 5, radius: 11 }],
  dungeon7:  [{ type: "icepalaceguardian",count:1,radius: 0}, { type: "icesprite",       count: 6, radius: 12 }, { type: "glaciergolem",   count: 2, radius: 15 }, { type: "icewolf",       count: 5, radius: 13 }, { type: "frostphantom",  count: 3, radius: 11 }],
  dungeon8:  [{ type: "mirebeast",    count: 1, radius: 0  }, { type: "mirecrawler",     count: 6, radius: 12 }, { type: "swampghost",     count: 5, radius: 14 }, { type: "mossgolem",     count: 2, radius: 15 }, { type: "watersprite",   count: 4, radius: 10 }],
  dungeon9:  [{ type: "dragonoverlord",count:1, radius: 0  }, { type: "firedrake",       count: 5, radius: 12 }, { type: "pyrogolem",      count: 3, radius: 14 }, { type: "lavabeast",     count: 4, radius: 13 }, { type: "bonedragon",    count: 1, radius: 16 }],
  dungeon10: [{ type: "shadowlord",   count: 1, radius: 0  }, { type: "darkelf",         count: 5, radius: 12 }, { type: "shadowknight",   count: 4, radius: 14 }, { type: "phantomblade",  count: 5, radius: 13 }, { type: "shadowslime",   count: 6, radius: 10 }],
  dungeon11: [{ type: "malgrathtrue", count: 1, radius: 0  }, { type: "shadowknight",    count: 4, radius: 12 }, { type: "bonedragon",     count: 2, radius: 15 }, { type: "voidwraith",    count: 5, radius: 13 }, { type: "darkelf",       count: 4, radius: 11 }],
};

function spawnEnemies(area: AreaId, bossDefeated: boolean): EnemyData[] {
  if (area === "boss" && bossDefeated) return [];
  const result: EnemyData[] = [];
  let c = 0;
  for (const cfg of (AREA_CONFIGS[area] ?? [])) {
    const def = ENEMY_DEFS[cfg.type];
    for (let i = 0; i < cfg.count; i++) {
      const angle = (i / cfg.count) * Math.PI * 2 + Math.random() * 0.5;
      const r = cfg.radius + Math.random() * 4;
      result.push({
        id: `${area}-${c++}-${Math.random().toString(36).slice(2)}`,
        type: cfg.type, hp: def.hp,
        x: cfg.radius === 0 ? 0 : Math.cos(angle) * r,
        z: cfg.radius === 0 ? -15 : Math.sin(angle) * r,
        iframes: 0, hurtFlash: 0,
        chargeTimer: (def.chargeInterval ?? 2) + Math.random() * 1.5,
        isCharging: false, chargeDx: 0, chargeDz: 0,
        rangedTimer: (def.rangedInterval ?? 2) + Math.random(),
        frozenTimer: 0,
      });
    }
  }
  return result;
}

let projSeq = 0;

// ── Slime mesh ────────────────────────────────────────────────────
function SlimeMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.52, 0]} scale={[1, 0.72, 1]}>
        <sphereGeometry args={[0.58, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.45} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0.12, 0.72, 0.32]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.18} roughness={0} />
      </mesh>
      <mesh position={[-0.2, 0.64, 0.5]}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[0.2, 0.64, 0.5]}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[-0.2, 0.64, 0.6]}><sphereGeometry args={[0.056, 7, 5]} /><meshStandardMaterial color="#110a1a" /></mesh>
      <mesh position={[0.2, 0.64, 0.6]}><sphereGeometry args={[0.056, 7, 5]} /><meshStandardMaterial color="#110a1a" /></mesh>
      {[0,1,2,3,4,5].map(i => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a)*0.52, 0.15, Math.sin(a)*0.52]} rotation={[0, -a, 0.35]}>
            <coneGeometry args={[0.1, 0.3, 6]} />
            <meshStandardMaterial color={accent} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Goblin mesh ───────────────────────────────────────────────────
function GoblinMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group scale={[0.72, 0.72, 0.72]}>
      <mesh position={[0, 0.7, 0]}><capsuleGeometry args={[0.28, 0.5, 8, 12]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
      <mesh position={[0, 1.24, 0]}><sphereGeometry args={[0.36, 12, 10]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      <mesh position={[-0.32, 1.48, 0]} rotation={[0, 0, 0.7]}><coneGeometry args={[0.1, 0.42, 6]} /><meshStandardMaterial color={accent} roughness={0.7} /></mesh>
      <mesh position={[0.32, 1.48, 0]} rotation={[0, 0, -0.7]}><coneGeometry args={[0.1, 0.42, 6]} /><meshStandardMaterial color={accent} roughness={0.7} /></mesh>
      <mesh position={[-0.14, 1.28, 0.3]}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#ff2200" emissive="#cc1100" emissiveIntensity={2} /></mesh>
      <mesh position={[0.14, 1.28, 0.3]}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#ff2200" emissive="#cc1100" emissiveIntensity={2} /></mesh>
      <mesh position={[0.38, 0.75, 0.1]} rotation={[0.2, 0, 0.5]}><cylinderGeometry args={[0.06, 0.1, 0.55, 7]} /><meshStandardMaterial color="#5a3a1a" roughness={0.9} /></mesh>
      <mesh position={[0.52, 1.0, 0.15]}><sphereGeometry args={[0.14, 8, 6]} /><meshStandardMaterial color="#3a2a0a" roughness={0.85} /></mesh>
      <mesh position={[-0.14, 0.22, 0]}><cylinderGeometry args={[0.09, 0.07, 0.34, 7]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      <mesh position={[0.14, 0.22, 0]}><cylinderGeometry args={[0.09, 0.07, 0.34, 7]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
    </group>
  );
}

// ── BriarWolf mesh ────────────────────────────────────────────────
function BriarWolfMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.62, 0]} scale={[1, 0.7, 1.5]}><sphereGeometry args={[0.42, 12, 9]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
      <mesh position={[0, 0.78, 0.38]} rotation={[-0.4, 0, 0]}><cylinderGeometry args={[0.19, 0.22, 0.38, 9]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
      <mesh position={[0, 0.9, 0.62]} scale={[0.8, 0.7, 1.0]}><sphereGeometry args={[0.3, 10, 8]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[0, 0.78, 0.88]} scale={[0.6, 0.5, 1]}><sphereGeometry args={[0.2, 8, 6]} /><meshStandardMaterial color="#1a3a1a" roughness={0.9} /></mesh>
      <mesh position={[-0.1, 0.96, 0.84]}><sphereGeometry args={[0.055, 7, 5]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={3} /></mesh>
      <mesh position={[0.1, 0.96, 0.84]}><sphereGeometry args={[0.055, 7, 5]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={3} /></mesh>
      <mesh position={[-0.16, 1.16, 0.6]} rotation={[0.2, 0.2, 0.3]}><coneGeometry args={[0.09, 0.22, 6]} /><meshStandardMaterial color="#1a3a1a" roughness={0.9} /></mesh>
      <mesh position={[0.16, 1.16, 0.6]} rotation={[0.2, -0.2, -0.3]}><coneGeometry args={[0.09, 0.22, 6]} /><meshStandardMaterial color="#1a3a1a" roughness={0.9} /></mesh>
      {([[-0.22, 0.92, -0.1], [0, 1.0, -0.18], [0.22, 0.92, -0.08]] as [number,number,number][]).map(([x,y,z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0.3, 0, i === 1 ? 0 : (i === 0 ? 0.3 : -0.3)]}>
          <coneGeometry args={[0.04, 0.24, 5]} />
          <meshStandardMaterial color="#0d2e0d" roughness={0.85} />
        </mesh>
      ))}
      {([-0.2, 0.2] as number[]).map((x) =>
        [-0.28, 0.28].map((z, j) => (
          <mesh key={`${x}-${j}`} position={[x, 0.22, z]}><cylinderGeometry args={[0.07, 0.06, 0.44, 7]} /><meshStandardMaterial color="#1a3a1a" roughness={0.9} /></mesh>
        ))
      )}
      <mesh position={[0, 0.78, -0.54]} rotation={[-0.7, 0, 0]}><cylinderGeometry args={[0.04, 0.09, 0.44, 7]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
    </group>
  );
}

// ── Thornspitter mesh ─────────────────────────────────────────────
function ThornspitterMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.38, 0.55, 0.35, 10]} /><meshStandardMaterial color="#3a2a10" roughness={1} /></mesh>
      <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.18, 0.24, 1.0, 10]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[0, 1.45, 0]}><sphereGeometry args={[0.42, 12, 10]} /><meshStandardMaterial color={accent} roughness={0.6} /></mesh>
      {[0,1,2,3,4,5].map(i => {
        const a = (i/6)*Math.PI*2;
        return (
          <mesh key={i} position={[Math.cos(a)*0.46, 1.45, Math.sin(a)*0.46]} rotation={[0, -a, 0.6]}>
            <coneGeometry args={[0.1, 0.5, 6]} />
            <meshStandardMaterial color="#2d5a10" roughness={0.75} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.45, 0]}><sphereGeometry args={[0.22, 9, 7]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.8} roughness={0} transparent opacity={0.9} /></mesh>
      <mesh position={[-0.52, 0.95, 0]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.06, 0.55, 0.28]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      <mesh position={[0.52, 0.95, 0]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.06, 0.55, 0.28]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      <mesh position={[-0.18, 1.52, 0.34]}><sphereGeometry args={[0.09, 7, 5]} /><meshStandardMaterial color="#ffe030" emissive="#ffcc00" emissiveIntensity={2} /></mesh>
      <mesh position={[0.18, 1.52, 0.34]}><sphereGeometry args={[0.09, 7, 5]} /><meshStandardMaterial color="#ffe030" emissive="#ffcc00" emissiveIntensity={2} /></mesh>
    </group>
  );
}

// ── EmberScorpion mesh ────────────────────────────────────────────
function EmberScorpionMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} scale={[1.1, 0.6, 1.4]}><sphereGeometry args={[0.4, 12, 9]} /><meshStandardMaterial color={color} roughness={0.6} metalness={0.3} /></mesh>
      {([0.3, 0.0, -0.28] as number[]).map((z, i) => (
        <mesh key={i} position={[0, 0.22, z]} scale={[0.9 - i*0.1, 0.5, 0.4]}>
          <sphereGeometry args={[0.28, 9, 7]} />
          <meshStandardMaterial color={i % 2 === 0 ? color : accent} roughness={0.5} metalness={0.35} emissive={accent} emissiveIntensity={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.32, 0.52]} scale={[0.9, 0.7, 0.8]}><sphereGeometry args={[0.28, 10, 8]} /><meshStandardMaterial color={color} roughness={0.5} metalness={0.3} /></mesh>
      <mesh position={[-0.1, 0.38, 0.72]}><sphereGeometry args={[0.045, 6, 5]} /><meshStandardMaterial color="#ff4400" emissive="#ff6600" emissiveIntensity={5} /></mesh>
      <mesh position={[0.1, 0.38, 0.72]}><sphereGeometry args={[0.045, 6, 5]} /><meshStandardMaterial color="#ff4400" emissive="#ff6600" emissiveIntensity={5} /></mesh>
      {([-1, 1] as number[]).map(side => (
        <group key={side} position={[side * 0.5, 0.28, 0.54]} rotation={[0, side * -0.4, 0]}>
          <mesh position={[0, 0, 0.18]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.055, 0.08, 0.38, 7]} /><meshStandardMaterial color={color} roughness={0.5} metalness={0.3} /></mesh>
          <mesh position={[side * 0.08, 0.06, 0.38]}><boxGeometry args={[0.14, 0.1, 0.2]} /><meshStandardMaterial color={accent} roughness={0.4} metalness={0.4} /></mesh>
        </group>
      ))}
      {([-0.3, -0.1, 0.1, 0.3] as number[]).map((z, j) =>
        ([-1, 1] as number[]).map(side => (
          <mesh key={`${j}-${side}`} position={[side * 0.42, 0.1, z]} rotation={[0, 0, side * 0.5]}><cylinderGeometry args={[0.03, 0.025, 0.42, 6]} /><meshStandardMaterial color={color} roughness={0.55} metalness={0.25} /></mesh>
        ))
      )}
      {([[0, 0.38, -0.42, -0.6], [0, 0.62, -0.56, -1.1], [0, 0.84, -0.48, -1.5]] as [number,number,number,number][]).map(([x,y,z,rx], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[rx, 0, 0]}>
          <sphereGeometry args={[0.12 - i*0.02, 7, 5]} />
          <meshStandardMaterial color={i === 2 ? accent : color} roughness={0.5} metalness={0.3} emissive={i === 2 ? accent : '#000'} emissiveIntensity={i === 2 ? 2 : 0} />
        </mesh>
      ))}
      <pointLight color={accent} intensity={0.5} distance={4} decay={2} position={[0, 0.5, 0]} />
    </group>
  );
}

// ── VoidWraith mesh ───────────────────────────────────────────────
function VoidWraithMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]}><coneGeometry args={[0.52, 1.1, 12]} /><meshStandardMaterial color={color} roughness={0.6} transparent opacity={0.88} emissive={accent} emissiveIntensity={0.15} /></mesh>
      {[0,1,2,3,4,5].map(i => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a)*0.38, 0.08, Math.sin(a)*0.38]}>
            <sphereGeometry args={[0.1, 6, 5]} />
            <meshStandardMaterial color={color} roughness={0.7} transparent opacity={0.55} emissive={accent} emissiveIntensity={0.2} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.18, 0]}><sphereGeometry args={[0.3, 10, 8]} /><meshStandardMaterial color={color} roughness={0.5} transparent opacity={0.9} emissive={accent} emissiveIntensity={0.2} /></mesh>
      <mesh position={[0, 1.6, 0]}><sphereGeometry args={[0.28, 10, 8]} /><meshStandardMaterial color={color} roughness={0.55} transparent opacity={0.92} emissive={accent} emissiveIntensity={0.1} /></mesh>
      <mesh position={[-0.1, 1.63, 0.22]}><sphereGeometry args={[0.06, 7, 5]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={6} transparent opacity={0.95} /></mesh>
      <mesh position={[0.1, 1.63, 0.22]}><sphereGeometry args={[0.06, 7, 5]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={6} transparent opacity={0.95} /></mesh>
      {([-1, 1] as number[]).map(side => (
        <group key={side} position={[side * 0.48, 1.02, 0.14]} rotation={[0.3, side * -0.3, side * 0.4]}>
          <mesh><sphereGeometry args={[0.1, 7, 5]} /><meshStandardMaterial color={color} roughness={0.6} emissive={accent} emissiveIntensity={0.3} /></mesh>
          {[0, 1, 2].map(f => (
            <mesh key={f} position={[side * 0.04, -0.06, 0.1 + f * 0.05]} rotation={[-0.3 - f * 0.1, 0, side * 0.15]}>
              <coneGeometry args={[0.025, 0.14, 5]} />
              <meshStandardMaterial color="#0a0014" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      <pointLight color={accent} intensity={1.2} distance={5} decay={2} position={[0, 1.2, 0]} />
    </group>
  );
}

// ── Bat mesh ──────────────────────────────────────────────────────
function BatMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.76, 0]}><sphereGeometry args={[0.42, 12, 10]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[0, 0.7, 0.26]}><sphereGeometry args={[0.24, 8, 7]} /><meshStandardMaterial color={accent} roughness={0.9} /></mesh>
      <mesh position={[-0.4, 0.78, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.04, 0.03, 0.6, 6]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[-0.64, 0.78, 0]}><boxGeometry args={[0.5, 0.04, 0.48]} /><meshStandardMaterial color={accent} transparent opacity={0.85} /></mesh>
      <mesh position={[0.4, 0.78, 0]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.04, 0.03, 0.6, 6]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.64, 0.78, 0]}><boxGeometry args={[0.5, 0.04, 0.48]} /><meshStandardMaterial color={accent} transparent opacity={0.85} /></mesh>
      <mesh position={[-0.18, 1.13, 0]} rotation={[0, 0, -0.25]}><coneGeometry args={[0.08, 0.28, 7]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[0.18, 1.13, 0]} rotation={[0, 0, 0.25]}><coneGeometry args={[0.08, 0.28, 7]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[-0.14, 0.85, 0.35]}><sphereGeometry args={[0.06, 7, 7]} /><meshStandardMaterial color="#ff1100" emissive="#ff0000" emissiveIntensity={3} /></mesh>
      <mesh position={[0.14, 0.85, 0.35]}><sphereGeometry args={[0.06, 7, 7]} /><meshStandardMaterial color="#ff1100" emissive="#ff0000" emissiveIntensity={3} /></mesh>
      <pointLight color="#8800ff" intensity={0.8} distance={4} decay={2} position={[0, 0.7, 0]} />
    </group>
  );
}

// ── Knight mesh ───────────────────────────────────────────────────
function KnightMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[-0.17, 0.1, 0]}><boxGeometry args={[0.17, 0.18, 0.3]} /><meshStandardMaterial color="#2a1a0a" roughness={0.85} /></mesh>
      <mesh position={[0.17, 0.1, 0]}><boxGeometry args={[0.17, 0.18, 0.3]} /><meshStandardMaterial color="#2a1a0a" roughness={0.85} /></mesh>
      <mesh position={[-0.17, 0.38, 0]}><cylinderGeometry args={[0.1, 0.11, 0.4, 8]} /><meshStandardMaterial color="#d4b896" roughness={0.9} /></mesh>
      <mesh position={[0.17, 0.38, 0]}><cylinderGeometry args={[0.1, 0.11, 0.4, 8]} /><meshStandardMaterial color="#d4b896" roughness={0.9} /></mesh>
      <mesh position={[-0.17, 0.74, 0]}><cylinderGeometry args={[0.13, 0.11, 0.36, 8]} /><meshStandardMaterial color={color} metalness={0.55} roughness={0.42} /></mesh>
      <mesh position={[0.17, 0.74, 0]}><cylinderGeometry args={[0.13, 0.11, 0.36, 8]} /><meshStandardMaterial color={color} metalness={0.55} roughness={0.42} /></mesh>
      <mesh position={[0, 0.96, 0]}><cylinderGeometry args={[0.29, 0.25, 0.18, 10]} /><meshStandardMaterial color="#d4b896" roughness={0.85} /></mesh>
      <mesh position={[0, 1.28, 0]}><boxGeometry args={[0.52, 0.56, 0.3]} /><meshStandardMaterial color={color} metalness={0.6} roughness={0.38} /></mesh>
      <mesh position={[-0.33, 1.42, 0]}><sphereGeometry args={[0.18, 8, 7]} /><meshStandardMaterial color={accent} metalness={0.7} roughness={0.28} /></mesh>
      <mesh position={[0.33, 1.42, 0]}><sphereGeometry args={[0.18, 8, 7]} /><meshStandardMaterial color={accent} metalness={0.7} roughness={0.28} /></mesh>
      <mesh position={[-0.36, 1.1, 0]}><cylinderGeometry args={[0.1, 0.09, 0.45, 7]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.4} /></mesh>
      <mesh position={[0.36, 1.1, 0]}><cylinderGeometry args={[0.1, 0.09, 0.45, 7]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.4} /></mesh>
      <mesh position={[0, 1.76, 0]}><sphereGeometry args={[0.28, 10, 9]} /><meshStandardMaterial color={color} metalness={0.65} roughness={0.35} /></mesh>
      <mesh position={[0, 1.73, 0.24]}><boxGeometry args={[0.3, 0.1, 0.06]} /><meshStandardMaterial color="#1a0a00" roughness={0.9} /></mesh>
      <mesh position={[-0.08, 1.75, 0.27]}><sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={3} /></mesh>
      <mesh position={[0.08, 1.75, 0.27]}><sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={3} /></mesh>
    </group>
  );
}

function SkeletonMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.14, 0.17, 0.3, 8]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.5} /></mesh>
      <mesh position={[-0.18, 0.55, 0]}><cylinderGeometry args={[0.05, 0.05, 0.52, 6]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.18, 0.55, 0]}><cylinderGeometry args={[0.05, 0.05, 0.52, 6]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.65, 0]}><boxGeometry args={[0.36, 0.36, 0.18]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      <mesh position={[0, 1.05, 0]}><sphereGeometry args={[0.2, 8, 8]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.4} /></mesh>
      <mesh position={[-0.06, 1.04, 0.17]}><sphereGeometry args={[0.04, 5, 5]} /><meshStandardMaterial color="#33aaff" emissive="#3399ff" emissiveIntensity={3} /></mesh>
      <mesh position={[0.06, 1.04, 0.17]}><sphereGeometry args={[0.04, 5, 5]} /><meshStandardMaterial color="#33aaff" emissive="#3399ff" emissiveIntensity={3} /></mesh>
    </group>
  );
}

function LizardmanMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.14, -0.1]}><cylinderGeometry args={[0.08, 0.06, 0.45, 7]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
      <mesh position={[-0.2, 0.5, 0]}><cylinderGeometry args={[0.07, 0.06, 0.55, 6]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.2, 0.5, 0]}><cylinderGeometry args={[0.07, 0.06, 0.55, 6]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.65, 0]}><boxGeometry args={[0.4, 0.42, 0.24]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.22, 9, 8]} /><meshStandardMaterial color={color} roughness={0.3} /></mesh>
      <mesh position={[0, 1.06, 0.2]}><boxGeometry args={[0.24, 0.07, 0.04]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[-0.07, 1.1, 0.2]}><sphereGeometry args={[0.04, 5, 5]} /><meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={2} /></mesh>
      <mesh position={[0.07, 1.1, 0.2]}><sphereGeometry args={[0.04, 5, 5]} /><meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={2} /></mesh>
    </group>
  );
}

function RockGolemMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.7, 0.44, 0.6]} /><meshStandardMaterial color={color} roughness={0.95} /></mesh>
      <mesh position={[-0.42, 0.55, 0]}><boxGeometry args={[0.28, 0.7, 0.28]} /><meshStandardMaterial color={color} roughness={0.95} /></mesh>
      <mesh position={[0.42, 0.55, 0]}><boxGeometry args={[0.28, 0.7, 0.28]} /><meshStandardMaterial color={color} roughness={0.95} /></mesh>
      <mesh position={[0, 0.7, 0]}><boxGeometry args={[0.6, 0.52, 0.5]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.5} roughness={0.9} /></mesh>
      <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.5, 0.42, 0.44]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[-0.1, 1.22, 0.22]}><sphereGeometry args={[0.06, 6, 6]} /><meshStandardMaterial color="#55aa55" emissive="#33cc33" emissiveIntensity={2} /></mesh>
      <mesh position={[0.1, 1.22, 0.22]}><sphereGeometry args={[0.06, 6, 6]} /><meshStandardMaterial color="#55aa55" emissive="#33cc33" emissiveIntensity={2} /></mesh>
    </group>
  );
}

function IceWolfMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.45, 0.28, 0.75]} /><meshStandardMaterial color={color} roughness={0.15} metalness={0.3} /></mesh>
      <mesh position={[0.18, 0.42, 0.26]}><boxGeometry args={[0.2, 0.22, 0.38]} /><meshStandardMaterial color={color} roughness={0.15} /></mesh>
      <mesh position={[0.22, 0.54, 0.28]}><coneGeometry args={[0.05, 0.14, 5]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[-0.22, 0.54, 0.28]}><coneGeometry args={[0.05, 0.14, 5]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[-0.2, 0.2, 0.38]}><boxGeometry args={[0.22, 0.18, 0.32]} /><meshStandardMaterial color={color} roughness={0.1} /></mesh>
      <mesh position={[-0.07, 0.24, 0.55]}><boxGeometry args={[0.1, 0.1, 0.12]} /><meshStandardMaterial color={color} roughness={0.1} /></mesh>
      <mesh position={[-0.05, 0.24, 0.6]}><sphereGeometry args={[0.04, 5, 5]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={3} /></mesh>
      <mesh position={[0.05, 0.24, 0.6]}><sphereGeometry args={[0.04, 5, 5]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={3} /></mesh>
      <mesh position={[0, 0.24, -0.44]}><cylinderGeometry args={[0.04, 0.02, 0.32, 5]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  );
}

function LavaBeastMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.46, 9, 7]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={1.2} roughness={0.7} /></mesh>
      <mesh position={[-0.38, 0.52, 0]}><sphereGeometry args={[0.22, 7, 6]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>
      <mesh position={[0.38, 0.52, 0]}><sphereGeometry args={[0.22, 7, 6]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>
      <mesh position={[0, 0.76, 0]}><sphereGeometry args={[0.3, 8, 7]} /><meshStandardMaterial color="#221100" roughness={0.9} /></mesh>
      <mesh position={[-0.1, 0.78, 0.24]}><sphereGeometry args={[0.06, 6, 6]} /><meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} /></mesh>
      <mesh position={[0.1, 0.78, 0.24]}><sphereGeometry args={[0.06, 6, 6]} /><meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} /></mesh>
      <pointLight position={[0, 0.5, 0]} color="#ff4400" intensity={6} distance={4} />
    </group>
  );
}

function CrystalSpiderMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.22, 0]}><sphereGeometry args={[0.28, 7, 6]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={1.0} metalness={0.6} roughness={0.2} /></mesh>
      <mesh position={[0, 0.32, -0.18]}><sphereGeometry args={[0.18, 7, 6]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.8} metalness={0.5} /></mesh>
      {[-0.3,-0.2,-0.1,0.1,0.2,0.3,-0.2,0.2].map((ox, i) => (
        <mesh key={i} position={[ox * 1.2, 0.2, (i < 4 ? -1 : 1) * (0.1 + (i % 3) * 0.1)]} rotation={[0, 0, (ox < 0 ? 1 : -1) * 0.4]}>
          <cylinderGeometry args={[0.025, 0.015, 0.32, 4]} />
          <meshStandardMaterial color={color} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[-0.07, 0.36, 0.15]}><sphereGeometry args={[0.04, 5, 5]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={3} /></mesh>
      <mesh position={[0.07, 0.36, 0.15]}><sphereGeometry args={[0.04, 5, 5]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={3} /></mesh>
    </group>
  );
}

function ThunderBirdMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group position={[0, 0.6, 0]}>
      <mesh position={[0, 0, 0]}><sphereGeometry args={[0.26, 8, 7]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={1.0} metalness={0.3} /></mesh>
      <mesh position={[0, -0.12, -0.2]}><capsuleGeometry args={[0.14, 0.36, 5, 8]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.6} /></mesh>
      <mesh position={[-0.44, 0.06, -0.04]} rotation={[0.2, 0, 0.4]}><boxGeometry args={[0.55, 0.06, 0.32]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.8} /></mesh>
      <mesh position={[0.44, 0.06, -0.04]} rotation={[0.2, 0, -0.4]}><boxGeometry args={[0.55, 0.06, 0.32]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.8} /></mesh>
      <mesh position={[0, 0.12, 0.22]}><coneGeometry args={[0.06, 0.2, 5]} rotation={[Math.PI/2,0,0]} /><meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={2} /></mesh>
      <mesh position={[-0.07, 0.08, 0.19]}><sphereGeometry args={[0.04, 5, 5]} /><meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={3} /></mesh>
      <mesh position={[0.07, 0.08, 0.19]}><sphereGeometry args={[0.04, 5, 5]} /><meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={3} /></mesh>
    </group>
  );
}

function ShadowSlimeMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.36, 8, 6]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={1.5} transparent opacity={0.82} /></mesh>
      <mesh position={[0, 0.42, 0]}><sphereGeometry args={[0.22, 7, 5]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={2.0} transparent opacity={0.7} /></mesh>
      <mesh position={[-0.1, 0.5, 0.16]}><sphereGeometry args={[0.05, 5, 5]} /><meshStandardMaterial color="#cc00ff" emissive="#aa00ff" emissiveIntensity={4} /></mesh>
      <mesh position={[0.1, 0.5, 0.16]}><sphereGeometry args={[0.05, 5, 5]} /><meshStandardMaterial color="#cc00ff" emissive="#aa00ff" emissiveIntensity={4} /></mesh>
      <pointLight position={[0, 0.3, 0]} color="#6600cc" intensity={4} distance={3} />
    </group>
  );
}

function CaveDemonMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]}><capsuleGeometry args={[0.2, 0.45, 5, 8]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.6} roughness={0.7} /></mesh>
      <mesh position={[-0.38, 0.55, 0.05]} rotation={[0.3, 0, 0.6]}><boxGeometry args={[0.44, 0.05, 0.22]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      <mesh position={[0.38, 0.55, 0.05]} rotation={[0.3, 0, -0.6]}><boxGeometry args={[0.44, 0.05, 0.22]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      <mesh position={[0, 0.78, 0]}><sphereGeometry args={[0.22, 8, 7]} /><meshStandardMaterial color={color} roughness={0.65} /></mesh>
      <mesh position={[-0.07, 0.8, 0.18]}><sphereGeometry args={[0.05, 5, 5]} /><meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={3} /></mesh>
      <mesh position={[0.07, 0.8, 0.18]}><sphereGeometry args={[0.05, 5, 5]} /><meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={3} /></mesh>
      <mesh position={[-0.08, 0.72, 0.2]}><coneGeometry args={[0.03, 0.09, 4]} /><meshStandardMaterial color="#aaaaaa" /></mesh>
      <mesh position={[0.08, 0.72, 0.2]}><coneGeometry args={[0.03, 0.09, 4]} /><meshStandardMaterial color="#aaaaaa" /></mesh>
    </group>
  );
}

function JungleTrollMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.62, 0.56, 0.44]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[-0.44, 0.6, 0]}><boxGeometry args={[0.24, 0.72, 0.22]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      <mesh position={[0.44, 0.6, 0]}><boxGeometry args={[0.24, 0.72, 0.22]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      <mesh position={[0.62, 0.28, 0]}><sphereGeometry args={[0.22, 7, 6]} /><meshStandardMaterial color="#555533" roughness={0.9} /></mesh>
      <mesh position={[0, 0.95, 0]}><sphereGeometry args={[0.3, 8, 7]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.3} roughness={0.8} /></mesh>
      <mesh position={[-0.1, 0.97, 0.25]}><sphereGeometry args={[0.05, 5, 5]} /><meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={2} /></mesh>
      <mesh position={[0.1, 0.97, 0.25]}><sphereGeometry args={[0.05, 5, 5]} /><meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={2} /></mesh>
      <mesh position={[0, 0.88, 0.28]}><boxGeometry args={[0.28, 0.08, 0.04]} /><meshStandardMaterial color="#aaaaaa" /></mesh>
    </group>
  );
}

function FrostPhantomMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}><capsuleGeometry args={[0.22, 0.5, 5, 8]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={1.5} transparent opacity={0.65} /></mesh>
      <mesh position={[0, 1.0, 0]}><sphereGeometry args={[0.24, 8, 7]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={2.0} transparent opacity={0.7} /></mesh>
      <mesh position={[-0.1, 1.02, 0.19]}><sphereGeometry args={[0.05, 5, 5]} /><meshStandardMaterial color="#00ccff" emissive="#00aaff" emissiveIntensity={4} /></mesh>
      <mesh position={[0.1, 1.02, 0.19]}><sphereGeometry args={[0.05, 5, 5]} /><meshStandardMaterial color="#00ccff" emissive="#00aaff" emissiveIntensity={4} /></mesh>
      <mesh position={[-0.22, 0.7, 0.04]} rotation={[0.2, 0, 0.5]}><boxGeometry args={[0.38, 0.04, 0.18]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={1.2} transparent opacity={0.6} /></mesh>
      <mesh position={[0.22, 0.7, 0.04]} rotation={[0.2, 0, -0.5]}><boxGeometry args={[0.38, 0.04, 0.18]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={1.2} transparent opacity={0.6} /></mesh>
      <pointLight position={[0, 0.8, 0]} color="#88ccff" intensity={5} distance={4} />
    </group>
  );
}

function VolcanoDemonMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}><capsuleGeometry args={[0.3, 0.55, 6, 9]} /><meshStandardMaterial color={color} emissive={accent} emissiveIntensity={1.0} roughness={0.65} /></mesh>
      <mesh position={[-0.48, 0.65, 0]}><cylinderGeometry args={[0.14, 0.18, 0.6, 7]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      <mesh position={[0.48, 0.65, 0]}><cylinderGeometry args={[0.14, 0.18, 0.6, 7]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      <mesh position={[0, 1.0, 0]}><sphereGeometry args={[0.32, 9, 8]} /><meshStandardMaterial color="#330000" roughness={0.8} /></mesh>
      <mesh position={[-0.12, 1.02, 0.26]}><sphereGeometry args={[0.07, 6, 6]} /><meshStandardMaterial color="#ff6600" emissive="#ff2200" emissiveIntensity={5} /></mesh>
      <mesh position={[0.12, 1.02, 0.26]}><sphereGeometry args={[0.07, 6, 6]} /><meshStandardMaterial color="#ff6600" emissive="#ff2200" emissiveIntensity={5} /></mesh>
      <mesh position={[-0.1, 0.8, 0.3]}><coneGeometry args={[0.04, 0.11, 4]} /><meshStandardMaterial color="#ffcc00" /></mesh>
      <mesh position={[0.1, 0.8, 0.3]}><coneGeometry args={[0.04, 0.11, 4]} /><meshStandardMaterial color="#ffcc00" /></mesh>
      <pointLight position={[0, 0.6, 0]} color="#ff4400" intensity={10} distance={6} />
    </group>
  );
}

function EnemyMesh({ data }: { data: EnemyData }) {
  const def = ENEMY_DEFS[data.type];
  const s = def.size;
  const groupRef = useRef<THREE.Group>(null!);
  const flashStateRef = useRef<"none" | "flash" | "frozen">("none");

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(data.x, data.type === "bat" ? 1.2 : 0, data.z);

    const newState = data.frozenTimer > 0 ? "frozen" : data.hurtFlash > 0 ? "flash" : "none";
    if (newState !== flashStateRef.current) {
      flashStateRef.current = newState;
      if (newState !== "none") {
        groupRef.current.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (newState === "frozen") { mat.color.setHex(0x88ccff); mat.emissiveIntensity = 2; }
          else { mat.color.setHex(0xffffff); mat.emissiveIntensity = 4; }
        });
      }
    }
  });

  const isBoss = data.type === "boss";

  if (data.type === "bat") {
    return (
      <group ref={groupRef}>
        <BatMesh color={def.color} accent={def.emissive} />
      </group>
    );
  }

  if (data.type === "knight") {
    return (
      <group ref={groupRef}>
        <KnightMesh color={def.color} accent={def.emissive} />
      </group>
    );
  }

  if (isBoss) {
    return (
      <group ref={groupRef}>
        <mesh position={[0, s, 0]}>
          <capsuleGeometry args={[s * 0.55, s, 8, 12]} />
          <meshStandardMaterial color={def.color} emissive={def.emissive} emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, s * 2.4, 0]}>
          <sphereGeometry args={[s * 0.55, 10, 10]} />
          <meshStandardMaterial color="#880044" emissive="#aa0066" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, s * 2, 0]} color="#ff0066" intensity={15} distance={8} />
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {data.type === "slime"          && <SlimeMesh          color={def.color} accent={def.emissive} />}
      {data.type === "goblin"         && <GoblinMesh         color={def.color} accent={def.emissive} />}
      {data.type === "briarwolf"      && <BriarWolfMesh      color={def.color} accent={def.emissive} />}
      {data.type === "thornspitter"   && <ThornspitterMesh   color={def.color} accent={def.emissive} />}
      {data.type === "emberscorpion"  && <EmberScorpionMesh  color={def.color} accent={def.emissive} />}
      {data.type === "voidwraith"     && <VoidWraithMesh     color={def.color} accent={def.emissive} />}
      {data.type === "skeleton"       && <SkeletonMesh       color={def.color} accent={def.emissive} />}
      {data.type === "lizardman"      && <LizardmanMesh      color={def.color} accent={def.emissive} />}
      {data.type === "rockgolem"      && <RockGolemMesh      color={def.color} accent={def.emissive} />}
      {data.type === "icewolf"        && <IceWolfMesh        color={def.color} accent={def.emissive} />}
      {data.type === "lavabeast"      && <LavaBeastMesh      color={def.color} accent={def.emissive} />}
      {data.type === "crystalspider"  && <CrystalSpiderMesh  color={def.color} accent={def.emissive} />}
      {data.type === "thunderbird"    && <ThunderBirdMesh    color={def.color} accent={def.emissive} />}
      {data.type === "shadowslime"    && <ShadowSlimeMesh    color={def.color} accent={def.emissive} />}
      {data.type === "cavedemon"      && <CaveDemonMesh      color={def.color} accent={def.emissive} />}
      {data.type === "jungletroll"    && <JungleTrollMesh    color={def.color} accent={def.emissive} />}
      {data.type === "frostphantom"   && <FrostPhantomMesh   color={def.color} accent={def.emissive} />}
      {data.type === "volcanodemon"   && <VolcanoDemonMesh   color={def.color} accent={def.emissive} />}
    </group>
  );
}

function ProjectileMesh({ data }: { data: Projectile }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.set(data.x, 0.6, data.z);
      meshRef.current.rotation.y += delta * 5;
    }
  });
  const col = data.type === "boss" ? "#ff0044" : data.type === "voidwraith" ? "#8800ff" : data.type === "emberscorpion" ? "#ff4400" : "#88cc22";
  return (
    <mesh ref={meshRef}>
      <tetrahedronGeometry args={[0.18, 0]} />
      <meshStandardMaterial color={col} emissive={col} emissiveIntensity={2} />
    </mesh>
  );
}

export default function Enemies() {
  const enemiesRef = useRef<EnemyData[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const [, triggerRender] = useState(0);

  const currentArea = useGameStore(s => s.currentArea);
  const bossDefeated = useGameStore(s => s.bossDefeated);
  const gameState = useGameStore(s => s.gameState);
  const activeSword = useGameStore(s => s.activeSword);

  const storeRef = useRef(useGameStore.getState());
  useEffect(() => {
    const unsub = useGameStore.subscribe(s => { storeRef.current = s; });
    return unsub;
  }, []);

  useEffect(() => {
    enemiesRef.current = spawnEnemies(currentArea, bossDefeated);
    projectilesRef.current = [];
    triggerRender(n => n + 1);
  }, [currentArea]);

  const swordDmgRef = useRef(SWORD_DEFS[activeSword].damage);
  useEffect(() => { swordDmgRef.current = SWORD_DEFS[activeSword].damage; }, [activeSword]);

  useFrame((_, delta) => {
    if (storeRef.current.gameState !== "playing") return;
    const dt = Math.min(delta, 0.05);
    let anyDied = false;
    const now = Date.now();
    const isFrozen = now < weaponEffects.freezeUntil;
    const isStunned = now < weaponEffects.stunUntil;

    for (const e of enemiesRef.current) {
      if (e.iframes > 0) e.iframes -= dt;
      if (e.hurtFlash > 0) e.hurtFlash -= dt;
      if (e.frozenTimer > 0) e.frozenTimer -= dt;

      // Apply weapon hit zones
      for (const hz of weaponHitZones) {
        if (e.iframes > 0) continue;
        const dx2 = hz.x - e.x;
        const dz2 = hz.z - e.z;
        if (Math.sqrt(dx2 * dx2 + dz2 * dz2) < hz.radius + ENEMY_DEFS[e.type].size) {
          e.hp -= hz.damage;
          e.iframes = 0.4;
          e.hurtFlash = 0.18;
          if (hz.type === "frost") e.frozenTimer = 1.5;
          if (e.type === "boss") useGameStore.getState().damageBoss(hz.damage);
          if (e.hp <= 0) {
            const r = Math.random();
            if (r < 0.3) pendingPickupSpawns.push({ type: "heart", x: e.x, z: e.z });
            else if (r < 0.7) pendingPickupSpawns.push({ type: "rupee", x: e.x, z: e.z });
            useGameStore.getState().addKill(ENEMY_DEFS[e.type].pts);
            anyDied = true;
          }
        }
      }

      const def = ENEMY_DEFS[e.type];
      const dx = playerState.x - e.x;
      const dz = playerState.z - e.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Sword hit
      if (playerState.swordActive && e.iframes <= 0) {
        const sdx = playerState.swordX - e.x;
        const sdz = playerState.swordZ - e.z;
        if (Math.sqrt(sdx * sdx + sdz * sdz) < playerState.swordRadius + def.size * 0.75) {
          const dmg = swordDmgRef.current;
          e.hp -= dmg;
          e.iframes = 0.4;
          e.hurtFlash = 0.18;
          if (e.type === "boss") useGameStore.getState().damageBoss(dmg);
          if (e.hp <= 0) {
            const r = Math.random();
            if (r < 0.3) pendingPickupSpawns.push({ type: "heart", x: e.x, z: e.z });
            else if (r < 0.7) pendingPickupSpawns.push({ type: "rupee", x: e.x, z: e.z });
            useGameStore.getState().addKill(def.pts);
            anyDied = true;
          }
          continue;
        }
      }

      if (e.hp <= 0) continue;

      // Frozen / stunned — don't move or shoot
      if (isFrozen || e.frozenTimer > 0) continue;
      const speedMult = isStunned ? 0.3 : 1.0;

      if (def.behavior === "chase") {
        if (dist > 0.01) { e.x += (dx / dist) * def.speed * speedMult * dt; e.z += (dz / dist) * def.speed * speedMult * dt; }
        if (dist < def.size + 0.75) useGameStore.getState().damagePlayer(def.contactDamage);

      } else if (def.behavior === "charge") {
        e.chargeTimer -= dt;
        if (e.chargeTimer <= 0 && !e.isCharging) {
          e.isCharging = true;
          const len = dist || 1;
          e.chargeDx = dx / len; e.chargeDz = dz / len;
          e.chargeTimer = def.chargeDuration ?? 0.5;
        }
        if (e.isCharging) {
          e.x += e.chargeDx * def.speed * 2.2 * speedMult * dt;
          e.z += e.chargeDz * def.speed * 2.2 * speedMult * dt;
          e.chargeTimer -= dt;
          if (e.chargeTimer <= 0) { e.isCharging = false; e.chargeTimer = (def.chargeInterval ?? 2) + Math.random() * 1.5; }
        } else {
          if (dist > 2 && dist > 0.01) { e.x += (dx / dist) * def.speed * 0.35 * speedMult * dt; e.z += (dz / dist) * def.speed * 0.35 * speedMult * dt; }
        }
        if (dist < def.size + 0.75) useGameStore.getState().damagePlayer(def.contactDamage);
        if (e.type === "boss" && def.rangedInterval) {
          e.rangedTimer -= dt;
          if (e.rangedTimer <= 0 && dist < 20 && projectilesRef.current.length < 18) {
            e.rangedTimer = def.rangedInterval + Math.random() * 0.5;
            const len2 = dist || 1;
            const bossHP = useGameStore.getState().bossHP;
            const shots = bossHP <= 10 ? 3 : 1;
            for (let s = 0; s < shots; s++) {
              const spread = (s - (shots - 1) / 2) * (Math.PI / 6);
              const ca = Math.cos(spread), sa = Math.sin(spread);
              const ndx = (dx / len2) * ca - (dz / len2) * sa;
              const ndz = (dx / len2) * sa + (dz / len2) * ca;
              projectilesRef.current.push({ id: `p-${++projSeq}`, x: e.x, z: e.z, dx: ndx, dz: ndz, speed: def.projectileSpeed ?? 12, damage: def.projectileDamage ?? 0.75, timeLeft: 3.5, type: "boss" });
            }
          }
        }

      } else if (def.behavior === "ranged") {
        const keepDist = 9;
        if (dist < keepDist && dist > 0.01) { e.x -= (dx / dist) * def.speed * speedMult * dt; e.z -= (dz / dist) * def.speed * speedMult * dt; }
        else if (dist > keepDist + 4 && dist > 0.01) { e.x += (dx / dist) * def.speed * 0.5 * speedMult * dt; e.z += (dz / dist) * def.speed * 0.5 * speedMult * dt; }
        e.rangedTimer -= dt;
        if (e.rangedTimer <= 0 && dist < 18 && projectilesRef.current.length < 18) {
          e.rangedTimer = (def.rangedInterval ?? 2) + Math.random() * 0.8;
          const len2 = dist || 1;
          projectilesRef.current.push({ id: `p-${++projSeq}`, x: e.x, z: e.z, dx: dx / len2, dz: dz / len2, speed: def.projectileSpeed ?? 9, damage: def.projectileDamage ?? 0.5, timeLeft: 3.0, type: e.type });
        }
        if (dist < def.size + 0.75) useGameStore.getState().damagePlayer(def.contactDamage);
      }

      e.x = Math.max(-22.5, Math.min(22.5, e.x));
      e.z = Math.max(-22.5, Math.min(22.5, e.z));
    }

    for (const p of projectilesRef.current) {
      p.timeLeft -= dt;
      p.x += p.dx * p.speed * dt;
      p.z += p.dz * p.speed * dt;
      const pdx = playerState.x - p.x;
      const pdz = playerState.z - p.z;
      if (Math.sqrt(pdx * pdx + pdz * pdz) < 0.6) {
        useGameStore.getState().damagePlayer(p.damage);
        p.timeLeft = -1;
      }
    }

    if (anyDied) {
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);
      triggerRender(n => n + 1);
    }
    projectilesRef.current = projectilesRef.current.filter(p => p.timeLeft > 0);
  });

  return (
    <>
      {enemiesRef.current.map(e => <EnemyMesh key={e.id} data={e} />)}
      {projectilesRef.current.map(p => <ProjectileMesh key={p.id} data={p} />)}
    </>
  );
}
