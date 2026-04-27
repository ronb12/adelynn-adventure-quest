import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from './controls';
import { useGameStore } from './store';
import { sfxSword, sfxArrow, sfxBomb, sfxBoomerang } from './AudioManager';

const SPEED = 5;

const CHEST_POSITIONS: Record<string, THREE.Vector3> = {
  field:  new THREE.Vector3(0, 0, -22),
  forest: new THREE.Vector3(0, 0, 0),
  desert: new THREE.Vector3(0, 0, -24),
};

// ── Colour palette — Adelynn (pink adventurer) ───────────────────
const C = {
  tunic:    '#e91e8c',   // hot pink outfit
  tunicDk:  '#880e4f',   // deep magenta accent
  skin:     '#f5c9a0',
  hair:     '#7b2d14',   // rich auburn
  boot:     '#6a1040',   // dark magenta boots
  belt:     '#fce4ec',   // light pink belt
  gold:     '#fdd835',
  steel:    '#eceff1',
  steelDk:  '#90a4ae',
  shPink:   '#f06292',   // pink shield
  shGold:   '#f8bbd0',   // light rose shield boss
};

// ── Sub-components (pure visuals) ───────────────────────────────

function HeroHead() {
  return (
    <group position={[0, 1.55, 0]}>
      {/* Neck */}
      <mesh position={[0, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.22, 10]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      {/* Head sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.33, 18, 14]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      {/* Ear left */}
      <mesh position={[-0.34, 0.04, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      {/* Ear right */}
      <mesh position={[0.34, 0.04, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.13, 0.06, 0.3]}>
        <sphereGeometry args={[0.065, 10, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.13, 0.06, 0.3]}>
        <sphereGeometry args={[0.065, 10, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Eye whites */}
      <mesh position={[-0.13, 0.07, 0.295]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.13, 0.07, 0.295]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Nose */}
      <mesh position={[0, -0.03, 0.32]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      {/* Lips — rosy pink */}
      <mesh position={[0, -0.12, 0.3]}>
        <boxGeometry args={[0.13, 0.045, 0.02]} />
        <meshStandardMaterial color="#e91e8c" roughness={0.5} />
      </mesh>
      {/* Auburn hair — back mass */}
      <mesh position={[0, 0.06, -0.22]} castShadow>
        <sphereGeometry args={[0.3, 10, 8]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      {/* Hair side pieces */}
      <mesh position={[-0.27, -0.02, 0.15]} castShadow>
        <sphereGeometry args={[0.11, 8, 6]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      <mesh position={[0.27, -0.02, 0.15]} castShadow>
        <sphereGeometry args={[0.11, 8, 6]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      {/* Ponytail base */}
      <mesh position={[0, -0.02, -0.32]} castShadow>
        <sphereGeometry args={[0.13, 9, 7]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      {/* Ponytail shaft */}
      <mesh position={[0, -0.28, -0.34]} rotation={[0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.05, 0.38, 8]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      {/* Ponytail tip */}
      <mesh position={[0, -0.52, -0.28]} castShadow>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color={C.hair} roughness={0.8} />
      </mesh>
      {/* Pink bow / ribbon */}
      <mesh position={[0.01, 0.02, -0.34]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.22, 0.08, 0.05]} />
        <meshStandardMaterial color="#ff4db8" roughness={0.4} />
      </mesh>
      {/* Hat brim */}
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 16]} />
        <meshStandardMaterial color={C.tunic} roughness={0.55} />
      </mesh>
      {/* Hat cone */}
      <mesh position={[0, 0.76, -0.04]} rotation={[0.3, 0, 0]} castShadow>
        <coneGeometry args={[0.36, 1.0, 14]} />
        <meshStandardMaterial color={C.tunic} roughness={0.55} />
      </mesh>
      {/* Hat star trim */}
      <mesh position={[0, 0.32, 0.38]}>
        <sphereGeometry args={[0.055, 7, 5]} />
        <meshStandardMaterial color="#ffd6ec" metalness={0.4} roughness={0.2} />
      </mesh>
    </group>
  );
}

function HeroTorso() {
  return (
    <group position={[0, 0.72, 0]}>
      {/* Main torso — tapered cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.72, 14]} />
        <meshStandardMaterial color={C.tunic} roughness={0.7} />
      </mesh>
      {/* Chest tunic accent stripe */}
      <mesh position={[0, 0.1, 0.28]}>
        <boxGeometry args={[0.38, 0.32, 0.04]} />
        <meshStandardMaterial color={C.tunicDk} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.38, 0.1, 14]} />
        <meshStandardMaterial color={C.belt} roughness={0.8} />
      </mesh>
      {/* Belt buckle */}
      <mesh position={[0, -0.3, 0.39]}>
        <boxGeometry args={[0.14, 0.1, 0.04]} />
        <meshStandardMaterial color={C.gold} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Skirt flare — wider at bottom */}
      <mesh position={[0, -0.52, 0]} castShadow>
        <cylinderGeometry args={[0.48, 0.55, 0.28, 14]} />
        <meshStandardMaterial color={C.tunicDk} roughness={0.65} />
      </mesh>
      {/* Pink shield on left hip */}
      <group position={[-0.3, -0.12, -0.25]} rotation={[0, -0.4, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.25, 0.08, 16]} />
          <meshStandardMaterial color={C.shPink} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.18, 0.15, 0.03, 10]} />
          <meshStandardMaterial color={C.shGold} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Heart emblem on shield */}
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
      {/* Shoulder sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.15, 10, 8]} />
        <meshStandardMaterial color={C.tunic} roughness={0.7} />
      </mesh>
      {/* Upper arm */}
      <mesh position={[0, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.1, 0.32, 9]} />
        <meshStandardMaterial color={C.tunic} roughness={0.7} />
      </mesh>
      {/* Elbow */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <sphereGeometry args={[0.1, 9, 7]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      {/* Forearm */}
      <mesh position={[0, -0.55, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.24, 9]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      {/* Hand */}
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
  legRef?: React.RefObject<THREE.Mesh>;
}
function HeroLeg({ side, legRef }: LegProps) {
  const x = side * 0.17;
  return (
    <group position={[x, 0.33, 0]}>
      {/* Hip joint */}
      <mesh castShadow>
        <sphereGeometry args={[0.13, 9, 7]} />
        <meshStandardMaterial color={C.tunic} />
      </mesh>
      {/* Thigh */}
      <mesh ref={legRef} position={[0, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.11, 0.32, 9]} />
        <meshStandardMaterial color={C.tunic} roughness={0.7} />
      </mesh>
      {/* Knee */}
      <mesh position={[0, -0.42, 0]} castShadow>
        <sphereGeometry args={[0.11, 9, 7]} />
        <meshStandardMaterial color={C.boot} />
      </mesh>
      {/* Shin / boot */}
      <mesh position={[0, -0.58, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.3, 9]} />
        <meshStandardMaterial color={C.boot} roughness={0.9} />
      </mesh>
      {/* Foot */}
      <mesh position={[0, -0.77, 0.06]} castShadow>
        <sphereGeometry args={[0.13, 9, 6]} />
        <meshStandardMaterial color={C.boot} roughness={0.9} />
      </mesh>
    </group>
  );
}

// Adelynn's sword — pink blade, chrome fittings
const SW = {
  blade:    '#f48fb1',   // medium pink blade
  bladeHi:  '#fce4ec',   // bright pink-white edge
  fuller:   '#e0e0e0',   // silver/chrome ridge
  guard:    '#b0bec5',   // chrome crossguard
  guardHi:  '#eceff1',   // bright chrome face
  grip:     '#e91e8c',   // hot pink grip
  gripWrap: '#cfd8dc',   // silver wrap rings
  pommel:   '#b0bec5',   // chrome pommel
  pommelHi: '#eceff1',   // bright chrome sheen
};

function SwordMesh() {
  return (
    <group position={[0.04, -0.88, 0]}>
      {/* ── Pommel (gold sphere) ── */}
      <mesh castShadow position={[0, -0.18, 0]}>
        <sphereGeometry args={[0.09, 12, 9]} />
        <meshStandardMaterial color={SW.pommel} metalness={0.65} roughness={0.2} />
      </mesh>
      {/* Pommel top sheen cap */}
      <mesh position={[0, -0.12, 0]}>
        <sphereGeometry args={[0.055, 9, 7]} />
        <meshStandardMaterial color={SW.pommelHi} metalness={0.8} roughness={0.1} />
      </mesh>

      {/* ── Grip (deep blue cylinder) ── */}
      <mesh castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.048, 0.056, 0.42, 9]} />
        <meshStandardMaterial color={SW.grip} roughness={0.72} />
      </mesh>
      {/* Grip wrap rings */}
      {[-0.08, 0.04, 0.16].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.056, 0.011, 6, 14]} />
          <meshStandardMaterial color={SW.gripWrap} metalness={0.55} roughness={0.28} />
        </mesh>
      ))}

      {/* ── Crossguard (gold bar + round end caps) ── */}
      {/* Main bar */}
      <mesh castShadow position={[0, 0.27, 0]}>
        <boxGeometry args={[0.64, 0.078, 0.096]} />
        <meshStandardMaterial color={SW.guard} metalness={0.58} roughness={0.22} />
      </mesh>
      {/* Top face sheen */}
      <mesh position={[0, 0.31, 0]}>
        <boxGeometry args={[0.62, 0.012, 0.08]} />
        <meshStandardMaterial color={SW.guardHi} metalness={0.7} roughness={0.12} />
      </mesh>
      {/* Left end sphere */}
      <mesh castShadow position={[-0.33, 0.27, 0]}>
        <sphereGeometry args={[0.082, 11, 9]} />
        <meshStandardMaterial color={SW.guard} metalness={0.58} roughness={0.22} />
      </mesh>
      {/* Right end sphere */}
      <mesh castShadow position={[0.33, 0.27, 0]}>
        <sphereGeometry args={[0.082, 11, 9]} />
        <meshStandardMaterial color={SW.guard} metalness={0.58} roughness={0.22} />
      </mesh>
      {/* Guard inner notch where blade starts */}
      <mesh position={[0, 0.33, 0]}>
        <boxGeometry args={[0.14, 0.06, 0.068]} />
        <meshStandardMaterial color={SW.guardHi} metalness={0.7} roughness={0.12} />
      </mesh>

      {/* ── Blade (chunky, always-visible, glowing blue) ── */}
      {/* Ricasso / base block */}
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[0.15, 0.14, 0.13]} />
        <meshStandardMaterial color={SW.blade} metalness={0.85} roughness={0.08}
          emissive={SW.blade} emissiveIntensity={0.35} />
      </mesh>
      {/* Main blade body — thick so it reads from every angle */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.13, 1.1, 0.11]} />
        <meshStandardMaterial color={SW.blade} metalness={0.85} roughness={0.08}
          emissive={SW.blade} emissiveIntensity={0.4} />
      </mesh>
      {/* Left edge highlight bevel */}
      <mesh position={[-0.062, 1.0, 0]}>
        <boxGeometry args={[0.012, 1.1, 0.115]} />
        <meshStandardMaterial color={SW.bladeHi} metalness={1.0} roughness={0.0}
          emissive={SW.bladeHi} emissiveIntensity={0.6} />
      </mesh>
      {/* Right edge highlight bevel */}
      <mesh position={[0.062, 1.0, 0]}>
        <boxGeometry args={[0.012, 1.1, 0.115]} />
        <meshStandardMaterial color={SW.bladeHi} metalness={1.0} roughness={0.0}
          emissive={SW.bladeHi} emissiveIntensity={0.6} />
      </mesh>
      {/* Central fuller ridge (front face) */}
      <mesh position={[0, 1.0, 0.057]}>
        <boxGeometry args={[0.03, 1.04, 0.012]} />
        <meshStandardMaterial color={SW.fuller} metalness={0.9} roughness={0.04}
          emissive={SW.fuller} emissiveIntensity={0.5} />
      </mesh>
      {/* Central fuller ridge (back face) */}
      <mesh position={[0, 1.0, -0.057]}>
        <boxGeometry args={[0.03, 1.04, 0.012]} />
        <meshStandardMaterial color={SW.fuller} metalness={0.9} roughness={0.04}
          emissive={SW.fuller} emissiveIntensity={0.5} />
      </mesh>
      {/* Blade tip */}
      <mesh castShadow position={[0, 1.6, 0]}>
        <coneGeometry args={[0.065, 0.24, 4]} />
        <meshStandardMaterial color={SW.blade} metalness={0.85} roughness={0.08}
          emissive={SW.blade} emissiveIntensity={0.4} />
      </mesh>
      {/* Glow light from blade — pink shimmer */}
      <pointLight position={[0, 1.1, 0]} color="#ff80c0" intensity={1.2} distance={2.5} decay={2} />
    </group>
  );
}

// ── Main Player component ────────────────────────────────────────
export function Player() {
  const groupRef    = useRef<THREE.Group>(null!);
  const bodyBobRef  = useRef<THREE.Group>(null!);
  const leftLegRef  = useRef<THREE.Mesh>(null!);
  const rightLegRef = useRef<THREE.Mesh>(null!);
  const leftArmRef  = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const swordGroupRef = useRef<THREE.Group>(null!);

  const [, getState] = useKeyboardControls<Controls>();

  const isSwinging  = useRef(false);
  const swingTime   = useRef(0);
  const invulnTime  = useRef(0);
  const walkTime    = useRef(0);
  const targetYaw   = useRef(0);
  const pos         = useRef(new THREE.Vector3());
  const velocity    = useRef(new THREE.Vector3());
  const facingDir   = useRef(new THREE.Vector3(0, 0, -1));

  const prevNext = useRef(false);
  const prevPrev = useRef(false);
  const prevBow  = useRef(false);
  const prevBomb = useRef(false);
  const prevBoom = useRef(false);
  const prevAtk  = useRef(false);

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
            nextWeapon, prevWeapon, bow, bomb, boomerang } = getState();

    // Weapon cycling
    if (nextWeapon && !prevNext.current) store.cycleWeapon(1);
    if (prevWeapon && !prevPrev.current) store.cycleWeapon(-1);
    prevNext.current = nextWeapon;
    prevPrev.current = prevWeapon;

    // Fire sub-weapons on press (dedicated keys)
    const sel = store.selectedWeapon;
    if (bow  && !prevBow.current  && sel === 'bow')            { store.fireWeapon('bow');       sfxArrow();     }
    if (bomb && !prevBomb.current && sel === 'bomb')           { store.fireWeapon('bomb');      sfxBomb();      }
    if (boomerang && !prevBoom.current && sel === 'boomerang') { store.fireWeapon('boomerang'); sfxBoomerang(); }
    prevBow.current  = bow;
    prevBomb.current = bomb;
    prevBoom.current = boomerang;

    // Space: fire selected weapon
    if (attack && !prevAtk.current) {
      if (sel === 'sword' && !isSwinging.current) {
        isSwinging.current = true;
        swingTime.current  = 0;
        sfxSword();
      } else if (sel === 'bow')       { store.fireWeapon('bow');       sfxArrow();     }
      else if (sel === 'bomb')        { store.fireWeapon('bomb');      sfxBomb();      }
      else if (sel === 'boomerang')   { store.fireWeapon('boomerang'); sfxBoomerang(); }
    }
    prevAtk.current = attack;

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

    // Smooth yaw
    let diff = targetYaw.current - groupRef.current.rotation.y;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    groupRef.current.rotation.y += diff * Math.min(1, delta * 14);

    // World clamp
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -29, 29);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -29, 29);
    groupRef.current.position.copy(pos.current);

    store.setPlayerPosition(pos.current.clone());
    store.setPlayerDirection(facingDir.current.clone());

    // Chest check
    const chestPos = CHEST_POSITIONS[store.currentArea];
    const alreadyOpened = store.chestsOpened.includes(store.currentArea);
    const nearChest = chestPos && !alreadyOpened
      ? pos.current.distanceTo(chestPos) < 2.5
      : false;
    store.setNearChest(nearChest);
    if (interact && nearChest) store.openChest(store.currentArea);

    // Walk animation
    walkTime.current += delta * (moving ? 10 : 3);
    const swing = Math.sin(walkTime.current);
    bodyBobRef.current.position.y = moving ? 0.04 + Math.abs(swing) * 0.07 : 0.04;
    leftLegRef.current.rotation.x  = moving ?  swing  * 0.7 : 0;
    rightLegRef.current.rotation.x = moving ? -swing  * 0.7 : 0;
    if (!isSwinging.current) {
      leftArmRef.current.rotation.x  = moving ? -swing * 0.55 : 0;
      rightArmRef.current.rotation.x = moving ?  swing * 0.55 : 0;
    }

    // Sword swing
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

        // Sword hit zone: player pos + forward * 1.4 at Y=0.5 (reliable XZ hit)
        const swordHitPos = pos.current.clone()
          .addScaledVector(facingDir.current.clone().setY(0).normalize(), 1.4)
          .setY(0.5);
        store.setSwordState(true, swordHitPos);
      }
    }
  });

  useGameStore.subscribe((state, prev) => {
    if (state.hearts < prev.hearts && state.hearts > 0) {
      invulnTime.current = 1.0;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={bodyBobRef} position={[0, 0.04, 0]}>
        <HeroLeg side={-1} legRef={leftLegRef} />
        <HeroLeg side={1}  legRef={rightLegRef} />
        <HeroTorso />
        <HeroArm side={-1} armRef={leftArmRef} />
        <HeroArm side={1}  armRef={rightArmRef}>
          <group ref={swordGroupRef} visible={false}>
            <SwordMesh />
          </group>
        </HeroArm>
        <HeroHead />
      </group>
    </group>
  );
}
