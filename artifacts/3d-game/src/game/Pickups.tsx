import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './store';

const RUPEE_COUNT = 10;
const HEART_COUNT = 3;
const WORLD_SIZE = 50;

interface PickupData {
  id: number;
  type: 'rupee' | 'heart';
  pos: THREE.Vector3;
  active: boolean;
  baseY: number;
}

export function Pickups() {
  const pickupsRef = useRef<PickupData[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  
  const addRupees = useGameStore(state => state.addRupees);
  const healPlayer = useGameStore(state => state.healPlayer);

  // Initialize
  if (pickupsRef.current.length === 0) {
    let idCounter = 0;
    for (let i = 0; i < RUPEE_COUNT; i++) {
      pickupsRef.current.push({
        id: idCounter++,
        type: 'rupee',
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * WORLD_SIZE,
          0.5,
          (Math.random() - 0.5) * WORLD_SIZE
        ),
        active: true,
        baseY: 0.5
      });
    }
    for (let i = 0; i < HEART_COUNT; i++) {
      pickupsRef.current.push({
        id: idCounter++,
        type: 'heart',
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * WORLD_SIZE,
          0.5,
          (Math.random() - 0.5) * WORLD_SIZE
        ),
        active: true,
        baseY: 0.5
      });
    }
  }

  useFrame((state) => {
    const playerPos = useGameStore.getState().playerPosition;
    const gameState = useGameStore.getState().gameState;
    
    if (gameState !== 'playing' || !groupRef.current) return;

    pickupsRef.current.forEach((pickup, index) => {
      if (!pickup.active) return;

      const child = groupRef.current!.children[index];
      if (child) {
        // Bob and spin
        child.position.y = pickup.baseY + Math.sin(state.clock.elapsedTime * 3 + pickup.id) * 0.2;
        child.rotation.y += 0.05;
        child.visible = true;
      }

      // Collect
      if (pickup.pos.distanceTo(playerPos) < 1.5) {
        pickup.active = false;
        if (child) child.visible = false;

        if (pickup.type === 'rupee') {
          addRupees(1);
        } else if (pickup.type === 'heart') {
          healPlayer(1);
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {pickupsRef.current.map(p => (
        <group key={p.id} position={p.pos}>
          {p.type === 'rupee' ? (
            <mesh castShadow>
              <octahedronGeometry args={[0.3]} />
              <meshStandardMaterial color="#22cc55" roughness={0.2} metalness={0.8} />
            </mesh>
          ) : (
            <mesh castShadow scale={[0.3, 0.3, 0.3]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#ff2222" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
