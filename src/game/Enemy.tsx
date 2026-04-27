import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, AreaId } from './store';
import { hitZones } from './hitZones';
import { sfxHit, sfxDeath } from './AudioManager';

// ── Area config ─────────────────────────────────────────────────
const AREA_CONFIG: Record<AreaId, {
  count: number; maxHp: number; speed: [number, number];
  body: string; accent: string; chaseRange: number;
}[]> = {
  field:  [{ count: 6, maxHp: 2, speed: [1.4, 2.5], body: '#c0392b', accent: '#922b21', chaseRange: 8 }],
  forest: [{ count: 8, maxHp: 2, speed: [2.0, 3.2], body: '#4a235a', accent: '#6c3483', chaseRange: 12 }],
  desert: [
    { count: 5, maxHp: 3, speed: [0.9, 1.5], body: '#a04020', accent: '#c0703a', chaseRange: 6 },
    { count: 3, maxHp: 2, speed: [2.0, 2.8], body: '#b7770d', accent: '#f0b03a', chaseRange: 10 },
  ],
};

// ── Visual meshes ────────────────────────────────────────────────

/** Slime / blob — field enemy */
function SlimeEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      {/* Main body — large squashed sphere */}
      <mesh castShadow position={[0, 0.52, 0]} scale={[1, 0.72, 1]}>
        <sphereGeometry args={[0.58, 20, 16]} />
        <meshStandardMaterial color={palette.body} roughness={0.45} transparent opacity={0.92} />
      </mesh>
      {/* Highlight dome */}
      <mesh position={[0.12, 0.72, 0.32]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.18} roughness={0} />
      </mesh>
      {/* Eye blobs */}
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
      {/* Brow ridges (angry) */}
      <mesh position={[-0.21, 0.76, 0.52]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.035, 0.035, 0.14, 5]} />
        <meshStandardMaterial color={palette.accent} />
      </mesh>
      <mesh position={[0.21, 0.76, 0.52]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.035, 0.035, 0.14, 5]} />
        <meshStandardMaterial color={palette.accent} />
      </mesh>
      {/* Drool drop */}
      <mesh position={[0, 0.3, 0.56]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color={palette.body} transparent opacity={0.8} />
      </mesh>
      {/* Tentacle nubs */}
      {[0,1,2,3,4,5].map(i => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} castShadow
            position={[Math.cos(a)*0.52, 0.15, Math.sin(a)*0.52]}
            rotation={[0, -a, 0.35]}>
            <coneGeometry args={[0.1, 0.3, 6]} />
            <meshStandardMaterial color={palette.accent} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Bat — forest enemy */
function BatEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      {/* Fur body */}
      <mesh castShadow position={[0, 0.76, 0]}>
        <sphereGeometry args={[0.42, 16, 13]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      {/* Belly */}
      <mesh position={[0, 0.7, 0.28]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color={palette.accent} roughness={0.9} />
      </mesh>
      {/* Left wing */}
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
      {/* Right wing */}
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
      {/* Ears */}
      <mesh castShadow position={[-0.2, 1.17, 0]} rotation={[0, 0, -0.25]}>
        <coneGeometry args={[0.1, 0.35, 7]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.2, 1.17, 0]} rotation={[0, 0, 0.25]}>
        <coneGeometry args={[0.1, 0.35, 7]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      {/* Inner ears */}
      <mesh position={[-0.2, 1.18, 0.04]} rotation={[0, 0, -0.25]}>
        <coneGeometry args={[0.06, 0.22, 6]} />
        <meshStandardMaterial color="#c06080" />
      </mesh>
      <mesh position={[0.2, 1.18, 0.04]} rotation={[0, 0, 0.25]}>
        <coneGeometry args={[0.06, 0.22, 6]} />
        <meshStandardMaterial color="#c06080" />
      </mesh>
      {/* Glowing eyes */}
      <mesh position={[-0.17, 0.86, 0.37]}>
        <sphereGeometry args={[0.085, 10, 8]} />
        <meshStandardMaterial color="#ff1100" emissive="#ff0000" emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[0.17, 0.86, 0.37]}>
        <sphereGeometry args={[0.085, 10, 8]} />
        <meshStandardMaterial color="#ff1100" emissive="#ff0000" emissiveIntensity={2.5} />
      </mesh>
      {/* Fangs */}
      <mesh position={[-0.09, 0.58, 0.4]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.035, 0.14, 4]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      <mesh position={[0.09, 0.58, 0.4]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.035, 0.14, 4]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      <pointLight color="#8800ff" intensity={0.8} distance={4} decay={2} position={[0, 0.7, 0]} />
    </group>
  );
}

/** Armored sand knight — desert enemy */
function KnightEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      {/* Legs — cylinder shins */}
      <mesh castShadow position={[-0.18, 0.22, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.48, 10]} />
        <meshStandardMaterial color={palette.body} metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh castShadow position={[0.18, 0.22, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.48, 10]} />
        <meshStandardMaterial color={palette.body} metalness={0.5} roughness={0.45} />
      </mesh>
      {/* Feet/sabatons */}
      <mesh castShadow position={[-0.18, -0.02, 0.1]} scale={[1.1, 0.55, 1.4]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color={palette.accent} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0.18, -0.02, 0.1]} scale={[1.1, 0.55, 1.4]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color={palette.accent} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Chest plate — barrel */}
      <mesh castShadow position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.36, 0.32, 0.72, 14]} />
        <meshStandardMaterial color={palette.body} metalness={0.55} roughness={0.42} />
      </mesh>
      {/* Pauldrons (shoulder spheres) */}
      <mesh castShadow position={[-0.5, 0.95, 0]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color={palette.accent} metalness={0.6} roughness={0.38} />
      </mesh>
      <mesh castShadow position={[0.5, 0.95, 0]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color={palette.accent} metalness={0.6} roughness={0.38} />
      </mesh>
      {/* Upper arms */}
      <mesh castShadow position={[-0.52, 0.72, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.38, 9]} />
        <meshStandardMaterial color={palette.body} metalness={0.5} roughness={0.45} />
      </mesh>
      {/* Shield arm */}
      <group position={[-0.52, 0.52, 0.22]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.38, 9]} />
          <meshStandardMaterial color={palette.body} metalness={0.5} roughness={0.45} />
        </mesh>
        {/* Shield */}
        <mesh castShadow position={[0, 0, 0.3]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.28, 0.07, 16]} />
          <meshStandardMaterial color={palette.accent} metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.36]}>
          <cylinderGeometry args={[0.12, 0.1, 0.03, 12]} />
          <meshStandardMaterial color="#f0d060" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
      {/* Spear arm */}
      <group position={[0.52, 0.75, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.11, 0.1, 0.36, 9]} />
          <meshStandardMaterial color={palette.body} metalness={0.5} roughness={0.45} />
        </mesh>
        {/* Spear shaft */}
        <mesh castShadow position={[0.08, 0.1, -0.65]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 2.2, 7]} />
          <meshStandardMaterial color="#7a5533" roughness={0.85} />
        </mesh>
        {/* Spear tip */}
        <mesh castShadow position={[0.08, 0.1, -1.85]} rotation={[Math.PI/2, 0, 0]}>
          <coneGeometry args={[0.07, 0.38, 5]} />
          <meshStandardMaterial color="#ccccbb" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>
      {/* Helmet */}
      <mesh castShadow position={[0, 1.37, 0]}>
        <sphereGeometry args={[0.36, 16, 13]} />
        <meshStandardMaterial color={palette.body} metalness={0.55} roughness={0.4} />
      </mesh>
      {/* Visor */}
      <mesh castShadow position={[0, 1.32, 0.28]} scale={[1.1, 0.5, 1]}>
        <sphereGeometry args={[0.25, 12, 10]} />
        <meshStandardMaterial color={palette.accent} metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Visor slit */}
      <mesh position={[0, 1.32, 0.38]}>
        <boxGeometry args={[0.32, 0.07, 0.02]} />
        <meshStandardMaterial color="#111100" />
      </mesh>
      {/* Crest */}
      <mesh castShadow position={[0, 1.74, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.07, 0.28, 7]} />
        <meshStandardMaterial color={palette.accent} metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
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
  wobble: number;
  chaseRange: number;
  baseColor: THREE.Color;
  dead: boolean;
}

function seeded(n: number, s: number) {
  const x = Math.sin(n * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ── Main Enemies component ───────────────────────────────────────
export function Enemies() {
  const groupRef     = useRef<THREE.Group>(null!);
  const damagePlayer = useGameStore(state => state.damagePlayer);
  const currentArea  = useGameStore(state => state.currentArea);

  const { enemies, meshDefs } = useMemo(() => {
    const configs = AREA_CONFIG[currentArea];
    const enemies: EnemyData[] = [];
    const meshDefs: { type: AreaId; palette: { body: string; accent: string } }[] = [];

    let idCounter = 0;
    configs.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const n = idCounter++;
        const angle = seeded(n, 1) * Math.PI * 2;
        const r = 8 + seeded(n, 2) * 16;
        enemies.push({
          id: n,
          pos: new THREE.Vector3(Math.cos(angle)*r, 0, Math.sin(angle)*r),
          dir: new THREE.Vector3(seeded(n,3)-0.5, 0, seeded(n,4)-0.5).normalize(),
          hp: cfg.maxHp, maxHp: cfg.maxHp,
          speed: cfg.speed[0] + seeded(n,5) * (cfg.speed[1]-cfg.speed[0]),
          changeDirTimer: seeded(n,6) * 2,
          isHit: false, hitTimer: 0, invulnTimer: 0, stunTimer: 0,
          wobble: seeded(n,7) * Math.PI * 2,
          chaseRange: cfg.chaseRange,
          baseColor: new THREE.Color(cfg.body),
          dead: false,
        });
        meshDefs.push({ type: currentArea, palette: { body: cfg.body, accent: cfg.accent } });
      }
    });
    return { enemies, meshDefs };
  }, [currentArea]);

  const enemiesRef = useRef<EnemyData[]>(enemies);
  enemiesRef.current = enemies; // sync on area change via key reset

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing' || !groupRef.current) return;
    const { playerPosition, swordActive, swordPosition } = store;
    const t = state.clock.elapsedTime;

    const children = groupRef.current.children;

    enemiesRef.current.forEach((enemy, index) => {
      const child = children[index] as THREE.Group | undefined;
      if (!child) return;

      if (enemy.dead) { child.visible = false; return; }

      // Stun
      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= delta;
        child.visible = true;
        child.position.set(enemy.pos.x, 0, enemy.pos.z);
        // Tint stun blue on the first mesh child
        const bodyMesh = child.children[0] as THREE.Mesh | undefined;
        if (bodyMesh?.material) {
          (bodyMesh.material as THREE.MeshStandardMaterial).color.setHex(0x4499ff);
          (bodyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x224488);
          (bodyMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
        }
        return;
      }

      // AI movement
      enemy.changeDirTimer -= delta;
      if (enemy.changeDirTimer <= 0) {
        enemy.changeDirTimer = 1.2 + Math.random() * 2;
        const distToPlayer = enemy.pos.distanceTo(playerPosition);
        if (Math.random() > 0.38 && distToPlayer < enemy.chaseRange) {
          enemy.dir.copy(playerPosition).sub(enemy.pos).setY(0).normalize();
        } else {
          enemy.dir.set(Math.random()-0.5, 0, Math.random()-0.5).normalize();
        }
      }

      enemy.pos.addScaledVector(enemy.dir, enemy.speed * delta);
      enemy.pos.x = THREE.MathUtils.clamp(enemy.pos.x, -27, 27);
      enemy.pos.z = THREE.MathUtils.clamp(enemy.pos.z, -27, 27);

      if (enemy.hitTimer > 0) {
        enemy.hitTimer -= delta;
        if (enemy.hitTimer <= 0) enemy.isHit = false;
      }
      if (enemy.invulnTimer > 0) enemy.invulnTimer -= delta;

      // Position & wobble
      const hoverY = currentArea === 'forest' ? 0.35 + Math.abs(Math.sin(t * 3 + enemy.wobble)) * 0.35 : 0;
      const squishY = 1 + Math.sin(t * 5 + enemy.wobble) * 0.06;
      child.position.set(enemy.pos.x, hoverY, enemy.pos.z);
      child.scale.set(1, squishY, 1);
      child.rotation.y = Math.atan2(enemy.dir.x, enemy.dir.z);
      child.visible = true;

      // Body color flash on hit
      const bodyMesh = child.children[0] as THREE.Mesh | undefined;
      if (bodyMesh?.material) {
        const mat = bodyMesh.material as THREE.MeshStandardMaterial;
        if (enemy.isHit) {
          mat.color.setHex(0xffffff);
          mat.emissive.setHex(0xff6666);
          mat.emissiveIntensity = 1.2;
        } else {
          mat.color.copy(enemy.baseColor);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }

      // ── Sword hit (XZ flat zone, Y-independent) ──
      if (swordActive && enemy.invulnTimer <= 0) {
        const swordXZ  = swordPosition.clone().setY(0);
        const enemyXZ  = enemy.pos.clone().setY(0);
        if (enemyXZ.distanceTo(swordXZ) < 1.7) {
          applyHit(enemy, 1, swordPosition);
          if (enemy.dead) child.visible = false;
        }
      }

      // ── Arrow hits ──
      for (const zone of hitZones.arrows) {
        if (enemy.invulnTimer <= 0) {
          const zoneXZ   = zone.pos.clone().setY(0);
          const enemyXZ  = enemy.pos.clone().setY(0);
          if (enemyXZ.distanceTo(zoneXZ) < zone.radius + 0.3) {
            applyHit(enemy, 1, zone.pos);
            if (enemy.dead) child.visible = false;
            break;
          }
        }
      }

      // ── Boomerang stun ──
      if (hitZones.boomerang && enemy.invulnTimer <= 0) {
        const bXZ  = hitZones.boomerang.pos.clone().setY(0);
        const eXZ  = enemy.pos.clone().setY(0);
        if (eXZ.distanceTo(bXZ) < hitZones.boomerang.radius + 0.2) {
          enemy.stunTimer = 2.2;
          enemy.invulnTimer = 0.4;
        }
      }

      // ── Bomb explosion ──
      for (const zone of hitZones.explosions) {
        if (enemy.pos.distanceTo(zone.pos) < zone.radius) {
          enemy.hp = 0; enemy.dead = true;
          child.visible = false;
          break;
        }
      }

      // ── Player melee damage ──
      const dist2d = new THREE.Vector2(enemy.pos.x - playerPosition.x, enemy.pos.z - playerPosition.z).length();
      if (dist2d < 1.25 && !enemy.isHit && !enemy.dead && enemy.stunTimer <= 0) {
        damagePlayer(0.5);
        enemy.dir.multiplyScalar(-1);
        enemy.pos.addScaledVector(enemy.dir, 0.5);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {meshDefs.map((def, i) => (
        <group key={`e-${i}`}>
          {def.type === 'field'  && <SlimeEnemy  palette={def.palette} />}
          {def.type === 'forest' && <BatEnemy    palette={def.palette} />}
          {def.type === 'desert' && <KnightEnemy palette={def.palette} />}
        </group>
      ))}
    </group>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function applyHit(enemy: EnemyData, damage: number, sourcePos: THREE.Vector3) {
  enemy.hp -= damage;
  enemy.isHit = true;
  enemy.hitTimer = 0.22;
  enemy.invulnTimer = 0.55;
  const kb = enemy.pos.clone().sub(sourcePos).setY(0).normalize();
  enemy.pos.addScaledVector(kb, 1.3);
  if (enemy.hp <= 0) {
    enemy.dead = true;
    sfxDeath();
  } else {
    sfxHit();
  }
}
