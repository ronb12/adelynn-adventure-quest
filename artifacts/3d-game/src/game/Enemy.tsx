import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, AreaId } from './store';
import { hitZones } from './hitZones';

const WORLD_SIZE = 50;

// ── Enemy config by area ─────────────────────────────────────────
const AREA_CONFIG: Record<AreaId, { count: number; maxHp: number; speed: [number, number]; body: string; accent: string; chaseRange: number }[]> = {
  field: [
    { count: 6, maxHp: 2, speed: [1.4, 2.4], body: '#b22a4e', accent: '#7a1633', chaseRange: 8 },
  ],
  forest: [
    { count: 8, maxHp: 2, speed: [2.0, 3.2], body: '#442266', accent: '#220033', chaseRange: 12 },
  ],
  desert: [
    { count: 5, maxHp: 3, speed: [0.9, 1.5], body: '#886644', accent: '#553322', chaseRange: 6 },
    { count: 3, maxHp: 2, speed: [2.0, 2.8], body: '#cc6600', accent: '#884400', chaseRange: 10 },
  ],
};

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
  wobble: number;
  body: string;
  chaseRange: number;
  baseColor: THREE.Color;
}

function seeded(n: number, s: number) {
  const x = Math.sin(n + s) * 43758.5453;
  return x - Math.floor(x);
}

// ── Enemy mesh by area ───────────────────────────────────────────

function FieldEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <>
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.55, 20, 16]} />
        <meshStandardMaterial color={palette.body} roughness={0.65} />
      </mesh>
      {[0,1,2,3,4,5].map(i => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a)*0.42, 0.25, Math.sin(a)*0.42]} rotation={[0, -a, 0]}>
            <coneGeometry args={[0.16, 0.45, 6]} />
            <meshStandardMaterial color={palette.accent} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.12, 0]}>
        <coneGeometry args={[0.14, 0.22, 6]} />
        <meshStandardMaterial color={palette.accent} />
      </mesh>
      <mesh position={[0.22, 0.7, 0.42]}><sphereGeometry args={[0.13]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[-0.22, 0.7, 0.42]}><sphereGeometry args={[0.13]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[0.24, 0.7, 0.52]}><sphereGeometry args={[0.06]} /><meshStandardMaterial color="#15131e" /></mesh>
      <mesh position={[-0.2, 0.7, 0.52]}><sphereGeometry args={[0.06]} /><meshStandardMaterial color="#15131e" /></mesh>
      <mesh position={[0.22, 0.88, 0.45]} rotation={[0,0,-0.4]}><boxGeometry args={[0.18,0.04,0.04]} /><meshStandardMaterial color={palette.accent} /></mesh>
      <mesh position={[-0.22, 0.88, 0.45]} rotation={[0,0,0.4]}><boxGeometry args={[0.18,0.04,0.04]} /><meshStandardMaterial color={palette.accent} /></mesh>
    </>
  );
}

function ForestEnemy({ palette }: { palette: { body: string; accent: string } }) {
  // Bat-like winged creature
  return (
    <>
      {/* Body */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.45, 14, 12]} />
        <meshStandardMaterial color={palette.body} roughness={0.7} />
      </mesh>
      {/* Wings */}
      <mesh castShadow position={[-0.85, 0.8, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.9, 0.08, 0.7]} />
        <meshStandardMaterial color={palette.accent} />
      </mesh>
      <mesh castShadow position={[0.85, 0.8, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.9, 0.08, 0.7]} />
        <meshStandardMaterial color={palette.accent} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.22, 1.28, 0]} rotation={[0,0,-0.3]}>
        <coneGeometry args={[0.1, 0.35, 5]} />
        <meshStandardMaterial color={palette.body} />
      </mesh>
      <mesh position={[0.22, 1.28, 0]} rotation={[0,0,0.3]}>
        <coneGeometry args={[0.1, 0.35, 5]} />
        <meshStandardMaterial color={palette.body} />
      </mesh>
      {/* Eyes (glowing) */}
      <mesh position={[-0.18, 0.88, 0.38]}>
        <sphereGeometry args={[0.09]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.18, 0.88, 0.38]}>
        <sphereGeometry args={[0.09]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
      <pointLight color="#ff0000" intensity={0.8} distance={3} decay={2} />
    </>
  );
}

function DesertEnemy({ palette }: { palette: { body: string; accent: string } }) {
  // Armored sand knight
  return (
    <>
      {/* Armored body */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[0.7, 0.9, 0.6]} />
        <meshStandardMaterial color={palette.body} roughness={0.55} metalness={0.4} />
      </mesh>
      {/* Shoulder pads */}
      <mesh castShadow position={[-0.48, 0.88, 0]}>
        <boxGeometry args={[0.22, 0.22, 0.5]} />
        <meshStandardMaterial color={palette.accent} metalness={0.3} />
      </mesh>
      <mesh castShadow position={[0.48, 0.88, 0]}>
        <boxGeometry args={[0.22, 0.22, 0.5]} />
        <meshStandardMaterial color={palette.accent} metalness={0.3} />
      </mesh>
      {/* Helm head */}
      <mesh castShadow position={[0, 1.35, 0]}>
        <boxGeometry args={[0.6, 0.55, 0.58]} />
        <meshStandardMaterial color={palette.accent} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Visor slit */}
      <mesh position={[0, 1.35, 0.3]}>
        <boxGeometry args={[0.4, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a1200" />
      </mesh>
      {/* Spear */}
      <mesh castShadow position={[0.5, 0.9, -0.6]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.5, 6]} />
        <meshStandardMaterial color="#8a6644" />
      </mesh>
      <mesh position={[0.5, 0.9, -1.9]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.1, 0.4, 5]} />
        <meshStandardMaterial color="#ccccaa" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Legs */}
      <mesh castShadow position={[-0.2, 0.2, 0]}>
        <boxGeometry args={[0.26, 0.55, 0.5]} />
        <meshStandardMaterial color={palette.accent} metalness={0.3} />
      </mesh>
      <mesh castShadow position={[0.2, 0.2, 0]}>
        <boxGeometry args={[0.26, 0.55, 0.5]} />
        <meshStandardMaterial color={palette.accent} metalness={0.3} />
      </mesh>
    </>
  );
}

// ── Enemies component ────────────────────────────────────────────
export function Enemies() {
  const groupRef     = useRef<THREE.Group>(null);
  const damagePlayer = useGameStore(state => state.damagePlayer);
  const currentArea  = useGameStore(state => state.currentArea);

  const { enemies, meshDefs } = useMemo(() => {
    const configs = AREA_CONFIG[currentArea];
    const enemies: EnemyData[] = [];
    const meshDefs: { type: AreaId; palette: { body: string; accent: string } }[] = [];

    let idCounter = 0;
    configs.forEach((cfg, ci) => {
      for (let i = 0; i < cfg.count; i++) {
        const n = idCounter++;
        const angle = (n / 12) * Math.PI * 2 + ci;
        const r = 8 + seeded(n, 42) * 18;
        enemies.push({
          id: n,
          pos: new THREE.Vector3(Math.cos(angle)*r, 0, Math.sin(angle)*r),
          dir: new THREE.Vector3(seeded(n,1)-0.5, 0, seeded(n,2)-0.5).normalize(),
          hp: cfg.maxHp, maxHp: cfg.maxHp,
          speed: cfg.speed[0] + seeded(n,3) * (cfg.speed[1]-cfg.speed[0]),
          changeDirTimer: seeded(n,4) * 2,
          isHit: false, hitTimer: 0, invulnTimer: 0, stunTimer: 0,
          wobble: seeded(n,5) * Math.PI * 2,
          body: cfg.body, chaseRange: cfg.chaseRange,
          baseColor: new THREE.Color(cfg.body),
        });
        meshDefs.push({ type: currentArea, palette: { body: cfg.body, accent: cfg.accent } });
      }
    });
    return { enemies, meshDefs };
  }, [currentArea]);

  const enemiesRef = useRef<EnemyData[]>(enemies);
  // Reset when area changes
  if (enemiesRef.current.length !== enemies.length ||
      (enemiesRef.current[0] && enemies[0] && enemiesRef.current[0].body !== enemies[0].body)) {
    enemiesRef.current = enemies;
  }

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing' || !groupRef.current) return;
    const { playerPosition, swordActive, swordPosition } = store;
    const t = state.clock.elapsedTime;

    enemiesRef.current.forEach((enemy, index) => {
      const child = groupRef.current!.children[index] as THREE.Group | undefined;
      if (!child) return;

      if (enemy.hp <= 0) { child.visible = false; return; }

      // Stun
      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= delta;
        // Flash blue when stunned
        const body = child.children[0] as THREE.Mesh;
        if (body.material) (body.material as THREE.MeshStandardMaterial).color.setHex(0x4488ff);
        child.position.x = enemy.pos.x;
        child.position.z = enemy.pos.z;
        child.visible = true;
        return;
      }

      // AI
      enemy.changeDirTimer -= delta;
      if (enemy.changeDirTimer <= 0) {
        enemy.changeDirTimer = 1.2 + Math.random() * 2;
        if (Math.random() > 0.4 && enemy.pos.distanceTo(playerPosition) < enemy.chaseRange) {
          enemy.dir.copy(playerPosition).sub(enemy.pos).setY(0).normalize();
        } else {
          enemy.dir.set(Math.random()-0.5, 0, Math.random()-0.5).normalize();
        }
      }

      enemy.pos.addScaledVector(enemy.dir, enemy.speed * delta);
      enemy.pos.x = THREE.MathUtils.clamp(enemy.pos.x, -27, 27);
      enemy.pos.z = THREE.MathUtils.clamp(enemy.pos.z, -27, 27);

      if (enemy.hitTimer > 0) { enemy.hitTimer -= delta; if (enemy.hitTimer <= 0) enemy.isHit = false; }
      if (enemy.invulnTimer > 0) enemy.invulnTimer -= delta;

      // Update mesh
      const wobbleY = Math.abs(Math.sin(t * 4 + enemy.wobble)) * 0.06;
      child.position.set(enemy.pos.x, wobbleY, enemy.pos.z);
      child.rotation.y = Math.atan2(enemy.dir.x, enemy.dir.z);
      child.visible = true;

      // Body squish
      const body = child.children[0] as THREE.Mesh;
      if (body && body.scale) {
        const sq = 1 + Math.sin(t * 5 + enemy.wobble) * 0.06;
        body.scale.set(sq, 2 - sq, sq);
      }
      // Flash color
      if (body && body.material) {
        const mat = body.material as THREE.MeshStandardMaterial;
        if (enemy.isHit) {
          mat.color.setHex(0xffffff); mat.emissive.setHex(0xff8888);
        } else {
          mat.color.copy(enemy.baseColor); mat.emissive.setHex(0x000000);
        }
      }

      // ── Sword hit ──
      if (swordActive && enemy.invulnTimer <= 0 && enemy.pos.distanceTo(swordPosition) < 1.5) {
        enemy.hp -= 1; enemy.isHit = true; enemy.hitTimer = 0.2; enemy.invulnTimer = 0.5;
        enemy.dir.copy(enemy.pos).sub(swordPosition).setY(0).normalize();
        enemy.pos.addScaledVector(enemy.dir, 1.2);
        if (enemy.hp <= 0) child.visible = false;
      }

      // ── Arrow hits ──
      for (const zone of hitZones.arrows) {
        if (enemy.invulnTimer <= 0 && enemy.pos.distanceTo(zone.pos) < zone.radius) {
          enemy.hp -= 1; enemy.isHit = true; enemy.hitTimer = 0.2; enemy.invulnTimer = 0.5;
          enemy.dir.copy(enemy.pos).sub(zone.pos).setY(0).normalize();
          enemy.pos.addScaledVector(enemy.dir, 0.8);
          if (enemy.hp <= 0) child.visible = false;
          break;
        }
      }

      // ── Boomerang hit (stuns) ──
      if (hitZones.boomerang && enemy.invulnTimer <= 0) {
        if (enemy.pos.distanceTo(hitZones.boomerang.pos) < hitZones.boomerang.radius) {
          enemy.stunTimer = 2.0; enemy.invulnTimer = 0.4;
        }
      }

      // ── Bomb explosion ──
      for (const zone of hitZones.explosions) {
        if (enemy.pos.distanceTo(zone.pos) < zone.radius) {
          enemy.hp = 0; child.visible = false; break;
        }
      }

      // ── Player collision ──
      if (enemy.pos.distanceTo(playerPosition) < 1.2 && !enemy.isHit && enemy.hp > 0 && enemy.stunTimer <= 0) {
        damagePlayer(0.5);
        enemy.dir.multiplyScalar(-1);
        enemy.pos.addScaledVector(enemy.dir, 0.6);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {meshDefs.map((def, i) => (
        <group key={`e-${i}`}>
          {def.type === 'field'  && <FieldEnemy  palette={def.palette} />}
          {def.type === 'forest' && <ForestEnemy palette={def.palette} />}
          {def.type === 'desert' && <DesertEnemy palette={def.palette} />}
        </group>
      ))}
    </group>
  );
}
