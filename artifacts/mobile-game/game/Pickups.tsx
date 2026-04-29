import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { useGameStore } from "./store";
import { playerState, pendingPickupSpawns } from "./controls";

interface PickupData {
  id: string;
  type: "heart" | "rupee";
  x: number; z: number;
  timeLeft: number;
}

let pickupSeq = 0;

function HeartMesh({ data }: { data: PickupData }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(data.x, 0.5 + Math.sin(Date.now() * 0.004) * 0.12, data.z);
      meshRef.current.rotation.y = Date.now() * 0.002;
    }
  });
  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#e74c3c" emissive="#cc1122" emissiveIntensity={1.2} />
      </mesh>
      <pointLight ref={lightRef} position={[data.x, 0.6, data.z]} color="#ff2244" intensity={4} distance={3} />
    </>
  );
}

function RupeeMesh({ data }: { data: PickupData }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(data.x, 0.5 + Math.sin(Date.now() * 0.005 + 1) * 0.1, data.z);
      meshRef.current.rotation.y = Date.now() * 0.003;
    }
  });
  return (
    <>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.2]} />
        <meshStandardMaterial color="#f59e0b" emissive="#cc8800" emissiveIntensity={1.0} />
      </mesh>
      <pointLight position={[data.x, 0.6, data.z]} color="#ffaa00" intensity={3} distance={2.5} />
    </>
  );
}

export default function Pickups() {
  const pickupsRef = useRef<PickupData[]>([]);
  const [, triggerRender] = useState(0);
  const gameState = useGameStore(s => s.gameState);
  const currentArea = useGameStore(s => s.currentArea);

  useEffect(() => {
    pickupsRef.current = [];
    triggerRender(n => n + 1);
  }, [currentArea]);

  useFrame((_, delta) => {
    if (gameState !== "playing") return;
    let changed = false;

    while (pendingPickupSpawns.length > 0) {
      const spawn = pendingPickupSpawns.shift()!;
      pickupsRef.current.push({
        id: `pick-${++pickupSeq}`,
        type: spawn.type,
        x: spawn.x + (Math.random() - 0.5) * 1.2,
        z: spawn.z + (Math.random() - 0.5) * 1.2,
        timeLeft: 12,
      });
      changed = true;
    }

    const dt = Math.min(delta, 0.05);
    for (const p of pickupsRef.current) {
      p.timeLeft -= dt;
      if (p.timeLeft <= 0) { changed = true; continue; }
      const dx = playerState.x - p.x;
      const dz = playerState.z - p.z;
      if (Math.sqrt(dx * dx + dz * dz) < 1.0) {
        if (p.type === "heart") useGameStore.getState().healPlayer(1);
        else useGameStore.getState().addRupees(5);
        p.timeLeft = -1;
        changed = true;
      }
    }

    if (changed) {
      pickupsRef.current = pickupsRef.current.filter(p => p.timeLeft > 0);
      triggerRender(n => n + 1);
    }
  });

  return (
    <>
      {pickupsRef.current.map(p =>
        p.type === "heart"
          ? <HeartMesh key={p.id} data={p} />
          : <RupeeMesh key={p.id} data={p} />
      )}
    </>
  );
}
