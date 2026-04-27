import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from './controls';
import { useGameStore } from './store';

const SPEED = 5;

export function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const swordRef = useRef<THREE.Group>(null);
  const [subscribe, getState] = useKeyboardControls<Controls>();
  const isSwinging = useRef(false);
  const swingTime = useRef(0);
  const invulnTime = useRef(0);

  const pos = useRef(new THREE.Vector3(0, 0.5, 0));
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3(0, 0, -1));
  const swordWorldPos = useRef(new THREE.Vector3());

  const chestPos = new THREE.Vector3(0, 0.5, -25);

  useFrame((state, delta) => {
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

    if (velocity.current.lengthSq() > 0) {
      velocity.current.normalize();
      pos.current.addScaledVector(velocity.current, SPEED * delta);
      
      // Face movement direction
      direction.current.copy(velocity.current);
      const angle = Math.atan2(direction.current.x, direction.current.z);
      if (groupRef.current) {
        groupRef.current.rotation.y = angle;
      }
    }

    // Clamp to bounds
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -29, 29);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -29, 29);

    if (groupRef.current) {
      groupRef.current.position.copy(pos.current);
    }
    useGameStore.getState().setPlayerPosition(pos.current);

    // Interact with Chest
    if (interact && pos.current.distanceTo(chestPos) < 3) {
      useGameStore.getState().setGameState('victory');
    }

    // Sword attack
    if (attack && !isSwinging.current) {
      isSwinging.current = true;
      swingTime.current = 0;
    }

    if (isSwinging.current && swordRef.current) {
      swingTime.current += delta;
      const progress = swingTime.current / 0.25;
      
      if (progress >= 1) {
        isSwinging.current = false;
        swordRef.current.rotation.y = 0;
        swordRef.current.visible = false;
        useGameStore.getState().setSwordState(false, swordWorldPos.current);
      } else {
        swordRef.current.visible = true;
        swordRef.current.rotation.y = THREE.MathUtils.lerp(Math.PI / 2, -Math.PI / 2, progress);
        
        // Update world position for collision
        swordRef.current.children[0].getWorldPosition(swordWorldPos.current);
        useGameStore.getState().setSwordState(true, swordWorldPos.current);
      }
    }
  });

  // Export method to trigger invulnerability externally
  useGameStore.subscribe((state, prevState) => {
    if (state.hearts < prevState.hearts && state.hearts > 0) {
      invulnTime.current = 1.0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshStandardMaterial color="#2d8a2d" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color="#ffccaa" />
      </mesh>
      {/* Hat */}
      <mesh position={[0, 1.8, -0.1]} rotation={[0.2, 0, 0]} castShadow>
        <coneGeometry args={[0.4, 0.8, 4]} />
        <meshStandardMaterial color="#2d8a2d" />
      </mesh>

      {/* Sword */}
      <group ref={swordRef} position={[0.5, 0.5, -0.5]} visible={false}>
        <mesh position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 1.5, 0.2]} />
          <meshStandardMaterial color="#dddddd" />
        </mesh>
      </group>
    </group>
  );
}
