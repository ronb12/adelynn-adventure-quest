import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { useGameStore, AreaId, LORE_STONES, SWORD_CHESTS, WEAPON_PICKUPS } from "./store";
import { playerState } from "./controls";

function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.7 * scale, 0]}><cylinderGeometry args={[0.2 * scale, 0.3 * scale, 1.4 * scale, 7]} /><meshStandardMaterial color="#5c3d1e" /></mesh>
      <mesh position={[0, 1.8 * scale, 0]}><coneGeometry args={[0.9 * scale, 1.8 * scale, 8]} /><meshStandardMaterial color="#2d6a1e" /></mesh>
      <mesh position={[0, 2.6 * scale, 0]}><coneGeometry args={[0.65 * scale, 1.4 * scale, 8]} /><meshStandardMaterial color="#348a24" /></mesh>
    </group>
  );
}

function Cactus({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.22, 0.27, 1.8, 7]} /><meshStandardMaterial color="#4a8a2e" /></mesh>
      <mesh position={[0.5, 0.8, 0]}><cylinderGeometry args={[0.13, 0.15, 0.9, 6]} /><meshStandardMaterial color="#4a8a2e" /></mesh>
      <mesh position={[-0.45, 0.7, 0]}><cylinderGeometry args={[0.13, 0.15, 0.7, 6]} /><meshStandardMaterial color="#4a8a2e" /></mesh>
    </group>
  );
}

function Portal({ x, z, rotY = 0, color, targetArea, spawnX, spawnZ }: {
  x: number; z: number; rotY?: number; color: string; targetArea: AreaId; spawnX: number; spawnZ: number;
}) {
  const glowRef = useRef<THREE.Mesh>(null!);
  const cooldownRef = useRef(2.0); // initial cooldown prevents immediate re-trigger on spawn
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.8 + Math.sin(timeRef.current * 2.5) * 0.4;
      mat.opacity = 0.5 + Math.sin(timeRef.current * 2.5) * 0.1;
    }
    const store = useGameStore.getState();
    if (store.gameState !== "playing") return;
    cooldownRef.current -= delta;
    if (cooldownRef.current > 0) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.8) {
      cooldownRef.current = 2;
      store.triggerAreaTransition({ area: targetArea, spawnX, spawnZ });
    }
  });

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Left pillar */}
      <mesh position={[-1.1, 2.5, 0]}>
        <boxGeometry args={[0.38, 5, 0.38]} />
        <meshStandardMaterial color="#665544" roughness={0.9} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[1.1, 2.5, 0]}>
        <boxGeometry args={[0.38, 5, 0.38]} />
        <meshStandardMaterial color="#665544" roughness={0.9} />
      </mesh>
      {/* Lintel */}
      <mesh position={[0, 5.1, 0]}>
        <boxGeometry args={[2.8, 0.5, 0.38]} />
        <meshStandardMaterial color="#554433" roughness={0.85} />
      </mesh>
      {/* Pillar caps */}
      <mesh position={[-1.1, 5.0, 0]}><boxGeometry args={[0.5, 0.25, 0.5]} /><meshStandardMaterial color="#554433" roughness={0.9} /></mesh>
      <mesh position={[1.1, 5.0, 0]}><boxGeometry args={[0.5, 0.25, 0.5]} /><meshStandardMaterial color="#554433" roughness={0.9} /></mesh>
      {/* Glowing portal plane inside the doorway */}
      <mesh ref={glowRef} position={[0, 2.5, 0]}>
        <planeGeometry args={[1.9, 4.8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9}
          transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* Ground glow ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={0.35} />
      </mesh>
      {/* Rune orb on top of lintel */}
      <mesh position={[0, 5.6, 0]}>
        <sphereGeometry args={[0.22, 9, 7]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent opacity={0.9} />
      </mesh>
      <pointLight position={[0, 2.5, 0]} color={color} intensity={10} distance={9} decay={2} />
    </group>
  );
}

function LoreStoneObj({ id, x, z }: { id: string; x: number; z: number }) {
  const stoneRef = useRef<THREE.Mesh>(null!);
  const setNearLore = useGameStore(s => s.setNearLore);
  const loreRead = useGameStore(s => s.loreRead);
  const nearLore = useGameStore(s => s.nearLore);
  const isRead = loreRead.includes(id);
  const isNear = nearLore === id;
  const cooldownRef = useRef(0);

  useFrame((_, delta) => {
    if (stoneRef.current) {
      stoneRef.current.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.12;
      stoneRef.current.rotation.y += delta * 0.4;
    }
    cooldownRef.current -= delta;
    if (cooldownRef.current > 0) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2.2 && !isNear) { setNearLore(id); cooldownRef.current = 0.3; }
    else if (dist >= 2.2 && isNear) { setNearLore(null); cooldownRef.current = 0.3; }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, -0.2, 0]}><boxGeometry args={[0.7, 0.4, 0.35]} /><meshStandardMaterial color="#4a4a5a" /></mesh>
      <mesh ref={stoneRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[0.55, 0.75, 0.15]} />
        <meshStandardMaterial color={isRead ? "#888899" : "#b8a0ff"} emissive={isRead ? "#222" : (isNear ? "#cc88ff" : "#6633cc")} emissiveIntensity={isRead ? 0 : (isNear ? 2.5 : 1.0)} />
      </mesh>
      {!isRead && <pointLight position={[0, 1, 0]} color="#9966ff" intensity={isNear ? 8 : 3} distance={isNear ? 5 : 3} />}
    </group>
  );
}

// Main shard chest (field/forest/desert/boss-armor)
function ShardChest({ chestKey, x, z }: { chestKey: string; x: number; z: number }) {
  const chestsOpened = useGameStore(s => s.chestsOpened);
  const openChest = useGameStore(s => s.openChest);
  const gameState = useGameStore(s => s.gameState);
  const isOpen = chestsOpened.includes(chestKey);
  const cooldownRef = useRef(0);
  const lidRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    cooldownRef.current -= delta;
    if (isOpen || gameState !== "playing" || cooldownRef.current > 0) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
      cooldownRef.current = 1;
      openChest(chestKey);
    }
  });

  const boxColor = chestKey === "boss-armor" ? "#335599" : "#8b6914";
  const lidColor = chestKey === "boss-armor" ? "#4466bb" : "#a07820";
  const glowColor = chestKey === "boss-armor" ? "#4488ff" : (chestKey === "field" ? "#ffe060" : chestKey === "forest" ? "#b084ff" : "#ff8844");

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.8, 0.44, 0.55]} /><meshStandardMaterial color={boxColor} /></mesh>
      <mesh ref={lidRef} position={[0, isOpen ? 0.62 : 0.54, 0]} rotation={[isOpen ? -1.2 : 0, 0, 0]}>
        <boxGeometry args={[0.82, 0.22, 0.56]} /><meshStandardMaterial color={lidColor} />
      </mesh>
      {!isOpen && (
        <>
          <mesh position={[0, 0.44, 0]}><boxGeometry args={[0.86, 0.08, 0.58]} /><meshStandardMaterial color="#ffd700" emissive="#ffcc00" emissiveIntensity={1.5} /></mesh>
          <pointLight position={[0, 0.8, 0]} color={glowColor} intensity={6} distance={4} />
        </>
      )}
    </group>
  );
}

// Sword chest
function SwordChest({ chestKey, x, z }: { chestKey: string; x: number; z: number }) {
  const chestsOpened = useGameStore(s => s.chestsOpened);
  const isOpen = chestsOpened.includes(chestKey);
  const gameState = useGameStore(s => s.gameState);
  const cooldownRef = useRef(0);

  useFrame((_, delta) => {
    cooldownRef.current -= delta;
    if (isOpen || gameState !== "playing" || cooldownRef.current > 0) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
      cooldownRef.current = 1;
      useGameStore.getState().openChest(chestKey);
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.8, 0.44, 0.55]} /><meshStandardMaterial color="#8b6914" /></mesh>
      <mesh position={[0, isOpen ? 0.62 : 0.54, 0]} rotation={[isOpen ? -1.2 : 0, 0, 0]}>
        <boxGeometry args={[0.82, 0.22, 0.56]} /><meshStandardMaterial color="#a07820" />
      </mesh>
      {!isOpen && <pointLight position={[0, 0.8, 0]} color="#ffcc44" intensity={5} distance={4} />}
    </group>
  );
}

// Weapon altar pedestal
function WeaponAltar({ pickupKey, x, z, icon, color }: {
  pickupKey: string; x: number; z: number; icon: string; color: string;
}) {
  const chestsOpened = useGameStore(s => s.chestsOpened);
  const gameState = useGameStore(s => s.gameState);
  const isPickedUp = chestsOpened.includes(pickupKey);
  const cooldownRef = useRef(0);
  const orbRef = useRef<THREE.Mesh>(null!);
  const pickup = WEAPON_PICKUPS.find(p => p.key === pickupKey);

  useFrame((_, delta) => {
    if (orbRef.current && !isPickedUp) {
      orbRef.current.rotation.y += delta * 1.5;
      orbRef.current.position.y = 1.4 + Math.sin(Date.now() * 0.002) * 0.1;
    }
    cooldownRef.current -= delta;
    if (isPickedUp || gameState !== "playing" || cooldownRef.current > 0 || !pickup) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
      cooldownRef.current = 1;
      useGameStore.getState().unlockWeaponPickup(pickup.weaponId, pickupKey);
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Base pedestal */}
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.5, 0.6, 0.4, 10]} /><meshStandardMaterial color="#3a2a1a" /></mesh>
      <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.3, 0.5, 0.3, 10]} /><meshStandardMaterial color="#4a3a2a" /></mesh>
      {/* Orb */}
      {!isPickedUp && (
        <>
          <mesh ref={orbRef} position={[0, 1.4, 0]}>
            <sphereGeometry args={[0.28, 10, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, 1.4, 0]} color={color} intensity={6} distance={4} />
        </>
      )}
    </group>
  );
}

// Fairy Fountain
function Fountain({ x, z }: { x: number; z: number }) {
  const setNearFountain = useGameStore(s => s.setNearFountain);
  const nearFountain = useGameStore(s => s.nearFountain);
  const gameState = useGameStore(s => s.gameState);
  const cooldownRef = useRef(0);
  const waterRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (waterRef.current) {
      waterRef.current.rotation.y += delta * 0.8;
      waterRef.current.position.y = 0.9 + Math.sin(Date.now() * 0.003) * 0.08;
    }
    if (gameState !== "playing") return;
    cooldownRef.current -= delta;
    if (cooldownRef.current > 0) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2.5 && !nearFountain) { setNearFountain(true); cooldownRef.current = 0.3; }
    else if (dist >= 2.5 && nearFountain) { setNearFountain(false); cooldownRef.current = 0.3; }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[1.2, 1.3, 0.3, 12]} /><meshStandardMaterial color="#aabbcc" /></mesh>
      <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.15, 0.2, 0.9, 8]} /><meshStandardMaterial color="#aabbcc" /></mesh>
      <mesh ref={waterRef} position={[0, 0.9, 0]}>
        <torusGeometry args={[0.7, 0.18, 8, 16]} />
        <meshStandardMaterial color="#44aaff" emissive="#2288ff" emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color="#44aaff" intensity={10} distance={6} />
    </group>
  );
}

// Heart piece (collectible)
function HeartPiece({ id, x, z }: { id: string; x: number; z: number }) {
  const heartPiecesCollected = useGameStore(s => s.heartPiecesCollected);
  const collectHeartPiece = useGameStore(s => s.collectHeartPiece);
  const gameState = useGameStore(s => s.gameState);
  const collected = heartPiecesCollected.includes(id);
  const cooldownRef = useRef(0);
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current && !collected) {
      meshRef.current.position.y = 0.6 + Math.sin(Date.now() * 0.003) * 0.12;
      meshRef.current.rotation.y += delta * 1.2;
    }
    cooldownRef.current -= delta;
    if (collected || gameState !== "playing" || cooldownRef.current > 0) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.2) {
      cooldownRef.current = 1;
      collectHeartPiece(id);
    }
  });

  if (collected) return null;
  return (
    <group position={[x, 0, z]}>
      <mesh ref={meshRef} position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.24, 10, 8]} />
        <meshStandardMaterial color="#ff6688" emissive="#ee2255" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[x, 0.8, z]} color="#ff4466" intensity={5} distance={3} />
    </group>
  );
}

// Shop trigger
function ShopPedestal({ x, z }: { x: number; z: number }) {
  const setNearShop = useGameStore(s => s.setNearShop);
  const nearShop = useGameStore(s => s.nearShop);
  const gameState = useGameStore(s => s.gameState);
  const cooldownRef = useRef(0);
  const signRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (signRef.current) signRef.current.rotation.y += delta * 0.5;
    if (gameState !== "playing") return;
    cooldownRef.current -= delta;
    if (cooldownRef.current > 0) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2.2 && !nearShop) { setNearShop(true); cooldownRef.current = 0.3; }
    else if (dist >= 2.2 && nearShop) { setNearShop(false); cooldownRef.current = 0.3; }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.08, 0.1, 1.6, 6]} /><meshStandardMaterial color="#5c3d1e" /></mesh>
      <mesh ref={signRef} position={[0, 1.8, 0]}>
        <boxGeometry args={[0.8, 0.5, 0.08]} />
        <meshStandardMaterial color="#ffcc44" emissive="#cc8800" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[0, 1.8, 0]} color="#ffcc44" intensity={4} distance={4} />
    </group>
  );
}

function Wall({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh position={[x, 1.5, z]}>
      <boxGeometry args={[w, 3, d]} />
      <meshStandardMaterial color="#2a3a2a" transparent opacity={0} />
    </mesh>
  );
}

// ── Village structures ────────────────────────────────────────────
function Cottage({
  pos, rot = 0, roofColor = "#8b3a3a", wallColor = "#f5f0e8", size = 1,
}: { pos: [number,number,number]; rot?: number; roofColor?: string; wallColor?: string; size?: number }) {
  const w = 3.2 * size, d = 2.8 * size, h = 2.0 * size;
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.18, 0]}><boxGeometry args={[w+0.3, 0.36, d+0.3]} /><meshStandardMaterial color="#9e9e9e" roughness={0.9} /></mesh>
      <mesh position={[0, h/2+0.36, 0]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={wallColor} roughness={0.82} /></mesh>
      <mesh position={[0, h+0.36, 0]}><boxGeometry args={[w+0.1, 0.12, d+0.1]} /><meshStandardMaterial color="#5d4037" roughness={0.8} /></mesh>
      <mesh position={[-w*0.28, h+0.36+0.55*size, 0]} rotation={[0,0,-0.55]}><boxGeometry args={[w*0.62, 0.14, d+0.5]} /><meshStandardMaterial color={roofColor} roughness={0.75} /></mesh>
      <mesh position={[w*0.28, h+0.36+0.55*size, 0]} rotation={[0,0,0.55]}><boxGeometry args={[w*0.62, 0.14, d+0.5]} /><meshStandardMaterial color={roofColor} roughness={0.75} /></mesh>
      <mesh position={[0, h+0.36+0.96*size, 0]}><boxGeometry args={[0.18, 0.18, d+0.6]} /><meshStandardMaterial color="#4e342e" roughness={0.7} /></mesh>
      <mesh position={[0, h+0.36+0.48*size, d/2+0.07]}><boxGeometry args={[w+0.04, 1.0*size, 0.12]} /><meshStandardMaterial color={wallColor} roughness={0.82} /></mesh>
      <mesh position={[0, h+0.36+0.48*size, -(d/2+0.07)]}><boxGeometry args={[w+0.04, 1.0*size, 0.12]} /><meshStandardMaterial color={wallColor} roughness={0.82} /></mesh>
      <mesh position={[0, 0.72+0.36, d/2+0.02]}><boxGeometry args={[0.7*size, 1.44*size, 0.07]} /><meshStandardMaterial color="#5d3a1a" roughness={0.85} /></mesh>
      <mesh position={[0, 0.72+0.36, d/2+0.05]}><boxGeometry args={[0.78*size, 1.52*size, 0.05]} /><meshStandardMaterial color="#4e342e" roughness={0.8} /></mesh>
      <mesh position={[0.22*size, 0.7+0.36, d/2+0.07]}><sphereGeometry args={[0.055, 7, 5]} /><meshStandardMaterial color="#d4a840" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[-0.9*size, h*0.55+0.36, d/2+0.03]}><boxGeometry args={[0.55*size, 0.55*size, 0.06]} /><meshStandardMaterial color="#aad4f5" transparent opacity={0.65} /></mesh>
      <mesh position={[-0.9*size, h*0.55+0.36, d/2+0.05]}><boxGeometry args={[0.63*size, 0.63*size, 0.04]} /><meshStandardMaterial color="#4e342e" roughness={0.8} /></mesh>
      <mesh position={[0.9*size, h*0.55+0.36, d/2+0.03]}><boxGeometry args={[0.55*size, 0.55*size, 0.06]} /><meshStandardMaterial color="#aad4f5" transparent opacity={0.65} /></mesh>
      <mesh position={[0.9*size, h*0.55+0.36, d/2+0.05]}><boxGeometry args={[0.63*size, 0.63*size, 0.04]} /><meshStandardMaterial color="#4e342e" roughness={0.8} /></mesh>
      <mesh position={[0.7*size, h+0.36+1.0*size, -0.5*size]}><boxGeometry args={[0.36*size, 1.1*size, 0.36*size]} /><meshStandardMaterial color="#9e9e9e" roughness={0.9} /></mesh>
    </group>
  );
}

function Well({ pos }: { pos: [number,number,number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.8, 0.85, 0.8, 14]} /><meshStandardMaterial color="#9e9e9e" roughness={0.9} /></mesh>
      <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.58, 0.58, 0.82, 12]} /><meshStandardMaterial color="#1a1a1a" roughness={1} /></mesh>
      {([-0.65, 0.65] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 1.2, 0]}><cylinderGeometry args={[0.075, 0.075, 1.6, 7]} /><meshStandardMaterial color="#5d4037" roughness={0.8} /></mesh>
      ))}
      <mesh position={[0, 2.05, 0]}><boxGeometry args={[1.4, 0.14, 0.14]} /><meshStandardMaterial color="#5d4037" roughness={0.8} /></mesh>
      <mesh position={[0.1, 1.5, 0]}><cylinderGeometry args={[0.12, 0.1, 0.28, 8]} /><meshStandardMaterial color="#8d6e63" roughness={0.75} /></mesh>
    </group>
  );
}

function FenceSection({ from, to }: { from: [number,number,number]; to: [number,number,number] }) {
  const mid: [number,number,number] = [(from[0]+to[0])/2, (from[1]+to[1])/2+0.5, (from[2]+to[2])/2];
  const dx = to[0]-from[0], dz = to[2]-from[2];
  const len = Math.sqrt(dx*dx+dz*dz);
  const angle = Math.atan2(dx, dz);
  return (
    <group>
      <mesh position={[from[0], from[1]+0.5, from[2]]}><boxGeometry args={[0.1,1.0,0.1]} /><meshStandardMaterial color="#6d4c26" roughness={0.85} /></mesh>
      <mesh position={[to[0], to[1]+0.5, to[2]]}><boxGeometry args={[0.1,1.0,0.1]} /><meshStandardMaterial color="#6d4c26" roughness={0.85} /></mesh>
      <mesh position={mid} rotation={[0, angle, 0]}><boxGeometry args={[0.07, 0.07, len]} /><meshStandardMaterial color="#8d6239" roughness={0.82} /></mesh>
      <mesh position={[mid[0], mid[1]-0.28, mid[2]]} rotation={[0, angle, 0]}><boxGeometry args={[0.07, 0.07, len]} /><meshStandardMaterial color="#8d6239" roughness={0.82} /></mesh>
    </group>
  );
}

function AdelynnHouse() {
  const w = 4.2, d = 3.6, h = 2.4;
  return (
    <group position={[-7, 0, 10]}>
      <mesh position={[0, 0.22, 0]}><boxGeometry args={[w+0.5, 0.44, d+0.5]} /><meshStandardMaterial color="#8a8a7a" roughness={0.88} /></mesh>
      <mesh position={[0, h/2+0.44, 0]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial color="#f8f2e0" roughness={0.78} /></mesh>
      <mesh position={[0, h+0.44, 0]}><boxGeometry args={[w+0.12, 0.14, d+0.12]} /><meshStandardMaterial color="#4e3320" roughness={0.78} /></mesh>
      {([-w/2, w/2] as number[]).flatMap(x => ([-d/2, d/2] as number[]).map(z =>
        <mesh key={`${x}${z}`} position={[x, h/2+0.44, z]}><boxGeometry args={[0.13, h, 0.13]} /><meshStandardMaterial color="#4e3320" roughness={0.78} /></mesh>
      ))}
      <mesh position={[-w*0.27, h+0.44+0.65, 0]} rotation={[0,0,-0.55]}><boxGeometry args={[w*0.62, 0.16, d+0.6]} /><meshStandardMaterial color="#c06080" roughness={0.72} /></mesh>
      <mesh position={[w*0.27, h+0.44+0.65, 0]} rotation={[0,0,0.55]}><boxGeometry args={[w*0.62, 0.16, d+0.6]} /><meshStandardMaterial color="#c06080" roughness={0.72} /></mesh>
      <mesh position={[0, h+0.44+1.1, 0]}><boxGeometry args={[0.2, 0.2, d+0.7]} /><meshStandardMaterial color="#3a2010" roughness={0.72} /></mesh>
      {([-1, 1] as number[]).map(side => (
        <mesh key={side} position={[0, h+0.44+0.54, side*(d/2+0.08)]}><boxGeometry args={[w+0.06, 1.1, 0.14]} /><meshStandardMaterial color="#f8f2e0" roughness={0.78} /></mesh>
      ))}
      <mesh position={[0.8, h+0.44+1.15, -0.6]}><boxGeometry args={[0.44, 1.3, 0.44]} /><meshStandardMaterial color="#9a9080" roughness={0.88} /></mesh>
      <mesh position={[0.8, h+0.44+2.1, -0.6]}><sphereGeometry args={[0.28, 8, 7]} /><meshStandardMaterial color="#ddddcc" transparent opacity={0.4} roughness={1} /></mesh>
      <mesh position={[0, 0.88+0.44, d/2+0.03]}><boxGeometry args={[0.85, 1.76, 0.08]} /><meshStandardMaterial color="#cc6688" roughness={0.8} /></mesh>
      <mesh position={[0, 0.88+0.44, d/2+0.07]}><boxGeometry args={[0.95, 1.86, 0.06]} /><meshStandardMaterial color="#4e3320" roughness={0.78} /></mesh>
      <mesh position={[0.15, 1.1+0.44, d/2+0.1]}><sphereGeometry args={[0.07, 8, 7]} /><meshStandardMaterial color="#e8c020" metalness={0.7} roughness={0.2} /></mesh>
      {([-1.1, 1.1] as number[]).map(x => (
        <group key={x}>
          <mesh position={[x, h*0.55+0.44, d/2+0.04]}><boxGeometry args={[0.7, 0.7, 0.07]} /><meshStandardMaterial color="#ffeecc" transparent opacity={0.7} emissive="#ffe8aa" emissiveIntensity={0.5} /></mesh>
          <mesh position={[x, h*0.55+0.44, d/2+0.07]}><boxGeometry args={[0.78, 0.78, 0.05]} /><meshStandardMaterial color="#4e3320" roughness={0.78} /></mesh>
        </group>
      ))}
      {([
        [-1.8, 0.02, d/2+0.8, "#e91e8c"], [-0.6, 0.02, d/2+0.9, "#ff80ab"],
        [0.6, 0.02, d/2+0.9, "#f06292"], [1.8, 0.02, d/2+0.8, "#ffd54f"],
      ] as [number,number,number,string][]).map(([fx,fy,fz,col], i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[fx, fy, fz]}>
          <circleGeometry args={[0.35, 7]} />
          <meshStandardMaterial color={col} roughness={1} />
        </mesh>
      ))}
      {[0.4, 1.0, 1.6, 2.2].map((dz, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, d/2+dz]}>
          <circleGeometry args={[0.3, 7]} />
          <meshStandardMaterial color="#c0b8a0" roughness={0.9} />
        </mesh>
      ))}
      <group position={[-2.6, 0, d/2+0.4]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.055, 0.065, 1.8, 7]} /><meshStandardMaterial color="#6d4c26" roughness={0.85} /></mesh>
        <mesh position={[0, 1.85, 0]}><boxGeometry args={[1.5, 0.55, 0.12]} /><meshStandardMaterial color="#e8d090" roughness={0.6} /></mesh>
        <mesh position={[0, 1.85, 0.07]}><boxGeometry args={[1.4, 0.12, 0.04]} /><meshStandardMaterial color="#cc6688" roughness={0.7} /></mesh>
      </group>
      <pointLight position={[0, 1.5, 0]} color="#ffdd88" intensity={0.8} distance={6} decay={2} />
    </group>
  );
}

function Village() {
  return (
    <group>
      <AdelynnHouse />
      <Cottage pos={[6, 0, 8]}   rot={0}                roofColor="#8b3a2a" wallColor="#f5f0e8" />
      <Cottage pos={[14, 0, 5]}  rot={-Math.PI*0.08}   roofColor="#6d4c26" wallColor="#eee8d8" size={0.9} />
      <Cottage pos={[10, 0, 15]} rot={Math.PI*0.05}    roofColor="#4a4a6e" wallColor="#f0ede0" size={0.95} />
      <Well pos={[9.5, 0, 10]} />
      <FenceSection from={[4,0,5]}   to={[4,0,13]} />
      <FenceSection from={[4,0,13]}  to={[12,0,17]} />
      <FenceSection from={[12,0,17]} to={[17,0,13]} />
      <FenceSection from={[17,0,13]} to={[17,0,5]} />
      <FenceSection from={[17,0,5]}  to={[4,0,5]} />
      <group position={[5.2, 0, 4.2]} rotation={[0, 0.3, 0]}>
        <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.06, 0.07, 1.8, 7]} /><meshStandardMaterial color="#6d4c26" roughness={0.85} /></mesh>
        <mesh position={[0, 1.85, 0]}><boxGeometry args={[1.4, 0.55, 0.12]} /><meshStandardMaterial color="#d4a84a" roughness={0.6} /></mesh>
      </group>
      {([
        [7, 0.02, 13.5, "#e91e8c"], [8.5, 0.02, 14, "#ffd54f"],
        [16, 0.02, 9, "#f06292"],   [5, 0.02, 9, "#ffcc02"],
      ] as [number,number,number,string][]).map(([px,py,pz,col], i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[px, py, pz]}>
          <circleGeometry args={[0.6, 7]} />
          <meshStandardMaterial color={col} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ── Area components ───────────────────────────────────────────────
function FieldArea() {
  const treePos = [
    [-20, -20], [-14, -22], [-8, -24], [2, -24], [10, -23], [18, -21], [22, -14],
    [24, -6], [24, 4], [22, 14], [18, 22], [8, 24], [-2, 24], [-12, 22],
    [-22, 16], [-24, 6], [-24, -4], [-22, -14],
  ];
  const fieldSwordChests = SWORD_CHESTS.filter(c => c.area === "field");
  const fieldWeapons = WEAPON_PICKUPS.filter(p => p.area === "field");
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[50, 50]} /><meshStandardMaterial color="#3a7a2f" /></mesh>
      {treePos.map(([tx, tz], i) => <Tree key={i} x={tx} z={tz} scale={0.85 + (i % 3) * 0.1} />)}
      <Portal x={22} z={0} rotY={Math.PI / 2} color="#22ff88" targetArea="forest" spawnX={-20} spawnZ={0} />
      <Portal x={-22} z={0} rotY={Math.PI / 2} color="#ffaa44" targetArea="desert" spawnX={20} spawnZ={0} />
      {/* Main shard chest */}
      <ShardChest chestKey="field" x={0} z={-20} />
      {/* Sword chests */}
      {fieldSwordChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {/* Weapon altars */}
      {fieldWeapons.map(wp => <WeaponAltar key={wp.key} pickupKey={wp.key} x={wp.x} z={wp.z} icon={wp.icon} color={wp.color} />)}
      {/* Lore stones */}
      {LORE_STONES.field.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      {/* Fairy Fountain */}
      <Fountain x={-18} z={-18} />
      {/* Shop sign near NPC cluster */}
      <ShopPedestal x={10} z={14} />
      {/* Village — houses, well, fences */}
      <Village />
      {/* Heart pieces */}
      <HeartPiece id="hp-field-1" x={-10} z={-10} />
      <HeartPiece id="hp-field-2" x={12} z={-18} />
      <Wall x={0} z={-26} w={52} d={1} /><Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} /><Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function ForestArea() {
  const treePos = [
    [-18, -18], [-12, -20], [-6, -22], [2, -22], [8, -20], [14, -18], [20, -14],
    [22, -6], [22, 4], [20, 12], [16, 20], [6, 22], [-4, 22], [-14, 20],
    [-20, 14], [-22, 4], [-22, -6], [-20, -14],
    [-8, -10], [10, -8], [-14, 4], [12, 10], [-6, 16], [8, -16],
  ];
  const forestSwordChests = SWORD_CHESTS.filter(c => c.area === "forest");
  const forestWeapons = WEAPON_PICKUPS.filter(p => p.area === "forest");
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[50, 50]} /><meshStandardMaterial color="#1e4a14" /></mesh>
      {treePos.map(([tx, tz], i) => <Tree key={i} x={tx} z={tz} scale={1.0 + (i % 3) * 0.15} />)}
      <Portal x={-20} z={0} rotY={Math.PI / 2} color="#66ff88" targetArea="field" spawnX={20} spawnZ={0} />
      <Portal x={0} z={-22} rotY={0} color="#ff4444" targetArea="boss" spawnX={0} spawnZ={18} />
      {/* Main shard chest */}
      <ShardChest chestKey="forest" x={0} z={0} />
      {forestSwordChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {forestWeapons.map(wp => <WeaponAltar key={wp.key} pickupKey={wp.key} x={wp.x} z={wp.z} icon={wp.icon} color={wp.color} />)}
      {LORE_STONES.forest.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={18} z={18} />
      <HeartPiece id="hp-forest-1" x={-18} z={-16} />
      <HeartPiece id="hp-forest-2" x={16} z={-18} />
      <Wall x={0} z={-26} w={52} d={1} /><Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} /><Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function DesertArea() {
  const cactiPos = [
    [-16, -14], [-10, -20], [4, -18], [14, -16], [18, -10], [20, 4],
    [16, 14], [8, 20], [-4, 20], [-14, 16], [-20, 8], [-20, -4],
    [-8, 8], [10, -8], [6, 14], [-10, -6],
  ];
  const desertSwordChests = SWORD_CHESTS.filter(c => c.area === "desert");
  const desertWeapons = WEAPON_PICKUPS.filter(p => p.area === "desert");
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[50, 50]} /><meshStandardMaterial color="#c9a64a" /></mesh>
      {cactiPos.map(([cx, cz], i) => <Cactus key={i} x={cx} z={cz} />)}
      <Portal x={20} z={0} rotY={Math.PI / 2} color="#66ff88" targetArea="field" spawnX={-20} spawnZ={0} />
      <Portal x={0} z={-22} rotY={0} color="#ff4444" targetArea="boss" spawnX={0} spawnZ={18} />
      {/* Main shard chest */}
      <ShardChest chestKey="desert" x={0} z={-22} />
      {desertSwordChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {desertWeapons.map(wp => <WeaponAltar key={wp.key} pickupKey={wp.key} x={wp.x} z={wp.z} icon={wp.icon} color={wp.color} />)}
      {LORE_STONES.desert.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={18} z={-18} />
      <HeartPiece id="hp-desert-1" x={10} z={16} />
      <HeartPiece id="hp-desert-2" x={-16} z={-18} />
      <Wall x={0} z={-26} w={52} d={1} /><Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} /><Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function BossArea() {
  const pillarPos = [[-10, -10], [10, -10], [-10, 10], [10, 10]];
  const bossWeapons = WEAPON_PICKUPS.filter(p => p.area === "boss");
  const bossSwordChests = SWORD_CHESTS.filter(c => c.area === "boss");
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[44, 44]} /><meshStandardMaterial color="#1a1228" /></mesh>
      {pillarPos.map(([px, pz], i) => (
        <mesh key={i} position={[px, 2.5, pz]}><cylinderGeometry args={[0.7, 0.8, 5, 8]} /><meshStandardMaterial color="#2a1e3a" /></mesh>
      ))}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 14, 0.05, Math.sin(i * Math.PI / 2) * 14]} rotation={[-Math.PI / 2, 0, i * Math.PI / 2]}>
          <planeGeometry args={[3, 3]} /><meshStandardMaterial color="#4a1a6a" emissive="#6622aa" emissiveIntensity={0.4} />
        </mesh>
      ))}
      <pointLight position={[0, 8, 0]} color="#aa44ff" intensity={30} distance={25} />
      <pointLight position={[-8, 3, -8]} color="#ff2244" intensity={10} distance={12} />
      <pointLight position={[8, 3, -8]} color="#4422ff" intensity={10} distance={12} />
      {/* Armor chest */}
      <ShardChest chestKey="boss-armor" x={-8} z={8} />
      {/* Sword chests */}
      {bossSwordChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {/* Weapon altars */}
      {bossWeapons.map(wp => <WeaponAltar key={wp.key} pickupKey={wp.key} x={wp.x} z={wp.z} icon={wp.icon} color={wp.color} />)}
      {LORE_STONES.boss.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={-18} z={18} />
      <HeartPiece id="hp-boss-1" x={18} z={18} />
      <Wall x={0} z={-23} w={46} d={1} /><Wall x={0} z={23} w={46} d={1} />
      <Wall x={-23} z={0} w={1} d={46} /><Wall x={23} z={0} w={1} d={46} />
    </group>
  );
}

export default function World() {
  const currentArea = useGameStore(s => s.currentArea);
  switch (currentArea) {
    case "field":  return <FieldArea />;
    case "forest": return <ForestArea />;
    case "desert": return <DesertArea />;
    case "boss":   return <BossArea />;
    default:       return <FieldArea />;
  }
}
