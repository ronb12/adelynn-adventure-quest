import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './store';

const ENEMY_COUNT = 6;
const WORLD_SIZE = 50;

interface EnemyData {
  id: number;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  hp: number;
  speed: number;
  changeDirTimer: number;
  isHit: boolean;
  hitTimer: number;
  invulnTimer: number;
}

export function Enemies() {
  const enemiesRef = useRef<EnemyData[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const damagePlayer = useGameStore(state => state.damagePlayer);

  // Initialize enemies
  if (enemiesRef.current.length === 0) {
    for (let i = 0; i < ENEMY_COUNT; i++) {
      enemiesRef.current.push({
        id: i,
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * WORLD_SIZE,
          0.5,
          (Math.random() - 0.5) * WORLD_SIZE
        ),
        dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        hp: 2,
        speed: 1.5 + Math.random(),
        changeDirTimer: Math.random() * 2,
        isHit: false,
        hitTimer: 0,
        invulnTimer: 0,
      });
    }
  }

  useFrame((state, delta) => {
    const { playerPosition, gameState, swordActive, swordPosition } = useGameStore.getState();
    
    if (gameState !== 'playing' || !groupRef.current) return;

    enemiesRef.current.forEach((enemy, index) => {
      if (enemy.hp <= 0) return;

      // Simple AI
      enemy.changeDirTimer -= delta;
      if (enemy.changeDirTimer <= 0) {
        enemy.changeDirTimer = 1 + Math.random() * 2;
        // 50% chance to chase player if close
        if (Math.random() > 0.5 && enemy.pos.distanceTo(playerPosition) < 10) {
          enemy.dir.copy(playerPosition).sub(enemy.pos).normalize();
        } else {
          enemy.dir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        }
      }

      enemy.pos.addScaledVector(enemy.dir, enemy.speed * delta);
      enemy.pos.x = THREE.MathUtils.clamp(enemy.pos.x, -25, 25);
      enemy.pos.z = THREE.MathUtils.clamp(enemy.pos.z, -25, 25);

      // Hit effect timer
      if (enemy.hitTimer > 0) {
        enemy.hitTimer -= delta;
        if (enemy.hitTimer <= 0) {
          enemy.isHit = false;
        }
      }
      if (enemy.invulnTimer > 0) {
        enemy.invulnTimer -= delta;
      }

      // Update mesh position
      const child = groupRef.current!.children[index];
      if (child) {
        child.position.copy(enemy.pos);
        child.visible = enemy.hp > 0;
        
        // Face direction
        child.rotation.y = Math.atan2(enemy.dir.x, enemy.dir.z);

        // Flash white if hit
        const material = (child.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
        material.color.setHex(enemy.isHit ? 0xffffff : 0xaa2244);
      }

      // Sword collision
      if (swordActive && enemy.invulnTimer <= 0 && enemy.pos.distanceTo(swordPosition) < 1.5) {
        enemy.hp -= 1;
        enemy.isHit = true;
        enemy.hitTimer = 0.2;
        enemy.invulnTimer = 0.5;
        enemy.dir.copy(enemy.pos).sub(swordPosition).normalize(); // knockback
        enemy.pos.addScaledVector(enemy.dir, 1.0);
        
        if (enemy.hp <= 0 && child) {
          child.visible = false;
        }
      }

      // Player collision
      if (enemy.pos.distanceTo(playerPosition) < 1.2 && !enemy.isHit && enemy.hp > 0) {
        damagePlayer(0.5);
        enemy.dir.multiplyScalar(-1); // bounce back
        enemy.pos.addScaledVector(enemy.dir, 0.5);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {enemiesRef.current.map((enemy) => (
        <group key={enemy.id} position={enemy.pos}>
          {/* Blob Body */}
          <mesh castShadow position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial color="#aa2244" />
          </mesh>
          {/* Eyes */}
          <mesh position={[0.25, 0.4, 0.45]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.25, 0.4, 0.45]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
