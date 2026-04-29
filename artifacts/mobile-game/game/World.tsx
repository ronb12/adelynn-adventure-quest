import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { useGameStore, AreaId, LORE_STONES } from "./store";
import { playerState } from "./controls";

function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.7 * scale, 0]}>
        <cylinderGeometry args={[0.2 * scale, 0.3 * scale, 1.4 * scale, 7]} />
        <meshStandardMaterial color="#5c3d1e" />
      </mesh>
      <mesh position={[0, 1.8 * scale, 0]}>
        <coneGeometry args={[0.9 * scale, 1.8 * scale, 8]} />
        <meshStandardMaterial color="#2d6a1e" />
      </mesh>
      <mesh position={[0, 2.6 * scale, 0]}>
        <coneGeometry args={[0.65 * scale, 1.4 * scale, 8]} />
        <meshStandardMaterial color="#348a24" />
      </mesh>
    </group>
  );
}

function Cactus({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.22, 0.27, 1.8, 7]} />
        <meshStandardMaterial color="#4a8a2e" />
      </mesh>
      <mesh position={[0.5, 0.8, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.9, 6]} />
        <meshStandardMaterial color="#4a8a2e" />
      </mesh>
      <mesh position={[-0.45, 0.7, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.7, 6]} />
        <meshStandardMaterial color="#4a8a2e" />
      </mesh>
    </group>
  );
}

function Portal({ x, z, color, label, targetArea, spawnX, spawnZ }: {
  x: number; z: number; color: string; label: string;
  targetArea: AreaId; spawnX: number; spawnZ: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const triggerAreaTransition = useGameStore(s => s.triggerAreaTransition);
  const gameState = useGameStore(s => s.gameState);
  const cooldownRef = useRef(0);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
      ringRef.current.rotation.y += delta * 0.5;
    }
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
      <mesh ref={ringRef} position={[0, 1.8, 0]}>
        <torusGeometry args={[1.1, 0.12, 10, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <torusGeometry args={[0.85, 0.07, 8, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.4} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color={color} intensity={8} distance={6} />
    </group>
  );
}

function LoreStoneObj({ id, x, z, text }: { id: string; x: number; z: number; text: string }) {
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
    if (dist < 2.2 && !isNear) {
      setNearLore(id);
      cooldownRef.current = 0.3;
    } else if (dist >= 2.2 && isNear) {
      setNearLore(null);
      cooldownRef.current = 0.3;
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.7, 0.4, 0.35]} />
        <meshStandardMaterial color="#4a4a5a" />
      </mesh>
      <mesh ref={stoneRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[0.55, 0.75, 0.15]} />
        <meshStandardMaterial
          color={isRead ? "#888899" : "#b8a0ff"}
          emissive={isRead ? "#222" : (isNear ? "#cc88ff" : "#6633cc")}
          emissiveIntensity={isRead ? 0 : (isNear ? 2.5 : 1.0)}
        />
      </mesh>
      {!isRead && (
        <pointLight position={[0, 1, 0]} color="#9966ff" intensity={isNear ? 8 : 3} distance={isNear ? 5 : 3} />
      )}
    </group>
  );
}

function SwordChest({ chestKey, x, z, swordId }: { chestKey: string; x: number; z: number; swordId: string }) {
  const chestsOpened = useGameStore(s => s.chestsOpened);
  const unlockSword = useGameStore(s => s.unlockSword);
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
      unlockSword(swordId as import("./store").SwordId);
      // eslint-disable-next-line
      useGameStore.getState().openChest(chestKey);
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.8, 0.44, 0.55]} />
        <meshStandardMaterial color="#8b6914" />
      </mesh>
      <mesh ref={lidRef} position={[0, isOpen ? 0.62 : 0.54, 0]} rotation={[isOpen ? -1.2 : 0, 0, 0]}>
        <boxGeometry args={[0.82, 0.22, 0.56]} />
        <meshStandardMaterial color="#a07820" />
      </mesh>
      {!isOpen && (
        <pointLight position={[0, 0.8, 0]} color="#ffcc44" intensity={5} distance={4} />
      )}
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

function FieldArea() {
  const treePositions = [
    [-20, -20], [-14, -22], [-8, -24], [2, -24], [10, -23], [18, -21], [22, -14],
    [24, -6], [24, 4], [22, 14], [18, 22], [8, 24], [-2, 24], [-12, 22],
    [-22, 16], [-24, 6], [-24, -4], [-22, -14],
  ];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#3a7a2f" />
      </mesh>
      {treePositions.map(([tx, tz], i) => (
        <Tree key={i} x={tx} z={tz} scale={0.85 + Math.random() * 0.3} />
      ))}
      <Portal x={22} z={0} color="#22ff88" label="Whisper Woods" targetArea="forest" spawnX={-20} spawnZ={0} />
      <Portal x={-22} z={0} color="#ffaa44" label="Ashrock Sands" targetArea="desert" spawnX={20} spawnZ={0} />
      <SwordChest chestKey="field-flame" x={15} z={-14} swordId="flame" />
      <SwordChest chestKey="field-shadow" x={-15} z={14} swordId="shadow" />
      {LORE_STONES.field.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} text={s.text} />)}
      <Wall x={0} z={-26} w={52} d={1} />
      <Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} />
      <Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function ForestArea() {
  const treePositions = [
    [-18, -18], [-12, -20], [-6, -22], [2, -22], [8, -20], [14, -18], [20, -14],
    [22, -6], [22, 4], [20, 12], [16, 20], [6, 22], [-4, 22], [-14, 20],
    [-20, 14], [-22, 4], [-22, -6], [-20, -14],
    [-8, -10], [10, -8], [-14, 4], [12, 10], [-6, 16], [8, -16],
  ];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1e4a14" />
      </mesh>
      {treePositions.map(([tx, tz], i) => (
        <Tree key={i} x={tx} z={tz} scale={1.0 + (i % 3) * 0.15} />
      ))}
      <Portal x={-20} z={0} color="#66ff88" label="Sunfield Plains" targetArea="field" spawnX={20} spawnZ={0} />
      <Portal x={0} z={-22} color="#ff4444" label="Malgrath's Lair" targetArea="boss" spawnX={0} spawnZ={18} />
      <SwordChest chestKey="forest-frost" x={-14} z={-14} swordId="frost" />
      {LORE_STONES.forest.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} text={s.text} />)}
      <Wall x={0} z={-26} w={52} d={1} />
      <Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} />
      <Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function DesertArea() {
  const cactiPos = [
    [-16, -14], [-10, -20], [4, -18], [14, -16], [18, -10], [20, 4],
    [16, 14], [8, 20], [-4, 20], [-14, 16], [-20, 8], [-20, -4],
    [-8, 8], [10, -8], [6, 14], [-10, -6],
  ];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#c9a64a" />
      </mesh>
      {cactiPos.map(([cx, cz], i) => <Cactus key={i} x={cx} z={cz} />)}
      <Portal x={20} z={0} color="#66ff88" label="Sunfield Plains" targetArea="field" spawnX={-20} spawnZ={0} />
      <Portal x={0} z={-22} color="#ff4444" label="Malgrath's Lair" targetArea="boss" spawnX={0} spawnZ={18} />
      <SwordChest chestKey="desert-thunder" x={14} z={-14} swordId="thunder" />
      {LORE_STONES.desert.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} text={s.text} />)}
      <Wall x={0} z={-26} w={52} d={1} />
      <Wall x={0} z={26} w={52} d={1} />
      <Wall x={-26} z={0} w={1} d={52} />
      <Wall x={26} z={0} w={1} d={52} />
    </group>
  );
}

function BossArea() {
  const pillarPositions = [[-10, -10], [10, -10], [-10, 10], [10, 10]];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color="#1a1228" />
      </mesh>
      {pillarPositions.map(([px, pz], i) => (
        <mesh key={i} position={[px, 2.5, pz]}>
          <cylinderGeometry args={[0.7, 0.8, 5, 8]} />
          <meshStandardMaterial color="#2a1e3a" />
        </mesh>
      ))}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[
          Math.cos(i * Math.PI / 2) * 14, 0.05, Math.sin(i * Math.PI / 2) * 14
        ]} rotation={[-Math.PI / 2, 0, i * Math.PI / 2]}>
          <planeGeometry args={[3, 3]} />
          <meshStandardMaterial color="#4a1a6a" emissive="#6622aa" emissiveIntensity={0.4} />
        </mesh>
      ))}
      <pointLight position={[0, 8, 0]} color="#aa44ff" intensity={30} distance={25} />
      <pointLight position={[-8, 3, -8]} color="#ff2244" intensity={10} distance={12} />
      <pointLight position={[8, 3, -8]} color="#4422ff" intensity={10} distance={12} />
      {LORE_STONES.boss.map(s => <LoreStoneObj key={s.id} id={s.id} x={s.x} z={s.z} text={s.text} />)}
      <Wall x={0} z={-23} w={46} d={1} />
      <Wall x={0} z={23} w={46} d={1} />
      <Wall x={-23} z={0} w={1} d={46} />
      <Wall x={23} z={0} w={1} d={46} />
    </group>
  );
}

export default function World() {
  const currentArea = useGameStore(s => s.currentArea);
  switch (currentArea) {
    case "field": return <FieldArea />;
    case "forest": return <ForestArea />;
    case "desert": return <DesertArea />;
    case "boss": return <BossArea />;
    default: return <FieldArea />;
  }
}
