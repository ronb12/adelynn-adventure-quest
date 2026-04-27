import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from './store';

const WORLD_SIZE = 60;
const TREE_COUNT = 20;
const ROCK_COUNT = 10;

export function World() {
  const trees = useMemo(() => {
    return Array.from({ length: TREE_COUNT }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * (WORLD_SIZE - 4),
      z: (Math.random() - 0.5) * (WORLD_SIZE - 4),
      scale: 0.8 + Math.random() * 0.4,
    }));
  }, []);

  const rocks = useMemo(() => {
    return Array.from({ length: ROCK_COUNT }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * (WORLD_SIZE - 4),
      z: (Math.random() - 0.5) * (WORLD_SIZE - 4),
      scale: 0.5 + Math.random() * 0.8,
    }));
  }, []);

  const chestPos = useMemo(() => new THREE.Vector3(0, 0.5, -25), []);

  useFrame(() => {
    const playerPos = useGameStore.getState().playerPosition;
    const dist = playerPos.distanceTo(chestPos);
    if (dist < 2 && useGameStore.getState().gameState === 'playing') {
      // Could trigger interaction hint here
    }
  });

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#55aa55" />
      </mesh>

      {/* Trees */}
      {trees.map(t => (
        <group key={`tree-${t.id}`} position={[t.x, 0, t.z]} scale={t.scale}>
          <mesh position={[0, 1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.3, 2]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
            <sphereGeometry args={[1.5, 8, 8]} />
            <meshStandardMaterial color="#2d5a27" />
          </mesh>
        </group>
      ))}

      {/* Rocks */}
      {rocks.map(r => (
        <mesh key={`rock-${r.id}`} position={[r.x, r.scale/2, r.z]} scale={r.scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#888888" roughness={0.8} />
        </mesh>
      ))}

      {/* Chest */}
      <group position={chestPos} castShadow receiveShadow>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.5, 1, 1]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[1.6, 0.2, 1.1]} />
          <meshStandardMaterial color="#a0522d" />
        </mesh>
      </group>
    </group>
  );
}
