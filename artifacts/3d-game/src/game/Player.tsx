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
  desert: new THREE.Vector3(0, 0, -24),
};

// ── Colour palette ──────────────────────────────────────────────
const C = {
  tunic:    '#2e7d32',
  tunicDk:  '#1b5e20',
  skin:     '#f5c9a0',
  hair:     '#e8c84a',
  boot:     '#3e2723',
  belt:     '#5d4037',
  gold:     '#fdd835',
  steel:    '#eceff1',
  steelDk:  '#90a4ae',
  shBlue:   '#1565c0',
  shGold:   '#f9a825',
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
      {/* Mouth */}
      <mesh position={[0, -0.12, 0.3]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.02]} />
        <meshStandardMaterial color="#c26060" />
      </mesh>
      {/* Sideburn hair */}
      <mesh position={[-0.3, -0.05, 0.2]} castShadow>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color={C.hair} />
      </mesh>
      <mesh position={[0.3, -0.05, 0.2]} castShadow>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color={C.hair} />
      </mesh>
      {/* Hat brim */}
      <mesh position={[0, 0.26, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 16]} />
        <meshStandardMaterial color={C.tunic} />
      </mesh>
      {/* Hat cone */}
      <mesh position={[0, 0.76, -0.04]} rotation={[0.3, 0, 0]} castShadow>
        <coneGeometry args={[0.36, 1.0, 14]} />
        <meshStandardMaterial color={C.tunic} roughness={0.65} />
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
      {/* Shield on left hip */}
      <group position={[-0.3, -0.12, -0.25]} rotation={[0, -0.4, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.25, 0.08, 16]} />
          <meshStandardMaterial color={C.shBlue} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.18, 0.15, 0.03, 10]} />
          <meshStandardMaterial color={C.shGold} metalness={0.4} roughness={0.4} />
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

function SwordMesh() {
  return (
    <group position={[0.04, -0.85, 0]}>
      {/* Grip */}
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.24, 7]} />
        <meshStandardMaterial color={C.belt} roughness={0.9} />
      </mesh>
      {/* Guard */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.36, 0.07, 0.09]} />
        <meshStandardMaterial color={C.gold} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Pommel */}
      <mesh position={[0, -0.14, 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color={C.gold} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Blade */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.038, 0.055, 1.0, 5]} />
        <meshStandardMaterial color={C.steel} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Blade edge glint */}
      <mesh position={[0.02, 0.72, 0]}>
        <cylinderGeometry args={[0.01, 0.014, 0.98, 4]} />
        <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.0} />
      </mesh>
      {/* Tip */}
      <mesh position={[0, 1.24, 0]} castShadow>
        <coneGeometry args={[0.038, 0.18, 5]} />
        <meshStandardMaterial color={C.steel} metalness={0.7} roughness={0.2} />
      </mesh>
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
    const nearChest = chestPos ? pos.current.distanceTo(chestPos) < 2.5 : false;
    store.setNearChest(nearChest);
    if (interact && nearChest) store.setGameState('victory');

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
