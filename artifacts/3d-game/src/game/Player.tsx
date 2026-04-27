import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from './controls';
import { useGameStore, SWORD_DEFS, SWORD_CHESTS, SwordId } from './store';
import { sfxSword, sfxArrow, sfxBomb, sfxBoomerang } from './AudioManager';

const SPEED = 5;

// Main shard/armor chests
const MAIN_CHEST_POSITIONS: Record<string, THREE.Vector3> = {
  field:        new THREE.Vector3(0, 0, -22),
  forest:       new THREE.Vector3(0, 0, 0),
  desert:       new THREE.Vector3(0, 0, -24),
  'boss-armor': new THREE.Vector3(-8, 0, 8),
};

// All chest positions (main + sword upgrade chests)
const ALL_CHESTS: { key: string; pos: THREE.Vector3; area: string }[] = [
  { key: 'field',       pos: new THREE.Vector3(0, 0, -22),   area: 'field'  },
  { key: 'forest',      pos: new THREE.Vector3(0, 0, 0),     area: 'forest' },
  { key: 'desert',      pos: new THREE.Vector3(0, 0, -24),   area: 'desert' },
  { key: 'boss-armor',  pos: new THREE.Vector3(-8, 0, 8),    area: 'boss'   },
  ...SWORD_CHESTS.map(c => ({ key: c.key, pos: new THREE.Vector3(...c.pos), area: c.area })),
];

// ── Colour palette — Adelynn ─────────────────────────────────────
const C = {
  tunic:   '#e91e8c',
  tunicDk: '#880e4f',
  skin:    '#f5c9a0',
  hair:    '#7b2d14',
  boot:    '#6a1040',
  belt:    '#fce4ec',
  gold:    '#fdd835',
  steel:   '#eceff1',
  steelDk: '#90a4ae',
  shPink:  '#f06292',
  shGold:  '#f8bbd0',
};

// ─── Visual sub-components ───────────────────────────────────────

function HeroHead() {
  return (
    <group position={[0, 1.55, 0]}>
      <mesh position={[0, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.22, 10]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      <mesh castShadow>
        <sphereGeometry args={[0.33, 18, 14]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      <mesh position={[-0.34, 0.04, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      <mesh position={[0.34, 0.04, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      <mesh position={[-0.13, 0.06, 0.3]}>
        <sphereGeometry args={[0.065, 10, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.13, 0.06, 0.3]}>
        <sphereGeometry args={[0.065, 10, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[-0.13, 0.07, 0.295]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.13, 0.07, 0.295]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, -0.03, 0.32]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      <mesh position={[0, -0.12, 0.3]}>
        <boxGeometry args={[0.13, 0.045, 0.02]} />
        <meshStandardMaterial color="#e91e8c" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.06, -0.22]} castShadow>
        <sphereGeometry args={[0.3, 10, 8]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      <mesh position={[-0.27, -0.02, 0.15]} castShadow>
        <sphereGeometry args={[0.11, 8, 6]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      <mesh position={[0.27, -0.02, 0.15]} castShadow>
        <sphereGeometry args={[0.11, 8, 6]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.02, -0.32]} castShadow>
        <sphereGeometry args={[0.13, 9, 7]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.28, -0.34]} rotation={[0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.05, 0.38, 8]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.52, -0.28]} castShadow>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      <mesh position={[0.01, 0.02, -0.34]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.22, 0.08, 0.05]} />
        <meshStandardMaterial color="#ff4db8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 16]} />
        <meshStandardMaterial color={C.tunic} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.76, -0.04]} rotation={[0.3, 0, 0]} castShadow>
        <coneGeometry args={[0.36, 1.0, 14]} />
        <meshStandardMaterial color={C.tunic} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.32, 0.38]}>
        <sphereGeometry args={[0.055, 7, 5]} />
        <meshStandardMaterial color="#ffd6ec" metalness={0.4} roughness={0.2} />
      </mesh>
    </group>
  );
}

function HeroTorso({ armorLevel }: { armorLevel: number }) {
  const tunicColor = armorLevel >= 2 ? '#c41e1e' : armorLevel >= 1 ? '#1e50c4' : C.tunic;
  const tunicDk    = armorLevel >= 2 ? '#8b0000' : armorLevel >= 1 ? '#0a2d8b' : C.tunicDk;
  return (
    <group position={[0, 0.72, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.72, 14]} />
        <meshStandardMaterial color={tunicColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.1, 0.28]}>
        <boxGeometry args={[0.38, 0.32, 0.04]} />
        <meshStandardMaterial color={tunicDk} />
      </mesh>
      <mesh position={[0, -0.3, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.38, 0.1, 14]} />
        <meshStandardMaterial color={C.belt} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.3, 0.39]}>
        <boxGeometry args={[0.14, 0.1, 0.04]} />
        <meshStandardMaterial color={C.gold} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.52, 0]} castShadow>
        <cylinderGeometry args={[0.48, 0.55, 0.28, 14]} />
        <meshStandardMaterial color={tunicDk} roughness={0.65} />
      </mesh>
      {/* Shield on left hip */}
      <group position={[-0.3, -0.12, -0.25]} rotation={[0, -0.4, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.25, 0.08, 16]} />
          <meshStandardMaterial color={C.shPink} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.18, 0.15, 0.03, 10]} />
          <meshStandardMaterial color={C.shGold} metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.07, 0.16]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color="#ff4db8" emissive="#ff4db8" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
}

interface ArmProps {
  side: -1 | 1;
  armRef?: React.RefObject<THREE.Group>;
  children?: React.ReactNode;
}
function HeroArm({ side, armRef, children }: ArmProps) {
  const x = side * 0.44;
  return (
    <group ref={armRef} position={[x, 1.0, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.15, 10, 8]} />
        <meshStandardMaterial color={C.tunic} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.1, 0.32, 9]} />
        <meshStandardMaterial color={C.tunic} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.4, 0]} castShadow>
        <sphereGeometry args={[0.1, 9, 7]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      <mesh position={[0, -0.55, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.24, 9]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      <mesh position={[0, -0.72, 0]} castShadow>
        <sphereGeometry args={[0.1, 9, 7]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      {children}
    </group>
  );
}

interface LegProps {
  side: -1 | 1;
  legRef?: React.RefObject<THREE.Group>;
}
function HeroLeg({ side, legRef }: LegProps) {
  const x = side * 0.17;
  // Boot colours
  const bootMain = '#5a0e35';   // deep wine-plum boot shaft
  const bootCuff = '#7a1a4a';   // slightly lighter cuff band
  const bootToe  = '#3d0824';   // dark toe/sole
  const stocking = '#f0c8a8';   // bare-skin upper thigh

  return (
    <group ref={legRef} position={[x, 0.33, 0]}>
      {/* ── UPPER THIGH (skin — visible below tunic skirt) ── */}
      <mesh castShadow>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshStandardMaterial color={stocking} roughness={0.88} />
      </mesh>
      <mesh position={[0, -0.18, 0]} castShadow>
        <cylinderGeometry args={[0.115, 0.105, 0.28, 10]} />
        <meshStandardMaterial color={stocking} roughness={0.88} />
      </mesh>

      {/* ── KNEE JOINT ── */}
      <mesh position={[0, -0.35, 0]} castShadow>
        <sphereGeometry args={[0.105, 10, 8]} />
        <meshStandardMaterial color={stocking} roughness={0.88} />
      </mesh>

      {/* ── BOOT CUFF (top fold of knee-high boot) ── */}
      <mesh position={[0, -0.44, 0]} castShadow>
        <cylinderGeometry args={[0.115, 0.108, 0.11, 12]} />
        <meshStandardMaterial color={bootCuff} roughness={0.72} />
      </mesh>
      {/* Cuff rim band */}
      <mesh position={[0, -0.39, 0]} castShadow>
        <cylinderGeometry args={[0.118, 0.118, 0.03, 12]} />
        <meshStandardMaterial color={C.gold} metalness={0.55} roughness={0.3} />
      </mesh>

      {/* ── BOOT SHAFT (lower leg) ── */}
      <mesh position={[0, -0.6, 0]} castShadow>
        <cylinderGeometry args={[0.105, 0.115, 0.3, 12]} />
        <meshStandardMaterial color={bootMain} roughness={0.78} />
      </mesh>

      {/* ── ANKLE JOINT (smooth rounding into foot) ── */}
      <mesh position={[0, -0.77, 0]} castShadow>
        <sphereGeometry args={[0.108, 10, 8]} />
        <meshStandardMaterial color={bootMain} roughness={0.8} />
      </mesh>

      {/* ── FOOT / TOE CAP ── */}
      <mesh position={[0, -0.8, 0.1]} rotation={[-0.22, 0, 0]} castShadow>
        <boxGeometry args={[0.18, 0.13, 0.32]} />
        <meshStandardMaterial color={bootMain} roughness={0.78} />
      </mesh>
      {/* Rounded toe */}
      <mesh position={[0, -0.8, 0.24]} rotation={[-0.22, 0, 0]} castShadow>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color={bootToe} roughness={0.75} />
      </mesh>
      {/* Sole strip */}
      <mesh position={[0, -0.87, 0.09]} rotation={[-0.22, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 0.04, 0.34]} />
        <meshStandardMaterial color={bootToe} roughness={0.95} />
      </mesh>
      {/* Heel */}
      <mesh position={[0, -0.86, -0.1]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.16, 0.08, 0.14]} />
        <meshStandardMaterial color={bootToe} roughness={0.95} />
      </mesh>
    </group>
  );
}

// Shield raised visual (shown when blocking)
function ShieldRaised() {
  return (
    <group position={[-0.55, 0.2, 0.4]} rotation={[0.1, 0.5, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.42, 0.36, 0.09, 18]} />
        <meshStandardMaterial color="#f06292" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.24, 0.20, 0.04, 12]} />
        <meshStandardMaterial color="#f8bbd0" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.08, 0.2]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#ff4db8" emissive="#ff4db8" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function SwordMesh({ swordId }: { swordId: SwordId }) {
  const def = SWORD_DEFS[swordId];
  return (
    <group position={[0.04, -0.88, 0]}>
      {/* Pommel */}
      <mesh castShadow position={[0, -0.18, 0]}>
        <sphereGeometry args={[0.09, 12, 9]} />
        <meshStandardMaterial color={def.guard} metalness={0.65} roughness={0.2} />
      </mesh>
      {/* Grip */}
      <mesh castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.048, 0.056, 0.42, 9]} />
        <meshStandardMaterial color={def.grip} roughness={0.72} />
      </mesh>
      {/* Grip wraps */}
      {[-0.08, 0.04, 0.16].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.056, 0.011, 6, 14]} />
          <meshStandardMaterial color="#cfd8dc" metalness={0.55} roughness={0.28} />
        </mesh>
      ))}
      {/* Guard */}
      <mesh castShadow position={[0, 0.27, 0]}>
        <boxGeometry args={[0.64, 0.078, 0.096]} />
        <meshStandardMaterial color={def.guard} metalness={0.58} roughness={0.22} />
      </mesh>
      {/* Blade body */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.13, 1.1, 0.11]} />
        <meshStandardMaterial color={def.blade} metalness={0.85} roughness={0.08}
          emissive={def.emissive} emissiveIntensity={def.emissiveInt} />
      </mesh>
      {/* Blade tip */}
      <mesh castShadow position={[0, 1.6, 0]}>
        <coneGeometry args={[0.065, 0.24, 4]} />
        <meshStandardMaterial color={def.blade} metalness={0.85} roughness={0.08}
          emissive={def.emissive} emissiveIntensity={def.emissiveInt} />
      </mesh>

      {/* ── Per-sword special decorations ── */}
      {swordId === 'flame' && <>
        <mesh position={[0, 1.76, 0]}>
          <coneGeometry args={[0.15, 0.5, 8]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff6600" emissiveIntensity={4} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 2.05, 0]}>
          <coneGeometry args={[0.08, 0.35, 6]} />
          <meshStandardMaterial color="#ffcc00" emissive="#ffdd00" emissiveIntensity={5} transparent opacity={0.6} />
        </mesh>
      </>}

      {swordId === 'thunder' && <>
        {[0.45, 0.85, 1.25].map((y, i) => (
          <mesh key={i} position={[i % 2 === 0 ? 0.08 : -0.08, y, 0.07]} rotation={[0, 0, i % 2 === 0 ? 0.5 : -0.5]}>
            <boxGeometry args={[0.07, 0.18, 0.03]} />
            <meshStandardMaterial color="#ffee00" emissive="#ffcc00" emissiveIntensity={4} />
          </mesh>
        ))}
      </>}

      {swordId === 'frost' && <>
        <mesh position={[0, 0.27, 0.08]} rotation={[0, 0, Math.PI / 6]}>
          <torusGeometry args={[0.16, 0.026, 6, 6]} />
          <meshStandardMaterial color="#80d4ff" emissive="#00aaff" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[0, 1.75, 0]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color="#ffffff" emissive="#80d4ff" emissiveIntensity={3} transparent opacity={0.85} />
        </mesh>
      </>}

      {swordId === 'shadow' && <>
        <mesh position={[0, 1.1, 0.08]}>
          <boxGeometry args={[0.03, 1.0, 0.02]} />
          <meshStandardMaterial color="#220033" emissive="#6600cc" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, 1.72, 0]}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshStandardMaterial color="#440077" emissive="#9900ff" emissiveIntensity={4} transparent opacity={0.8} />
        </mesh>
      </>}

      {swordId === 'holy' && <>
        <mesh position={[0, 0.27, 0.06]}>
          <boxGeometry args={[0.6, 0.03, 0.03]} />
          <meshStandardMaterial color="#ffffcc" emissive="#ffffaa" emissiveIntensity={3} />
        </mesh>
        <mesh position={[0, 1.82, 0]}>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshStandardMaterial color="#ffffee" emissive="#ffffcc" emissiveIntensity={5} transparent opacity={0.85} />
        </mesh>
      </>}

      {swordId === 'viper' && <>
        <mesh position={[0.07, 1.66, 0]} rotation={[0, 0, -0.45]}>
          <coneGeometry args={[0.04, 0.28, 5]} />
          <meshStandardMaterial color="#00cc44" emissive="#00ff55" emissiveIntensity={3} />
        </mesh>
        <mesh position={[0, 0.9, 0.08]}>
          <sphereGeometry args={[0.045, 6, 5]} />
          <meshStandardMaterial color="#00ff55" emissive="#00ff55" emissiveIntensity={4} transparent opacity={0.7} />
        </mesh>
      </>}

      {swordId === 'storm' && <>
        <mesh position={[0, 0.28, 0]}>
          <torusGeometry args={[0.22, 0.035, 8, 14]} />
          <meshStandardMaterial color="#00d4cc" emissive="#00cccc" emissiveIntensity={2.5} transparent opacity={0.9} />
        </mesh>
        {[0.55, 1.05, 1.45].map((y, i) => (
          <mesh key={i} position={[i % 2 === 0 ? 0.06 : -0.06, y, 0.07]}>
            <sphereGeometry args={[0.04, 6, 5]} />
            <meshStandardMaterial color="#aaffff" emissive="#00cccc" emissiveIntensity={3} />
          </mesh>
        ))}
      </>}

      {swordId === 'dragon' && <>
        {[0.5, 0.8, 1.1, 1.4].map((y, i) => (
          <mesh key={i} position={[0.09, y, 0.07]}>
            <boxGeometry args={[0.05, 0.1, 0.05]} />
            <meshStandardMaterial color="#ff2200" emissive="#cc1100" emissiveIntensity={2.5} />
          </mesh>
        ))}
        <mesh position={[0, 1.78, 0]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={4} transparent opacity={0.9} />
        </mesh>
      </>}

      {swordId === 'cosmos' && <>
        {[0.5, 0.85, 1.2, 1.55].map((y, i) => (
          <mesh key={i} position={[i % 2 === 0 ? 0.07 : -0.07, y, 0.07]}>
            <sphereGeometry args={[0.055, 8, 6]} />
            <meshStandardMaterial color="#cc00ff" emissive="#aa00ff" emissiveIntensity={4} />
          </mesh>
        ))}
        <mesh position={[0, 1.8, 0]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color="#ee88ff" emissive="#cc00ff" emissiveIntensity={5} transparent opacity={0.85} />
        </mesh>
      </>}

      <pointLight position={[0, 1.1, 0]} color={def.light} intensity={1.5} distance={2.5} decay={2} />
    </group>
  );
}

// ── Main Player component ─────────────────────────────────────────
export function Player() {
  const groupRef      = useRef<THREE.Group>(null!);
  const bodyBobRef    = useRef<THREE.Group>(null!);
  const leftLegRef    = useRef<THREE.Group>(null!);
  const rightLegRef   = useRef<THREE.Group>(null!);
  const leftArmRef    = useRef<THREE.Group>(null!);
  const rightArmRef   = useRef<THREE.Group>(null!);
  const swordGroupRef = useRef<THREE.Group>(null!);

  const [, getState] = useKeyboardControls<Controls>();

  const isSwinging    = useRef(false);
  const swingTime     = useRef(0);
  const isSpinning    = useRef(false);
  const spinTime      = useRef(0);
  const chargeTime    = useRef(0);        // how long Space has been held
  const attackHeld    = useRef(false);
  const invulnTime    = useRef(0);
  const walkTime      = useRef(0);
  const targetYaw     = useRef(0);
  const pos           = useRef(new THREE.Vector3());
  const velocity      = useRef(new THREE.Vector3());
  const facingDir     = useRef(new THREE.Vector3(0, 0, -1));
  const armorLevel    = useRef(0);

  const prevNext      = useRef(false);
  const prevPrev      = useRef(false);
  const prevBow       = useRef(false);
  const prevBomb      = useRef(false);
  const prevBoom      = useRef(false);
  const prevInteract  = useRef(false);
  const prevSwordCycle = useRef(false);
  const wandCooldown  = useRef(0);

  // Track armor level without re-renders
  useGameStore.subscribe((s) => { armorLevel.current = s.armorLevel; });

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;

    // Consume pending area spawn
    if (store.pendingTransition) {
      pos.current.copy(store.pendingTransition.spawnPos);
      groupRef.current.position.copy(pos.current);
      store.setPlayerPosition(pos.current.clone());
      useGameStore.setState({ pendingTransition: null });
    }

    const { forward, back, left, right, attack, interact,
            nextWeapon, prevWeapon, bow, bomb, boomerang, shield, swordCycle } = getState();

    // Shield block
    store.setBlocking(shield);

    // Weapon cycling (Q/Shift = cycle sub-weapon, Z = cycle sword)
    if (nextWeapon && !prevNext.current) store.cycleWeapon(1);
    if (prevWeapon && !prevPrev.current) store.cycleWeapon(-1);
    prevNext.current = nextWeapon;
    prevPrev.current = prevWeapon;

    if (swordCycle && !prevSwordCycle.current) store.cycleSword(1);
    prevSwordCycle.current = swordCycle;

    // Weapon cooldown ticks
    if (wandCooldown.current > 0) wandCooldown.current -= delta;

    const sel = store.selectedWeapon;

    // Sub-weapon dedicated keys (legacy bindings still work on current selection)
    if (bow  && !prevBow.current  && sel === 'bow')            { store.fireWeapon('bow');       sfxArrow();     }
    if (bomb && !prevBomb.current && sel === 'bomb')           { store.fireWeapon('bomb');      sfxBomb();      }
    if (boomerang && !prevBoom.current && sel === 'boomerang') { store.fireWeapon('boomerang'); sfxBoomerang(); }
    prevBow.current  = bow;
    prevBomb.current = bomb;
    prevBoom.current = boomerang;

    // ── Attack / charge spin ──────────────────────────────────────
    const wasHeld = attackHeld.current;
    attackHeld.current = attack;

    if (sel === 'sword') {
      if (attack && !isSpinning.current && !isSwinging.current) {
        chargeTime.current += delta;
      }
      // Press: regular swing
      if (!wasHeld && attack && !isSwinging.current && !isSpinning.current) {
        isSwinging.current = true;
        swingTime.current  = 0;
        sfxSword();
      }
      // Release after charging ≥ 0.7s: spin attack
      if (wasHeld && !attack && chargeTime.current >= 0.7 && !isSpinning.current) {
        isSpinning.current = true;
        spinTime.current   = 0;
        isSwinging.current = false;
        sfxSword();
      }
      if (!attack) chargeTime.current = 0;
    } else {
      if (attack && !wasHeld) {
        if      (sel === 'bow')            { store.fireWeapon('bow');        sfxArrow();     }
        else if (sel === 'moonbow')        { store.fireWeapon('moonbow');    sfxArrow();     }
        else if (sel === 'bomb')           { store.fireWeapon('bomb');       sfxBomb();      }
        else if (sel === 'boomerang')      { store.fireWeapon('boomerang');  sfxBoomerang(); }
        else if (sel === 'wand') {
          if (wandCooldown.current <= 0) {
            store.fireWeapon('wand');
            wandCooldown.current = 0.8;
            sfxArrow();
          }
        }
        else if (sel === 'frost')          { store.fireWeapon('frost');      sfxArrow();     }
        else if (sel === 'shuriken')       { store.fireWeapon('shuriken');   sfxArrow();     }
        else if (sel === 'flare')          { store.fireWeapon('flare');      sfxBomb();      }
        else if (sel === 'veil')           { store.fireWeapon('veil');       sfxArrow();     }
        else if (sel === 'quake')          { store.fireWeapon('quake');      sfxBomb();      }
        else if (sel === 'aura')           { store.fireWeapon('aura');       sfxArrow();     }
        else if (sel === 'shadow')         { store.fireWeapon('shadow');     sfxArrow();     }
        else if (sel === 'chain')          { store.fireWeapon('chain');      sfxBoomerang(); }
      }
    }

    // Invulnerability flash
    if (invulnTime.current > 0) {
      invulnTime.current -= delta;
      groupRef.current.visible = Math.floor(invulnTime.current * 10) % 2 === 0;
    } else {
      groupRef.current.visible = true;
    }

    // Movement
    velocity.current.set(0, 0, 0);
    if (forward) velocity.current.z -= 1;
    if (back)    velocity.current.z += 1;
    if (left)    velocity.current.x -= 1;
    if (right)   velocity.current.x += 1;

    const moving = velocity.current.lengthSq() > 0;
    if (moving) {
      velocity.current.normalize();
      pos.current.addScaledVector(velocity.current, SPEED * delta);
      facingDir.current.copy(velocity.current);
      targetYaw.current = Math.atan2(facingDir.current.x, facingDir.current.z);
    }

    // Smooth yaw (skip during spin)
    if (!isSpinning.current) {
      let diff = targetYaw.current - groupRef.current.rotation.y;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      groupRef.current.rotation.y += diff * Math.min(1, delta * 14);
    }

    // World clamp
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -29, 29);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -29, 29);
    groupRef.current.position.copy(pos.current);

    store.setPlayerPosition(pos.current.clone());
    store.setPlayerDirection(facingDir.current.clone());

    // Multi-chest proximity check (shard/armor + sword upgrade chests)
    const chestsOpened = store.chestsOpened;
    let nearChestId: string | null = null;
    for (const c of ALL_CHESTS) {
      if (c.area !== store.currentArea) continue;
      if (chestsOpened.includes(c.key)) continue;
      if (pos.current.distanceTo(c.pos) < 2.5) {
        nearChestId = c.key;
        break;
      }
    }
    store.setNearChest(nearChestId !== null);

    // E key rising-edge interaction
    const interactJustPressed = interact && !prevInteract.current;
    prevInteract.current = interact;
    if (interactJustPressed) {
      if (store.showShop) {
        store.closeShop();
      } else if (store.activeDialogue) {
        store.advanceDialogue();
      } else if (nearChestId !== null) {
        store.openChest(nearChestId);
      } else if (store.nearShop) {
        store.openShop();
      } else if (store.nearFountain) {
        store.useFountain();
      } else if (store.nearNPC) {
        store.startDialogue(store.nearNPC);
      }
    }

    // Walk animation
    walkTime.current += delta * (moving ? 9 : 4);
    const swing = Math.sin(walkTime.current);
    const swingAbs = Math.abs(swing);

    // Body bob — slight up-down as feet push off
    bodyBobRef.current.position.y = moving ? 0.58 + swingAbs * 0.05 : 0.58;

    // Legs swing front-to-back from the hip pivot
    const legSwing = moving ? swing * 0.85 : 0;
    leftLegRef.current.rotation.x  =  legSwing;
    rightLegRef.current.rotation.x = -legSwing;

    // Idle: legs smoothly return to neutral
    if (!moving) {
      leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x,  0, delta * 8);
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, delta * 8);
    }

    // Arms counter-swing opposite to legs (only when not attacking)
    if (!isSwinging.current && !isSpinning.current) {
      const armSwing = moving ? -swing * 0.45 : 0;
      leftArmRef.current.rotation.x  = moving ? armSwing : THREE.MathUtils.lerp(leftArmRef.current.rotation.x,  0, delta * 8);
      rightArmRef.current.rotation.x = moving ? -armSwing : THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, delta * 8);
      leftArmRef.current.rotation.z  = 0;
      rightArmRef.current.rotation.z = 0;
    }

    // ── Regular sword swing ───────────────────────────────────────
    if (isSwinging.current && swordGroupRef.current && rightArmRef.current) {
      swingTime.current += delta;
      const progress = swingTime.current / 0.3;
      if (progress >= 1) {
        isSwinging.current = false;
        swordGroupRef.current.visible = false;
        rightArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.z = 0;
        store.setSwordState(false, pos.current);
      } else {
        swordGroupRef.current.visible = true;
        rightArmRef.current.rotation.x = -1.2;
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(-Math.PI / 2, Math.PI / 2, progress);
        const hitPos = pos.current.clone()
          .addScaledVector(facingDir.current.clone().setY(0).normalize(), 1.4)
          .setY(0.5);
        store.setSwordState(true, hitPos);
      }
      if (!isSwinging.current) {
        leftArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.x = 0;
      }
    } else if (!isSpinning.current) {
      if (!isSwinging.current) {
        leftArmRef.current.rotation.x  = moving ? -swing * 0.55 : 0;
        rightArmRef.current.rotation.x = moving ?  swing * 0.55 : 0;
      }
    }

    // ── Spin attack (360° sweep, 0.8s) ───────────────────────────
    if (isSpinning.current && swordGroupRef.current) {
      spinTime.current += delta;
      const SPIN_DURATION = 0.8;
      const progress = spinTime.current / SPIN_DURATION;

      if (progress >= 1) {
        isSpinning.current = false;
        swordGroupRef.current.visible = false;
        groupRef.current.rotation.y = targetYaw.current;
        store.setSwordState(false, pos.current);
        store.setSpinState(false, pos.current);
      } else {
        swordGroupRef.current.visible = true;
        // Full rotation during spin
        groupRef.current.rotation.y += (Math.PI * 2 / SPIN_DURATION) * delta;
        rightArmRef.current.rotation.x = -1.5;
        rightArmRef.current.rotation.z = 0;
        // Spin hit zone: full circle around player
        store.setSpinState(true, pos.current.clone().setY(0.5));
      }
    }
  });

  useGameStore.subscribe((state, prev) => {
    if (state.hearts < prev.hearts && state.hearts > 0) {
      invulnTime.current = 1.0;
    }
  });

  const armorLvl   = useGameStore(s => s.armorLevel);
  const isBlocking = useGameStore(s => s.isBlocking);
  const activeSword = useGameStore(s => s.activeSword);

  return (
    <group ref={groupRef}>
      <group ref={bodyBobRef} position={[0, 0.58, 0]}>
        <HeroLeg side={-1} legRef={leftLegRef} />
        <HeroLeg side={1}  legRef={rightLegRef} />
        <HeroTorso armorLevel={armorLvl} />
        <HeroArm side={-1} armRef={leftArmRef}>
          {isBlocking && <ShieldRaised />}
        </HeroArm>
        <HeroArm side={1}  armRef={rightArmRef}>
          <group ref={swordGroupRef} visible={false}>
            <SwordMesh swordId={activeSword} />
          </group>
        </HeroArm>
        <HeroHead />
      </group>
    </group>
  );
}
