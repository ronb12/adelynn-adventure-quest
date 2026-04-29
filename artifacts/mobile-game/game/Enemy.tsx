import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { useGameStore, AreaId, SWORD_DEFS } from "./store";
import { playerState, pendingPickupSpawns, weaponHitZones, weaponEffects } from "./controls";

export type EnemyType = "slime" | "goblin" | "briarwolf" | "thornspitter" | "emberscorpion" | "voidwraith" | "boss" | "bat" | "knight";

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
  field:  [{ type: "slime", count: 8, radius: 14 }, { type: "goblin", count: 4, radius: 16 }],
  forest: [{ type: "briarwolf", count: 6, radius: 14 }, { type: "thornspitter", count: 4, radius: 16 }, { type: "bat", count: 4, radius: 12 }],
  desert: [{ type: "emberscorpion", count: 6, radius: 14 }, { type: "voidwraith", count: 4, radius: 16 }, { type: "knight", count: 3, radius: 12 }],
  boss:   [{ type: "boss", count: 1, radius: 0 }],
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
      {data.type === "slime"         && <SlimeMesh         color={def.color} accent={def.emissive} />}
      {data.type === "goblin"        && <GoblinMesh        color={def.color} accent={def.emissive} />}
      {data.type === "briarwolf"     && <BriarWolfMesh     color={def.color} accent={def.emissive} />}
      {data.type === "thornspitter"  && <ThornspitterMesh  color={def.color} accent={def.emissive} />}
      {data.type === "emberscorpion" && <EmberScorpionMesh color={def.color} accent={def.emissive} />}
      {data.type === "voidwraith"    && <VoidWraithMesh    color={def.color} accent={def.emissive} />}
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
