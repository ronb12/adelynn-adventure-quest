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

// Archery Range sign (triggers mini-game)
function ArcherySign({ x, z }: { x: number; z: number }) {
  const setNearArchery = useGameStore(s => s.setNearArchery);
  const nearArchery    = useGameStore(s => s.nearArchery);
  const gameState      = useGameStore(s => s.gameState);
  const cooldownRef    = useRef(0);
  const bobRef         = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (bobRef.current) bobRef.current.position.y = 0.05 + Math.sin(Date.now() * 0.0025) * 0.06;
    if (gameState !== "playing") return;
    cooldownRef.current -= delta;
    if (cooldownRef.current > 0) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 3.0 && !nearArchery)  { setNearArchery(true);  cooldownRef.current = 0.3; }
    else if (dist >= 3.0 && nearArchery) { setNearArchery(false); cooldownRef.current = 0.3; }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Post */}
      <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.08, 0.1, 1.4, 6]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
      {/* Sign board */}
      <group ref={bobRef} position={[0, 1.5, 0]}>
        <mesh><boxGeometry args={[0.9, 0.5, 0.08]} /><meshStandardMaterial color="#d4a060" /></mesh>
        <mesh position={[0, 0, 0.05]}><planeGeometry args={[0.8, 0.4]} /><meshStandardMaterial color="#c8832a" /></mesh>
        <pointLight position={[0, 0.3, 0.5]} color="#ffaa33" intensity={6} distance={4} />
      </group>
      {/* Hay bale target stand */}
      <mesh position={[0, 0.3, -1.5]}><cylinderGeometry args={[0.35, 0.4, 0.6, 8]} /><meshStandardMaterial color="#c8a040" /></mesh>
      <mesh position={[0, 0.65, -1.5]}><circleGeometry args={[0.32, 12]} /><meshStandardMaterial color="#cc2222" /></mesh>
      <mesh position={[0, 0.66, -1.5]}><circleGeometry args={[0.18, 12]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[0, 0.67, -1.5]}><circleGeometry args={[0.08, 12]} /><meshStandardMaterial color="#ffdd00" /></mesh>
    </group>
  );
}

// Fishing Pond sign (triggers mini-game)
function FishingSign({ x, z }: { x: number; z: number }) {
  const setNearFishing = useGameStore(s => s.setNearFishing);
  const nearFishing    = useGameStore(s => s.nearFishing);
  const gameState      = useGameStore(s => s.gameState);
  const cooldownRef    = useRef(0);
  const bobRef         = useRef<THREE.Group>(null!);
  const waterRef       = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (bobRef.current) bobRef.current.position.y = 0.05 + Math.sin(Date.now() * 0.002) * 0.05;
    if (waterRef.current) waterRef.current.rotation.y += delta * 0.4;
    if (gameState !== "playing") return;
    cooldownRef.current -= delta;
    if (cooldownRef.current > 0) return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 3.5 && !nearFishing)  { setNearFishing(true);  cooldownRef.current = 0.3; }
    else if (dist >= 3.5 && nearFishing) { setNearFishing(false); cooldownRef.current = 0.3; }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Pond floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[2.2, 20]} />
        <meshStandardMaterial color="#1a5577" transparent opacity={0.85} />
      </mesh>
      {/* Water shimmer */}
      <mesh ref={waterRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 2.0, 20]} />
        <meshStandardMaterial color="#22aadd" emissive="#1188cc" emissiveIntensity={1.2} transparent opacity={0.4} />
      </mesh>
      <pointLight position={[0, 0.6, 0]} color="#22aaff" intensity={8} distance={5} />
      {/* Post */}
      <mesh position={[1.8, 0.7, 0]}><cylinderGeometry args={[0.07, 0.09, 1.4, 6]} /><meshStandardMaterial color="#6b4423" /></mesh>
      {/* Sign */}
      <group ref={bobRef} position={[1.8, 1.5, 0]}>
        <mesh><boxGeometry args={[0.85, 0.45, 0.07]} /><meshStandardMaterial color="#1a6688" /></mesh>
        <mesh position={[0, 0, 0.05]}><planeGeometry args={[0.75, 0.35]} /><meshStandardMaterial color="#0e4466" /></mesh>
        <pointLight position={[0, 0.2, 0.5]} color="#22ccff" intensity={5} distance={4} />
      </group>
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
      <Portal x={22} z={0}  rotY={Math.PI / 2} color="#22ff88" targetArea="forest" spawnX={-20} spawnZ={0} />
      <Portal x={-22} z={0}  rotY={Math.PI / 2} color="#ffaa44" targetArea="desert" spawnX={20}  spawnZ={0} />
      <Portal x={0}  z={22}  rotY={0}           color="#886633" targetArea="cave"   spawnX={0}   spawnZ={-18} />
      <Portal x={0}  z={-22} rotY={0}           color="#4488ff" targetArea="sky"    spawnX={0}   spawnZ={18} />
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
      {/* Archery Range mini-game */}
      <ArcherySign x={15} z={-16} />
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
      <Portal x={-20} z={0}  rotY={Math.PI / 2} color="#66ff88" targetArea="field"  spawnX={20} spawnZ={0} />
      <Portal x={0}  z={-22} rotY={0}           color="#ff4444" targetArea="boss"   spawnX={0}  spawnZ={18} />
      <Portal x={0}  z={22}  rotY={0}           color="#22bb44" targetArea="jungle" spawnX={0}  spawnZ={-18} />
      {/* Main shard chest */}
      <ShardChest chestKey="forest" x={0} z={0} />
      {forestSwordChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {forestWeapons.map(wp => <WeaponAltar key={wp.key} pickupKey={wp.key} x={wp.x} z={wp.z} icon={wp.icon} color={wp.color} />)}
      {LORE_STONES.forest.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={18} z={18} />
      {/* Fishing Pond mini-game */}
      <FishingSign x={-14} z={14} />
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
      <Portal x={20} z={0}  rotY={Math.PI / 2} color="#66ff88" targetArea="field"   spawnX={-20} spawnZ={0} />
      <Portal x={0}  z={-22} rotY={0}          color="#ff4444" targetArea="boss"    spawnX={0}   spawnZ={18} />
      <Portal x={0}  z={22}  rotY={0}          color="#ff6622" targetArea="volcano" spawnX={0}   spawnZ={-18} />
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

function ItemAltar({ altarKey, item, x, z, color, icon }: {
  altarKey: string; item: "magicMirror" | "speedBoots" | "hookshot" | "flippers";
  x: number; z: number; color: string; icon: string;
}) {
  const chestsOpened = useGameStore(s => s.chestsOpened);
  const collectSpecialItem = useGameStore(s => s.collectSpecialItem);
  const collected = chestsOpened.includes(altarKey);
  const cooldownRef = useRef(2.0);
  const glowRef = useRef<THREE.Mesh>(null!);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = collected ? 0 : 1.0 + Math.sin(timeRef.current * 2) * 0.6;
    }
    if (collected) return;
    cooldownRef.current -= delta;
    if (cooldownRef.current > 0) return;
    const store = useGameStore.getState();
    if (store.gameState !== "playing") return;
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.6) {
      cooldownRef.current = 2;
      if (item === "flippers") {
        if (!store.chestsOpened.includes(altarKey)) {
          store.unlockFlippers();
          useGameStore.setState(st => ({ chestsOpened: [...st.chestsOpened, altarKey] }));
        }
      } else {
        store.collectSpecialItem(item, altarKey);
      }
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.65, 0.75, 0.36, 10]} /><meshStandardMaterial color="#776644" roughness={0.8} /></mesh>
      <mesh position={[0, 0.44, 0]}><cylinderGeometry args={[0.42, 0.65, 0.16, 10]} /><meshStandardMaterial color="#998866" roughness={0.75} /></mesh>
      {!collected && (
        <>
          <mesh ref={glowRef} position={[0, 0.82, 0]}>
            <sphereGeometry args={[0.28, 10, 9]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.85} />
          </mesh>
          <pointLight position={[0, 1.2, 0]} color={color} intensity={8} distance={5} />
        </>
      )}
    </group>
  );
}

function StoneWall({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh position={[x, 1.2, z]}>
      <boxGeometry args={[w, 2.4, d]} />
      <meshStandardMaterial color="#5a5555" roughness={0.9} />
    </mesh>
  );
}

function IcePillar({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.22, 0.28, 2.4, 7]} /><meshStandardMaterial color="#cceeff" transparent opacity={0.8} roughness={0.1} metalness={0.2} /></mesh>
      <mesh position={[0, 2.6, 0]}><coneGeometry args={[0.22, 0.8, 7]} /><meshStandardMaterial color="#aaddff" transparent opacity={0.75} roughness={0.1} /></mesh>
    </group>
  );
}

function LavaRock({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]}><sphereGeometry args={[0.6, 7, 6]} /><meshStandardMaterial color="#442200" roughness={0.95} /></mesh>
      <mesh position={[0, 0.32, 0.3]}><sphereGeometry args={[0.18, 6, 5]} /><meshStandardMaterial color="#cc4400" emissive="#ff2200" emissiveIntensity={2.5} /></mesh>
    </group>
  );
}

function CloudPlatform({ x, y, z, w }: { x: number; y: number; z: number; w: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh><boxGeometry args={[w, 0.25, w * 0.6]} /><meshStandardMaterial color="#eef6ff" transparent opacity={0.85} roughness={0.05} /></mesh>
      <mesh position={[0, 0.14, 0]}><boxGeometry args={[w * 0.7, 0.15, w * 0.45]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.7} roughness={0} /></mesh>
    </group>
  );
}

function ShadowCrystal({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.8, 0]} rotation={[0.3, 0.5, 0.2]}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#330066" emissive="#6600cc" emissiveIntensity={1.5} transparent opacity={0.8} metalness={0.6} roughness={0.1} />
      </mesh>
      <pointLight position={[0, 0.8, 0]} color="#8800ff" intensity={4} distance={3} />
    </group>
  );
}

function DungeonPillar({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.5, 0]}><cylinderGeometry args={[0.35, 0.42, 5, 8]} /><meshStandardMaterial color="#2a2535" roughness={0.9} /></mesh>
      <mesh position={[0, 5.2, 0]}><cylinderGeometry args={[0.45, 0.35, 0.4, 8]} /><meshStandardMaterial color="#3a3048" roughness={0.85} /></mesh>
    </group>
  );
}

function CaveArea() {
  const caveChests = SWORD_CHESTS.filter(c => c.area === "cave");
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[50, 50]} /><meshStandardMaterial color="#2a2520" /></mesh>
      <pointLight position={[0, 8, 0]} color="#886633" intensity={15} distance={28} />
      <pointLight position={[-12, 4, -10]} color="#aa7744" intensity={6} distance={12} />
      <pointLight position={[12, 4, 10]} color="#aa6633" intensity={6} distance={12} />
      {[[-14,-12],[-8,-18],[6,-16],[16,-14],[20,-4],[18,10],[10,18],[-4,20],[-16,14],[-20,4],[-20,-8],[2,-20],[12,-8],[-10,8]] .map(([tx,tz],i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, 0.8, 0]}><sphereGeometry args={[0.9 + (i%3)*0.3, 7, 6]} /><meshStandardMaterial color="#3a3530" roughness={0.95} /></mesh>
        </group>
      ))}
      <Portal x={0}   z={22}  rotY={0}           color="#886633" targetArea="field"    spawnX={0}  spawnZ={-18} />
      <Portal x={22}  z={0}   rotY={Math.PI / 2} color="#9966ff" targetArea="dungeon1" spawnX={-20} spawnZ={0} />
      <Portal x={-22} z={0}   rotY={Math.PI / 2} color="#aaddff" targetArea="ice"      spawnX={20}  spawnZ={0} />
      <ItemAltar altarKey="item-mirror" item="magicMirror" x={0} z={-14} color="#cc88ff" icon="🪞" />
      {caveChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {LORE_STONES.cave.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={-18} z={18} />
      <HeartPiece id="hp-cave-1" x={14} z={-14} />
      <HeartPiece id="hp-cave-2" x={-14} z={14} />
      <Wall x={0} z={-26} w={52} d={1} /><Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} /><Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function JungleArea() {
  const jungleChests = SWORD_CHESTS.filter(c => c.area === "jungle");
  const treePos = [[-18,-16],[-12,-20],[-4,-22],[6,-20],[14,-18],[20,-12],[22,-4],[20,8],[16,18],[4,22],[-8,20],[-18,14],[-22,4],[-22,-8],[10,-10],[-10,10],[8,6],[-6,-8]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[50, 50]} /><meshStandardMaterial color="#1a3d0e" /></mesh>
      <pointLight position={[0, 10, 0]} color="#44aa22" intensity={12} distance={30} />
      {treePos.map(([tx,tz],i) => <Tree key={i} x={tx} z={tz} scale={1.2 + (i%3)*0.15} />)}
      <Portal x={0}   z={22}  rotY={0}           color="#22bb44" targetArea="forest"   spawnX={0}  spawnZ={-18} />
      <Portal x={22}  z={0}   rotY={Math.PI / 2} color="#9966ff" targetArea="dungeon1" spawnX={-20} spawnZ={0} />
      {jungleChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {LORE_STONES.jungle.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={18} z={-18} />
      <HeartPiece id="hp-jungle-1" x={-16} z={-16} />
      <HeartPiece id="hp-jungle-2" x={16} z={16} />
      <Wall x={0} z={-26} w={52} d={1} /><Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} /><Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function IceArea() {
  const iceChests = SWORD_CHESTS.filter(c => c.area === "ice");
  const pillarPositions = [[-14,-12],[-6,-16],[8,-14],[16,-8],[18,6],[10,16],[-4,18],[-14,10],[-4,-4],[8,4]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[50, 50]} /><meshStandardMaterial color="#c8dff0" /></mesh>
      <pointLight position={[0, 10, 0]} color="#aaccff" intensity={20} distance={32} />
      {pillarPositions.map(([px,pz],i) => <IcePillar key={i} x={px} z={pz} />)}
      <Portal x={-22} z={0}  rotY={Math.PI / 2} color="#886633" targetArea="cave"     spawnX={-22}  spawnZ={0} />
      <Portal x={22}  z={0}  rotY={Math.PI / 2} color="#88ccff" targetArea="dungeon3" spawnX={-20}  spawnZ={0} />
      <ItemAltar altarKey="item-boots" item="speedBoots" x={0} z={-14} color="#aaffcc" icon="👟" />
      {iceChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {LORE_STONES.ice.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={-18} z={18} />
      <HeartPiece id="hp-ice-1" x={14} z={-14} />
      <HeartPiece id="hp-ice-2" x={-12} z={-18} />
      <Wall x={0} z={-26} w={52} d={1} /><Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} /><Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function VolcanoArea() {
  const volChests = SWORD_CHESTS.filter(c => c.area === "volcano");
  const lavaRockPos = [[-16,-14],[-8,-18],[6,-16],[14,-10],[18,4],[12,16],[-2,20],[-14,14],[-20,2],[-18,-10],[4,-4],[-8,6]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[50, 50]} /><meshStandardMaterial color="#3a1800" /></mesh>
      <pointLight position={[0, 8, 0]} color="#ff4400" intensity={18} distance={28} />
      <pointLight position={[-10, 3, -10]} color="#ff2200" intensity={8} distance={15} />
      <pointLight position={[10, 3, 10]} color="#ff6600" intensity={8} distance={15} />
      {lavaRockPos.map(([lx,lz],i) => <LavaRock key={i} x={lx} z={lz} />)}
      <Portal x={0}   z={22}  rotY={0}           color="#ff6622" targetArea="desert"   spawnX={0}   spawnZ={-18} />
      <Portal x={22}  z={0}   rotY={Math.PI / 2} color="#ff2200" targetArea="dungeon2" spawnX={-20} spawnZ={0} />
      {volChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {LORE_STONES.volcano.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={-18} z={-18} />
      <HeartPiece id="hp-vol-1" x={12} z={-16} />
      <HeartPiece id="hp-vol-2" x={-14} z={14} />
      <Wall x={0} z={-26} w={52} d={1} /><Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} /><Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function SkyArea() {
  const skyChests = SWORD_CHESTS.filter(c => c.area === "sky");
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[50, 50]} /><meshStandardMaterial color="#2244aa" /></mesh>
      <pointLight position={[0, 12, 0]} color="#88aaff" intensity={25} distance={35} />
      <CloudPlatform x={-12} y={0.1} z={-8} w={6} />
      <CloudPlatform x={10}  y={0.1} z={10} w={5} />
      <CloudPlatform x={-8}  y={0.1} z={14} w={4} />
      <CloudPlatform x={14}  y={0.1} z={-14} w={5} />
      <CloudPlatform x={-16} y={0.1} z={4}  w={4} />
      <CloudPlatform x={6}   y={0.1} z={-16} w={5} />
      <Portal x={0}   z={22}  rotY={0}           color="#4488ff" targetArea="field"  spawnX={0}  spawnZ={22} />
      <Portal x={-22} z={0}   rotY={Math.PI / 2} color="#aa44ff" targetArea="shadow" spawnX={20} spawnZ={0} />
      {skyChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {LORE_STONES.sky.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={18} z={18} />
      <HeartPiece id="hp-sky-1" x={-14} z={-14} />
      <HeartPiece id="hp-sky-2" x={16} z={-18} />
      <Wall x={0} z={-26} w={52} d={1} /><Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} /><Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function ShadowArea() {
  const shadChests = SWORD_CHESTS.filter(c => c.area === "shadow");
  const crystalPos = [[-14,-12],[-6,-16],[8,-14],[16,-8],[18,6],[10,16],[-4,18],[-14,10],[-2,-4],[10,4]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[50, 50]} /><meshStandardMaterial color="#0a0010" /></mesh>
      <pointLight position={[0, 8, 0]} color="#8800ff" intensity={15} distance={25} />
      <pointLight position={[-10, 4, -8]} color="#4400aa" intensity={8} distance={15} />
      <pointLight position={[10, 4, 8]} color="#6600cc" intensity={8} distance={15} />
      {crystalPos.map(([cx,cz],i) => <ShadowCrystal key={i} x={cx} z={cz} />)}
      <Portal x={22}  z={0}  rotY={Math.PI / 2} color="#aa44ff" targetArea="sky"  spawnX={-22} spawnZ={0} />
      <Portal x={0}   z={-22} rotY={0}          color="#ff2244" targetArea="boss"  spawnX={0}   spawnZ={18} />
      {shadChests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {LORE_STONES.shadow.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={-18} z={18} />
      <HeartPiece id="hp-shadow-1" x={-14} z={-14} />
      <HeartPiece id="hp-shadow-2" x={14} z={-16} />
      <Wall x={0} z={-26} w={52} d={1} /><Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} /><Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function Dungeon1Area() {
  const d1Chests = SWORD_CHESTS.filter(c => c.area === "dungeon1");
  const pillarPos = [[-10,-10],[10,-10],[-10,10],[10,10],[-10,0],[10,0],[0,-10],[0,10]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[44, 44]} /><meshStandardMaterial color="#1a1525" /></mesh>
      <pointLight position={[0, 8, 0]} color="#9966ff" intensity={15} distance={24} />
      {pillarPos.map(([px,pz],i) => <DungeonPillar key={i} x={px} z={pz} />)}
      <StoneWall x={0} z={-18} w={30} d={1} />
      <StoneWall x={0} z={18} w={30} d={1} />
      <StoneWall x={-18} z={0} w={1} d={30} />
      <StoneWall x={18} z={0} w={1} d={30} />
      <Portal x={-20} z={0}  rotY={Math.PI / 2} color="#886633" targetArea="cave"   spawnX={20}  spawnZ={0} />
      <Portal x={20}  z={0}  rotY={Math.PI / 2} color="#22bb44" targetArea="jungle" spawnX={-22} spawnZ={0} />
      {d1Chests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {LORE_STONES.dungeon1.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={-16} z={-16} />
      <HeartPiece id="hp-d1-1" x={16} z={-16} />
      <HeartPiece id="hp-d1-2" x={-16} z={16} />
      <Wall x={0} z={-23} w={46} d={1} /><Wall x={0} z={23} w={46} d={1} />
      <Wall x={-23} z={0} w={1} d={46} /><Wall x={23} z={0} w={1} d={46} />
    </group>
  );
}

function Dungeon2Area() {
  const d2Chests = SWORD_CHESTS.filter(c => c.area === "dungeon2");
  const pillarPos = [[-10,-10],[10,-10],[-10,10],[10,10],[-6,-6],[6,-6],[-6,6],[6,6]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[44, 44]} /><meshStandardMaterial color="#220800" /></mesh>
      <pointLight position={[0, 8, 0]} color="#ff4400" intensity={18} distance={24} />
      <pointLight position={[-8, 3, -8]} color="#cc2200" intensity={8} distance={14} />
      <pointLight position={[8, 3, 8]} color="#ff5500" intensity={8} distance={14} />
      {pillarPos.map(([px,pz],i) => (
        <mesh key={i} position={[px, 2.5, pz]}><cylinderGeometry args={[0.5, 0.6, 5, 8]} /><meshStandardMaterial color="#221100" emissive="#661100" emissiveIntensity={0.3} /></mesh>
      ))}
      <ItemAltar altarKey="item-hookshot" item="hookshot" x={0} z={-14} color="#ffaa44" icon="⛓️" />
      <Portal x={-20} z={0} rotY={Math.PI / 2} color="#ff6622" targetArea="volcano" spawnX={20} spawnZ={0} />
      {d2Chests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {LORE_STONES.dungeon2.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={-16} z={16} />
      <HeartPiece id="hp-d2-1" x={16} z={-16} />
      <HeartPiece id="hp-d2-2" x={-14} z={-14} />
      <Wall x={0} z={-23} w={46} d={1} /><Wall x={0} z={23} w={46} d={1} />
      <Wall x={-23} z={0} w={1} d={46} /><Wall x={23} z={0} w={1} d={46} />
    </group>
  );
}

function Dungeon3Area() {
  const d3Chests = SWORD_CHESTS.filter(c => c.area === "dungeon3");
  const pillarPos = [[-12,-12],[12,-12],[-12,12],[12,12],[0,-12],[0,12],[-12,0],[12,0]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[44, 44]} /><meshStandardMaterial color="#061220" /></mesh>
      <pointLight position={[0, 8, 0]} color="#88ccff" intensity={18} distance={24} />
      <pointLight position={[-8, 3, -8]} color="#4488cc" intensity={8} distance={14} />
      <pointLight position={[8, 3, 8]} color="#6699ff" intensity={8} distance={14} />
      {pillarPos.map(([px,pz],i) => <IcePillar key={i} x={px} z={pz} />)}
      <Portal x={-20} z={0} rotY={Math.PI / 2} color="#aaddff" targetArea="ice" spawnX={20} spawnZ={0} />
      {d3Chests.map(sc => <SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z} />)}
      {LORE_STONES.dungeon3.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} />)}
      <Fountain x={16} z={-16} />
      <HeartPiece id="hp-d3-1" x={-16} z={-16} />
      <HeartPiece id="hp-d3-2" x={16} z={16} />
      <Wall x={0} z={-23} w={46} d={1} /><Wall x={0} z={23} w={46} d={1} />
      <Wall x={-23} z={0} w={1} d={46} /><Wall x={23} z={0} w={1} d={46} />
    </group>
  );
}

function Dungeon4Area() {
  const chests = SWORD_CHESTS.filter(c => c.area === "dungeon4");
  const cols = ["#004d20","#006633","#1a5c35","#00402a"];
  const pillars: [number,number][] = [[-10,-10],[10,-10],[-10,10],[10,10],[0,-8],[0,8],[-8,0],[8,0]];
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[44,44]}/><meshStandardMaterial color="#0a2010"/></mesh>
      <pointLight position={[0,8,0]} color="#33ff77" intensity={14} distance={24}/>
      <pointLight position={[-10,3,-10]} color="#00aa44" intensity={6} distance={12}/>
      <pointLight position={[10,3,10]} color="#00cc55" intensity={6} distance={12}/>
      {pillars.map(([px,pz],i)=>(
        <mesh key={i} position={[px,2.5,pz]}><cylinderGeometry args={[0.5,0.6,5,6]}/><meshStandardMaterial color={cols[i%cols.length]} emissive="#003311" emissiveIntensity={0.4}/></mesh>
      ))}
      <ItemAltar altarKey="item-flippers" item="flippers" x={0} z={-14} color="#33bbff" icon="🌊"/>
      <Portal x={-20} z={0} rotY={Math.PI/2} color="#33bb66" targetArea="jungle" spawnX={20} spawnZ={0}/>
      <Portal x={20}  z={0} rotY={Math.PI/2} color="#33bb66" targetArea="dungeon5" spawnX={-20} spawnZ={0}/>
      {chests.map(sc=><SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z}/>)}
      {LORE_STONES.dungeon4.map(s=><LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z}/>)}
      <Fountain x={-16} z={16}/>
      <HeartPiece id="hp-d4-1" x={16} z={-16}/>
      <HeartPiece id="hp-d4-2" x={-14} z={14}/>
      <Wall x={0} z={-23} w={46} d={1}/><Wall x={0} z={23} w={46} d={1}/>
      <Wall x={-23} z={0} w={1} d={46}/><Wall x={23} z={0} w={1} d={46}/>
    </group>
  );
}

function Dungeon5Area() {
  const chests = SWORD_CHESTS.filter(c => c.area === "dungeon5");
  const pillars: [number,number][] = [[-10,-10],[10,-10],[-10,10],[10,10],[-6,0],[6,0],[0,-8],[0,8]];
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[44,44]}/><meshStandardMaterial color="#0f0c08"/></mesh>
      <pointLight position={[0,8,0]} color="#ddbb77" intensity={12} distance={22}/>
      <pointLight position={[-8,3,-8]} color="#aa8833" intensity={5} distance={12}/>
      {pillars.map(([px,pz],i)=>(
        <mesh key={i} position={[px,2.2,pz]}><boxGeometry args={[0.8,4.4,0.8]}/><meshStandardMaterial color="#2a2018" emissive="#554433" emissiveIntensity={0.2}/></mesh>
      ))}
      <ItemAltar altarKey="item-firerod" item="hookshot" x={0} z={-14} color="#ff5500" icon="🔥"/>
      <Portal x={-20} z={0} rotY={Math.PI/2} color="#ccbb88" targetArea="dungeon4" spawnX={20} spawnZ={0}/>
      <Portal x={20}  z={0} rotY={Math.PI/2} color="#ccbb88" targetArea="dungeon6" spawnX={-20} spawnZ={0}/>
      {chests.map(sc=><SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z}/>)}
      {LORE_STONES.dungeon5.map(s=><LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z}/>)}
      <Fountain x={16} z={16}/>
      <HeartPiece id="hp-d5-1" x={-16} z={-16}/>
      <HeartPiece id="hp-d5-2" x={16} z={-14}/>
      <Wall x={0} z={-23} w={46} d={1}/><Wall x={0} z={23} w={46} d={1}/>
      <Wall x={-23} z={0} w={1} d={46}/><Wall x={23} z={0} w={1} d={46}/>
    </group>
  );
}

function Dungeon6Area() {
  const chests = SWORD_CHESTS.filter(c => c.area === "dungeon6");
  const pillars: [number,number][] = [[-12,-12],[12,-12],[-12,12],[12,12],[-6,-4],[6,-4],[-6,4],[6,4]];
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[44,44]}/><meshStandardMaterial color="#0f0818"/></mesh>
      <pointLight position={[0,8,0]} color="#cc88ff" intensity={15} distance={24}/>
      <pointLight position={[-8,3,-8]} color="#9933cc" intensity={7} distance={12}/>
      <pointLight position={[8,3,8]} color="#bb44ee" intensity={7} distance={12}/>
      {pillars.map(([px,pz],i)=>(
        <mesh key={i} position={[px,2,pz]}><boxGeometry args={[0.6,4,0.6]}/><meshStandardMaterial color="#1a0a28" emissive="#6600aa" emissiveIntensity={0.3}/></mesh>
      ))}
      <ItemAltar altarKey="item-net" item="hookshot" x={0} z={-14} color="#ddbbff" icon="🕸️"/>
      <Portal x={-20} z={0} rotY={Math.PI/2} color="#9933cc" targetArea="dungeon5" spawnX={20} spawnZ={0}/>
      <Portal x={20}  z={0} rotY={Math.PI/2} color="#9933cc" targetArea="dungeon7" spawnX={-20} spawnZ={0}/>
      {chests.map(sc=><SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z}/>)}
      {LORE_STONES.dungeon6.map(s=><LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z}/>)}
      <Fountain x={-16} z={-16}/>
      <HeartPiece id="hp-d6-1" x={16} z={-16}/>
      <HeartPiece id="hp-d6-2" x={-16} z={16}/>
      <Wall x={0} z={-23} w={46} d={1}/><Wall x={0} z={23} w={46} d={1}/>
      <Wall x={-23} z={0} w={1} d={46}/><Wall x={23} z={0} w={1} d={46}/>
    </group>
  );
}

function Dungeon7Area() {
  const chests = SWORD_CHESTS.filter(c => c.area === "dungeon7");
  const pillars: [number,number][] = [[-11,-11],[11,-11],[-11,11],[11,11],[-5,-5],[5,-5],[-5,5],[5,5]];
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[44,44]}/><meshStandardMaterial color="#060e18"/></mesh>
      <pointLight position={[0,8,0]} color="#88ddff" intensity={18} distance={26}/>
      <pointLight position={[-8,3,-8]} color="#4499cc" intensity={8} distance={12}/>
      <pointLight position={[8,3,8]} color="#66aadd" intensity={8} distance={12}/>
      {pillars.map(([px,pz],i)=>(
        <mesh key={i} position={[px,2.5,pz]}><octahedronGeometry args={[0.7]}/><meshStandardMaterial color="#b3e5fc" emissive="#2244aa" emissiveIntensity={0.6}/></mesh>
      ))}
      <ItemAltar altarKey="item-icerod" item="hookshot" x={0} z={-14} color="#88ddff" icon="🧊"/>
      <Portal x={-20} z={0} rotY={Math.PI/2} color="#88ddff" targetArea="ice" spawnX={20} spawnZ={0}/>
      <Portal x={20}  z={0} rotY={Math.PI/2} color="#88ddff" targetArea="dungeon8" spawnX={-20} spawnZ={0}/>
      {chests.map(sc=><SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z}/>)}
      {LORE_STONES.dungeon7.map(s=><LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z}/>)}
      <Fountain x={16} z={-16}/>
      <HeartPiece id="hp-d7-1" x={-16} z={-16}/>
      <HeartPiece id="hp-d7-2" x={16} z={16}/>
      <Wall x={0} z={-23} w={46} d={1}/><Wall x={0} z={23} w={46} d={1}/>
      <Wall x={-23} z={0} w={1} d={46}/><Wall x={23} z={0} w={1} d={46}/>
    </group>
  );
}

function Dungeon8Area() {
  const chests = SWORD_CHESTS.filter(c => c.area === "dungeon8");
  const pillars: [number,number][] = [[-10,-10],[10,-10],[-10,10],[10,10],[0,-10],[0,10],[-10,0],[10,0]];
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[44,44]}/><meshStandardMaterial color="#0a100a"/></mesh>
      <pointLight position={[0,8,0]} color="#88aa44" intensity={12} distance={22}/>
      <pointLight position={[-8,3,-8]} color="#556622" intensity={6} distance={12}/>
      <pointLight position={[8,3,8]} color="#778833" intensity={6} distance={12}/>
      {pillars.map(([px,pz],i)=>(
        <mesh key={i} position={[px,1.8,pz]}><torusGeometry args={[0.4,0.15,6,8]}/><meshStandardMaterial color="#3a4a1a" emissive="#445511" emissiveIntensity={0.3}/></mesh>
      ))}
      <ItemAltar altarKey="item-ether" item="hookshot" x={0} z={-14} color="#88aaff" icon="🌀"/>
      <Portal x={-20} z={0} rotY={Math.PI/2} color="#88aa44" targetArea="dungeon7" spawnX={20} spawnZ={0}/>
      <Portal x={20}  z={0} rotY={Math.PI/2} color="#88aa44" targetArea="shadow"   spawnX={-20} spawnZ={0}/>
      {chests.map(sc=><SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z}/>)}
      {LORE_STONES.dungeon8.map(s=><LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z}/>)}
      <Fountain x={-16} z={16}/>
      <HeartPiece id="hp-d8-1" x={16} z={-16}/>
      <HeartPiece id="hp-d8-2" x={-14} z={-14}/>
      <Wall x={0} z={-23} w={46} d={1}/><Wall x={0} z={23} w={46} d={1}/>
      <Wall x={-23} z={0} w={1} d={46}/><Wall x={23} z={0} w={1} d={46}/>
    </group>
  );
}

function Dungeon9Area() {
  const chests = SWORD_CHESTS.filter(c => c.area === "dungeon9");
  const pillars: [number,number][] = [[-12,-12],[12,-12],[-12,12],[12,12],[-6,0],[6,0],[0,-12],[0,12]];
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[44,44]}/><meshStandardMaterial color="#1a0500"/></mesh>
      <pointLight position={[0,8,0]} color="#ff5511" intensity={20} distance={26}/>
      <pointLight position={[-8,3,-8]} color="#cc2200" intensity={9} distance={12}/>
      <pointLight position={[8,3,8]} color="#ff3300" intensity={9} distance={12}/>
      {pillars.map(([px,pz],i)=>(
        <mesh key={i} position={[px,2.8,pz]}><coneGeometry args={[0.6,5.6,5]}/><meshStandardMaterial color="#330800" emissive="#ff3300" emissiveIntensity={0.5}/></mesh>
      ))}
      <ItemAltar altarKey="item-bombos" item="hookshot" x={0} z={-14} color="#ff4400" icon="💣"/>
      <Portal x={-20} z={0} rotY={Math.PI/2} color="#ff5511" targetArea="volcano"  spawnX={20} spawnZ={0}/>
      <Portal x={20}  z={0} rotY={Math.PI/2} color="#ff5511" targetArea="dungeon10" spawnX={-20} spawnZ={0}/>
      {chests.map(sc=><SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z}/>)}
      {LORE_STONES.dungeon9.map(s=><LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z}/>)}
      <Fountain x={16} z={16}/>
      <HeartPiece id="hp-d9-1" x={-16} z={-16}/>
      <HeartPiece id="hp-d9-2" x={16} z={-14}/>
      <Wall x={0} z={-23} w={46} d={1}/><Wall x={0} z={23} w={46} d={1}/>
      <Wall x={-23} z={0} w={1} d={46}/><Wall x={23} z={0} w={1} d={46}/>
    </group>
  );
}

function Dungeon10Area() {
  const chests = SWORD_CHESTS.filter(c => c.area === "dungeon10");
  const pillars: [number,number][] = [[-11,-11],[11,-11],[-11,11],[11,11],[-5,-7],[5,-7],[-5,7],[5,7]];
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[44,44]}/><meshStandardMaterial color="#050008"/></mesh>
      <pointLight position={[0,8,0]} color="#8800ff" intensity={16} distance={24}/>
      <pointLight position={[-8,3,-8]} color="#5500aa" intensity={8} distance={12}/>
      <pointLight position={[8,3,8]} color="#7700cc" intensity={8} distance={12}/>
      {pillars.map(([px,pz],i)=>(
        <mesh key={i} position={[px,3,pz]}><dodecahedronGeometry args={[0.5]}/><meshStandardMaterial color="#0a0018" emissive="#7c4dff" emissiveIntensity={0.8}/></mesh>
      ))}
      <ItemAltar altarKey="item-dipsgram" item="hookshot" x={0} z={-14} color="#cc44ff" icon="⚡"/>
      <Portal x={-20} z={0} rotY={Math.PI/2} color="#6600cc" targetArea="dungeon9"  spawnX={20} spawnZ={0}/>
      <Portal x={20}  z={0} rotY={Math.PI/2} color="#6600cc" targetArea="dungeon11" spawnX={-20} spawnZ={0}/>
      {chests.map(sc=><SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z}/>)}
      {LORE_STONES.dungeon10.map(s=><LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z}/>)}
      <Fountain x={-16} z={-16}/>
      <HeartPiece id="hp-d10-1" x={16} z={-16}/>
      <HeartPiece id="hp-d10-2" x={-14} z={14}/>
      <Wall x={0} z={-23} w={46} d={1}/><Wall x={0} z={23} w={46} d={1}/>
      <Wall x={-23} z={0} w={1} d={46}/><Wall x={23} z={0} w={1} d={46}/>
    </group>
  );
}

function Dungeon11Area() {
  const chests = SWORD_CHESTS.filter(c => c.area === "dungeon11");
  const ringR = 14;
  const pillars = Array.from({length: 8},(_,i)=>[Math.cos(i/8*Math.PI*2)*ringR, Math.sin(i/8*Math.PI*2)*ringR] as [number,number]);
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[44,44]}/><meshStandardMaterial color="#0a0010"/></mesh>
      <pointLight position={[0,8,0]} color="#cc00ff" intensity={22} distance={28}/>
      <pointLight position={[-6,3,-6]} color="#8800cc" intensity={10} distance={12}/>
      <pointLight position={[6,3,6]} color="#aa00ee" intensity={10} distance={12}/>
      <pointLight position={[0,3,-12]} color="#ff00aa" intensity={8} distance={10}/>
      {pillars.map(([px,pz],i)=>(
        <mesh key={i} position={[px,3.5,pz]}><icosahedronGeometry args={[0.6]}/><meshStandardMaterial color="#1a0033" emissive="#cc00ff" emissiveIntensity={1.2}/></mesh>
      ))}
      <Portal x={-20} z={0} rotY={Math.PI/2} color="#cc00ff" targetArea="dungeon10" spawnX={20} spawnZ={0}/>
      <Portal x={20}  z={0} rotY={Math.PI/2} color="#cc00ff" targetArea="boss"      spawnX={-20} spawnZ={0}/>
      {chests.map(sc=><SwordChest key={sc.key} chestKey={sc.key} x={sc.x} z={sc.z}/>)}
      {LORE_STONES.dungeon11.map(s=><LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z}/>)}
      <Fountain x={16} z={-16}/>
      <HeartPiece id="hp-d11-1" x={-16} z={-16}/>
      <HeartPiece id="hp-d11-2" x={16} z={14}/>
      <Wall x={0} z={-23} w={46} d={1}/><Wall x={0} z={23} w={46} d={1}/>
      <Wall x={-23} z={0} w={1} d={46}/><Wall x={23} z={0} w={1} d={46}/>
    </group>
  );
}

export default function World() {
  const currentArea = useGameStore(s => s.currentArea);
  switch (currentArea) {
    case "field":     return <FieldArea />;
    case "forest":    return <ForestArea />;
    case "desert":    return <DesertArea />;
    case "boss":      return <BossArea />;
    case "cave":      return <CaveArea />;
    case "jungle":    return <JungleArea />;
    case "ice":       return <IceArea />;
    case "volcano":   return <VolcanoArea />;
    case "sky":       return <SkyArea />;
    case "shadow":    return <ShadowArea />;
    case "dungeon1":  return <Dungeon1Area />;
    case "dungeon2":  return <Dungeon2Area />;
    case "dungeon3":  return <Dungeon3Area />;
    case "dungeon4":  return <Dungeon4Area />;
    case "dungeon5":  return <Dungeon5Area />;
    case "dungeon6":  return <Dungeon6Area />;
    case "dungeon7":  return <Dungeon7Area />;
    case "dungeon8":  return <Dungeon8Area />;
    case "dungeon9":  return <Dungeon9Area />;
    case "dungeon10": return <Dungeon10Area />;
    case "dungeon11": return <Dungeon11Area />;
    default:          return <FieldArea />;
  }
}
