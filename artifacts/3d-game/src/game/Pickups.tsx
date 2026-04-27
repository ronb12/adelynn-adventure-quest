import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, AreaId } from './store';

// Fixed heart piece positions per area (placed interestingly around the map)
const HEART_PIECE_POSITIONS: Record<AreaId, { id: string; pos: [number, number, number] }[]> = {
  field: [
    { id: 'hp-field-1', pos: [ 18,  0.6,  15] },
    { id: 'hp-field-2', pos: [-20,  0.6, -18] },
    { id: 'hp-field-3', pos: [ 24,  0.6, -10] },
  ],
  forest: [
    { id: 'hp-forest-1', pos: [ 20,  0.6,  20] },
    { id: 'hp-forest-2', pos: [-18,  0.6, -15] },
    { id: 'hp-forest-3', pos: [  8,  0.6, -22] },
  ],
  desert: [
    { id: 'hp-desert-1', pos: [ 22,  0.6,  18] },
    { id: 'hp-desert-2', pos: [-16,  0.6, -20] },
    { id: 'hp-desert-3', pos: [  5,  0.6,  22] },
  ],
  boss: [
    { id: 'hp-boss-1', pos: [14, 0.6, -12] },
  ],
};

const RUPEE_POSITIONS: { pos: [number, number, number] }[] = [
  { pos: [  5, 0.5,  8] }, { pos: [-10, 0.5, 12] }, { pos: [ 15, 0.5, -5] },
  { pos: [ -8, 0.5, -14] }, { pos: [ 20, 0.5,  3] }, { pos: [-18, 0.5,  7] },
  { pos: [  2, 0.5, -20] }, { pos: [ 12, 0.5, 18] }, { pos: [-22, 0.5, -8] },
  { pos: [  6, 0.5, 24] },
];

const HEART_POSITIONS: { pos: [number, number, number] }[] = [
  { pos: [-5, 0.5, 10] }, { pos: [16, 0.5, -16] }, { pos: [-14, 0.5, 5] },
];

interface PickupData {
  id: string;
  type: 'rupee' | 'heart';
  pos: THREE.Vector3;
  active: boolean;
}

interface HeartPieceData {
  id: string;
  pos: THREE.Vector3;
  active: boolean;
}

export function Pickups() {
  const currentArea = useGameStore(s => s.currentArea);
  const pickupsRef    = useRef<PickupData[]>([]);
  const heartPiecesRef = useRef<HeartPieceData[]>([]);
  const pickupGroupRef = useRef<THREE.Group>(null);
  const hpGroupRef     = useRef<THREE.Group>(null);
  const initializedArea = useRef<AreaId | null>(null);

  // Re-initialize on area change
  if (initializedArea.current !== currentArea) {
    initializedArea.current = currentArea;
    const store = useGameStore.getState();

    // Rupees & hearts (fresh each area)
    pickupsRef.current = [
      ...RUPEE_POSITIONS.map((r, i) => ({
        id: `rupee-${i}`,
        type: 'rupee' as const,
        pos: new THREE.Vector3(...r.pos),
        active: true,
      })),
      ...HEART_POSITIONS.map((h, i) => ({
        id: `heart-${i}`,
        type: 'heart' as const,
        pos: new THREE.Vector3(...h.pos),
        active: true,
      })),
    ];

    // Heart pieces (persistent — hide already collected)
    const pieces = HEART_PIECE_POSITIONS[currentArea] ?? [];
    heartPiecesRef.current = pieces.map(p => ({
      id: p.id,
      pos: new THREE.Vector3(...p.pos),
      active: !store.heartPiecesCollected.includes(p.id),
    }));
  }

  useFrame((state) => {
    const { playerPosition, gameState, addRupees, healPlayer, collectHeartPiece } =
      useGameStore.getState();
    if (gameState !== 'playing') return;

    const t = state.clock.elapsedTime;

    // ── Regular pickups ──
    if (pickupGroupRef.current) {
      pickupsRef.current.forEach((pickup, i) => {
        const child = pickupGroupRef.current!.children[i];
        if (!child) return;
        if (!pickup.active) { child.visible = false; return; }
        child.visible = true;
        child.position.y = pickup.pos.y + Math.sin(t * 3 + i) * 0.15;
        child.rotation.y += 0.04;

        if (pickup.pos.distanceTo(playerPosition) < 1.4) {
          pickup.active = false;
          child.visible = false;
          if (pickup.type === 'rupee') addRupees(1);
          else healPlayer(1);
        }
      });
    }

    // ── Heart pieces ──
    if (hpGroupRef.current) {
      heartPiecesRef.current.forEach((hp, i) => {
        const child = hpGroupRef.current!.children[i];
        if (!child) return;
        if (!hp.active) { child.visible = false; return; }
        child.visible = true;
        child.position.y = hp.pos.y + Math.sin(t * 2 + i * 1.3) * 0.12;
        child.rotation.y += 0.03;

        if (hp.pos.distanceTo(playerPosition) < 1.5) {
          hp.active = false;
          child.visible = false;
          collectHeartPiece(hp.id);
        }
      });
    }
  });

  return (
    <>
      {/* Rupees & hearts */}
      <group ref={pickupGroupRef}>
        {pickupsRef.current.map(p => (
          <group key={p.id} position={p.pos}>
            {p.type === 'rupee' ? (
              <mesh castShadow>
                <octahedronGeometry args={[0.3]} />
                <meshStandardMaterial color="#22cc55" roughness={0.2} metalness={0.8}
                  emissive="#22cc55" emissiveIntensity={0.3} />
              </mesh>
            ) : (
              <group>
                {/* Heart shape using two spheres */}
                <mesh castShadow position={[-0.12, 0.1, 0]} scale={[0.28, 0.25, 0.2]}>
                  <sphereGeometry args={[1, 12, 10]} />
                  <meshStandardMaterial color="#ff2244" emissive="#ff2244" emissiveIntensity={0.5} />
                </mesh>
                <mesh castShadow position={[0.12, 0.1, 0]} scale={[0.28, 0.25, 0.2]}>
                  <sphereGeometry args={[1, 12, 10]} />
                  <meshStandardMaterial color="#ff2244" emissive="#ff2244" emissiveIntensity={0.5} />
                </mesh>
                <mesh castShadow position={[0, -0.06, 0]} scale={[0.34, 0.28, 0.2]} rotation={[0,0,Math.PI/4]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#ff2244" emissive="#ff2244" emissiveIntensity={0.5} />
                </mesh>
                <pointLight color="#ff2244" intensity={0.8} distance={3} decay={2} />
              </group>
            )}
          </group>
        ))}
      </group>

      {/* Heart pieces — glowing purple */}
      <group ref={hpGroupRef}>
        {heartPiecesRef.current.map(hp => (
          <group key={hp.id} position={hp.pos}>
            {/* Quarter-heart piece shape */}
            <mesh castShadow scale={[0.35, 0.32, 0.25]}>
              <sphereGeometry args={[1, 14, 12]} />
              <meshStandardMaterial color="#ff44cc" roughness={0.3} metalness={0.2}
                emissive="#cc00ff" emissiveIntensity={0.8} />
            </mesh>
            {/* Star sparkle on top */}
            <mesh position={[0, 0.5, 0]}>
              <octahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial color="#ffffff" emissive="#cc88ff" emissiveIntensity={2} />
            </mesh>
            <pointLight color="#cc00ff" intensity={1.5} distance={5} decay={2} />
          </group>
        ))}
      </group>
    </>
  );
}
