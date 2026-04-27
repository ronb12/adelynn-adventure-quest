import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from './controls';
import { useGameStore } from './store';

const SPEED = 5;

const CHEST_POSITIONS: Record<string, THREE.Vector3> = {
  field:  new THREE.Vector3(0, 0, -22),
  desert: new THREE.Vector3(0, 0, -24),
};

export function Player() {
  const groupRef    = useRef<THREE.Group>(null);
  const bodyBobRef  = useRef<THREE.Group>(null);
  const leftLegRef  = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const swordRef    = useRef<THREE.Group>(null);
  const swordTipRef = useRef<THREE.Mesh>(null);
  const hatTipRef   = useRef<THREE.Mesh>(null);

  const [, getState] = useKeyboardControls<Controls>();

  const isSwinging    = useRef(false);
  const swingTime     = useRef(0);
  const invulnTime    = useRef(0);
  const walkTime      = useRef(0);
  const targetYaw     = useRef(0);
  const pos           = useRef(new THREE.Vector3(0, 0, 0));
  const velocity      = useRef(new THREE.Vector3());
  const facingDir     = useRef(new THREE.Vector3(0, 0, -1));
  const swordWorldPos = useRef(new THREE.Vector3());

  // Edge-detect for weapon keys
  const prevNext  = useRef(false);
  const prevPrev  = useRef(false);
  const prevBow   = useRef(false);
  const prevBomb  = useRef(false);
  const prevBoom  = useRef(false);

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;

    // Snap to pending spawn position on area transition
    if (store.pendingTransition) {
      const spawn = store.pendingTransition.spawnPos;
      pos.current.copy(spawn);
      if (groupRef.current) groupRef.current.position.copy(pos.current);
      store.setPlayerPosition(pos.current.clone());
      // Clear transition (already committed by store.triggerAreaTransition)
      useGameStore.setState({ pendingTransition: null });
    }

    const { forward, back, left, right, attack, interact, nextWeapon, prevWeapon, bow, bomb, boomerang } = getState();

    // Weapon cycling (edge detect)
    if (nextWeapon && !prevNext.current) store.cycleWeapon(1);
    if (prevWeapon && !prevPrev.current) store.cycleWeapon(-1);
    prevNext.current = nextWeapon;
    prevPrev.current = prevWeapon;

    // Fire sub-weapons (edge detect)
    const sel = store.selectedWeapon;
    if (bow  && !prevBow.current  && sel === 'bow')       store.fireWeapon('bow');
    if (bomb && !prevBomb.current && sel === 'bomb')      store.fireWeapon('bomb');
    if (boomerang && !prevBoom.current && sel === 'boomerang') store.fireWeapon('boomerang');
    prevBow.current  = bow;
    prevBomb.current = bomb;
    prevBoom.current = boomerang;

    // Also allow Space to fire any selected sub-weapon
    if (attack && !isSwinging.current) {
      if (sel === 'sword') {
        isSwinging.current = true;
        swingTime.current  = 0;
      } else if (sel === 'bow' && !prevBow.current)       store.fireWeapon('bow');
      else if (sel === 'bomb' && !prevBomb.current)       store.fireWeapon('bomb');
      else if (sel === 'boomerang' && !prevBoom.current)  store.fireWeapon('boomerang');
    }

    // Invulnerability flashing
    if (invulnTime.current > 0) {
      invulnTime.current -= delta;
      if (groupRef.current) groupRef.current.visible = Math.floor(invulnTime.current * 10) % 2 === 0;
    } else if (groupRef.current) {
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

    // Smooth rotation
    if (groupRef.current) {
      let diff = targetYaw.current - groupRef.current.rotation.y;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      groupRef.current.rotation.y += diff * Math.min(1, delta * 12);
    }

    // Clamp to world bounds
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -29, 29);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -29, 29);

    if (groupRef.current) groupRef.current.position.copy(pos.current);
    store.setPlayerPosition(pos.current.clone());
    store.setPlayerDirection(facingDir.current.clone());

    // Chest interaction
    const chestPos = CHEST_POSITIONS[store.currentArea];
    const nearChest = chestPos ? pos.current.distanceTo(chestPos) < 2.5 : false;
    store.setNearChest(nearChest);
    if (interact && nearChest) store.setGameState('victory');

    // Walk animation
    walkTime.current += delta * (moving ? 10 : 3);
    const swing = Math.sin(walkTime.current);
    if (bodyBobRef.current)  bodyBobRef.current.position.y = moving ? 0.5 + Math.abs(swing) * 0.06 : 0.5;
    if (leftLegRef.current)  leftLegRef.current.rotation.x  = moving ? swing  * 0.6 : 0;
    if (rightLegRef.current) rightLegRef.current.rotation.x = moving ? -swing * 0.6 : 0;
    if (!isSwinging.current) {
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = moving ? -swing * 0.5 : 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = moving ?  swing * 0.5 : 0;
    }
    if (hatTipRef.current) hatTipRef.current.rotation.z = Math.sin(walkTime.current * 0.7) * 0.15;

    // Sword swing
    if (isSwinging.current && swordRef.current && rightArmRef.current) {
      swingTime.current += delta;
      const progress = swingTime.current / 0.28;
      if (progress >= 1) {
        isSwinging.current = false;
        swordRef.current.visible = false;
        rightArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.z = 0;
        store.setSwordState(false, swordWorldPos.current);
      } else {
        swordRef.current.visible = true;
        rightArmRef.current.rotation.x = -1.1;
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(-Math.PI / 2.2, Math.PI / 2.2, progress);
        if (swordTipRef.current) {
          swordTipRef.current.getWorldPosition(swordWorldPos.current);
          store.setSwordState(true, swordWorldPos.current);
        }
      }
    }
  });

  useGameStore.subscribe((state, prevState) => {
    if (state.hearts < prevState.hearts && state.hearts > 0) {
      invulnTime.current = 1.0;
    }
  });

  const TUNIC      = '#2f7d32';
  const TUNIC_DARK = '#225a25';
  const SKIN       = '#f5cfa8';
  const HAIR       = '#f5d76e';
  const BELT       = '#5a3a1c';
  const BOOT       = '#3a2412';
  const STEEL      = '#e9eef5';
  const STEEL_DARK = '#9aa6b3';
  const GOLD       = '#d8b24a';
  const SHIELD_BLUE = '#1e5fa8';

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group ref={bodyBobRef} position={[0, 0.5, 0]}>
        {/* Legs */}
        <mesh ref={leftLegRef}  position={[-0.18, -0.05, 0]} castShadow>
          <boxGeometry args={[0.28, 0.5, 0.32]} />
          <meshStandardMaterial color={BOOT} />
        </mesh>
        <mesh ref={rightLegRef} position={[0.18, -0.05, 0]} castShadow>
          <boxGeometry args={[0.28, 0.5, 0.32]} />
          <meshStandardMaterial color={BOOT} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.78, 0.12, 0.78]} />
          <meshStandardMaterial color={BELT} />
        </mesh>
        <mesh position={[0, 0.22, 0.4]}>
          <boxGeometry args={[0.18, 0.14, 0.04]} />
          <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Tunic body */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.78, 0.78, 0.74]} />
          <meshStandardMaterial color={TUNIC} />
        </mesh>
        <mesh position={[0, 0.92, 0.38]}>
          <boxGeometry args={[0.5, 0.22, 0.02]} />
          <meshStandardMaterial color={TUNIC_DARK} />
        </mesh>
        {/* Shield on back */}
        <group position={[0, 0.7, -0.42]} rotation={[0, Math.PI, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.7, 0.08]} />
            <meshStandardMaterial color={SHIELD_BLUE} />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <boxGeometry args={[0.5, 0.65, 0.02]} />
            <meshStandardMaterial color={GOLD} metalness={0.3} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.05, 0.06]}>
            <boxGeometry args={[0.18, 0.32, 0.02]} />
            <meshStandardMaterial color={STEEL} />
          </mesh>
        </group>
        {/* Left arm */}
        <group ref={leftArmRef} position={[-0.5, 0.85, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.22, 0.5, 0.24]} />
            <meshStandardMaterial color={TUNIC} />
          </mesh>
          <mesh position={[0, -0.52, 0]} castShadow>
            <boxGeometry args={[0.22, 0.18, 0.24]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
        </group>
        {/* Right arm (sword arm) */}
        <group ref={rightArmRef} position={[0.5, 0.85, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.22, 0.5, 0.24]} />
            <meshStandardMaterial color={TUNIC} />
          </mesh>
          <mesh position={[0, -0.52, 0]} castShadow>
            <boxGeometry args={[0.22, 0.18, 0.24]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
          {/* Sword */}
          <group ref={swordRef} position={[0, -0.55, 0]} visible={false}>
            <mesh position={[0, -0.05, 0]} castShadow>
              <boxGeometry args={[0.08, 0.18, 0.08]} />
              <meshStandardMaterial color={BELT} />
            </mesh>
            <mesh position={[0, -0.18, 0]} castShadow>
              <boxGeometry args={[0.12, 0.08, 0.12]} />
              <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.05, 0]} castShadow>
              <boxGeometry args={[0.34, 0.06, 0.12]} />
              <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.1, 0.85, 0.04]} />
              <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.5, 0.022]}>
              <boxGeometry args={[0.03, 0.78, 0.005]} />
              <meshStandardMaterial color={STEEL_DARK} />
            </mesh>
            <mesh ref={swordTipRef} position={[0, 0.95, 0]}>
              <boxGeometry args={[0.08, 0.12, 0.04]} />
              <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.25} />
            </mesh>
          </group>
        </group>
        {/* Head */}
        <mesh position={[0, 1.32, 0.02]} castShadow>
          <boxGeometry args={[0.62, 0.6, 0.6]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position={[0, 1.55, 0.28]}>
          <boxGeometry args={[0.62, 0.18, 0.08]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        <mesh position={[-0.32, 1.32, 0.18]}>
          <boxGeometry args={[0.06, 0.34, 0.18]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        <mesh position={[0.32, 1.32, 0.18]}>
          <boxGeometry args={[0.06, 0.34, 0.18]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        <mesh position={[-0.34, 1.34, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.05, 0.18, 0.14]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position={[0.34, 1.34, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.05, 0.18, 0.14]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position={[-0.14, 1.34, 0.32]}>
          <boxGeometry args={[0.08, 0.1, 0.02]} />
          <meshStandardMaterial color="#1a1a2a" />
        </mesh>
        <mesh position={[0.14, 1.34, 0.32]}>
          <boxGeometry args={[0.08, 0.1, 0.02]} />
          <meshStandardMaterial color="#1a1a2a" />
        </mesh>
        {/* Hat */}
        <mesh position={[0, 1.66, 0]} castShadow>
          <boxGeometry args={[0.66, 0.14, 0.64]} />
          <meshStandardMaterial color={TUNIC} />
        </mesh>
        <mesh ref={hatTipRef} position={[0, 1.78, -0.05]} rotation={[0.35, 0, 0]} castShadow>
          <coneGeometry args={[0.34, 0.95, 4]} />
          <meshStandardMaterial color={TUNIC} />
        </mesh>
      </group>
    </group>
  );
}
