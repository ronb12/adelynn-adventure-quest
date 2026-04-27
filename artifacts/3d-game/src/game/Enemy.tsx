import { useRef, useMemo } from 'react';
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
  wobble: number;
  baseColor: THREE.Color;
}

const PALETTES = [
  { body: '#b22a4e', accent: '#7a1633' },
  { body: '#7a3aa0', accent: '#4a1f66' },
  { body: '#c25a1e', accent: '#7a360e' },
  { body: '#1f8a8a', accent: '#0f5252' },
];

export function Enemies() {
  const enemiesRef = useRef<EnemyData[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const damagePlayer = useGameStore(state => state.damagePlayer);

  // Stable random seeds
  const seeds = useMemo(() => {
    return Array.from({ length: ENEMY_COUNT }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * WORLD_SIZE,
      z: (Math.random() - 0.5) * WORLD_SIZE,
      dirX: Math.random() - 0.5,
      dirZ: Math.random() - 0.5,
      speed: 1.5 + Math.random(),
      timer: Math.random() * 2,
      palette: PALETTES[i % PALETTES.length],
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  // Initialize enemies once
  if (enemiesRef.current.length === 0) {
    seeds.forEach((s) => {
      enemiesRef.current.push({
        id: s.id,
        pos: new THREE.Vector3(s.x, 0, s.z),
        dir: new THREE.Vector3(s.dirX, 0, s.dirZ).normalize(),
        hp: 2,
        speed: s.speed,
        changeDirTimer: s.timer,
        isHit: false,
        hitTimer: 0,
        invulnTimer: 0,
        wobble: s.phase,
        baseColor: new THREE.Color(s.palette.body),
      });
    });
  }

  useFrame((state, delta) => {
    const { playerPosition, gameState, swordActive, swordPosition } = useGameStore.getState();

    if (gameState !== 'playing' || !groupRef.current) return;

    const t = state.clock.elapsedTime;

    enemiesRef.current.forEach((enemy, index) => {
      const child = groupRef.current!.children[index] as THREE.Group | undefined;
      if (!child) return;

      if (enemy.hp <= 0) {
        child.visible = false;
        return;
      }

      // Simple AI
      enemy.changeDirTimer -= delta;
      if (enemy.changeDirTimer <= 0) {
        enemy.changeDirTimer = 1 + Math.random() * 2;
        if (Math.random() > 0.5 && enemy.pos.distanceTo(playerPosition) < 10) {
          enemy.dir.copy(playerPosition).sub(enemy.pos).setY(0).normalize();
        } else {
          enemy.dir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        }
      }

      enemy.pos.addScaledVector(enemy.dir, enemy.speed * delta);
      enemy.pos.x = THREE.MathUtils.clamp(enemy.pos.x, -28, 28);
      enemy.pos.z = THREE.MathUtils.clamp(enemy.pos.z, -28, 28);

      if (enemy.hitTimer > 0) {
        enemy.hitTimer -= delta;
        if (enemy.hitTimer <= 0) enemy.isHit = false;
      }
      if (enemy.invulnTimer > 0) enemy.invulnTimer -= delta;

      // Position + face direction
      child.position.x = enemy.pos.x;
      child.position.z = enemy.pos.z;
      child.position.y = Math.abs(Math.sin(t * 4 + enemy.wobble)) * 0.08;
      child.rotation.y = Math.atan2(enemy.dir.x, enemy.dir.z);
      child.visible = true;

      // Body wobble
      const body = child.children[0] as THREE.Mesh;
      const squish = 1 + Math.sin(t * 5 + enemy.wobble) * 0.06;
      body.scale.set(squish, 2 - squish, squish);

      // Tentacle flap
      for (let i = 1; i <= 6; i++) {
        const tent = child.children[i] as THREE.Mesh | undefined;
        if (tent) {
          tent.rotation.x = Math.sin(t * 6 + i + enemy.wobble) * 0.4;
        }
      }

      // Color flash on hit
      const mat = body.material as THREE.MeshStandardMaterial;
      if (enemy.isHit) {
        mat.color.setHex(0xffffff);
        mat.emissive.setHex(0xff8888);
      } else {
        mat.color.copy(enemy.baseColor);
        mat.emissive.setHex(0x000000);
      }

      // Sword collision
      if (swordActive && enemy.invulnTimer <= 0 && enemy.pos.distanceTo(swordPosition) < 1.5) {
        enemy.hp -= 1;
        enemy.isHit = true;
        enemy.hitTimer = 0.2;
        enemy.invulnTimer = 0.5;
        enemy.dir.copy(enemy.pos).sub(swordPosition).setY(0).normalize();
        enemy.pos.addScaledVector(enemy.dir, 1.0);

        if (enemy.hp <= 0) {
          child.visible = false;
        }
      }

      // Player collision
      if (enemy.pos.distanceTo(playerPosition) < 1.2 && !enemy.isHit && enemy.hp > 0) {
        damagePlayer(0.5);
        enemy.dir.multiplyScalar(-1);
        enemy.pos.addScaledVector(enemy.dir, 0.5);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {seeds.map((seed) => {
        const palette = seed.palette;
        return (
          <group key={seed.id} position={[seed.x, 0, seed.z]}>
            {/* Body — index 0 */}
            <mesh castShadow position={[0, 0.55, 0]}>
              <sphereGeometry args={[0.55, 20, 16]} />
              <meshStandardMaterial color={palette.body} roughness={0.65} />
            </mesh>

            {/* Tentacles — indices 1..6 */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              const r = 0.42;
              return (
                <mesh
                  key={i}
                  castShadow
                  position={[Math.cos(angle) * r, 0.25, Math.sin(angle) * r]}
                  rotation={[0, -angle, 0]}
                >
                  <coneGeometry args={[0.16, 0.45, 6]} />
                  <meshStandardMaterial color={palette.accent} roughness={0.7} />
                </mesh>
              );
            })}

            {/* Spout on top — index 7 */}
            <mesh position={[0, 1.12, 0]}>
              <coneGeometry args={[0.14, 0.22, 6]} />
              <meshStandardMaterial color={palette.accent} />
            </mesh>

            {/* Eye whites — indices 8, 9 */}
            <mesh position={[0.22, 0.7, 0.42]}>
              <sphereGeometry args={[0.13, 12, 12]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-0.22, 0.7, 0.42]}>
              <sphereGeometry args={[0.13, 12, 12]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* Pupils — indices 10, 11 */}
            <mesh position={[0.24, 0.7, 0.52]}>
              <sphereGeometry args={[0.06, 10, 10]} />
              <meshStandardMaterial color="#15131e" />
            </mesh>
            <mesh position={[-0.2, 0.7, 0.52]}>
              <sphereGeometry args={[0.06, 10, 10]} />
              <meshStandardMaterial color="#15131e" />
            </mesh>

            {/* Angry brow — indices 12, 13 */}
            <mesh position={[0.22, 0.88, 0.45]} rotation={[0, 0, -0.4]}>
              <boxGeometry args={[0.18, 0.04, 0.04]} />
              <meshStandardMaterial color={palette.accent} />
            </mesh>
            <mesh position={[-0.22, 0.88, 0.45]} rotation={[0, 0, 0.4]}>
              <boxGeometry args={[0.18, 0.04, 0.04]} />
              <meshStandardMaterial color={palette.accent} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
