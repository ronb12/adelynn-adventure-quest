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

function Portal({ x, z, color, targetArea, spawnX, spawnZ }: {
  x: number; z: number; color: string; targetArea: AreaId; spawnX: number; spawnZ: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const triggerAreaTransition = useGameStore(s => s.triggerAreaTransition);
  const gameState = useGameStore(s => s.gameState);
  const cooldownRef = useRef(0);

  useFrame((_, delta) => {
    if (ringRef.current) { ringRef.current.rotation.z += delta * 1.5; ringRef.current.rotation.y += delta * 0.5; }
    if (gameState !== "playing") return;
    cooldownRef.current -= delta;
    if (cooldownRef.current > 0) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.4) {
      cooldownRef.current = 2;
      triggerAreaTransition({ area: targetArea, spawnX, spawnZ });
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh ref={ringRef} position={[0, 1.8, 0]}><torusGeometry args={[1.1, 0.12, 10, 32]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} /></mesh>
      <mesh position={[0, 1.8, 0]}><torusGeometry args={[0.85, 0.07, 8, 32]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.6} /></mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.9, 24]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.4} /></mesh>
      <pointLight position={[0, 1.5, 0]} color={color} intensity={8} distance={6} />
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
      <Portal x={22} z={0} color="#22ff88" targetArea="forest" spawnX={-20} spawnZ={0} />
      <Portal x={-22} z={0} color="#ffaa44" targetArea="desert" spawnX={20} spawnZ={0} />
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
      <Portal x={-20} z={0} color="#66ff88" targetArea="field" spawnX={20} spawnZ={0} />
      <Portal x={0} z={-22} color="#ff4444" targetArea="boss" spawnX={0} spawnZ={18} />
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
      <Portal x={20} z={0} color="#66ff88" targetArea="field" spawnX={-20} spawnZ={0} />
      <Portal x={0} z={-22} color="#ff4444" targetArea="boss" spawnX={0} spawnZ={18} />
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
