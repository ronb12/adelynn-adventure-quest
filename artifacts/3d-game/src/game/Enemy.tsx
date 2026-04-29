import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, AreaId, SWORD_DEFS } from './store';
import { hitZones } from './hitZones';
import { sfxHit, sfxDeath, sfxStatusEffect } from './AudioManager';

// ── Area config ──────────────────────────────────────────────────
type EnemyMeshType = 'slime' | 'bat' | 'knight' | 'briarwolf' | 'scorpion' | 'wraith' | 'goblin' | 'thornspitter';
type EnemyBehavior = 'chase' | 'charge' | 'ranged';

const AREA_CONFIG: Record<AreaId, {
  count: number; maxHp: number; speed: [number, number];
  body: string; accent: string; chaseRange: number;
  meshType: EnemyMeshType;
  behavior?: EnemyBehavior;
}[]> = {
  field: [
    { count: 5, maxHp: 2, speed: [1.4, 2.5], body: '#c0392b', accent: '#922b21', chaseRange: 8,  meshType: 'slime' },
  ],
  forest: [
    { count: 4, maxHp: 2, speed: [2.0, 3.2], body: '#4a235a', accent: '#6c3483', chaseRange: 12, meshType: 'bat' },
    { count: 3, maxHp: 3, speed: [1.8, 2.6], body: '#2d6a2d', accent: '#81c784', chaseRange: 10, meshType: 'briarwolf', behavior: 'charge' },
    { count: 2, maxHp: 2, speed: [1.0, 1.4], body: '#4a6e2a', accent: '#9acd50', chaseRange: 13, meshType: 'thornspitter', behavior: 'ranged' },
  ],
  desert: [
    { count: 3, maxHp: 3, speed: [0.9, 1.5], body: '#a04020', accent: '#c0703a', chaseRange: 6,  meshType: 'knight' },
    { count: 4, maxHp: 2, speed: [2.0, 2.8], body: '#b7770d', accent: '#f0b03a', chaseRange: 11, meshType: 'scorpion', behavior: 'ranged' },
  ],
  boss: [
    { count: 5, maxHp: 4, speed: [2.2, 3.0], body: '#1a0030', accent: '#7c4dff', chaseRange: 14, meshType: 'wraith', behavior: 'ranged' },
  ],
  jungle: [
    { count: 5, maxHp: 5, speed: [2.2, 3.2], body: '#2a6e1a', accent: '#66ee44', chaseRange: 11, meshType: 'briarwolf', behavior: 'charge' },
    { count: 3, maxHp: 4, speed: [1.2, 2.0], body: '#1a4a0a', accent: '#44cc22', chaseRange: 15, meshType: 'thornspitter', behavior: 'ranged' },
    { count: 2, maxHp: 6, speed: [0.7, 1.2], body: '#3a5a1a', accent: '#88dd44', chaseRange: 7,  meshType: 'knight' },
    { count: 4, maxHp: 3, speed: [2.8, 3.8], body: '#2d7d20', accent: '#55cc44', chaseRange: 14, meshType: 'goblin', behavior: 'charge' },
  ],
  ice: [
    { count: 5, maxHp: 5, speed: [1.5, 2.4], body: '#88ccff', accent: '#ffffff', chaseRange: 10, meshType: 'slime' },
    { count: 3, maxHp: 4, speed: [2.2, 3.2], body: '#5588cc', accent: '#aaddff', chaseRange: 14, meshType: 'bat', behavior: 'ranged' },
    { count: 2, maxHp: 7, speed: [0.7, 1.3], body: '#336699', accent: '#99ccff', chaseRange: 7,  meshType: 'knight' },
  ],
  volcano: [
    { count: 5, maxHp: 5, speed: [2.8, 3.8], body: '#cc2200', accent: '#ff6600', chaseRange: 13, meshType: 'goblin', behavior: 'charge' },
    { count: 3, maxHp: 5, speed: [1.4, 2.4], body: '#aa3300', accent: '#ff8800', chaseRange: 13, meshType: 'scorpion', behavior: 'ranged' },
    { count: 2, maxHp: 8, speed: [0.8, 1.4], body: '#882200', accent: '#ff4400', chaseRange: 7,  meshType: 'knight' },
  ],
  sky: [
    { count: 5, maxHp: 5, speed: [3.2, 4.4], body: '#2244cc', accent: '#88bbff', chaseRange: 13, meshType: 'bat', behavior: 'charge' },
    { count: 3, maxHp: 5, speed: [1.8, 2.8], body: '#1133aa', accent: '#5599ff', chaseRange: 15, meshType: 'thornspitter', behavior: 'ranged' },
    { count: 2, maxHp: 8, speed: [1.0, 1.8], body: '#0022aa', accent: '#3366ff', chaseRange: 7,  meshType: 'knight' },
  ],
  crypt: [
    { count: 5, maxHp: 6, speed: [2.0, 3.2], body: '#c8c888', accent: '#ffff99', chaseRange: 12, meshType: 'goblin', behavior: 'charge' },
    { count: 4, maxHp: 6, speed: [2.4, 3.6], body: '#553311', accent: '#aa6622', chaseRange: 15, meshType: 'wraith', behavior: 'ranged' },
    { count: 2, maxHp: 10, speed: [0.7, 1.3], body: '#888866', accent: '#ccccaa', chaseRange: 6,  meshType: 'knight' },
  ],
  void: [
    { count: 6, maxHp: 8, speed: [3.0, 4.5], body: '#110022', accent: '#cc00ff', chaseRange: 16, meshType: 'wraith', behavior: 'ranged' },
    { count: 4, maxHp: 9, speed: [2.0, 3.2], body: '#220033', accent: '#8800cc', chaseRange: 10, meshType: 'knight', behavior: 'charge' },
    { count: 3, maxHp: 6, speed: [4.0, 5.5], body: '#330044', accent: '#ff00cc', chaseRange: 14, meshType: 'bat' },
  ],
  cave: [
    { count: 6, maxHp: 3, speed: [2.8, 4.0], body: '#2a1a4a', accent: '#aa66ff', chaseRange: 14, meshType: 'bat' },
    { count: 3, maxHp: 4, speed: [1.6, 2.6], body: '#4a3366', accent: '#cc88ff', chaseRange: 10, meshType: 'slime' },
    { count: 2, maxHp: 5, speed: [1.0, 1.8], body: '#553388', accent: '#8844cc', chaseRange: 8,  meshType: 'wraith', behavior: 'ranged' },
  ],
  home: [],
  cottage1: [],
  cottage2: [],
  cottage3: [],
};

// ── Visual meshes ────────────────────────────────────────────────

function SlimeEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.52, 0]} scale={[1, 0.72, 1]}>
        <sphereGeometry args={[0.58, 20, 16]} />
        <meshStandardMaterial color={palette.body} roughness={0.45} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0.12, 0.72, 0.32]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.18} roughness={0} />
      </mesh>
      <mesh position={[-0.2, 0.64, 0.5]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0.2, 0.64, 0.5]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[-0.2, 0.64, 0.6]}>
        <sphereGeometry args={[0.056, 8, 6]} />
        <meshStandardMaterial color="#110a1a" />
      </mesh>
      <mesh position={[0.2, 0.64, 0.6]}>
        <sphereGeometry args={[0.056, 8, 6]} />
        <meshStandardMaterial color="#110a1a" />
      </mesh>
      {[0,1,2,3,4,5].map(i => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a)*0.52, 0.15, Math.sin(a)*0.52]} rotation={[0, -a, 0.35]}>
            <coneGeometry args={[0.1, 0.3, 6]} />
            <meshStandardMaterial color={palette.accent} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function BatEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.76, 0]}>
        <sphereGeometry args={[0.42, 16, 13]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.7, 0.28]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color={palette.accent} roughness={0.9} />
      </mesh>
      <group position={[-0.42, 0.78, 0]} rotation={[0, 0, 0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.03, 0.7, 6]} />
          <meshStandardMaterial color={palette.body} />
        </mesh>
        <mesh position={[-0.22, 0, 0]}>
          <boxGeometry args={[0.6, 0.04, 0.55]} />
          <meshStandardMaterial color={palette.accent} transparent opacity={0.88} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group position={[0.42, 0.78, 0]} rotation={[0, 0, -0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.03, 0.7, 6]} />
          <meshStandardMaterial color={palette.body} />
        </mesh>
        <mesh position={[0.22, 0, 0]}>
          <boxGeometry args={[0.6, 0.04, 0.55]} />
          <meshStandardMaterial color={palette.accent} transparent opacity={0.88} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh castShadow position={[-0.2, 1.17, 0]} rotation={[0, 0, -0.25]}>
        <coneGeometry args={[0.1, 0.35, 7]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.2, 1.17, 0]} rotation={[0, 0, 0.25]}>
        <coneGeometry args={[0.1, 0.35, 7]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      <mesh position={[-0.17, 0.86, 0.37]}>
        <sphereGeometry args={[0.085, 10, 8]} />
        <meshStandardMaterial color="#ff1100" emissive="#ff0000" emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[0.17, 0.86, 0.37]}>
        <sphereGeometry args={[0.085, 10, 8]} />
        <meshStandardMaterial color="#ff1100" emissive="#ff0000" emissiveIntensity={2.5} />
      </mesh>
      <pointLight color="#8800ff" intensity={0.8} distance={4} decay={2} position={[0, 0.7, 0]} />
    </group>
  );
}

function KnightEnemy({ palette }: { palette: { body: string; accent: string } }) {
  // Cloth colour — warm off-white wrappings
  const cloth   = '#d4b896';
  const dark    = '#2a1a0a';
  const bronze  = palette.accent;
  const armor   = palette.body;
  const eyes    = '#ff6600';

  return (
    <group>
      {/* ── FEET / SANDALS ── */}
      <mesh castShadow position={[-0.17, 0.07, 0.04]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.18, 0.1, 0.34]} />
        <meshStandardMaterial color={dark} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.17, 0.07, 0.04]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.18, 0.1, 0.34]} />
        <meshStandardMaterial color={dark} roughness={0.85} />
      </mesh>

      {/* ── LOWER LEGS (cloth-wrapped greaves) ── */}
      <mesh castShadow position={[-0.17, 0.34, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.42, 10]} />
        <meshStandardMaterial color={cloth} roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0.17, 0.34, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.42, 10]} />
        <meshStandardMaterial color={cloth} roughness={0.92} />
      </mesh>
      {/* Knee guards (metal discs) */}
      <mesh castShadow position={[-0.17, 0.55, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.115, 0.115, 0.07, 12]} />
        <meshStandardMaterial color={bronze} metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh castShadow position={[0.17, 0.55, 0.09]}>
        <cylinderGeometry args={[0.115, 0.115, 0.07, 12]} />
        <meshStandardMaterial color={bronze} metalness={0.72} roughness={0.28} />
      </mesh>

      {/* ── UPPER LEGS ── */}
      <mesh castShadow position={[-0.17, 0.75, 0]}>
        <cylinderGeometry args={[0.13, 0.11, 0.38, 10]} />
        <meshStandardMaterial color={armor} metalness={0.55} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0.17, 0.75, 0]}>
        <cylinderGeometry args={[0.13, 0.11, 0.38, 10]} />
        <meshStandardMaterial color={armor} metalness={0.55} roughness={0.42} />
      </mesh>

      {/* ── HIP / BELT (layered cloth tabard) ── */}
      <mesh castShadow position={[0, 0.96, 0]}>
        <cylinderGeometry args={[0.31, 0.26, 0.18, 12]} />
        <meshStandardMaterial color={cloth} roughness={0.88} />
      </mesh>
      {/* Belt plate */}
      <mesh castShadow position={[0, 0.97, 0.3]}>
        <boxGeometry args={[0.44, 0.12, 0.04]} />
        <meshStandardMaterial color={bronze} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Side tabard strips */}
      {[-0.22, 0, 0.22].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.81, 0.08]}>
          <boxGeometry args={[0.1, 0.22, 0.06]} />
          <meshStandardMaterial color={i % 2 === 0 ? armor : cloth} roughness={0.85} />
        </mesh>
      ))}

      {/* ── TORSO (layered chest) ── */}
      <mesh castShadow position={[0, 1.22, 0]}>
        <cylinderGeometry args={[0.3, 0.29, 0.5, 14]} />
        <meshStandardMaterial color={armor} metalness={0.58} roughness={0.38} />
      </mesh>
      {/* Chest plate on front */}
      <mesh castShadow position={[0, 1.26, 0.28]}>
        <boxGeometry args={[0.42, 0.38, 0.07]} />
        <meshStandardMaterial color={bronze} metalness={0.75} roughness={0.25} />
      </mesh>
      {/* Chest ridge line */}
      <mesh castShadow position={[0, 1.26, 0.33]}>
        <boxGeometry args={[0.05, 0.32, 0.03]} />
        <meshStandardMaterial color={dark} roughness={0.6} />
      </mesh>
      {/* Back plate */}
      <mesh castShadow position={[0, 1.22, -0.28]}>
        <boxGeometry args={[0.44, 0.44, 0.06]} />
        <meshStandardMaterial color={armor} metalness={0.55} roughness={0.42} />
      </mesh>

      {/* ── SHOULDERS (rounded pauldrons) ── */}
      <mesh castShadow position={[-0.47, 1.42, 0]} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color={bronze} metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh castShadow position={[0.47, 1.42, 0]} rotation={[0, 0, -0.4]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color={bronze} metalness={0.72} roughness={0.28} />
      </mesh>
      {/* Pauldron ridges */}
      <mesh castShadow position={[-0.5, 1.52, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.05, 0.04, 0.3, 8]} />
        <meshStandardMaterial color={armor} metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh castShadow position={[0.5, 1.52, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.05, 0.04, 0.3, 8]} />
        <meshStandardMaterial color={armor} metalness={0.65} roughness={0.35} />
      </mesh>

      {/* ── UPPER ARMS ── */}
      <mesh castShadow position={[-0.58, 1.18, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.34, 10]} />
        <meshStandardMaterial color={cloth} roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0.58, 1.18, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.34, 10]} />
        <meshStandardMaterial color={cloth} roughness={0.92} />
      </mesh>

      {/* ── FOREARMS / GAUNTLETS ── */}
      <mesh castShadow position={[-0.6, 0.9, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.32, 10]} />
        <meshStandardMaterial color={armor} metalness={0.62} roughness={0.35} />
      </mesh>
      <mesh castShadow position={[0.6, 0.9, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.32, 10]} />
        <meshStandardMaterial color={armor} metalness={0.62} roughness={0.35} />
      </mesh>
      {/* Wrist cuffs */}
      <mesh castShadow position={[-0.6, 0.76, 0]}>
        <cylinderGeometry args={[0.11, 0.1, 0.07, 10]} />
        <meshStandardMaterial color={bronze} metalness={0.78} roughness={0.22} />
      </mesh>
      <mesh castShadow position={[0.6, 0.76, 0]}>
        <cylinderGeometry args={[0.11, 0.1, 0.07, 10]} />
        <meshStandardMaterial color={bronze} metalness={0.78} roughness={0.22} />
      </mesh>

      {/* ── SHIELD (left arm, round buckler) ── */}
      <mesh castShadow position={[-0.62, 0.88, 0.22]} rotation={[Math.PI / 2, -0.4, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.05, 16]} />
        <meshStandardMaterial color={armor} metalness={0.65} roughness={0.32} />
      </mesh>
      {/* Shield boss (centre stud) */}
      <mesh castShadow position={[-0.76, 0.88, 0.38]} rotation={[0, -0.4, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color={bronze} metalness={0.82} roughness={0.18} />
      </mesh>
      {/* Shield rim */}
      <mesh position={[-0.62, 0.88, 0.22]} rotation={[0, -0.4, 0]}>
        <torusGeometry args={[0.28, 0.03, 8, 18]} />
        <meshStandardMaterial color={bronze} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── SCIMITAR (right arm) ── */}
      {/* Handle */}
      <mesh castShadow position={[0.62, 0.66, 0.14]} rotation={[0.5, 0, 0.15]}>
        <cylinderGeometry args={[0.045, 0.04, 0.38, 8]} />
        <meshStandardMaterial color={dark} roughness={0.8} />
      </mesh>
      {/* Guard */}
      <mesh castShadow position={[0.62, 0.82, 0.04]} rotation={[Math.PI / 2, 0, 0.15]}>
        <cylinderGeometry args={[0.035, 0.035, 0.38, 8]} />
        <meshStandardMaterial color={bronze} metalness={0.82} roughness={0.18} />
      </mesh>
      {/* Blade (wide curved shape — two boxes at an angle) */}
      <mesh castShadow position={[0.64, 1.0, 0.0]} rotation={[0.3, 0, -0.18]}>
        <boxGeometry args={[0.07, 0.62, 0.018]} />
        <meshStandardMaterial color="#c8c0a0" metalness={0.88} roughness={0.12} />
      </mesh>
      <mesh castShadow position={[0.54, 1.3, 0.0]} rotation={[0.65, 0, -0.45]}>
        <boxGeometry args={[0.06, 0.42, 0.016]} />
        <meshStandardMaterial color="#c8c0a0" metalness={0.88} roughness={0.12} />
      </mesh>
      {/* Blade shine edge */}
      <mesh position={[0.66, 1.0, 0.01]} rotation={[0.3, 0, -0.18]}>
        <boxGeometry args={[0.015, 0.6, 0.005]} />
        <meshStandardMaterial color="#ffffff" metalness={1} roughness={0} />
      </mesh>

      {/* ── NECK ── */}
      <mesh castShadow position={[0, 1.54, 0]}>
        <cylinderGeometry args={[0.13, 0.14, 0.18, 10]} />
        <meshStandardMaterial color={cloth} roughness={0.9} />
      </mesh>

      {/* ── HEAD ── */}
      <mesh castShadow position={[0, 1.76, 0]}>
        <sphereGeometry args={[0.33, 16, 14]} />
        <meshStandardMaterial color={cloth} roughness={0.88} />
      </mesh>

      {/* ── HELMET (metal cap) ── */}
      <mesh castShadow position={[0, 1.97, 0]}>
        <sphereGeometry args={[0.34, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
        <meshStandardMaterial color={armor} metalness={0.68} roughness={0.3} />
      </mesh>
      {/* Helmet rim band */}
      <mesh castShadow position={[0, 1.87, 0]}>
        <torusGeometry args={[0.33, 0.035, 8, 20]} />
        <meshStandardMaterial color={bronze} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Nose guard */}
      <mesh castShadow position={[0, 1.8, 0.3]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.06, 0.24, 0.05]} />
        <meshStandardMaterial color={armor} metalness={0.68} roughness={0.3} />
      </mesh>
      {/* Cheek guards */}
      <mesh castShadow position={[-0.22, 1.74, 0.22]} rotation={[0, 0.35, 0]}>
        <boxGeometry args={[0.06, 0.22, 0.1]} />
        <meshStandardMaterial color={armor} metalness={0.65} roughness={0.32} />
      </mesh>
      <mesh castShadow position={[0.22, 1.74, 0.22]} rotation={[0, -0.35, 0]}>
        <boxGeometry args={[0.06, 0.22, 0.1]} />
        <meshStandardMaterial color={armor} metalness={0.65} roughness={0.32} />
      </mesh>

      {/* ── KEFFIYEH TAIL (cloth hanging at back) ── */}
      <mesh castShadow position={[0, 1.66, -0.26]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.42, 0.44, 0.06]} />
        <meshStandardMaterial color={cloth} roughness={0.92} />
      </mesh>
      {/* Keffiyeh side drape left */}
      <mesh castShadow position={[-0.28, 1.55, -0.1]} rotation={[-0.1, 0.3, 0.12]}>
        <boxGeometry args={[0.12, 0.38, 0.05]} />
        <meshStandardMaterial color={cloth} roughness={0.92} />
      </mesh>
      {/* Keffiyeh side drape right */}
      <mesh castShadow position={[0.28, 1.55, -0.1]} rotation={[-0.1, -0.3, -0.12]}>
        <boxGeometry args={[0.12, 0.38, 0.05]} />
        <meshStandardMaterial color={cloth} roughness={0.92} />
      </mesh>

      {/* ── EYES (glowing slits) ── */}
      <mesh position={[-0.13, 1.8, 0.3]}>
        <boxGeometry args={[0.12, 0.04, 0.02]} />
        <meshStandardMaterial color={eyes} emissive={eyes} emissiveIntensity={3.5} />
      </mesh>
      <mesh position={[0.13, 1.8, 0.3]}>
        <boxGeometry args={[0.12, 0.04, 0.02]} />
        <meshStandardMaterial color={eyes} emissive={eyes} emissiveIntensity={3.5} />
      </mesh>

      {/* Subtle warm point light */}
      <pointLight color="#ff8833" intensity={0.6} distance={5} decay={2} position={[0, 1.4, 0]} />
    </group>
  );
}

// ── Briar Wolf (forest) ──────────────────────────────────────────
function BriarWolfEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      {/* Body */}
      <mesh castShadow position={[0, 0.62, 0]} scale={[1, 0.7, 1.5]}>
        <sphereGeometry args={[0.42, 14, 10]} />
        <meshStandardMaterial color={palette.body} roughness={0.9} />
      </mesh>
      {/* Neck */}
      <mesh castShadow position={[0, 0.78, 0.38]} rotation={[-0.4, 0, 0]}>
        <cylinderGeometry args={[0.19, 0.22, 0.38, 10]} />
        <meshStandardMaterial color={palette.body} roughness={0.9} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 0.9, 0.62]} scale={[0.8, 0.7, 1.0]}>
        <sphereGeometry args={[0.3, 12, 9]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      {/* Snout */}
      <mesh castShadow position={[0, 0.78, 0.88]} scale={[0.6, 0.5, 1]}>
        <sphereGeometry args={[0.2, 10, 7]} />
        <meshStandardMaterial color="#1a3a1a" roughness={0.9} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 0.96, 0.84]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.1, 0.96, 0.84]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={3} />
      </mesh>
      {/* Ears */}
      <mesh castShadow position={[-0.16, 1.16, 0.6]} rotation={[0.2, 0.2, 0.3]}>
        <coneGeometry args={[0.09, 0.22, 6]} />
        <meshStandardMaterial color="#1a3a1a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.16, 1.16, 0.6]} rotation={[0.2, -0.2, -0.3]}>
        <coneGeometry args={[0.09, 0.22, 6]} />
        <meshStandardMaterial color="#1a3a1a" roughness={0.9} />
      </mesh>
      {/* Thorn spines on back */}
      {([[-0.22, 0.92, -0.1], [0, 1.0, -0.18], [0.22, 0.92, -0.08]] as [number,number,number][]).map(([x,y,z], i) => (
        <mesh key={i} castShadow position={[x, y, z]} rotation={[0.3, 0, i === 1 ? 0 : (i === 0 ? 0.3 : -0.3)]}>
          <coneGeometry args={[0.04, 0.24, 5]} />
          <meshStandardMaterial color="#0d2e0d" roughness={0.85} />
        </mesh>
      ))}
      {/* Legs */}
      {([-0.2, 0.2] as number[]).map((x) =>
        [-0.28, 0.28].map((z, j) => (
          <mesh key={`${x}-${j}`} castShadow position={[x, 0.22, z]}>
            <cylinderGeometry args={[0.07, 0.06, 0.44, 8]} />
            <meshStandardMaterial color="#1a3a1a" roughness={0.9} />
          </mesh>
        ))
      )}
      {/* Tail */}
      <mesh castShadow position={[0, 0.78, -0.54]} rotation={[-0.7, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.09, 0.44, 8]} />
        <meshStandardMaterial color={palette.body} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Ember Scorpion (desert) ───────────────────────────────────────
function EmberScorpionEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      {/* Main body */}
      <mesh castShadow position={[0, 0.28, 0]} scale={[1.1, 0.6, 1.4]}>
        <sphereGeometry args={[0.4, 14, 10]} />
        <meshStandardMaterial color={palette.body} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Body segments */}
      {([0.3, 0.0, -0.28] as number[]).map((z, i) => (
        <mesh key={i} castShadow position={[0, 0.22, z]} scale={[0.9 - i*0.1, 0.5, 0.4]}>
          <sphereGeometry args={[0.28, 10, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? palette.body : palette.accent}
            roughness={0.5} metalness={0.35} emissive={palette.accent} emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* Head */}
      <mesh castShadow position={[0, 0.32, 0.52]} scale={[0.9, 0.7, 0.8]}>
        <sphereGeometry args={[0.28, 12, 9]} />
        <meshStandardMaterial color={palette.body} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Eyes — glowing ember */}
      <mesh position={[-0.1, 0.38, 0.72]}>
        <sphereGeometry args={[0.045, 7, 5]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff6600" emissiveIntensity={5} />
      </mesh>
      <mesh position={[0.1, 0.38, 0.72]}>
        <sphereGeometry args={[0.045, 7, 5]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff6600" emissiveIntensity={5} />
      </mesh>
      {/* Pincers */}
      {([-1, 1] as number[]).map(side => (
        <group key={side} position={[side * 0.5, 0.28, 0.54]} rotation={[0, side * -0.4, 0]}>
          <mesh castShadow position={[0, 0, 0.18]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.08, 0.38, 8]} />
            <meshStandardMaterial color={palette.body} roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh castShadow position={[side * 0.08, 0.06, 0.38]}>
            <boxGeometry args={[0.14, 0.1, 0.2]} />
            <meshStandardMaterial color={palette.accent} roughness={0.4} metalness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Legs */}
      {([-0.3, -0.1, 0.1, 0.3] as number[]).map((z, j) =>
        ([-1, 1] as number[]).map(side => (
          <mesh key={`${j}-${side}`} castShadow
            position={[side * 0.42, 0.1, z]} rotation={[0, 0, side * 0.5]}>
            <cylinderGeometry args={[0.03, 0.025, 0.42, 6]} />
            <meshStandardMaterial color={palette.body} roughness={0.55} metalness={0.25} />
          </mesh>
        ))
      )}
      {/* Tail segments curling up */}
      {([
        [0, 0.38, -0.42, -0.6, 0],
        [0, 0.62, -0.56, -1.1, 0],
        [0, 0.84, -0.48, -1.5, 0],
      ] as [number,number,number,number,number][]).map(([x,y,z,rx], i) => (
        <mesh key={i} castShadow position={[x, y, z]} rotation={[rx, 0, 0]}>
          <sphereGeometry args={[0.12 - i*0.02, 8, 6]} />
          <meshStandardMaterial color={i === 2 ? palette.accent : palette.body}
            roughness={0.5} metalness={0.3}
            emissive={i === 2 ? palette.accent : '#000'} emissiveIntensity={i === 2 ? 2 : 0} />
        </mesh>
      ))}
      <pointLight color={palette.accent} intensity={0.5} distance={4} decay={2} position={[0, 0.5, 0]} />
    </group>
  );
}

// ── Void Wraith (boss area) ───────────────────────────────────────
function VoidWraithEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      {/* Robes — taper from wide at bottom to narrow at top */}
      <mesh castShadow position={[0, 0.55, 0]} scale={[1, 1, 1]}>
        <coneGeometry args={[0.52, 1.1, 14]} />
        <meshStandardMaterial color={palette.body} roughness={0.6} transparent opacity={0.88}
          emissive={palette.accent} emissiveIntensity={0.15} />
      </mesh>
      {/* Robe hem wisps */}
      {([0, 1, 2, 3, 4, 5] as number[]).map(i => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a)*0.38, 0.08, Math.sin(a)*0.38]}>
            <sphereGeometry args={[0.1, 7, 5]} />
            <meshStandardMaterial color={palette.body} roughness={0.7} transparent opacity={0.55}
              emissive={palette.accent} emissiveIntensity={0.2} />
          </mesh>
        );
      })}
      {/* Torso / upper body */}
      <mesh castShadow position={[0, 1.18, 0]}>
        <sphereGeometry args={[0.3, 12, 9]} />
        <meshStandardMaterial color={palette.body} roughness={0.5} transparent opacity={0.9}
          emissive={palette.accent} emissiveIntensity={0.2} />
      </mesh>
      {/* Hood */}
      <mesh castShadow position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.28, 12, 9]} />
        <meshStandardMaterial color={palette.body} roughness={0.55} transparent opacity={0.92}
          emissive={palette.accent} emissiveIntensity={0.1} />
      </mesh>
      {/* Eyes — piercing violet */}
      <mesh position={[-0.1, 1.63, 0.22]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={6} transparent opacity={0.95} />
      </mesh>
      <mesh position={[0.1, 1.63, 0.22]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={6} transparent opacity={0.95} />
      </mesh>
      {/* Claw hands */}
      {([-1, 1] as number[]).map(side => (
        <group key={side} position={[side * 0.48, 1.02, 0.14]} rotation={[0.3, side * -0.3, side * 0.4]}>
          <mesh castShadow>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshStandardMaterial color={palette.body} roughness={0.6} emissive={palette.accent} emissiveIntensity={0.3} />
          </mesh>
          {([0, 1, 2] as number[]).map(f => (
            <mesh key={f} castShadow
              position={[side * 0.04, -0.06, 0.1 + f * 0.05]}
              rotation={[-0.3 - f * 0.1, 0, side * 0.15]}>
              <coneGeometry args={[0.025, 0.14, 5]} />
              <meshStandardMaterial color="#0a0014" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Inner void glow */}
      <pointLight color={palette.accent} intensity={1.2} distance={5} decay={2} position={[0, 1.2, 0]} />
    </group>
  );
}

// ── Malgrath Boss Visual ─────────────────────────────────────────
function MalgrathBoss({ hitFlash }: { hitFlash: boolean }) {
  return (
    <group>
      {/* Cloak */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <coneGeometry args={[1.1, 3.2, 16]} />
        <meshStandardMaterial color={hitFlash ? '#ffffff' : '#1a0035'}
          emissive={hitFlash ? '#ff4488' : '#330066'} emissiveIntensity={hitFlash ? 2 : 0.4}
          roughness={0.7} />
      </mesh>
      {/* Inner robe glow */}
      <mesh position={[0, 0.6, 0.4]}>
        <planeGeometry args={[1.0, 1.4]} />
        <meshStandardMaterial color="#6600cc" emissive="#6600cc" emissiveIntensity={0.8}
          transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 2.85, 0]}>
        <sphereGeometry args={[0.48, 16, 14]} />
        <meshStandardMaterial color={hitFlash ? '#ffffff' : '#0d001a'}
          emissive={hitFlash ? '#ff88aa' : '#1a0040'} emissiveIntensity={hitFlash ? 3 : 0.5} />
      </mesh>
      {/* Hood */}
      <mesh castShadow position={[0, 3.25, -0.1]} rotation={[0.25, 0, 0]}>
        <coneGeometry args={[0.55, 1.2, 14]} />
        <meshStandardMaterial color="#12002a" roughness={0.6} />
      </mesh>
      {/* Glowing purple eyes */}
      <mesh position={[-0.18, 2.95, 0.42]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#aa00ff" emissive="#cc00ff" emissiveIntensity={4} />
      </mesh>
      <mesh position={[0.18, 2.95, 0.42]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#aa00ff" emissive="#cc00ff" emissiveIntensity={4} />
      </mesh>
      {/* Staff */}
      <mesh castShadow position={[0.7, 1.6, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.06, 0.07, 3.0, 8]} />
        <meshStandardMaterial color="#2a0055" roughness={0.8} />
      </mesh>
      {/* Orb top of staff */}
      <mesh position={[0.8, 3.25, 0]}>
        <sphereGeometry args={[0.28, 14, 12]} />
        <meshStandardMaterial color="#9900ff" emissive="#aa00ff" emissiveIntensity={3}
          transparent opacity={0.9} roughness={0} />
      </mesh>
      {/* Shoulder spikes */}
      <mesh castShadow position={[-0.9, 2.2, 0]} rotation={[0, 0, -0.8]}>
        <coneGeometry args={[0.12, 0.7, 6]} />
        <meshStandardMaterial color="#3a006a" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.9, 2.2, 0]} rotation={[0, 0, 0.8]}>
        <coneGeometry args={[0.12, 0.7, 6]} />
        <meshStandardMaterial color="#3a006a" roughness={0.7} />
      </mesh>
      {/* Dark aura light */}
      <pointLight color="#6600cc" intensity={hitFlash ? 8 : 3} distance={10} decay={2} />
      <pointLight position={[0.8, 3.25, 0]} color="#aa00ff" intensity={5} distance={8} decay={2} />
    </group>
  );
}

// Shadow bolt projectile
function ShadowBolt({ pos }: { pos: THREE.Vector3 }) {
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshStandardMaterial color="#aa00ff" emissive="#aa00ff" emissiveIntensity={3}
          transparent opacity={0.85} />
      </mesh>
      <pointLight color="#aa00ff" intensity={2} distance={4} decay={2} />
    </group>
  );
}

// ── New enemy mesh: Goblin (small, fast, charge) ──────────────────
function GoblinEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group scale={[0.72, 0.72, 0.72]}>
      {/* Body */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.28, 0.5, 8, 12]} />
        <meshStandardMaterial color={palette.body} roughness={0.75} />
      </mesh>
      {/* Head - large pointed */}
      <mesh castShadow position={[0, 1.24, 0]}>
        <sphereGeometry args={[0.36, 14, 12]} />
        <meshStandardMaterial color={palette.body} roughness={0.7} />
      </mesh>
      {/* Pointy ears */}
      <mesh castShadow position={[-0.32, 1.48, 0]} rotation={[0, 0, 0.7]}>
        <coneGeometry args={[0.1, 0.42, 6]} />
        <meshStandardMaterial color={palette.accent} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.32, 1.48, 0]} rotation={[0, 0, -0.7]}>
        <coneGeometry args={[0.1, 0.42, 6]} />
        <meshStandardMaterial color={palette.accent} roughness={0.7} />
      </mesh>
      {/* Eyes - angry red */}
      <mesh position={[-0.14, 1.28, 0.3]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#ff2200" emissive="#cc1100" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.14, 1.28, 0.3]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#ff2200" emissive="#cc1100" emissiveIntensity={2} />
      </mesh>
      {/* Club arm */}
      <mesh castShadow position={[0.38, 0.75, 0.1]} rotation={[0.2, 0, 0.5]}>
        <cylinderGeometry args={[0.06, 0.1, 0.55, 7]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.52, 1.0, 0.15]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshStandardMaterial color="#3a2a0a" roughness={0.85} />
      </mesh>
      {/* Stubby legs */}
      <mesh castShadow position={[-0.14, 0.22, 0]}>
        <cylinderGeometry args={[0.09, 0.07, 0.34, 7]} />
        <meshStandardMaterial color={palette.body} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.14, 0.22, 0]}>
        <cylinderGeometry args={[0.09, 0.07, 0.34, 7]} />
        <meshStandardMaterial color={palette.body} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ── New enemy mesh: Thornspitter (plant, ranged) ──────────────────
function ThornspitterEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      {/* Root base */}
      <mesh castShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.38, 0.55, 0.35, 10]} />
        <meshStandardMaterial color="#3a2a10" roughness={1} />
      </mesh>
      {/* Vine stem */}
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 1.0, 10]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      {/* Flower-head / mouth */}
      <mesh castShadow position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.42, 14, 12]} />
        <meshStandardMaterial color={palette.accent} roughness={0.6} />
      </mesh>
      {/* Spiky petals */}
      {[0,1,2,3,4,5].map(i => {
        const a = (i/6)*Math.PI*2;
        return (
          <mesh key={i} castShadow
            position={[Math.cos(a)*0.46, 1.45, Math.sin(a)*0.46]}
            rotation={[0, -a, 0.6]}>
            <coneGeometry args={[0.1, 0.5, 6]} />
            <meshStandardMaterial color="#2d5a10" roughness={0.75} />
          </mesh>
        );
      })}
      {/* Glowing centre (loading shot) */}
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent}
          emissiveIntensity={1.8} roughness={0} transparent opacity={0.9} />
      </mesh>
      {/* Leaf arms */}
      <mesh castShadow position={[-0.52, 0.95, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.06, 0.55, 0.28]} />
        <meshStandardMaterial color={palette.body} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.52, 0.95, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.06, 0.55, 0.28]} />
        <meshStandardMaterial color={palette.body} roughness={0.8} />
      </mesh>
      {/* Eyes on head */}
      <mesh position={[-0.18, 1.52, 0.34]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial color="#ffe030" emissive="#ffcc00" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.18, 1.52, 0.34]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial color="#ffe030" emissive="#ffcc00" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ── Enemy projectile (fired by ranged enemies) ────────────────────
interface EnemyProj {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  life: number;
  damage: number;
  color: string;
  active: boolean;
}

function EnemyProjMesh({ color }: { color: string }) {
  return (
    <mesh>
      <sphereGeometry args={[0.18, 8, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5}
        transparent opacity={0.9} />
    </mesh>
  );
}

// ── EnemyData ────────────────────────────────────────────────────
interface EnemyData {
  id: number;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  hp: number;
  maxHp: number;
  speed: number;
  changeDirTimer: number;
  isHit: boolean;
  hitTimer: number;
  invulnTimer: number;
  stunTimer: number;
  slowTimer: number;
  wobble: number;
  chaseRange: number;
  baseColor: THREE.Color;
  dead: boolean;
  deadAnimTimer: number;     // death fade/shrink animation countdown (0.7s)
  isElite: boolean;
  // New behavior fields
  behavior: EnemyBehavior;
  chargeTimer: number;       // cooldown between charges (when > 0, cooling down)
  isCharging: boolean;
  chargeSpeed: number;       // speed multiplier during charge
  chargeWindup: number;      // time spent charging (auto-ends after 1.8s)
  rangedTimer: number;       // time until next ranged shot
  projColor: string;         // projectile color for this enemy type
  // Status effects
  burnTimer: number;         // fire DoT remaining duration
  burnTickTimer: number;     // next fire tick countdown
  poisonTimer: number;       // poison DoT remaining duration
  poisonTickTimer: number;   // next poison tick countdown
  kbVx: number;              // knockback velocity X
  kbVz: number;              // knockback velocity Z
}

// Boss shadow bolt data
interface BoltData {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  life: number;
  active: boolean;
}

function seeded(n: number, s: number) {
  const x = Math.sin(n * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ── Regular Enemies ───────────────────────────────────────────────
const MAX_ENEMY_PROJS = 12;
export function Enemies() {
  const groupRef    = useRef<THREE.Group>(null!);
  const projGroupRef = useRef<THREE.Group>(null!);
  const damagePlayer = useGameStore(state => state.damagePlayer);
  const currentArea  = useGameStore(state => state.currentArea);

  // Pre-allocated enemy projectile pool
  const projs = useRef<EnemyProj[]>(
    Array.from({ length: MAX_ENEMY_PROJS }, () => ({
      pos: new THREE.Vector3(), dir: new THREE.Vector3(1,0,0),
      speed: 5, life: 0, damage: 0.5, color: '#ff8800', active: false,
    }))
  );

  const { enemies, meshDefs } = useMemo(() => {
    const configs = AREA_CONFIG[currentArea] ?? [];
    const enemies: EnemyData[] = [];
    const meshDefs: { meshType: EnemyMeshType; palette: { body: string; accent: string }; isElite: boolean }[] = [];
    let idCounter = 0;
    configs.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const n = idCounter++;
        const angle = seeded(n, 1) * Math.PI * 2;
        const r = 8 + seeded(n, 2) * 16;
        const projColorMap: Record<EnemyMeshType, string> = {
          slime: '#ff6666', bat: '#cc44ff', knight: '#ff8800',
          briarwolf: '#66ff44', scorpion: '#ffcc00', wraith: '#aa00ff',
          goblin: '#88ff44', thornspitter: '#88dd00',
        };
        const elite = seeded(n, 10) < 0.10;
        const hp = elite ? cfg.maxHp * 2 : cfg.maxHp;
        enemies.push({
          id: n,
          pos: new THREE.Vector3(Math.cos(angle)*r, 0, Math.sin(angle)*r),
          dir: new THREE.Vector3(seeded(n,3)-0.5, 0, seeded(n,4)-0.5).normalize(),
          hp, maxHp: hp,
          speed: (cfg.speed[0] + seeded(n,5)*(cfg.speed[1]-cfg.speed[0])) * (elite ? 1.25 : 1),
          changeDirTimer: seeded(n,6)*2,
          isHit: false, hitTimer: 0, invulnTimer: 0, stunTimer: 0, slowTimer: 0,
          wobble: seeded(n,7)*Math.PI*2,
          chaseRange: cfg.chaseRange * (elite ? 1.4 : 1),
          baseColor: new THREE.Color(cfg.body),
          dead: false,
          deadAnimTimer: 0,
          isElite: elite,
          behavior: cfg.behavior ?? 'chase',
          chargeTimer: seeded(n,8)*2,
          isCharging: false,
          chargeSpeed: 6.5,
          chargeWindup: 0,
          rangedTimer: 2 + seeded(n,9)*3,
          projColor: elite ? '#ffcc00' : projColorMap[cfg.meshType],
          burnTimer: 0, burnTickTimer: 0,
          poisonTimer: 0, poisonTickTimer: 0,
          kbVx: 0, kbVz: 0,
        });
        meshDefs.push({ meshType: cfg.meshType, palette: { body: cfg.body, accent: cfg.accent }, isElite: elite });
      }
    });
    return { enemies, meshDefs };
  }, [currentArea]);

  const enemiesRef = useRef<EnemyData[]>(enemies);
  enemiesRef.current = enemies;

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing' || !groupRef.current) return;
    const { playerPosition, swordActive, swordPosition, spinActive, spinPosition } = store;
    const swordDmg = SWORD_DEFS[store.activeSword].damage;
    const spinRadius = store.activeSword === 'storm' ? 4.0 : 2.8;
    const t = state.clock.elapsedTime;
    const children = groupRef.current.children;

    // Tick combo timer
    store.tickCombo(delta);

    // Update enemy projectiles
    const projChildren = projGroupRef.current?.children ?? [];
    projs.current.forEach((proj, pi) => {
      const pm = projChildren[pi] as THREE.Mesh | undefined;
      if (!proj.active) { if (pm) pm.visible = false; return; }
      proj.life -= delta;
      if (proj.life <= 0) { proj.active = false; if (pm) pm.visible = false; return; }
      proj.pos.addScaledVector(proj.dir, proj.speed * delta);
      if (pm) { pm.visible = true; pm.position.copy(proj.pos); }
      // Hit player
      const pdist = proj.pos.distanceTo(playerPosition);
      if (pdist < 0.9) {
        store.damagePlayer(proj.damage);
        proj.active = false;
        if (pm) pm.visible = false;
      }
    });

    enemiesRef.current.forEach((enemy, index) => {
      const child = children[index] as THREE.Group | undefined;
      if (!child) return;
      // Death animation — shrink + fade over 0.7s before hiding
      if (enemy.dead) {
        if (enemy.deadAnimTimer > 0) {
          enemy.deadAnimTimer -= delta;
          const p = Math.max(0, enemy.deadAnimTimer / 0.7);
          child.visible = true;
          child.scale.setScalar(p + Math.abs(Math.sin(t * 14)) * p * 0.08);
          const dm = child.children[0] as THREE.Mesh | undefined;
          if (dm?.material) {
            const mat = dm.material as THREE.MeshStandardMaterial;
            mat.transparent = true; mat.opacity = p;
            mat.emissive.setHex(0xff8800); mat.emissiveIntensity = 2.5;
          }
        } else {
          child.visible = false;
        }
        return;
      }

      // ── Knockback momentum ───────────────────────────────────────
      if (enemy.kbVx !== 0 || enemy.kbVz !== 0) {
        enemy.pos.x += enemy.kbVx * delta;
        enemy.pos.z += enemy.kbVz * delta;
        const decay = Math.exp(-7 * delta);
        enemy.kbVx *= decay;
        enemy.kbVz *= decay;
        if (Math.abs(enemy.kbVx) < 0.08) enemy.kbVx = 0;
        if (Math.abs(enemy.kbVz) < 0.08) enemy.kbVz = 0;
      }

      // ── Ground slam AoE ──────────────────────────────────────────
      if (store.groundSlamActive) {
        const sx = enemy.pos.x - store.groundSlamPos.x;
        const sz = enemy.pos.z - store.groundSlamPos.z;
        if (Math.sqrt(sx * sx + sz * sz) < 2.8) {
          const slamDmg = 2.5 * (SWORD_DEFS[store.activeSword]?.damage ?? 1.0);
          enemy.hp -= slamDmg;
          const dlen = Math.sqrt(sx * sx + sz * sz) + 0.001;
          enemy.kbVx = (sx / dlen) * 10;
          enemy.kbVz = (sz / dlen) * 10;
          enemy.stunTimer = Math.max(enemy.stunTimer, 1.2);
          if (enemy.hp <= 0 && !enemy.dead) {
            enemy.dead = true; enemy.deadAnimTimer = 0.7;
            useGameStore.getState().addKill(Math.ceil(enemy.maxHp * 50));
          }
        }
      }

      // ── Shield bash AoE ──────────────────────────────────────────
      if (store.shieldBashActive) {
        const bx = enemy.pos.x - store.shieldBashPos.x;
        const bz = enemy.pos.z - store.shieldBashPos.z;
        const dist = Math.sqrt(bx * bx + bz * bz);
        if (dist < 2.2) {
          // Check enemy is roughly in front of the bash direction
          const dot = (bx / (dist + 0.001)) * store.shieldBashDir.x
                    + (bz / (dist + 0.001)) * store.shieldBashDir.z;
          if (dot > -0.4) { // 130° cone in front
            const bashDmg = 0.5 * (SWORD_DEFS[store.activeSword]?.damage ?? 1.0);
            enemy.hp -= bashDmg;
            enemy.kbVx = store.shieldBashDir.x * 12;
            enemy.kbVz = store.shieldBashDir.z * 12;
            enemy.stunTimer = Math.max(enemy.stunTimer, 0.8);
            if (enemy.hp <= 0 && !enemy.dead) {
              enemy.dead = true; enemy.deadAnimTimer = 0.7;
              useGameStore.getState().addKill(Math.ceil(enemy.maxHp * 50));
            }
          }
        }
      }

      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= delta;
        child.visible = true;
        child.position.set(enemy.pos.x, 0, enemy.pos.z);
        const bodyMesh = child.children[0] as THREE.Mesh | undefined;
        if (bodyMesh?.material) {
          (bodyMesh.material as THREE.MeshStandardMaterial).color.setHex(0x4499ff);
          (bodyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x224488);
          (bodyMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
        }
        return;
      }

      const playerInvisible = Date.now() < store.shadowEndTime;
      const dist = enemy.pos.distanceTo(playerPosition);

      // ── CHARGE behavior ──────────────────────────────────────────
      if (enemy.behavior === 'charge') {
        if (enemy.chargeTimer > 0) enemy.chargeTimer -= delta;
        if (enemy.isCharging) {
          enemy.chargeWindup += delta;
          if (enemy.chargeWindup >= 1.8 || dist > 18) {
            enemy.isCharging = false;
            enemy.chargeTimer = 3.0 + Math.random();
            enemy.chargeWindup = 0;
          } else {
            // Sprint toward player
            if (!playerInvisible) enemy.dir.copy(playerPosition).sub(enemy.pos).setY(0).normalize();
            const moveSpeed = enemy.slowTimer > 0 ? enemy.chargeSpeed * 0.28 : enemy.chargeSpeed;
            enemy.pos.addScaledVector(enemy.dir, moveSpeed * delta);
          }
        } else {
          // Normal wander, then trigger charge
          enemy.changeDirTimer -= delta;
          if (enemy.changeDirTimer <= 0) {
            enemy.changeDirTimer = 1.0 + Math.random() * 1.5;
            if (!playerInvisible && dist < enemy.chaseRange && enemy.chargeTimer <= 0 && Math.random() > 0.35) {
              // Start charge!
              enemy.isCharging = true;
              enemy.chargeWindup = 0;
              enemy.dir.copy(playerPosition).sub(enemy.pos).setY(0).normalize();
            } else if (!playerInvisible && dist < enemy.chaseRange * 0.5) {
              enemy.dir.copy(playerPosition).sub(enemy.pos).setY(0).normalize();
            } else {
              enemy.dir.set(Math.random()-0.5, 0, Math.random()-0.5).normalize();
            }
          }
          if (enemy.slowTimer > 0) enemy.slowTimer -= delta;
          const moveSpeed = enemy.slowTimer > 0 ? enemy.speed * 0.28 : enemy.speed;
          enemy.pos.addScaledVector(enemy.dir, moveSpeed * delta);
        }
      }
      // ── RANGED behavior ──────────────────────────────────────────
      else if (enemy.behavior === 'ranged') {
        const preferredDist = 8;
        enemy.changeDirTimer -= delta;
        if (enemy.changeDirTimer <= 0) {
          enemy.changeDirTimer = 0.8 + Math.random() * 1.2;
          if (!playerInvisible && dist < enemy.chaseRange) {
            if (dist < preferredDist - 1.5) {
              // Too close — back away
              enemy.dir.copy(enemy.pos).sub(playerPosition).setY(0).normalize();
            } else if (dist > preferredDist + 1.5) {
              // Too far — close in
              enemy.dir.copy(playerPosition).sub(enemy.pos).setY(0).normalize();
            } else {
              // At good range — strafe
              const perpX = -enemy.dir.z;
              const perpZ = enemy.dir.x;
              enemy.dir.set(perpX + (Math.random()-0.5)*0.4, 0, perpZ + (Math.random()-0.5)*0.4).normalize();
            }
          } else {
            enemy.dir.set(Math.random()-0.5, 0, Math.random()-0.5).normalize();
          }
        }
        if (enemy.slowTimer > 0) enemy.slowTimer -= delta;
        const moveSpeed = enemy.slowTimer > 0 ? enemy.speed * 0.28 : enemy.speed;
        enemy.pos.addScaledVector(enemy.dir, moveSpeed * delta);
        // Fire projectile when in range and ready
        if (!playerInvisible && enemy.rangedTimer > 0) enemy.rangedTimer -= delta;
        if (!playerInvisible && enemy.rangedTimer <= 0 && dist < enemy.chaseRange && dist > 2.5) {
          const slot = projs.current.find(p => !p.active);
          if (slot) {
            slot.active = true;
            slot.pos.copy(enemy.pos).setY(0.8);
            slot.dir.copy(playerPosition).sub(enemy.pos).setY(0).normalize();
            slot.speed = 5.5 + Math.random() * 1.5;
            slot.life = 4.5;
            slot.damage = 0.35;
            slot.color = enemy.projColor;
          }
          enemy.rangedTimer = 2.2 + Math.random() * 1.5;
        }
      }
      // ── CHASE behavior (default) ─────────────────────────────────
      else {
        enemy.changeDirTimer -= delta;
        if (enemy.changeDirTimer <= 0) {
          enemy.changeDirTimer = 1.2 + Math.random() * 2;
          if (!playerInvisible && Math.random() > 0.38 && dist < enemy.chaseRange) {
            enemy.dir.copy(playerPosition).sub(enemy.pos).setY(0).normalize();
          } else {
            enemy.dir.set(Math.random()-0.5, 0, Math.random()-0.5).normalize();
          }
        }
        if (enemy.slowTimer > 0) enemy.slowTimer -= delta;
        const moveSpeed = enemy.slowTimer > 0 ? enemy.speed * 0.28 : enemy.speed;
        enemy.pos.addScaledVector(enemy.dir, moveSpeed * delta);
      }
      enemy.pos.x = THREE.MathUtils.clamp(enemy.pos.x, -27, 27);
      enemy.pos.z = THREE.MathUtils.clamp(enemy.pos.z, -27, 27);
      if (enemy.hitTimer > 0) { enemy.hitTimer -= delta; if (enemy.hitTimer <= 0) enemy.isHit = false; }
      if (enemy.invulnTimer > 0) enemy.invulnTimer -= delta;

      // ── Status effect ticks ──────────────────────────────────────
      if (enemy.burnTimer > 0) {
        enemy.burnTimer -= delta;
        enemy.burnTickTimer -= delta;
        if (enemy.burnTickTimer <= 0) {
          enemy.burnTickTimer = 0.45;
          enemy.hp -= 0.45;
          if (enemy.hp <= 0) {
            enemy.dead = true;
            enemy.deadAnimTimer = 0.7;
            sfxDeath();
            useGameStore.getState().addKill(Math.ceil(enemy.maxHp * 50));
            if (enemy.isElite) { useGameStore.getState().addEliteKill(); useGameStore.getState().healPlayer(0.5); }
          }
        }
      }
      if (enemy.poisonTimer > 0) {
        enemy.poisonTimer -= delta;
        enemy.poisonTickTimer -= delta;
        if (enemy.poisonTickTimer <= 0) {
          enemy.poisonTickTimer = 0.7;
          enemy.hp -= 0.3;
          if (enemy.hp <= 0) {
            enemy.dead = true;
            enemy.deadAnimTimer = 0.7;
            sfxDeath();
            useGameStore.getState().addKill(Math.ceil(enemy.maxHp * 50));
            if (enemy.isElite) { useGameStore.getState().addEliteKill(); useGameStore.getState().healPlayer(0.5); }
          }
        }
      }

      const hoverY = currentArea === 'forest'
        ? 0.35 + Math.abs(Math.sin(t*3+enemy.wobble))*0.35
        : currentArea === 'boss'
          ? 0.6 + Math.sin(t*2+enemy.wobble)*0.22
          : 0;
      const squishY = 1 + Math.sin(t*5+enemy.wobble)*0.06;
      child.position.set(enemy.pos.x, hoverY, enemy.pos.z);
      child.scale.set(1, squishY, 1);
      child.rotation.y = Math.atan2(enemy.dir.x, enemy.dir.z);
      child.visible = true;

      const bodyMesh = child.children[0] as THREE.Mesh | undefined;
      if (bodyMesh?.material) {
        const mat = bodyMesh.material as THREE.MeshStandardMaterial;
        if (enemy.isHit) {
          mat.color.setHex(0xffffff); mat.emissive.setHex(0xff6666); mat.emissiveIntensity = 1.2;
          mat.transparent = false; mat.opacity = 1;
        } else if (enemy.burnTimer > 0) {
          mat.color.copy(enemy.baseColor);
          mat.emissive.setHex(0xff4400);
          mat.emissiveIntensity = 0.9 + Math.sin(t * 9) * 0.35;
          mat.transparent = true; mat.opacity = 0.88;
        } else if (enemy.poisonTimer > 0) {
          mat.color.copy(enemy.baseColor);
          mat.emissive.setHex(0x00cc33);
          mat.emissiveIntensity = 0.8 + Math.sin(t * 7) * 0.25;
          mat.transparent = true; mat.opacity = 0.9;
        } else if (enemy.slowTimer > 0) {
          mat.color.copy(enemy.baseColor);
          mat.emissive.setHex(0x3399ff);
          mat.emissiveIntensity = 0.7;
          mat.transparent = false; mat.opacity = 1;
        } else {
          mat.color.copy(enemy.baseColor); mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0; mat.transparent = false; mat.opacity = 1;
        }
      }

      // Sword hit
      if (swordActive && enemy.invulnTimer <= 0) {
        if (enemy.pos.clone().setY(0).distanceTo(swordPosition.clone().setY(0)) < 1.7) {
          applyHit(enemy, swordDmg, swordPosition);
          if (!enemy.dead) {
            if (store.activeSword === 'flame' && enemy.burnTimer <= 0) {
              enemy.burnTimer = 3.0; enemy.burnTickTimer = 0.45; sfxStatusEffect();
            } else if (store.activeSword === 'viper' && enemy.poisonTimer <= 0) {
              enemy.poisonTimer = 4.0; enemy.poisonTickTimer = 0.7; sfxStatusEffect();
            }
          }
        }
      }
      // Spin attack — radius depends on active sword (storm = wider)
      if (spinActive && enemy.invulnTimer <= 0) {
        if (enemy.pos.clone().setY(0).distanceTo(spinPosition.clone().setY(0)) < spinRadius) {
          applyHit(enemy, swordDmg * 2, spinPosition);
          if (!enemy.dead) {
            if (store.activeSword === 'flame' && enemy.burnTimer <= 0) {
              enemy.burnTimer = 3.0; enemy.burnTickTimer = 0.45; sfxStatusEffect();
            } else if (store.activeSword === 'viper' && enemy.poisonTimer <= 0) {
              enemy.poisonTimer = 4.0; enemy.poisonTickTimer = 0.7; sfxStatusEffect();
            }
          }
        }
      }
      // Arrow hits
      for (const zone of hitZones.arrows) {
        if (enemy.invulnTimer <= 0 &&
            enemy.pos.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.3) {
          applyHit(enemy, 1, zone.pos);
          if (enemy.dead) child.visible = false;
          break;
        }
      }
      // Wand of Sparks hits
      for (const zone of hitZones.wand) {
        if (enemy.invulnTimer <= 0 &&
            enemy.pos.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.2) {
          applyHit(enemy, zone.damage ?? 1.5, zone.pos);
          if (enemy.dead) child.visible = false;
          break;
        }
      }
      // Shuriken hits
      for (const zone of hitZones.shurikens) {
        if (enemy.invulnTimer <= 0 &&
            enemy.pos.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.15) {
          applyHit(enemy, zone.damage ?? 0.6, zone.pos);
          if (enemy.dead) child.visible = false;
          break;
        }
      }
      // Boomerang stun (Shadowrang)
      if (hitZones.boomerang && enemy.invulnTimer <= 0) {
        if (enemy.pos.clone().setY(0).distanceTo(hitZones.boomerang.pos.clone().setY(0)) < hitZones.boomerang.radius+0.2) {
          enemy.stunTimer = 2.2;
          enemy.invulnTimer = 0.4;
        }
      }
      // Moonbow crescent arrows
      for (const zone of hitZones.moonbow) {
        if (enemy.invulnTimer <= 0 &&
            enemy.pos.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius + 0.25) {
          applyHit(enemy, zone.damage ?? 1.2, zone.pos);
          if (enemy.dead) child.visible = false;
          break;
        }
      }
      // Frost Scepter — slows enemy
      for (const zone of hitZones.frost) {
        if (enemy.invulnTimer <= 0 &&
            enemy.pos.distanceTo(zone.pos) < zone.radius + 0.2) {
          applyHit(enemy, zone.damage ?? 1.0, zone.pos);
          enemy.slowTimer = Math.max(enemy.slowTimer, 2.5);
          if (enemy.dead) child.visible = false;
          break;
        }
      }
      // Chain Anchor — stuns on hit
      if (hitZones.chain && enemy.invulnTimer <= 0) {
        if (enemy.pos.clone().setY(0).distanceTo(hitZones.chain.pos.clone().setY(0)) < hitZones.chain.radius + 0.2) {
          applyHit(enemy, hitZones.chain.damage ?? 0.5, hitZones.chain.pos);
          enemy.stunTimer = Math.max(enemy.stunTimer, 2.0);
          enemy.invulnTimer = 0.5;
          if (enemy.dead) child.visible = false;
        }
      }
      // Aura Ring orbiting crystals
      for (const zone of hitZones.aura) {
        if (enemy.invulnTimer <= 0 &&
            enemy.pos.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius + 0.15) {
          applyHit(enemy, zone.damage ?? 0.25, zone.pos);
          if (enemy.dead) child.visible = false;
          break;
        }
      }
      // Bomb explosion / Solara's Flare / Cragus Strike (all use explosions channel)
      for (const zone of hitZones.explosions) {
        if (enemy.pos.distanceTo(zone.pos) < zone.radius) {
          if (!enemy.dead) {
            enemy.hp = 0; enemy.dead = true; enemy.deadAnimTimer = 0.7;
            sfxDeath();
            useGameStore.getState().addKill(Math.ceil(enemy.maxHp * 50));
            if (enemy.isElite) { useGameStore.getState().addEliteKill(); useGameStore.getState().healPlayer(0.5); }
          }
          break;
        }
      }
      // Player melee
      const dist2d = new THREE.Vector2(enemy.pos.x-playerPosition.x, enemy.pos.z-playerPosition.z).length();
      if (dist2d < 1.25 && !enemy.isHit && !enemy.dead && enemy.stunTimer <= 0) {
        damagePlayer(0.35);
        enemy.dir.multiplyScalar(-1);
        enemy.pos.addScaledVector(enemy.dir, 0.5);
      }
    });
    // Clear one-shot AoE flags after all enemies have been processed
    if (store.groundSlamActive) store.clearGroundSlam();
    if (store.shieldBashActive) store.clearShieldBash();
  });

  return (
    <>
      <group ref={groupRef}>
        {meshDefs.map((def, i) => (
          <group key={`e-${i}`}>
            {def.meshType === 'slime'        && <SlimeEnemy         palette={def.palette} />}
            {def.meshType === 'bat'          && <BatEnemy           palette={def.palette} />}
            {def.meshType === 'knight'       && <KnightEnemy        palette={def.palette} />}
            {def.meshType === 'briarwolf'    && <BriarWolfEnemy     palette={def.palette} />}
            {def.meshType === 'scorpion'     && <EmberScorpionEnemy palette={def.palette} />}
            {def.meshType === 'wraith'       && <VoidWraithEnemy    palette={def.palette} />}
            {def.meshType === 'goblin'       && <GoblinEnemy        palette={def.palette} />}
            {def.meshType === 'thornspitter' && <ThornspitterEnemy  palette={def.palette} />}
            {def.isElite && (
              <>
                <mesh scale={[1.6, 1.6, 1.6]}>
                  <sphereGeometry args={[0.9, 8, 6]} />
                  <meshStandardMaterial color="#ffcc00" emissive="#ffdd00" emissiveIntensity={2.5}
                    transparent opacity={0.18} wireframe />
                </mesh>
                <pointLight color="#ffcc00" intensity={2.5} distance={4} decay={2} />
              </>
            )}
          </group>
        ))}
      </group>
      {/* Enemy projectiles pool */}
      <group ref={projGroupRef}>
        {projs.current.map((proj, i) => (
          <mesh key={`ep-${i}`} visible={false}>
            <sphereGeometry args={[0.18, 7, 5]} />
            <meshStandardMaterial color={proj.color} emissive={proj.color}
              emissiveIntensity={2.5} transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
    </>
  );
}

// ── Boss Component ────────────────────────────────────────────────
export function BossEnemy() {
  const bossRef     = useRef<THREE.Group>(null!);
  const boltsRef    = useRef<BoltData[]>([]);
  const boltGroupRef = useRef<THREE.Group>(null!);
  const bossPos     = useRef(new THREE.Vector3(0, 0, -10));
  const bossDir     = useRef(new THREE.Vector3(1, 0, 0));
  const bossHP      = useRef(20);
  const bossInvuln  = useRef(0);
  const bossHitFlash = useRef(false);
  const boltTimer   = useRef(0);
  const changeDirTimer = useRef(0);
  const phase       = useRef(1); // 1: normal, 2: enraged (HP < 10)

  // Pre-create bolt meshes
  const MAX_BOLTS = 8;
  if (boltsRef.current.length === 0) {
    for (let i = 0; i < MAX_BOLTS; i++) {
      boltsRef.current.push({ pos: new THREE.Vector3(), dir: new THREE.Vector3(1,0,0), life: 0, active: false });
    }
  }

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing' || store.bossDefeated) return;
    if (!bossRef.current) return;

    const { playerPosition, swordActive, swordPosition, spinActive, spinPosition } = store;

    // Sync HP
    bossHP.current = store.bossHP;
    phase.current = bossHP.current <= 10 ? 2 : 1;
    const speed = phase.current === 2 ? 3.5 : 2.0;

    // Boss movement — chase player
    changeDirTimer.current -= delta;
    if (changeDirTimer.current <= 0) {
      changeDirTimer.current = 0.6 + Math.random() * 0.8;
      bossDir.current.copy(playerPosition).sub(bossPos.current).setY(0).normalize();
      // Enraged: teleport dash
      if (phase.current === 2 && Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        bossPos.current.set(
          playerPosition.x + Math.cos(angle) * 6,
          0,
          playerPosition.z + Math.sin(angle) * 6,
        );
      }
    }

    bossPos.current.addScaledVector(bossDir.current, speed * delta);
    bossPos.current.x = THREE.MathUtils.clamp(bossPos.current.x, -25, 25);
    bossPos.current.z = THREE.MathUtils.clamp(bossPos.current.z, -25, 25);

    bossRef.current.position.copy(bossPos.current);
    bossRef.current.rotation.y = Math.atan2(bossDir.current.x, bossDir.current.z);

    // Hit flash
    bossHitFlash.current = bossInvuln.current > 0 && Math.floor(bossInvuln.current * 10) % 2 === 0;
    if (bossInvuln.current > 0) bossInvuln.current -= delta;

    // Fire shadow bolts
    const boltRate = phase.current === 2 ? 1.2 : 2.5;
    boltTimer.current -= delta;
    if (boltTimer.current <= 0) {
      boltTimer.current = boltRate;
      const count = phase.current === 2 ? 4 : 2;
      for (let i = 0; i < count; i++) {
        const freeSlot = boltsRef.current.find(b => !b.active);
        if (!freeSlot) continue;
        const angle = Math.atan2(
          playerPosition.x - bossPos.current.x,
          playerPosition.z - bossPos.current.z,
        ) + (i - Math.floor(count/2)) * 0.35;
        freeSlot.pos.copy(bossPos.current).setY(2.0);
        freeSlot.dir.set(Math.sin(angle), 0, Math.cos(angle));
        freeSlot.life = 3.0;
        freeSlot.active = true;
      }
    }

    // Update bolts
    if (boltGroupRef.current) {
      boltsRef.current.forEach((bolt, i) => {
        const child = boltGroupRef.current.children[i];
        if (!child) return;
        if (!bolt.active) { child.visible = false; return; }
        bolt.pos.addScaledVector(bolt.dir, 8 * delta);
        bolt.life -= delta;
        if (bolt.life <= 0 || Math.abs(bolt.pos.x) > 30 || Math.abs(bolt.pos.z) > 30) {
          bolt.active = false; child.visible = false; return;
        }
        child.visible = true;
        child.position.copy(bolt.pos);
        // Bolt hits player
        if (bolt.pos.distanceTo(playerPosition) < 1.0) {
          bolt.active = false; child.visible = false;
          store.damagePlayer(0.5);
        }
      });
    }

    // Player weapon hits boss
    const bossDmg    = SWORD_DEFS[store.activeSword].damage;
    const bossSpinR  = store.activeSword === 'storm' ? 4.5 : 3.5;
    const bossDist   = bossPos.current.clone().setY(0).distanceTo(swordPosition.clone().setY(0));
    if (swordActive && bossInvuln.current <= 0 && bossDist < 2.0) {
      store.damageBoss(bossDmg);
      bossInvuln.current = 0.5;
      sfxHit();
    }
    if (spinActive && bossInvuln.current <= 0 &&
        bossPos.current.clone().setY(0).distanceTo(spinPosition.clone().setY(0)) < bossSpinR) {
      store.damageBoss(bossDmg * 2);
      bossInvuln.current = 0.5;
      sfxHit();
    }
    for (const zone of hitZones.arrows) {
      if (bossInvuln.current <= 0 &&
          bossPos.current.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.6) {
        store.damageBoss(1);
        bossInvuln.current = 0.4;
        sfxHit();
        break;
      }
    }
    for (const zone of hitZones.wand) {
      if (bossInvuln.current <= 0 &&
          bossPos.current.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.5) {
        store.damageBoss(zone.damage ?? 1.5);
        bossInvuln.current = 0.4;
        sfxHit();
        break;
      }
    }
    for (const zone of hitZones.shurikens) {
      if (bossInvuln.current <= 0 &&
          bossPos.current.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.4) {
        store.damageBoss(zone.damage ?? 0.6);
        bossInvuln.current = 0.3;
        sfxHit();
        break;
      }
    }
    for (const zone of hitZones.moonbow) {
      if (bossInvuln.current <= 0 &&
          bossPos.current.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.5) {
        store.damageBoss(zone.damage ?? 1.2);
        bossInvuln.current = 0.35;
        sfxHit();
        break;
      }
    }
    for (const zone of hitZones.frost) {
      if (bossInvuln.current <= 0 &&
          bossPos.current.distanceTo(zone.pos) < zone.radius+0.5) {
        store.damageBoss(zone.damage ?? 1.0);
        bossInvuln.current = 0.4;
        sfxHit();
        break;
      }
    }
    if (hitZones.chain && bossInvuln.current <= 0 &&
        bossPos.current.clone().setY(0).distanceTo(hitZones.chain.pos.clone().setY(0)) < hitZones.chain.radius+0.5) {
      store.damageBoss(hitZones.chain.damage ?? 0.5);
      bossInvuln.current = 0.4;
      sfxHit();
    }
    for (const zone of hitZones.aura) {
      if (bossInvuln.current <= 0 &&
          bossPos.current.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.5) {
        store.damageBoss(zone.damage ?? 0.25);
        bossInvuln.current = 0.15;
        sfxHit();
        break;
      }
    }
    for (const zone of hitZones.explosions) {
      if (bossPos.current.distanceTo(zone.pos) < zone.radius + 1.0) {
        store.damageBoss(5);
        bossInvuln.current = 0.6;
        sfxDeath();
        break;
      }
    }

    // Boss melee damage
    if (bossPos.current.distanceTo(playerPosition) < 1.8) {
      store.damagePlayer(0.35);
    }
  });

  return (
    <>
      <group ref={bossRef}>
        <MalgrathBoss hitFlash={bossHitFlash.current} />
      </group>
      <group ref={boltGroupRef}>
        {boltsRef.current.map((_, i) => (
          <group key={`bolt-${i}`} visible={false}>
            <ShadowBolt pos={new THREE.Vector3()} />
          </group>
        ))}
      </group>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// AREA GUARDIAN SYSTEM
// ══════════════════════════════════════════════════════════════════

interface GuardianCfg {
  name: string;
  title: string;
  maxHP: number;
  speed: number;
  speed2: number;
  boltCount: number;
  boltCount2: number;
  boltRate: number;
  boltRate2: number;
  boltColor: string;
  boltSpeed: number;
  bodyColor: string;
  accentColor: string;
  barColor: string;
}

export const GUARDIAN_CONFIG: Partial<Record<AreaId, GuardianCfg>> = {
  field: {
    name: 'Thornback Brute', title: 'Warchief of the Plains',
    maxHP: 15, speed: 2.5, speed2: 4.2,
    boltCount: 1, boltCount2: 3, boltRate: 2.5, boltRate2: 1.5,
    boltColor: '#88ff44', boltSpeed: 7,
    bodyColor: '#2d8020', accentColor: '#88ff44', barColor: '#66dd22',
  },
  forest: {
    name: 'Gorgomara', title: 'Rootweaver of Whisper Woods',
    maxHP: 18, speed: 1.8, speed2: 3.2,
    boltCount: 3, boltCount2: 5, boltRate: 2.0, boltRate2: 1.2,
    boltColor: '#88dd22', boltSpeed: 6,
    bodyColor: '#1a4a0a', accentColor: '#66ff22', barColor: '#44bb00',
  },
  desert: {
    name: 'Embric Sentinel', title: 'Undying Guardian of Ashrock',
    maxHP: 20, speed: 1.4, speed2: 2.8,
    boltCount: 2, boltCount2: 4, boltRate: 2.0, boltRate2: 1.0,
    boltColor: '#ff8800', boltSpeed: 7.5,
    bodyColor: '#aa4400', accentColor: '#ff8800', barColor: '#ff6600',
  },
  jungle: {
    name: 'Canopy Tyrant', title: 'Apex Predator of the Jungle',
    maxHP: 22, speed: 3.0, speed2: 5.0,
    boltCount: 1, boltCount2: 3, boltRate: 2.2, boltRate2: 1.2,
    boltColor: '#66ff22', boltSpeed: 9,
    bodyColor: '#1a5a0a', accentColor: '#88ff44', barColor: '#55cc00',
  },
  ice: {
    name: 'Frostveil Wraith', title: 'Specter of the Frozen Keep',
    maxHP: 22, speed: 2.2, speed2: 4.0,
    boltCount: 4, boltCount2: 6, boltRate: 1.8, boltRate2: 0.9,
    boltColor: '#aaddff', boltSpeed: 8,
    bodyColor: '#88ccff', accentColor: '#ffffff', barColor: '#99ddff',
  },
  volcano: {
    name: 'Magma Titan', title: 'Infernal Lord of the Caldera',
    maxHP: 26, speed: 1.2, speed2: 2.4,
    boltCount: 4, boltCount2: 6, boltRate: 1.5, boltRate2: 0.8,
    boltColor: '#ff4400', boltSpeed: 7,
    bodyColor: '#882200', accentColor: '#ff6600', barColor: '#ff5500',
  },
  sky: {
    name: 'Storm Herald Vayne', title: 'Champion of the Tempest Spire',
    maxHP: 24, speed: 3.5, speed2: 5.5,
    boltCount: 2, boltCount2: 4, boltRate: 1.8, boltRate2: 0.9,
    boltColor: '#88aaff', boltSpeed: 10,
    bodyColor: '#2244cc', accentColor: '#88aaff', barColor: '#6688ff',
  },
  crypt: {
    name: 'The Bonelord', title: 'Undead Tyrant of Ashenmoor',
    maxHP: 28, speed: 1.8, speed2: 3.5,
    boltCount: 5, boltCount2: 8, boltRate: 1.5, boltRate2: 0.7,
    boltColor: '#ffffaa', boltSpeed: 6.5,
    bodyColor: '#cccc88', accentColor: '#ffffaa', barColor: '#eeee88',
  },
  void: {
    name: 'Null Predator', title: 'Devourer of the Void Realm',
    maxHP: 30, speed: 2.8, speed2: 5.0,
    boltCount: 3, boltCount2: 6, boltRate: 1.3, boltRate2: 0.6,
    boltColor: '#cc00ff', boltSpeed: 9,
    bodyColor: '#220033', accentColor: '#cc00ff', barColor: '#aa00ee',
  },
  cave: {
    name: 'Crystal Golem Shard', title: 'Construct of the Deep Caverns',
    maxHP: 20, speed: 1.5, speed2: 3.0,
    boltCount: 4, boltCount2: 6, boltRate: 1.8, boltRate2: 0.9,
    boltColor: '#bb88ff', boltSpeed: 7,
    bodyColor: '#553388', accentColor: '#aa66ff', barColor: '#9955ff',
  },
};

// ── Guardian Visual Meshes ─────────────────────────────────────────
function GuardianVisual({ area, flash }: { area: AreaId; flash: boolean }) {
  const cfg = GUARDIAN_CONFIG[area]!;
  const c = cfg.bodyColor;
  const a = cfg.accentColor;
  const ei = flash ? 2.5 : 0.45;
  const ec = flash ? '#ffffff' : a;

  if (area === 'field') return (
    <group>
      <mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[1.8, 2.2, 1.4]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} /></mesh>
      <mesh position={[0, 2.7, 0]}><sphereGeometry args={[0.7, 10, 8]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} /></mesh>
      <mesh position={[-0.3, 3.4, 0]} rotation={[0,0,-0.4]}><coneGeometry args={[0.15, 0.9, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.8} /></mesh>
      <mesh position={[0.3, 3.4, 0]} rotation={[0,0,0.4]}><coneGeometry args={[0.15, 0.9, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.8} /></mesh>
      <mesh position={[-1.3, 1.9, 0]} rotation={[0,0,-Math.PI/3]}><coneGeometry args={[0.22, 1.1, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.7} /></mesh>
      <mesh position={[1.3, 1.9, 0]} rotation={[0,0,Math.PI/3]}><coneGeometry args={[0.22, 1.1, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.7} /></mesh>
      <mesh position={[1.3, 0.8, 0.3]} rotation={[0.3,0,0.5]}><cylinderGeometry args={[0.35, 0.52, 1.3, 8]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} /></mesh>
      <mesh position={[-0.25, 2.8, 0.6]}><sphereGeometry args={[0.11, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={3} /></mesh>
      <mesh position={[0.25, 2.8, 0.6]}><sphereGeometry args={[0.11, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={3} /></mesh>
      <pointLight color={a} intensity={flash ? 4 : 1.5} distance={5} decay={2} />
    </group>
  );

  if (area === 'forest') return (
    <group>
      <mesh position={[0, 1.4, 0]} castShadow><sphereGeometry args={[1.2, 12, 10]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} roughness={0.9} /></mesh>
      {[0,1,2,3,4,5].map(i => <mesh key={i} position={[Math.sin(i*1.05)*0.9, 1.9+(i%2)*0.5, Math.cos(i*1.05)*0.9]} rotation={[Math.sin(i)*0.6,0,Math.cos(i)*0.4]}><coneGeometry args={[0.12, 0.9, 5]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.7} /></mesh>)}
      <mesh position={[0, 2.8, 0]}><sphereGeometry args={[0.65, 10, 8]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} /></mesh>
      <mesh position={[-1.5, 1.2, 0]} rotation={[0,0,0.8]}><cylinderGeometry args={[0.25, 0.15, 2.0, 6]} /><meshStandardMaterial color={flash ? '#fff' : c} roughness={0.95} /></mesh>
      <mesh position={[1.5, 1.2, 0]} rotation={[0,0,-0.8]}><cylinderGeometry args={[0.25, 0.15, 2.0, 6]} /><meshStandardMaterial color={flash ? '#fff' : c} roughness={0.95} /></mesh>
      <mesh position={[-0.22, 2.9, 0.55]}><sphereGeometry args={[0.1, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={2.5} /></mesh>
      <mesh position={[0.22, 2.9, 0.55]}><sphereGeometry args={[0.1, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={2.5} /></mesh>
      <pointLight color={a} intensity={flash ? 4 : 1.2} distance={4.5} decay={2} />
    </group>
  );

  if (area === 'desert') return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[1.6, 2.5, 1.2]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} roughness={0.95} /></mesh>
      <mesh position={[-1.1, 2.2, 0]} rotation={[0,0,0.4]}><boxGeometry args={[0.9, 0.4, 0.9]} /><meshStandardMaterial color={flash ? '#fff' : c} roughness={0.9} /></mesh>
      <mesh position={[1.1, 2.2, 0]} rotation={[0,0,-0.4]}><boxGeometry args={[0.9, 0.4, 0.9]} /><meshStandardMaterial color={flash ? '#fff' : c} roughness={0.9} /></mesh>
      <mesh position={[0, 1.6, 0.7]}><sphereGeometry args={[0.38, 8, 8]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={2.5} /></mesh>
      <mesh position={[0, 3.1, 0]}><boxGeometry args={[1.0, 0.9, 0.9]} /><meshStandardMaterial color={flash ? '#fff' : c} roughness={0.9} /></mesh>
      <mesh position={[0, 3.8, 0]}><coneGeometry args={[0.5, 0.9, 4]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={1.0} /></mesh>
      <mesh position={[-0.25, 3.15, 0.5]}><sphereGeometry args={[0.13, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={3} /></mesh>
      <mesh position={[0.25, 3.15, 0.5]}><sphereGeometry args={[0.13, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={3} /></mesh>
      <pointLight color={a} intensity={flash ? 5 : 2} distance={5} decay={2} />
    </group>
  );

  if (area === 'jungle') return (
    <group>
      <mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[1.4, 2.0, 1.0]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} /></mesh>
      <mesh position={[-1.8, 1.8, -0.3]} rotation={[0.3,0,0.2]}><boxGeometry args={[1.6, 0.15, 1.0]} /><meshStandardMaterial color={c} emissive={a} emissiveIntensity={0.25} transparent opacity={0.85} /></mesh>
      <mesh position={[1.8, 1.8, -0.3]} rotation={[0.3,0,-0.2]}><boxGeometry args={[1.6, 0.15, 1.0]} /><meshStandardMaterial color={c} emissive={a} emissiveIntensity={0.25} transparent opacity={0.85} /></mesh>
      <mesh position={[0, 2.6, 0.2]}><boxGeometry args={[0.9, 0.7, 1.0]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} /></mesh>
      <mesh position={[0, 2.1, 0.56]} rotation={[0.3,0,0]}><boxGeometry args={[0.5, 0.2, 0.5]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={1} /></mesh>
      <mesh position={[-0.45, 0.15, 0.2]} rotation={[0.4,0,0.2]}><coneGeometry args={[0.1, 0.6, 4]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.8} /></mesh>
      <mesh position={[0.45, 0.15, 0.2]} rotation={[0.4,0,-0.2]}><coneGeometry args={[0.1, 0.6, 4]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.8} /></mesh>
      <mesh position={[-0.22, 2.7, 0.62]}><sphereGeometry args={[0.1, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={3} /></mesh>
      <mesh position={[0.22, 2.7, 0.62]}><sphereGeometry args={[0.1, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={3} /></mesh>
      <pointLight color={a} intensity={flash ? 4 : 1.5} distance={5} decay={2} />
    </group>
  );

  if (area === 'ice') return (
    <group>
      <mesh position={[0, 1.8, 0]} castShadow><cylinderGeometry args={[0.7, 1.0, 3.2, 10]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} transparent opacity={0.82} roughness={0.1} metalness={0.3} /></mesh>
      {[0,1,2,3,4].map(i => <mesh key={i} position={[Math.sin(i/5*Math.PI*2)*0.55, 3.6, Math.cos(i/5*Math.PI*2)*0.55]} rotation={[0.3, i/5*Math.PI*2, 0]}><coneGeometry args={[0.1, 0.85, 5]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={flash ? 3 : 1.8} transparent opacity={0.9} /></mesh>)}
      <mesh position={[-1.2, 1.5, 0]} rotation={[0,0,0.9]}><coneGeometry args={[0.15, 1.4, 6]} /><meshStandardMaterial color={c} emissive={a} emissiveIntensity={0.5} transparent opacity={0.85} /></mesh>
      <mesh position={[1.2, 1.5, 0]} rotation={[0,0,-0.9]}><coneGeometry args={[0.15, 1.4, 6]} /><meshStandardMaterial color={c} emissive={a} emissiveIntensity={0.5} transparent opacity={0.85} /></mesh>
      <mesh position={[-0.2, 2.7, 0.65]}><sphereGeometry args={[0.12, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={3.5} /></mesh>
      <mesh position={[0.2, 2.7, 0.65]}><sphereGeometry args={[0.12, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={3.5} /></mesh>
      <pointLight color={a} intensity={flash ? 6 : 2.5} distance={6} decay={2} />
    </group>
  );

  if (area === 'volcano') return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[2.4, 3.0, 2.0]} /><meshStandardMaterial color={flash ? '#fff' : '#441100'} emissive={flash ? '#ffffff' : '#330000'} emissiveIntensity={flash ? 3 : 0.25} roughness={0.98} /></mesh>
      <mesh position={[0, 1.5, 1.02]}><planeGeometry args={[1.4, 2.0]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={2.2} /></mesh>
      <mesh position={[0, 1.5, -1.02]} rotation={[0,Math.PI,0]}><planeGeometry args={[0.8, 1.5]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={2.2} /></mesh>
      <mesh position={[0, 3.5, 0]}><boxGeometry args={[1.6, 1.2, 1.4]} /><meshStandardMaterial color={flash ? '#fff' : '#441100'} roughness={0.98} /></mesh>
      <mesh position={[-0.35, 3.6, 0.72]}><sphereGeometry args={[0.2, 8, 8]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={4} /></mesh>
      <mesh position={[0.35, 3.6, 0.72]}><sphereGeometry args={[0.2, 8, 8]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={4} /></mesh>
      <mesh position={[-1.8, 1.0, 0.3]} rotation={[0.3,0,0.3]}><boxGeometry args={[0.9, 0.9, 0.9]} /><meshStandardMaterial color={flash ? '#fff' : '#441100'} roughness={0.98} /></mesh>
      <mesh position={[1.8, 1.0, 0.3]} rotation={[0.3,0,-0.3]}><boxGeometry args={[0.9, 0.9, 0.9]} /><meshStandardMaterial color={flash ? '#fff' : '#441100'} roughness={0.98} /></mesh>
      <pointLight color="#ff4400" intensity={flash ? 8 : 3} distance={7} decay={2} />
    </group>
  );

  if (area === 'sky') return (
    <group>
      <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[1.0, 2.4, 0.8]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[-2.1, 2.0, 0]} rotation={[0,0.2,-0.15]}><boxGeometry args={[2.1, 0.12, 1.2]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.5} transparent opacity={0.8} /></mesh>
      <mesh position={[2.1, 2.0, 0]} rotation={[0,-0.2,0.15]}><boxGeometry args={[2.1, 0.12, 1.2]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={0.5} transparent opacity={0.8} /></mesh>
      <mesh position={[0, 3.1, 0]}><boxGeometry args={[0.9, 0.9, 0.85]} /><meshStandardMaterial color={flash ? '#fff' : c} metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[0, 3.6, 0]}><coneGeometry args={[0.4, 0.7, 4]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={1.5} /></mesh>
      <mesh position={[1.2, 0.9, 0.4]} rotation={[0.5,0,-0.3]}><cylinderGeometry args={[0.07, 0.12, 2.5, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={2} /></mesh>
      <mesh position={[-0.18, 3.1, 0.44]}><sphereGeometry args={[0.1, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={4} /></mesh>
      <mesh position={[0.18, 3.1, 0.44]}><sphereGeometry args={[0.1, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={4} /></mesh>
      <pointLight color={a} intensity={flash ? 5 : 2} distance={6} decay={2} />
    </group>
  );

  if (area === 'crypt') return (
    <group>
      {[-0.5, 0, 0.5].map((z, i) => (
        <mesh key={i} position={[0, 1.2+i*0.55, z]}><boxGeometry args={[1.7, 0.13, 0.13]} /><meshStandardMaterial color={c} emissive={flash ? '#fff' : a} emissiveIntensity={flash ? 2 : 0.4} /></mesh>
      ))}
      <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.15, 0.2, 2.5, 6]} /><meshStandardMaterial color={flash ? '#fff' : c} roughness={0.7} /></mesh>
      <mesh position={[0, 3.0, 0]}><sphereGeometry args={[0.62, 8, 8]} /><meshStandardMaterial color={flash ? '#fff' : c} roughness={0.7} /></mesh>
      {[0,1,2,3,4].map(i => <mesh key={i} position={[Math.sin(i/5*Math.PI*2)*0.52, 3.5, Math.cos(i/5*Math.PI*2)*0.52]}><coneGeometry args={[0.09, 0.58, 4]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={flash ? 3 : 1.5} /></mesh>)}
      <mesh position={[-0.2, 3.05, 0.5]}><sphereGeometry args={[0.13, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={4} /></mesh>
      <mesh position={[0.2, 3.05, 0.5]}><sphereGeometry args={[0.13, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={4} /></mesh>
      <mesh position={[-1.3, 1.7, 0]} rotation={[0,0,0.6]}><cylinderGeometry args={[0.12, 0.1, 1.5, 6]} /><meshStandardMaterial color={flash ? '#fff' : c} roughness={0.7} /></mesh>
      <mesh position={[1.3, 1.7, 0]} rotation={[0,0,-0.6]}><cylinderGeometry args={[0.12, 0.1, 1.5, 6]} /><meshStandardMaterial color={flash ? '#fff' : c} roughness={0.7} /></mesh>
      <pointLight color={a} intensity={flash ? 4 : 1.8} distance={6} decay={2} />
    </group>
  );

  if (area === 'void') return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow><octahedronGeometry args={[1.4, 1]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={flash ? '#ffffff' : '#440066'} emissiveIntensity={flash ? 4 : 0.9} transparent opacity={0.9} roughness={0.2} /></mesh>
      <mesh position={[0, 2.0, 1.22]}><sphereGeometry args={[0.32, 8, 8]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={flash ? 8 : 4.5} /></mesh>
      {[0,1,2,3].map(i => <mesh key={i} position={[Math.sin(i/4*Math.PI*2)*1.9, 1.5+Math.sin(i)*0.4, Math.cos(i/4*Math.PI*2)*1.9]}><octahedronGeometry args={[0.22, 0]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={2} transparent opacity={0.85} /></mesh>)}
      <mesh position={[0, 2.9, 0]}><coneGeometry args={[0.26, 1.3, 6]} /><meshStandardMaterial color="#440066" emissive={a} emissiveIntensity={1.5} /></mesh>
      <pointLight color={a} intensity={flash ? 7 : 3} distance={7} decay={2} />
    </group>
  );

  if (area === 'cave') return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow><dodecahedronGeometry args={[1.3, 0]} /><meshStandardMaterial color={flash ? '#fff' : c} emissive={ec} emissiveIntensity={ei} transparent opacity={0.92} roughness={0.15} metalness={0.4} /></mesh>
      {[0,1,2,3].map(i => <mesh key={i} position={[Math.sin(i/4*Math.PI*2)*1.25, 2.2, Math.cos(i/4*Math.PI*2)*1.25]} rotation={[(i%2)*0.4, i/4*Math.PI*2, 0.3]}><coneGeometry args={[0.22, 1.45, 5]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={flash ? 3 : 1.5} transparent opacity={0.9} /></mesh>)}
      <mesh position={[0, 3.1, 0]}><coneGeometry args={[0.32, 1.25, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={flash ? 4 : 2} transparent opacity={0.95} /></mesh>
      <mesh position={[-0.3, 1.8, 1.06]}><sphereGeometry args={[0.16, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={5} /></mesh>
      <mesh position={[0.3, 1.8, 1.06]}><sphereGeometry args={[0.16, 6, 6]} /><meshStandardMaterial color={a} emissive={a} emissiveIntensity={5} /></mesh>
      <pointLight color={a} intensity={flash ? 6 : 2.5} distance={6} decay={2} />
    </group>
  );

  return (
    <mesh position={[0, 1.5, 0]} castShadow>
      <sphereGeometry args={[1.0, 8, 8]} />
      <meshStandardMaterial color={c} emissive={a} emissiveIntensity={1} />
    </mesh>
  );
}

// ── Guardian inner logic (runs when area has living guardian) ──────
const MAX_GUARDIAN_BOLTS = 12;

function GuardianInner({ cfg, area }: { cfg: GuardianCfg; area: AreaId }) {
  const guardianRef     = useRef<THREE.Group>(null!);
  const boltGroupRef    = useRef<THREE.Group>(null!);
  const boltsRef        = useRef<BoltData[]>([]);
  const gPos            = useRef(new THREE.Vector3(0, 0, -12));
  const gDir            = useRef(new THREE.Vector3(1, 0, 0));
  const gInvuln         = useRef(0);
  const gFlash          = useRef(false);
  const boltTimer       = useRef(1.8);
  const changeDirTimer  = useRef(0);
  const phase           = useRef(1);

  const spawnGuardian = useGameStore(s => s.spawnGuardian);

  useEffect(() => {
    spawnGuardian(area, cfg.maxHP);
    gPos.current.set(0, 0, -12);
    boltTimer.current = 1.8;
    gInvuln.current = 0;
    if (boltsRef.current.length === 0) {
      for (let i = 0; i < MAX_GUARDIAN_BOLTS; i++) {
        boltsRef.current.push({ pos: new THREE.Vector3(), dir: new THREE.Vector3(1,0,0), life: 0, active: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;
    if (!guardianRef.current || !boltGroupRef.current) return;

    const hp = store.currentGuardianHP;
    if (hp <= 0) { guardianRef.current.visible = false; return; }
    guardianRef.current.visible = true;

    phase.current = hp <= cfg.maxHP / 2 ? 2 : 1;
    const speed = phase.current === 2 ? cfg.speed2 : cfg.speed;
    const { playerPosition, swordActive, swordPosition, spinActive, spinPosition } = store;

    // Movement
    changeDirTimer.current -= delta;
    if (changeDirTimer.current <= 0) {
      changeDirTimer.current = 0.5 + Math.random() * 0.8;
      gDir.current.copy(playerPosition).sub(gPos.current).setY(0).normalize();
      if (phase.current === 2 && Math.random() < 0.25) {
        const ang = Math.random() * Math.PI * 2;
        gPos.current.set(
          playerPosition.x + Math.cos(ang) * 7,
          0,
          playerPosition.z + Math.sin(ang) * 7,
        );
      }
    }
    gPos.current.addScaledVector(gDir.current, speed * delta);
    gPos.current.x = THREE.MathUtils.clamp(gPos.current.x, -24, 24);
    gPos.current.z = THREE.MathUtils.clamp(gPos.current.z, -24, 24);
    guardianRef.current.position.copy(gPos.current);
    guardianRef.current.rotation.y = Math.atan2(gDir.current.x, gDir.current.z);

    // Invuln / flash
    if (gInvuln.current > 0) {
      gInvuln.current -= delta;
      gFlash.current = Math.floor(gInvuln.current * 10) % 2 === 0;
    } else {
      gFlash.current = false;
    }

    // Fire bolts
    const bRate  = phase.current === 2 ? cfg.boltRate2  : cfg.boltRate;
    const bCount = phase.current === 2 ? cfg.boltCount2 : cfg.boltCount;
    boltTimer.current -= delta;
    if (boltTimer.current <= 0) {
      boltTimer.current = bRate;
      const baseAng = Math.atan2(
        playerPosition.x - gPos.current.x,
        playerPosition.z - gPos.current.z,
      );
      for (let i = 0; i < bCount; i++) {
        const slot = boltsRef.current.find(b => !b.active);
        if (!slot) continue;
        const spread = bCount > 1 ? (i - (bCount-1)/2) * 0.35 : 0;
        slot.pos.copy(gPos.current).setY(2.0);
        slot.dir.set(Math.sin(baseAng+spread), 0, Math.cos(baseAng+spread));
        slot.life = 3.0;
        slot.active = true;
      }
    }

    // Update bolt meshes
    boltsRef.current.forEach((bolt, i) => {
      const child = boltGroupRef.current.children[i];
      if (!child) return;
      if (!bolt.active) { child.visible = false; return; }
      bolt.pos.addScaledVector(bolt.dir, cfg.boltSpeed * delta);
      bolt.life -= delta;
      if (bolt.life <= 0 || Math.abs(bolt.pos.x) > 30 || Math.abs(bolt.pos.z) > 30) {
        bolt.active = false; child.visible = false; return;
      }
      child.visible = true;
      child.position.copy(bolt.pos);
      if (bolt.pos.distanceTo(playerPosition) < 1.0) {
        bolt.active = false; child.visible = false;
        store.damagePlayer(0.5);
      }
    });

    // Weapon hit detection
    const dmg    = SWORD_DEFS[store.activeSword].damage;
    const swordD = gPos.current.clone().setY(0).distanceTo(swordPosition.clone().setY(0));
    if (swordActive && gInvuln.current <= 0 && swordD < 2.0) {
      store.damageGuardian(dmg); gInvuln.current = 0.5; sfxHit();
    }
    const spinR = store.activeSword === 'storm' ? 4.5 : 3.5;
    if (spinActive && gInvuln.current <= 0 &&
        gPos.current.clone().setY(0).distanceTo(spinPosition.clone().setY(0)) < spinR) {
      store.damageGuardian(dmg * 2); gInvuln.current = 0.5; sfxHit();
    }
    for (const zone of hitZones.arrows) {
      if (gInvuln.current <= 0 && gPos.current.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.5) {
        store.damageGuardian(zone.damage ?? 1.0); gInvuln.current = 0.3; sfxHit(); break;
      }
    }
    for (const zone of hitZones.explosions) {
      if (gPos.current.distanceTo(zone.pos) < zone.radius+1.0) {
        store.damageGuardian(5); gInvuln.current = 0.6; sfxDeath(); break;
      }
    }
    for (const zone of hitZones.moonbow) {
      if (gInvuln.current <= 0 && gPos.current.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.5) {
        store.damageGuardian(zone.damage ?? 1.2); gInvuln.current = 0.35; sfxHit(); break;
      }
    }
    for (const zone of hitZones.frost) {
      if (gInvuln.current <= 0 && gPos.current.distanceTo(zone.pos) < zone.radius+0.5) {
        store.damageGuardian(zone.damage ?? 1.0); gInvuln.current = 0.4; sfxHit(); break;
      }
    }
    if (hitZones.chain && gInvuln.current <= 0 &&
        gPos.current.clone().setY(0).distanceTo(hitZones.chain.pos.clone().setY(0)) < hitZones.chain.radius+0.5) {
      store.damageGuardian(hitZones.chain.damage ?? 0.5); gInvuln.current = 0.4; sfxHit();
    }
    for (const zone of hitZones.aura) {
      if (gInvuln.current <= 0 && gPos.current.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.5) {
        store.damageGuardian(zone.damage ?? 0.25); gInvuln.current = 0.15; sfxHit(); break;
      }
    }
    for (const zone of hitZones.wand) {
      if (gInvuln.current <= 0 && gPos.current.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.3) {
        store.damageGuardian(zone.damage ?? 0.5); gInvuln.current = 0.25; sfxHit(); break;
      }
    }

    // Melee damage to player
    if (gPos.current.distanceTo(playerPosition) < 1.9) {
      store.damagePlayer(0.5);
    }
  });

  return (
    <>
      <group ref={guardianRef}>
        <GuardianVisual area={area} flash={gFlash.current} />
      </group>
      <group ref={boltGroupRef}>
        {Array.from({ length: MAX_GUARDIAN_BOLTS }, (_, i) => (
          <group key={`gb-${i}`} visible={false}>
            <mesh>
              <sphereGeometry args={[0.24, 7, 6]} />
              <meshStandardMaterial color={cfg.boltColor} emissive={cfg.boltColor} emissiveIntensity={2.8} transparent opacity={0.92} />
            </mesh>
            <pointLight color={cfg.boltColor} intensity={1.5} distance={2.5} decay={2} />
          </group>
        ))}
      </group>
    </>
  );
}

// ── Public AreaGuardian component ─────────────────────────────────
export function AreaGuardian() {
  const currentArea       = useGameStore(s => s.currentArea);
  const guardianDefeated  = useGameStore(s => s.guardianDefeated);

  const cfg = GUARDIAN_CONFIG[currentArea];
  if (!cfg || currentArea === 'boss') return null;
  if (guardianDefeated.includes(currentArea)) return null;

  return <GuardianInner cfg={cfg} area={currentArea} />;
}

// ── Helpers ───────────────────────────────────────────────────────
function applyHit(enemy: EnemyData, damage: number, sourcePos: THREE.Vector3) {
  enemy.hp -= damage;
  enemy.isHit = true;
  enemy.hitTimer = 0.22;
  enemy.invulnTimer = 0.55;
  const kb = enemy.pos.clone().sub(sourcePos).setY(0).normalize();
  enemy.pos.addScaledVector(kb, 1.3);
  if (enemy.hp <= 0) {
    enemy.dead = true;
    enemy.deadAnimTimer = 0.7;
    sfxDeath();
    useGameStore.getState().addKill(Math.ceil(enemy.maxHp * 50));
    if (enemy.isElite) {
      useGameStore.getState().addEliteKill();
      useGameStore.getState().healPlayer(0.5);
    }
  } else {
    sfxHit();
  }
}
