import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useGameStore, AreaId, AreaTransition } from './store';
import { Village } from './Village';
import { NPCManager } from './NPCs';

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
    { pos: [0, 0, -29], rot: [0, 0, 0], label: 'Whisper Woods',
      destination: { area: 'forest', spawnPos: new THREE.Vector3(0, 0, 26) }, color: '#44ff44' },
    { pos: [29, 0, 0], rot: [0, -Math.PI/2, 0], label: 'Ashrock Summit',
      destination: { area: 'desert', spawnPos: new THREE.Vector3(-26, 0, 0) }, color: '#ff8822' },
  ],
  forest: [
    { pos: [0, 0, 29], rot: [0, Math.PI, 0], label: 'Sunfield Plains',
      destination: { area: 'field', spawnPos: new THREE.Vector3(0, 0, -24) }, color: '#88aaff' },
  ],
  desert: [
    { pos: [-29, 0, 0], rot: [0, Math.PI/2, 0], label: 'Sunfield Plains',
      destination: { area: 'field', spawnPos: new THREE.Vector3(26, 0, 0) }, color: '#88aaff' },
  ],
  boss: [
    { pos: [0, 0, 29], rot: [0, Math.PI, 0], label: 'Return to Sunfield Plains',
      destination: { area: 'field', spawnPos: new THREE.Vector3(0, 0, 20) }, color: '#88aaff' },
  ],
};

// ── Boss portal in field (only when all 3 shards collected) ──────
const BOSS_PORTAL_DEF: PortalDef = {
  pos: [-29, 0, 0], rot: [0, Math.PI/2, 0],
  label: "Malgrath's Lair",
  destination: { area: 'boss', spawnPos: new THREE.Vector3(0, 0, 22) },
  color: '#9900ff',
};

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
      <mesh position={[-1.2, 2.5, 0]} castShadow>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#665544" />
      </mesh>
      <mesh position={[1.2, 2.5, 0]} castShadow>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#665544" />
      </mesh>
      <mesh position={[0, 5.2, 0]} castShadow>
        <boxGeometry args={[3.0, 0.5, 0.4]} />
        <meshStandardMaterial color="#665544" />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <planeGeometry args={[2.0, 4.8]} />
        <meshStandardMaterial color={def.color} emissive={def.color}
          emissiveIntensity={glow} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={def.color} intensity={glow * 3} distance={8} decay={2} />
    </group>
  );
}

// ─── Crystal shard chest ─────────────────────────────────────────
const SHARD_COLORS: Record<string, string> = {
  field: '#ffe060', forest: '#9966ff', desert: '#ff6030', 'boss-armor': '#44aaff',
};

function TreasureChest({ pos, area }: { pos: [number, number, number]; area: string }) {
  const chestsOpened = useGameStore(s => s.chestsOpened);
  const opened = chestsOpened.includes(area);
  const color  = SHARD_COLORS[area] ?? '#ffd060';
  return (
    <group position={pos}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.95, 1.05]} />
        <meshStandardMaterial color="#6b4020" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[-0.56, 0.28, 0]}>
        <boxGeometry args={[0.07, 0.95, 1.07]} />
        <meshStandardMaterial color="#404040" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0.56, 0.28, 0]}>
        <boxGeometry args={[0.07, 0.95, 1.07]} />
        <meshStandardMaterial color="#404040" metalness={0.6} roughness={0.5} />
      </mesh>
      <group position={[0, 0.55, -0.5]} rotation={[opened ? -Math.PI*0.72 : 0, 0, 0]}>
        <mesh castShadow position={[0, 0.09, 0.55]}>
          <boxGeometry args={[1.72, 0.2, 1.1]} />
          <meshStandardMaterial color="#8b5030" roughness={0.75} />
        </mesh>
      </group>
      {!opened && (
        <mesh position={[0, 0.48, 0.54]}>
          <boxGeometry args={[0.28, 0.28, 0.06]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.2}
            emissive={color} emissiveIntensity={0.7} />
        </mesh>
      )}
      {opened && (
        <mesh position={[0, 0.9, 0]} rotation={[0.4, Math.PI/4, 0]}>
          <octahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial color={color} transparent opacity={0.75}
            emissive={color} emissiveIntensity={2} metalness={0.3} />
        </mesh>
      )}
      {!opened && (
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.09, 9, 7]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} />
        </mesh>
      )}
      <pointLight position={[0, opened ? 1.2 : 2, 0]} color={color}
        intensity={opened ? 0.6 : 3.5} distance={opened ? 5 : 10} decay={2} />
    </group>
  );
}

// ─── Fairy Fountain ───────────────────────────────────────────────
function FairyFountain({ pos }: { pos: [number, number, number] }) {
  const t = useRef(0);
  const rippleRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    t.current += delta;
    if (rippleRef.current) {
      rippleRef.current.rotation.y = t.current * 0.5;
      rippleRef.current.scale.setScalar(1 + Math.sin(t.current * 2) * 0.05);
    }
  });
  return (
    <group position={pos}>
      {/* Basin rim */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <torusGeometry args={[1.8, 0.25, 10, 24]} />
        <meshStandardMaterial color="#ddccff" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Basin base */}
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.8, 1.6, 0.4, 20]} />
        <meshStandardMaterial color="#c0aaee" roughness={0.4} />
      </mesh>
      {/* Water surface */}
      <mesh ref={rippleRef} position={[0, 0.52, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[1.6, 24]} />
        <meshStandardMaterial color="#88eeff" emissive="#44aaff" emissiveIntensity={0.6}
          transparent opacity={0.85} roughness={0} />
      </mesh>
      {/* Center pillar */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 1.4, 10]} />
        <meshStandardMaterial color="#ccbbff" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Top orb */}
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.4, 14, 12]} />
        <meshStandardMaterial color="#88eeff" emissive="#44ccff" emissiveIntensity={1.5}
          transparent opacity={0.9} roughness={0} />
      </mesh>
      {/* Fairy lights */}
      <pointLight color="#44ccff" intensity={3} distance={12} decay={2} position={[0, 2, 0]} />
      <pointLight color="#aa88ff" intensity={1.5} distance={8} decay={2} position={[0, 0.5, 0]} />
    </group>
  );
}

// ─── Shop Merchant Sign ───────────────────────────────────────────
function MerchantSign({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {/* Post */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 2.4, 7]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
      {/* Sign board */}
      <mesh castShadow position={[0, 2.4, 0]}>
        <boxGeometry args={[1.4, 0.7, 0.12]} />
        <meshStandardMaterial color="#f5deb3" roughness={0.8} />
      </mesh>
      {/* Rupee icon on sign */}
      <mesh position={[-0.35, 2.4, 0.08]} scale={0.15} rotation={[0, 0, Math.PI/4]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#22cc55" metalness={0.8} roughness={0.2} />
      </mesh>
      <pointLight position={[0, 2.4, 0.5]} color="#ffcc44" intensity={1.0} distance={5} decay={2} />
    </group>
  );
}

// ─── Field area ───────────────────────────────────────────────────
function FieldArea() {
  const trees = useMemo(() => seededItems(22, -50, 50, 1), []);
  const rocks = useMemo(() => seededItems(12, -50, 50, 2), []);
  const chestPos: [number, number, number] = [0, 0.5, -22];
  const shardsCollected = useGameStore(s => s.shardsCollected);

  return (
    <>
      <Sky sunPosition={[100, 30, 100]} turbidity={0.1} rayleigh={0.5} />
      <ambientLight intensity={0.65} color="#fff5e0" />
      <directionalLight position={[20, 35, 10]} intensity={1.3} color="#ffeedd" castShadow
        shadow-camera-left={-35} shadow-camera-right={35}
        shadow-camera-top={35} shadow-camera-bottom={-35}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#60bb60" />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.08, -14]} receiveShadow>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#b8a870" />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, Math.PI/2]} position={[14, -0.08, 0]} receiveShadow>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#b8a870" />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, Math.PI/2]} position={[-14, -0.08, 0]} receiveShadow>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#b8a870" />
      </mesh>

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

      {rocks.map(r => (
        <mesh key={r.id} position={[r.x, r.scale*0.4, r.z]}
          scale={[r.scale, r.scale*0.7, r.scale]} rotation={[0, r.rot, 0]} castShadow>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#8a8a88" roughness={0.85} />
        </mesh>
      ))}

      <TreasureChest pos={chestPos} area="field" />
      <Village />

      {/* Fairy Fountain */}
      <FairyFountain pos={[-20, 0, 20]} />

      {/* Merchant sign near village */}
      <MerchantSign pos={[8, 0, 12]} />

      {/* Boss portal — only visible when all 3 shards collected */}
      {shardsCollected >= 3 && (
        <Portal def={BOSS_PORTAL_DEF} portalTime={0} />
      )}

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
      <pointLight position={[0, 0.5, 0]} color="#33ff88" intensity={1.5} distance={25} decay={1.5} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#1a3a1a" />
      </mesh>

      {mushrooms.map(m => (
        <mesh key={`patch-${m.id}`} rotation={[-Math.PI/2, 0, m.rot]} position={[m.x, -0.05, m.z]}>
          <circleGeometry args={[m.scale*1.2, 7]} />
          <meshStandardMaterial color="#22441a" />
        </mesh>
      ))}

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

      {mushrooms.map(m => (
        <group key={m.id} position={[m.x, 0, m.z]} scale={m.scale*0.5} rotation={[0, m.rot, 0]}>
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

      <TreasureChest pos={[0, 0.5, 0]} area="forest" />
      {/* Fairy Fountain */}
      <FairyFountain pos={[18, 0, -18]} />
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

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#c8a444" roughness={1} />
      </mesh>

      {cacti.map(c => (
        <mesh key={`sand-${c.id}`} rotation={[-Math.PI/2, 0, c.rot]} position={[c.x, -0.06, c.z]}
          scale={[1, c.scale*0.4+0.1, 1]}>
          <circleGeometry args={[c.scale*1.8, 8]} />
          <meshStandardMaterial color="#d4b054" />
        </mesh>
      ))}

      {pillars.map(p => (
        <group key={p.id} position={[p.x, 0, p.z]} scale={p.scale} rotation={[0, p.rot, 0]}>
          <mesh position={[0, p.scale*2.5, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.9, p.scale*5, 7]} />
            <meshStandardMaterial color="#aa7744" roughness={0.9} />
          </mesh>
          <mesh position={[0, p.scale*5.3, 0]} castShadow>
            <cylinderGeometry args={[0.9, 0.6, p.scale*1.2, 7]} />
            <meshStandardMaterial color="#bb8855" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {rocks.map(r => (
        <mesh key={r.id} position={[r.x, r.scale*0.5, r.z]}
          scale={[r.scale, r.scale*0.75, r.scale]} rotation={[0.3, r.rot, 0]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#997755" roughness={0.9} />
        </mesh>
      ))}

      {cacti.map(c => (
        <group key={c.id} position={[c.x, 0, c.z]} scale={c.scale*0.7} rotation={[0, c.rot, 0]}>
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

      <TreasureChest pos={chestPos} area="desert" />
      {/* Fairy Fountain */}
      <FairyFountain pos={[20, 0, 20]} />
      <Boundary />
    </>
  );
}

// ─── Boss Lair area ───────────────────────────────────────────────
function BossArea() {
  const columns = useMemo(() => {
    return [
      [-10, 0, -15], [10, 0, -15], [-10, 0, 5], [10, 0, 5],
      [-18, 0, -8], [18, 0, -8], [-18, 0, -22], [18, 0, -22],
    ] as [number, number, number][];
  }, []);

  return (
    <>
      <color attach="background" args={['#0a0014']} />
      <fog attach="fog" args={['#0a0014', 20, 50]} />
      <ambientLight intensity={0.15} color="#4400aa" />
      <directionalLight position={[0, 20, 0]} intensity={0.3} color="#8844ff" />
      {/* Dramatic purple underlighting */}
      <pointLight position={[0, 0.5, 0]} color="#6600cc" intensity={3} distance={30} decay={1.5} />
      <pointLight position={[-15, 2, -15]} color="#440088" intensity={2} distance={20} decay={2} />
      <pointLight position={[15, 2, -15]} color="#440088" intensity={2} distance={20} decay={2} />

      {/* Dark stone floor */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#0d0020" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Floor rune circle */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.09, -5]}>
        <ringGeometry args={[6, 7, 32]} />
        <meshStandardMaterial color="#4400aa" emissive="#3300aa" emissiveIntensity={0.8}
          transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.09, -5]}>
        <ringGeometry args={[2, 3, 32]} />
        <meshStandardMaterial color="#aa00ff" emissive="#aa00ff" emissiveIntensity={1.2}
          transparent opacity={0.7} />
      </mesh>

      {/* Dark columns */}
      {columns.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow position={[0, 4, 0]}>
            <cylinderGeometry args={[0.55, 0.7, 8, 10]} />
            <meshStandardMaterial color="#1a0033" roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh castShadow position={[0, 8.3, 0]}>
            <cylinderGeometry args={[0.8, 0.6, 0.6, 10]} />
            <meshStandardMaterial color="#2a0055" metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Column rune glow */}
          <pointLight position={[0, 1.5, 0]} color="#6600cc" intensity={0.8} distance={4} decay={2} />
        </group>
      ))}

      {/* Back wall */}
      <mesh castShadow position={[0, 5, -30]}>
        <boxGeometry args={[62, 10, 1]} />
        <meshStandardMaterial color="#12002a" roughness={0.8} />
      </mesh>

      {/* Armor chest */}
      <TreasureChest pos={[-8, 0.5, 8]} area="boss-armor" />

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
const SHOP_POS = new THREE.Vector3(8, 0, 12);
const FOUNTAIN_POSITIONS: Partial<Record<AreaId, THREE.Vector3>> = {
  field:  new THREE.Vector3(-20, 0, 20),
  forest: new THREE.Vector3(18, 0, -18),
  desert: new THREE.Vector3(20, 0, 20),
};

export function World() {
  const portalTimeRef = useRef(0);
  const currentArea = useGameStore(state => state.currentArea);
  const portals = PORTALS[currentArea] ?? [];
  const shardsCollected = useGameStore(s => s.shardsCollected);

  // All portals visible in the current area
  const allPortals: PortalDef[] = [...portals];
  if (currentArea === 'field' && shardsCollected >= 3) {
    allPortals.push(BOSS_PORTAL_DEF);
  }

  useFrame((_, delta) => {
    const { playerPosition, gameState } = useGameStore.getState();
    if (gameState !== 'playing') return;
    portalTimeRef.current += delta;

    // Portal proximity check
    for (const portal of allPortals) {
      const ppos = new THREE.Vector3(...portal.pos);
      if (playerPosition.distanceTo(ppos) < 2.2) {
        useGameStore.getState().triggerAreaTransition(portal.destination);
        return;
      }
    }

    // Shop proximity
    if (currentArea === 'field') {
      useGameStore.getState().setNearShop(playerPosition.distanceTo(SHOP_POS) < 3.5);
    } else {
      useGameStore.getState().setNearShop(false);
    }

    // Fairy fountain proximity
    const fountainPos = FOUNTAIN_POSITIONS[currentArea];
    if (fountainPos) {
      useGameStore.getState().setNearFountain(playerPosition.distanceTo(fountainPos) < 3.0);
    } else {
      useGameStore.getState().setNearFountain(false);
    }
  });

  return (
    <>
      {allPortals.map((def, i) => (
        <Portal key={i} def={def} portalTime={portalTimeRef.current} />
      ))}

      {currentArea === 'field'  && <FieldArea />}
      {currentArea === 'forest' && <ForestArea />}
      {currentArea === 'desert' && <DesertArea />}
      {currentArea === 'boss'   && <BossArea />}
      <NPCManager />
    </>
  );
}
