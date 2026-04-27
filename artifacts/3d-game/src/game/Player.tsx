import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from './controls';
import { useGameStore } from './store';

const SPEED = 5;

export function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyBobRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const swordRef = useRef<THREE.Group>(null);
  const swordTipRef = useRef<THREE.Mesh>(null);
  const hatTipRef = useRef<THREE.Mesh>(null);

  const [, getState] = useKeyboardControls<Controls>();
  const isSwinging = useRef(false);
  const swingTime = useRef(0);
  const invulnTime = useRef(0);
  const walkTime = useRef(0);

  const pos = useRef(new THREE.Vector3(0, 0, 0));
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3(0, 0, -1));
  const swordWorldPos = useRef(new THREE.Vector3());
  const targetYaw = useRef(0);

  const chestPos = new THREE.Vector3(0, 0.5, -25);

  useFrame((_state, delta) => {
    const gameState = useGameStore.getState().gameState;
    if (gameState !== 'playing') return;

    const { forward, back, left, right, attack, interact } = getState();

    // Invulnerability flashing
    if (invulnTime.current > 0) {
      invulnTime.current -= delta;
      if (groupRef.current) {
        groupRef.current.visible = Math.floor(invulnTime.current * 10) % 2 === 0;
      }
    } else if (groupRef.current) {
      groupRef.current.visible = true;
    }

    // Movement
    velocity.current.set(0, 0, 0);
    if (forward) velocity.current.z -= 1;
    if (back) velocity.current.z += 1;
    if (left) velocity.current.x -= 1;
    if (right) velocity.current.x += 1;

    const moving = velocity.current.lengthSq() > 0;
    if (moving) {
      velocity.current.normalize();
      pos.current.addScaledVector(velocity.current, SPEED * delta);

      direction.current.copy(velocity.current);
      targetYaw.current = Math.atan2(direction.current.x, direction.current.z);
    }

    // Smooth rotation
    if (groupRef.current) {
      const cur = groupRef.current.rotation.y;
      let diff = targetYaw.current - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      groupRef.current.rotation.y = cur + diff * Math.min(1, delta * 12);
    }

    // Clamp to bounds
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -29, 29);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -29, 29);

    if (groupRef.current) {
      groupRef.current.position.copy(pos.current);
    }
    useGameStore.getState().setPlayerPosition(pos.current);

    // Walk animation
    walkTime.current += delta * (moving ? 10 : 4);
    const swing = Math.sin(walkTime.current);
    if (bodyBobRef.current) {
      bodyBobRef.current.position.y = moving ? 0.5 + Math.abs(swing) * 0.06 : 0.5;
    }
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = moving ? swing * 0.6 : 0;
      rightLegRef.current.rotation.x = moving ? -swing * 0.6 : 0;
    }
    if (leftArmRef.current && rightArmRef.current && !isSwinging.current) {
      leftArmRef.current.rotation.x = moving ? -swing * 0.5 : 0;
      rightArmRef.current.rotation.x = moving ? swing * 0.5 : 0;
    }
    if (hatTipRef.current) {
      hatTipRef.current.rotation.z = Math.sin(walkTime.current * 0.7) * 0.15;
    }

    // Interact with Chest
    if (interact && pos.current.distanceTo(chestPos) < 3) {
      useGameStore.getState().setGameState('victory');
    }

    // Sword attack
    if (attack && !isSwinging.current) {
      isSwinging.current = true;
      swingTime.current = 0;
    }

    if (isSwinging.current && swordRef.current && rightArmRef.current) {
      swingTime.current += delta;
      const progress = swingTime.current / 0.28;

      if (progress >= 1) {
        isSwinging.current = false;
        swordRef.current.visible = false;
        rightArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.z = 0;
        useGameStore.getState().setSwordState(false, swordWorldPos.current);
      } else {
        swordRef.current.visible = true;
        // Swing arc: arm sweeps from right-front to left-front
        const arc = THREE.MathUtils.lerp(-Math.PI / 2.2, Math.PI / 2.2, progress);
        rightArmRef.current.rotation.x = -1.1; // raised forward
        rightArmRef.current.rotation.z = arc;

        if (swordTipRef.current) {
          swordTipRef.current.getWorldPosition(swordWorldPos.current);
          useGameStore.getState().setSwordState(true, swordWorldPos.current);
        }
      }
    }
  });

  // External invulnerability trigger
  useGameStore.subscribe((state, prevState) => {
    if (state.hearts < prevState.hearts && state.hearts > 0) {
      invulnTime.current = 1.0;
    }
  });

  // Skin/cloth palette
  const TUNIC = '#2f7d32';
  const TUNIC_DARK = '#225a25';
  const SKIN = '#f5cfa8';
  const HAIR = '#f5d76e';
  const BELT = '#5a3a1c';
  const BOOT = '#3a2412';
  const STEEL = '#e9eef5';
  const STEEL_DARK = '#9aa6b3';
  const GOLD = '#d8b24a';
  const SHIELD_BLUE = '#1e5fa8';

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group ref={bodyBobRef} position={[0, 0.5, 0]}>
        {/* Legs */}
        <mesh ref={leftLegRef} position={[-0.18, -0.05, 0]} castShadow>
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
        {/* Belt buckle */}
        <mesh position={[0, 0.22, 0.4]}>
          <boxGeometry args={[0.18, 0.14, 0.04]} />
          <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.4} />
        </mesh>

        {/* Tunic body */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.78, 0.78, 0.74]} />
          <meshStandardMaterial color={TUNIC} />
        </mesh>
        {/* Tunic V-collar accent */}
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
          {/* Shield rim */}
          <mesh position={[0, 0, 0.045]}>
            <boxGeometry args={[0.5, 0.65, 0.02]} />
            <meshStandardMaterial color={GOLD} metalness={0.3} roughness={0.5} />
          </mesh>
          {/* Shield emblem */}
          <mesh position={[0, 0.05, 0.06]}>
            <boxGeometry args={[0.18, 0.32, 0.02]} />
            <meshStandardMaterial color={STEEL} />
          </mesh>
        </group>

        {/* Left arm (free) */}
        <group ref={leftArmRef} position={[-0.5, 0.85, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.22, 0.5, 0.24]} />
            <meshStandardMaterial color={TUNIC} />
          </mesh>
          {/* Hand */}
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
          {/* Hand */}
          <mesh position={[0, -0.52, 0]} castShadow>
            <boxGeometry args={[0.22, 0.18, 0.24]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
          {/* Sword - lives in the hand so swing follows naturally */}
          <group ref={swordRef} position={[0, -0.55, 0]} visible={false}>
            {/* Hilt */}
            <mesh position={[0, -0.05, 0]} castShadow>
              <boxGeometry args={[0.08, 0.18, 0.08]} />
              <meshStandardMaterial color={BELT} />
            </mesh>
            {/* Pommel */}
            <mesh position={[0, -0.18, 0]} castShadow>
              <boxGeometry args={[0.12, 0.08, 0.12]} />
              <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.4} />
            </mesh>
            {/* Crossguard */}
            <mesh position={[0, 0.05, 0]} castShadow>
              <boxGeometry args={[0.34, 0.06, 0.12]} />
              <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.4} />
            </mesh>
            {/* Blade */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.1, 0.85, 0.04]} />
              <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.25} />
            </mesh>
            {/* Blade fuller (darker stripe) */}
            <mesh position={[0, 0.5, 0.022]}>
              <boxGeometry args={[0.03, 0.78, 0.005]} />
              <meshStandardMaterial color={STEEL_DARK} />
            </mesh>
            {/* Tip — used for hit detection */}
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
        {/* Hair fringe */}
        <mesh position={[0, 1.55, 0.28]}>
          <boxGeometry args={[0.62, 0.18, 0.08]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        {/* Sideburn tufts */}
        <mesh position={[-0.32, 1.32, 0.18]}>
          <boxGeometry args={[0.06, 0.34, 0.18]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        <mesh position={[0.32, 1.32, 0.18]}>
          <boxGeometry args={[0.06, 0.34, 0.18]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.34, 1.34, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.05, 0.18, 0.14]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position={[0.34, 1.34, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.05, 0.18, 0.14]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.14, 1.34, 0.32]}>
          <boxGeometry args={[0.08, 0.1, 0.02]} />
          <meshStandardMaterial color="#1a1a2a" />
        </mesh>
        <mesh position={[0.14, 1.34, 0.32]}>
          <boxGeometry args={[0.08, 0.1, 0.02]} />
          <meshStandardMaterial color="#1a1a2a" />
        </mesh>

        {/* Hat — base band */}
        <mesh position={[0, 1.66, 0]} castShadow>
          <boxGeometry args={[0.66, 0.14, 0.64]} />
          <meshStandardMaterial color={TUNIC} />
        </mesh>
        {/* Hat — pointed cone, droops back slightly */}
        <mesh ref={hatTipRef} position={[0, 1.78, -0.05]} rotation={[0.35, 0, 0]} castShadow>
          <coneGeometry args={[0.34, 0.95, 4]} />
          <meshStandardMaterial color={TUNIC} />
        </mesh>
      </group>
    </group>
  );
}
