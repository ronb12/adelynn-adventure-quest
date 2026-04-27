import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useGameStore, AreaId, AreaTransition } from './store';

// ─── Portal definitions ───────────────────────────────────────────
export interface PortalDef {
  pos: [number, number, number];
  rot: [number, number, number];
  label: string;
  destination: AreaTransition;
  color: string;
}

export const PORTALS: Record<AreaId, PortalDef[]> = {
  field: [
    {
      pos: [0, 0, -29],
      rot: [0, 0, 0],
      label: 'Whisper Woods',
      destination: { area: 'forest', spawnPos: new THREE.Vector3(0, 0, 26) },
      color: '#44ff44',
    },
    {
      pos: [29, 0, 0],
      rot: [0, -Math.PI / 2, 0],
      label: 'Ashrock Summit',
      destination: { area: 'desert', spawnPos: new THREE.Vector3(-26, 0, 0) },
      color: '#ff8822',
    },
  ],
  forest: [
    {
      pos: [0, 0, 29],
      rot: [0, Math.PI, 0],
      label: 'Sunfield Plains',
      destination: { area: 'field', spawnPos: new THREE.Vector3(0, 0, -24) },
      color: '#88aaff',
    },
  ],
  desert: [
    {
      pos: [-29, 0, 0],
      rot: [0, Math.PI / 2, 0],
      label: 'Sunfield Plains',
      destination: { area: 'field', spawnPos: new THREE.Vector3(26, 0, 0) },
      color: '#88aaff',
    },
  ],
};

// ─── Shared seed generators ───────────────────────────────────────
function seededItems(count: number, rangeLo: number, rangeHi: number, seed: number) {
  const rng = (n: number) => {
    const x = Math.sin(n + seed) * 43758.5453;
    return x - Math.floor(x);
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (rng(i * 2 + 1) - 0.5) * (rangeHi - rangeLo),
    z: (rng(i * 2 + 2) - 0.5) * (rangeHi - rangeLo),
    scale: 0.7 + rng(i * 3 + 3) * 0.6,
    rot: rng(i * 5 + 7) * Math.PI * 2,
  }));
}

// ─── Portal arch ─────────────────────────────────────────────────
function Portal({ def, portalTime }: { def: PortalDef; portalTime: number }) {
  const glow = 0.8 + Math.sin(portalTime * 2.5) * 0.4;
  return (
    <group position={def.pos} rotation={def.rot}>
      {/* Left pillar */}
      <mesh position={[-1.2, 2.5, 0]} castShadow>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#665544" />
      </mesh>
      {/* Right pillar */}
      <mesh position={[1.2, 2.5, 0]} castShadow>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#665544" />
      </mesh>
      {/* Top arch */}
      <mesh position={[0, 5.2, 0]} castShadow>
        <boxGeometry args={[3.0, 0.5, 0.4]} />
        <meshStandardMaterial color="#665544" />
      </mesh>
      {/* Portal fill */}
      <mesh position={[0, 2.5, 0]}>
        <planeGeometry args={[2.0, 4.8]} />
        <meshStandardMaterial
          color={def.color}
          emissive={def.color}
          emissiveIntensity={glow}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Glow light */}
      <pointLight color={def.color} intensity={glow * 3} distance={8} decay={2} />
    </group>
  );
}

// ─── Field area ───────────────────────────────────────────────────
function FieldArea() {
  const trees = useMemo(() => seededItems(22, -50, 50, 1), []);
  const rocks = useMemo(() => seededItems(12, -50, 50, 2), []);
  const chestPos: [number, number, number] = [0, 0.5, -22];

  return (
    <>
      <Sky sunPosition={[100, 30, 100]} turbidity={0.1} rayleigh={0.5} />
      <ambientLight intensity={0.65} color="#fff5e0" />
      <directionalLight position={[20, 35, 10]} intensity={1.3} color="#ffeedd" castShadow
        shadow-camera-left={-35} shadow-camera-right={35}
        shadow-camera-top={35} shadow-camera-bottom={-35}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#60bb60" />
      </mesh>
      {/* Path to north portal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, -14]} receiveShadow>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#b8a870" />
      </mesh>
      {/* Path to east portal */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[14, -0.08, 0]} receiveShadow>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#b8a870" />
      </mesh>

      {/* Trees */}
      {trees.map(t => (
        <group key={t.id} position={[t.x, 0, t.z]} scale={t.scale}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.34, 2.4, 7]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
          <mesh position={[0, 3.2, 0]} castShadow>
            <sphereGeometry args={[1.6, 9, 8]} />
            <meshStandardMaterial color="#2e6328" />
          </mesh>
          <mesh position={[0.5, 2.6, 0.3]} castShadow>
            <sphereGeometry args={[1.0, 7, 7]} />
            <meshStandardMaterial color="#3a7a34" />
          </mesh>
        </group>
      ))}

      {/* Rocks */}
      {rocks.map(r => (
        <mesh key={r.id} position={[r.x, r.scale * 0.4, r.z]}
          scale={[r.scale, r.scale * 0.7, r.scale]} rotation={[0, r.rot, 0]} castShadow>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#8a8a88" roughness={0.85} />
        </mesh>
      ))}

      {/* Chest (placeholder — moved to desert in full game) */}
      <group position={chestPos}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 1, 1]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 0.57, 0]} castShadow>
          <boxGeometry args={[1.62, 0.22, 1.1]} />
          <meshStandardMaterial color="#a0622d" />
        </mesh>
        <mesh position={[0, 0.5, 0.52]}>
          <boxGeometry args={[0.3, 0.3, 0.06]} />
          <meshStandardMaterial color="#d4a840" metalness={0.6} roughness={0.4} />
        </mesh>
        <pointLight position={[0, 1.5, 0]} color="#ffd060" intensity={2} distance={5} decay={2} />
      </group>

      {/* World boundary walls (invisible) */}
      <Boundary />
    </>
  );
}

// ─── Forest area ─────────────────────────────────────────────────
function ForestArea() {
  const pines = useMemo(() => seededItems(35, -50, 50, 10), []);
  const mushrooms = useMemo(() => seededItems(14, -50, 50, 11), []);

  return (
    <>
      <color attach="background" args={['#0e1e0e']} />
      <fog attach="fog" args={['#0e1e0e', 12, 45]} />
      <ambientLight intensity={0.3} color="#557755" />
      <directionalLight position={[-5, 20, 5]} intensity={0.5} color="#aaffaa" castShadow
        shadow-camera-left={-35} shadow-camera-right={35}
        shadow-camera-top={35} shadow-camera-bottom={-35}
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      {/* Eerie underglow */}
      <pointLight position={[0, 0.5, 0]} color="#33ff88" intensity={1.5} distance={25} decay={1.5} />

      {/* Dark ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#1a3a1a" />
      </mesh>
      {/* Mossy patches */}
      {mushrooms.map(m => (
        <mesh key={`patch-${m.id}`} rotation={[-Math.PI / 2, 0, m.rot]} position={[m.x, -0.05, m.z]}>
          <circleGeometry args={[m.scale * 1.2, 7]} />
          <meshStandardMaterial color="#22441a" />
        </mesh>
      ))}

      {/* Tall dark pine trees */}
      {pines.map(t => (
        <group key={t.id} position={[t.x, 0, t.z]} scale={t.scale}>
          <mesh position={[0, 2, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.3, 4, 6]} />
            <meshStandardMaterial color="#2a1a0a" />
          </mesh>
          <mesh position={[0, 5.5, 0]} castShadow>
            <coneGeometry args={[1.6, 5.5, 7]} />
            <meshStandardMaterial color="#0d260d" />
          </mesh>
          <mesh position={[0, 7.5, 0]} castShadow>
            <coneGeometry args={[1.0, 3.5, 7]} />
            <meshStandardMaterial color="#102a10" />
          </mesh>
          <mesh position={[0, 9, 0]} castShadow>
            <coneGeometry args={[0.5, 2, 6]} />
            <meshStandardMaterial color="#153015" />
          </mesh>
        </group>
      ))}

      {/* Mushrooms */}
      {mushrooms.map(m => (
        <group key={m.id} position={[m.x, 0, m.z]} scale={m.scale * 0.5} rotation={[0, m.rot, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 0.8, 7]} />
            <meshStandardMaterial color="#ccbbaa" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.6, 10, 8]} />
            <meshStandardMaterial color="#cc2233" emissive="#330008" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}

      <Boundary />
    </>
  );
}

// ─── Desert area ─────────────────────────────────────────────────
function DesertArea() {
  const rocks = useMemo(() => seededItems(18, -50, 50, 20), []);
  const pillars = useMemo(() => seededItems(10, -45, 45, 21), []);
  const cacti = useMemo(() => seededItems(15, -48, 48, 22), []);
  const chestPos: [number, number, number] = [0, 0.5, -24];

  return (
    <>
      <color attach="background" args={['#d4956e']} />
      <fog attach="fog" args={['#d4956e', 25, 60]} />
      <ambientLight intensity={0.7} color="#ffe0aa" />
      <directionalLight position={[30, 40, -10]} intensity={1.5} color="#ffddaa" castShadow
        shadow-camera-left={-35} shadow-camera-right={35}
        shadow-camera-top={35} shadow-camera-bottom={-35}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      {/* Sandy ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#c8a444" roughness={1} />
      </mesh>
      {/* Sand ripple patches */}
      {cacti.map(c => (
        <mesh key={`sand-${c.id}`} rotation={[-Math.PI / 2, 0, c.rot]} position={[c.x, -0.06, c.z]}
          scale={[1, c.scale * 0.4 + 0.1, 1]}>
          <circleGeometry args={[c.scale * 1.8, 8]} />
          <meshStandardMaterial color="#d4b054" />
        </mesh>
      ))}

      {/* Rock pillars */}
      {pillars.map(p => (
        <group key={p.id} position={[p.x, 0, p.z]} scale={p.scale} rotation={[0, p.rot, 0]}>
          <mesh position={[0, p.scale * 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.9, p.scale * 5, 7]} />
            <meshStandardMaterial color="#aa7744" roughness={0.9} />
          </mesh>
          <mesh position={[0, p.scale * 5.3, 0]} castShadow>
            <cylinderGeometry args={[0.9, 0.6, p.scale * 1.2, 7]} />
            <meshStandardMaterial color="#bb8855" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Boulders */}
      {rocks.map(r => (
        <mesh key={r.id} position={[r.x, r.scale * 0.5, r.z]}
          scale={[r.scale, r.scale * 0.75, r.scale]} rotation={[0.3, r.rot, 0]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#997755" roughness={0.9} />
        </mesh>
      ))}

      {/* Cacti */}
      {cacti.map(c => (
        <group key={c.id} position={[c.x, 0, c.z]} scale={c.scale * 0.7} rotation={[0, c.rot, 0]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.3, 2.4, 7]} />
            <meshStandardMaterial color="#4a7a44" />
          </mesh>
          <mesh position={[0.7, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.2, 1.4, 6]} />
            <meshStandardMaterial color="#4a7a44" />
          </mesh>
          <mesh position={[0.7, 1.9, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.15, 0.9, 6]} />
            <meshStandardMaterial color="#4a7a44" />
          </mesh>
        </group>
      ))}

      {/* Victory Chest */}
      <group position={chestPos}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 1.1, 1.2]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <boxGeometry args={[1.9, 0.24, 1.3]} />
          <meshStandardMaterial color="#a0622d" />
        </mesh>
        <mesh position={[0, 0.55, 0.62]}>
          <boxGeometry args={[0.34, 0.34, 0.07]} />
          <meshStandardMaterial color="#d4a840" metalness={0.7} roughness={0.3} />
        </mesh>
        <pointLight position={[0, 2, 0]} color="#ffcc44" intensity={4} distance={8} decay={2} />
        <mesh position={[0, 3, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#ffe080" emissive="#ffe080" emissiveIntensity={3} />
        </mesh>
      </group>

      <Boundary />
    </>
  );
}

// ─── Invisible world boundary ─────────────────────────────────────
function Boundary() {
  return (
    <group>
      {([
        [[0, 3, -31], [62, 6, 0.4]],
        [[0, 3, 31],  [62, 6, 0.4]],
        [[-31, 3, 0], [0.4, 6, 62]],
        [[31, 3, 0],  [0.4, 6, 62]],
      ] as [number, number, number][][]).map(([p, s], i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={s as [number, number, number]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

// ─── World component ──────────────────────────────────────────────
export function World() {
  const portalTimeRef = useRef(0);
  const currentArea = useGameStore(state => state.currentArea);
  const portals = PORTALS[currentArea];

  useFrame((_, delta) => {
    const { playerPosition, gameState } = useGameStore.getState();
    if (gameState !== 'playing') return;
    portalTimeRef.current += delta;

    // Portal proximity check
    for (const portal of portals) {
      const ppos = new THREE.Vector3(...portal.pos);
      if (playerPosition.distanceTo(ppos) < 2.2) {
        useGameStore.getState().triggerAreaTransition(portal.destination);
        return;
      }
    }

    // Chest interaction (field or desert)
    const chestZ = -22;
    const chestX = 0;
    const checkChest = (area: string) =>
      area === currentArea &&
      Math.abs(playerPosition.x - chestX) < 2 &&
      Math.abs(playerPosition.z - chestZ) < 2;

    if (
      (currentArea === 'field' && checkChest('field')) ||
      (currentArea === 'desert' &&
        Math.abs(playerPosition.x) < 2 &&
        Math.abs(playerPosition.z - (-24)) < 2)
    ) {
      // Proximity hint is handled in HUD. Actual trigger is from Player E key.
    }
  });

  return (
    <>
      {/* Portal arches */}
      {portals.map((def, i) => (
        <Portal key={i} def={def} portalTime={portalTimeRef.current} />
      ))}

      {currentArea === 'field'  && <FieldArea />}
      {currentArea === 'forest' && <ForestArea />}
      {currentArea === 'desert' && <DesertArea />}
    </>
  );
}
