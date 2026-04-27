import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, AreaId } from './store';
import { hitZones } from './hitZones';
import { sfxHit, sfxDeath } from './AudioManager';

// ── Area config ──────────────────────────────────────────────────
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
  boss: [], // Boss handled separately
};

// ── Visual meshes ────────────────────────────────────────────────

function SlimeEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.52, 0]} scale={[1, 0.72, 1]}>
        <sphereGeometry args={[0.58, 20, 16]} />
        <meshStandardMaterial color={palette.body} roughness={0.45} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0.12, 0.72, 0.32]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.18} roughness={0} />
      </mesh>
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
      {[0,1,2,3,4,5].map(i => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a)*0.52, 0.15, Math.sin(a)*0.52]} rotation={[0, -a, 0.35]}>
            <coneGeometry args={[0.1, 0.3, 6]} />
            <meshStandardMaterial color={palette.accent} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function BatEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.76, 0]}>
        <sphereGeometry args={[0.42, 16, 13]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.7, 0.28]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color={palette.accent} roughness={0.9} />
      </mesh>
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
      <mesh castShadow position={[-0.2, 1.17, 0]} rotation={[0, 0, -0.25]}>
        <coneGeometry args={[0.1, 0.35, 7]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.2, 1.17, 0]} rotation={[0, 0, 0.25]}>
        <coneGeometry args={[0.1, 0.35, 7]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} />
      </mesh>
      <mesh position={[-0.17, 0.86, 0.37]}>
        <sphereGeometry args={[0.085, 10, 8]} />
        <meshStandardMaterial color="#ff1100" emissive="#ff0000" emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[0.17, 0.86, 0.37]}>
        <sphereGeometry args={[0.085, 10, 8]} />
        <meshStandardMaterial color="#ff1100" emissive="#ff0000" emissiveIntensity={2.5} />
      </mesh>
      <pointLight color="#8800ff" intensity={0.8} distance={4} decay={2} position={[0, 0.7, 0]} />
    </group>
  );
}

function KnightEnemy({ palette }: { palette: { body: string; accent: string } }) {
  return (
    <group>
      <mesh castShadow position={[-0.18, 0.22, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.48, 10]} />
        <meshStandardMaterial color={palette.body} metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh castShadow position={[0.18, 0.22, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.48, 10]} />
        <meshStandardMaterial color={palette.body} metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh castShadow position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.36, 0.32, 0.72, 14]} />
        <meshStandardMaterial color={palette.body} metalness={0.55} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[-0.5, 0.95, 0]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color={palette.accent} metalness={0.6} roughness={0.38} />
      </mesh>
      <mesh castShadow position={[0.5, 0.95, 0]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color={palette.accent} metalness={0.6} roughness={0.38} />
      </mesh>
      <mesh castShadow position={[0, 1.37, 0]}>
        <sphereGeometry args={[0.36, 16, 13]} />
        <meshStandardMaterial color={palette.body} metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.32, 0.38]}>
        <boxGeometry args={[0.32, 0.07, 0.02]} />
        <meshStandardMaterial color="#111100" />
      </mesh>
    </group>
  );
}

// ── Malgrath Boss Visual ─────────────────────────────────────────
function MalgrathBoss({ hitFlash }: { hitFlash: boolean }) {
  return (
    <group>
      {/* Cloak */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <coneGeometry args={[1.1, 3.2, 16]} />
        <meshStandardMaterial color={hitFlash ? '#ffffff' : '#1a0035'}
          emissive={hitFlash ? '#ff4488' : '#330066'} emissiveIntensity={hitFlash ? 2 : 0.4}
          roughness={0.7} />
      </mesh>
      {/* Inner robe glow */}
      <mesh position={[0, 0.6, 0.4]}>
        <planeGeometry args={[1.0, 1.4]} />
        <meshStandardMaterial color="#6600cc" emissive="#6600cc" emissiveIntensity={0.8}
          transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 2.85, 0]}>
        <sphereGeometry args={[0.48, 16, 14]} />
        <meshStandardMaterial color={hitFlash ? '#ffffff' : '#0d001a'}
          emissive={hitFlash ? '#ff88aa' : '#1a0040'} emissiveIntensity={hitFlash ? 3 : 0.5} />
      </mesh>
      {/* Hood */}
      <mesh castShadow position={[0, 3.25, -0.1]} rotation={[0.25, 0, 0]}>
        <coneGeometry args={[0.55, 1.2, 14]} />
        <meshStandardMaterial color="#12002a" roughness={0.6} />
      </mesh>
      {/* Glowing purple eyes */}
      <mesh position={[-0.18, 2.95, 0.42]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#aa00ff" emissive="#cc00ff" emissiveIntensity={4} />
      </mesh>
      <mesh position={[0.18, 2.95, 0.42]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#aa00ff" emissive="#cc00ff" emissiveIntensity={4} />
      </mesh>
      {/* Staff */}
      <mesh castShadow position={[0.7, 1.6, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.06, 0.07, 3.0, 8]} />
        <meshStandardMaterial color="#2a0055" roughness={0.8} />
      </mesh>
      {/* Orb top of staff */}
      <mesh position={[0.8, 3.25, 0]}>
        <sphereGeometry args={[0.28, 14, 12]} />
        <meshStandardMaterial color="#9900ff" emissive="#aa00ff" emissiveIntensity={3}
          transparent opacity={0.9} roughness={0} />
      </mesh>
      {/* Shoulder spikes */}
      <mesh castShadow position={[-0.9, 2.2, 0]} rotation={[0, 0, -0.8]}>
        <coneGeometry args={[0.12, 0.7, 6]} />
        <meshStandardMaterial color="#3a006a" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.9, 2.2, 0]} rotation={[0, 0, 0.8]}>
        <coneGeometry args={[0.12, 0.7, 6]} />
        <meshStandardMaterial color="#3a006a" roughness={0.7} />
      </mesh>
      {/* Dark aura light */}
      <pointLight color="#6600cc" intensity={hitFlash ? 8 : 3} distance={10} decay={2} />
      <pointLight position={[0.8, 3.25, 0]} color="#aa00ff" intensity={5} distance={8} decay={2} />
    </group>
  );
}

// Shadow bolt projectile
function ShadowBolt({ pos }: { pos: THREE.Vector3 }) {
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshStandardMaterial color="#aa00ff" emissive="#aa00ff" emissiveIntensity={3}
          transparent opacity={0.85} />
      </mesh>
      <pointLight color="#aa00ff" intensity={2} distance={4} decay={2} />
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

// Boss shadow bolt data
interface BoltData {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  life: number;
  active: boolean;
}

function seeded(n: number, s: number) {
  const x = Math.sin(n * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ── Regular Enemies ───────────────────────────────────────────────
export function Enemies() {
  const groupRef    = useRef<THREE.Group>(null!);
  const damagePlayer = useGameStore(state => state.damagePlayer);
  const currentArea  = useGameStore(state => state.currentArea);

  const { enemies, meshDefs } = useMemo(() => {
    const configs = AREA_CONFIG[currentArea] ?? [];
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
          speed: cfg.speed[0] + seeded(n,5)*(cfg.speed[1]-cfg.speed[0]),
          changeDirTimer: seeded(n,6)*2,
          isHit: false, hitTimer: 0, invulnTimer: 0, stunTimer: 0,
          wobble: seeded(n,7)*Math.PI*2,
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
  enemiesRef.current = enemies;

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing' || !groupRef.current) return;
    const { playerPosition, swordActive, swordPosition, spinActive, spinPosition } = store;
    const t = state.clock.elapsedTime;
    const children = groupRef.current.children;

    enemiesRef.current.forEach((enemy, index) => {
      const child = children[index] as THREE.Group | undefined;
      if (!child) return;
      if (enemy.dead) { child.visible = false; return; }

      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= delta;
        child.visible = true;
        child.position.set(enemy.pos.x, 0, enemy.pos.z);
        const bodyMesh = child.children[0] as THREE.Mesh | undefined;
        if (bodyMesh?.material) {
          (bodyMesh.material as THREE.MeshStandardMaterial).color.setHex(0x4499ff);
          (bodyMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x224488);
          (bodyMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
        }
        return;
      }

      enemy.changeDirTimer -= delta;
      if (enemy.changeDirTimer <= 0) {
        enemy.changeDirTimer = 1.2 + Math.random() * 2;
        const dist = enemy.pos.distanceTo(playerPosition);
        if (Math.random() > 0.38 && dist < enemy.chaseRange) {
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

      const hoverY = currentArea === 'forest' ? 0.35 + Math.abs(Math.sin(t*3+enemy.wobble))*0.35 : 0;
      const squishY = 1 + Math.sin(t*5+enemy.wobble)*0.06;
      child.position.set(enemy.pos.x, hoverY, enemy.pos.z);
      child.scale.set(1, squishY, 1);
      child.rotation.y = Math.atan2(enemy.dir.x, enemy.dir.z);
      child.visible = true;

      const bodyMesh = child.children[0] as THREE.Mesh | undefined;
      if (bodyMesh?.material) {
        const mat = bodyMesh.material as THREE.MeshStandardMaterial;
        if (enemy.isHit) { mat.color.setHex(0xffffff); mat.emissive.setHex(0xff6666); mat.emissiveIntensity = 1.2; }
        else { mat.color.copy(enemy.baseColor); mat.emissive.setHex(0x000000); mat.emissiveIntensity = 0; }
      }

      // Sword hit
      if (swordActive && enemy.invulnTimer <= 0) {
        if (enemy.pos.clone().setY(0).distanceTo(swordPosition.clone().setY(0)) < 1.7) {
          applyHit(enemy, 1, swordPosition);
          if (enemy.dead) child.visible = false;
        }
      }
      // Spin attack — large radius
      if (spinActive && enemy.invulnTimer <= 0) {
        if (enemy.pos.clone().setY(0).distanceTo(spinPosition.clone().setY(0)) < 2.8) {
          applyHit(enemy, 2, spinPosition);
          if (enemy.dead) child.visible = false;
        }
      }
      // Arrow hits
      for (const zone of hitZones.arrows) {
        if (enemy.invulnTimer <= 0 &&
            enemy.pos.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.3) {
          applyHit(enemy, 1, zone.pos);
          if (enemy.dead) child.visible = false;
          break;
        }
      }
      // Boomerang stun
      if (hitZones.boomerang && enemy.invulnTimer <= 0) {
        if (enemy.pos.clone().setY(0).distanceTo(hitZones.boomerang.pos.clone().setY(0)) < hitZones.boomerang.radius+0.2) {
          enemy.stunTimer = 2.2;
          enemy.invulnTimer = 0.4;
        }
      }
      // Bomb explosion
      for (const zone of hitZones.explosions) {
        if (enemy.pos.distanceTo(zone.pos) < zone.radius) {
          enemy.hp = 0; enemy.dead = true; child.visible = false; break;
        }
      }
      // Player melee
      const dist2d = new THREE.Vector2(enemy.pos.x-playerPosition.x, enemy.pos.z-playerPosition.z).length();
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

// ── Boss Component ────────────────────────────────────────────────
export function BossEnemy() {
  const bossRef     = useRef<THREE.Group>(null!);
  const boltsRef    = useRef<BoltData[]>([]);
  const boltGroupRef = useRef<THREE.Group>(null!);
  const bossPos     = useRef(new THREE.Vector3(0, 0, -10));
  const bossDir     = useRef(new THREE.Vector3(1, 0, 0));
  const bossHP      = useRef(20);
  const bossInvuln  = useRef(0);
  const bossHitFlash = useRef(false);
  const boltTimer   = useRef(0);
  const changeDirTimer = useRef(0);
  const phase       = useRef(1); // 1: normal, 2: enraged (HP < 10)

  // Pre-create bolt meshes
  const MAX_BOLTS = 8;
  if (boltsRef.current.length === 0) {
    for (let i = 0; i < MAX_BOLTS; i++) {
      boltsRef.current.push({ pos: new THREE.Vector3(), dir: new THREE.Vector3(1,0,0), life: 0, active: false });
    }
  }

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing' || store.bossDefeated) return;
    if (!bossRef.current) return;

    const { playerPosition, swordActive, swordPosition, spinActive, spinPosition } = store;

    // Sync HP
    bossHP.current = store.bossHP;
    phase.current = bossHP.current <= 10 ? 2 : 1;
    const speed = phase.current === 2 ? 3.5 : 2.0;

    // Boss movement — chase player
    changeDirTimer.current -= delta;
    if (changeDirTimer.current <= 0) {
      changeDirTimer.current = 0.6 + Math.random() * 0.8;
      bossDir.current.copy(playerPosition).sub(bossPos.current).setY(0).normalize();
      // Enraged: teleport dash
      if (phase.current === 2 && Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        bossPos.current.set(
          playerPosition.x + Math.cos(angle) * 6,
          0,
          playerPosition.z + Math.sin(angle) * 6,
        );
      }
    }

    bossPos.current.addScaledVector(bossDir.current, speed * delta);
    bossPos.current.x = THREE.MathUtils.clamp(bossPos.current.x, -25, 25);
    bossPos.current.z = THREE.MathUtils.clamp(bossPos.current.z, -25, 25);

    bossRef.current.position.copy(bossPos.current);
    bossRef.current.rotation.y = Math.atan2(bossDir.current.x, bossDir.current.z);

    // Hit flash
    bossHitFlash.current = bossInvuln.current > 0 && Math.floor(bossInvuln.current * 10) % 2 === 0;
    if (bossInvuln.current > 0) bossInvuln.current -= delta;

    // Fire shadow bolts
    const boltRate = phase.current === 2 ? 1.2 : 2.5;
    boltTimer.current -= delta;
    if (boltTimer.current <= 0) {
      boltTimer.current = boltRate;
      const count = phase.current === 2 ? 4 : 2;
      for (let i = 0; i < count; i++) {
        const freeSlot = boltsRef.current.find(b => !b.active);
        if (!freeSlot) continue;
        const angle = Math.atan2(
          playerPosition.x - bossPos.current.x,
          playerPosition.z - bossPos.current.z,
        ) + (i - Math.floor(count/2)) * 0.35;
        freeSlot.pos.copy(bossPos.current).setY(2.0);
        freeSlot.dir.set(Math.sin(angle), 0, Math.cos(angle));
        freeSlot.life = 3.0;
        freeSlot.active = true;
      }
    }

    // Update bolts
    if (boltGroupRef.current) {
      boltsRef.current.forEach((bolt, i) => {
        const child = boltGroupRef.current.children[i];
        if (!child) return;
        if (!bolt.active) { child.visible = false; return; }
        bolt.pos.addScaledVector(bolt.dir, 8 * delta);
        bolt.life -= delta;
        if (bolt.life <= 0 || Math.abs(bolt.pos.x) > 30 || Math.abs(bolt.pos.z) > 30) {
          bolt.active = false; child.visible = false; return;
        }
        child.visible = true;
        child.position.copy(bolt.pos);
        // Bolt hits player
        if (bolt.pos.distanceTo(playerPosition) < 1.0) {
          bolt.active = false; child.visible = false;
          store.damagePlayer(1.0);
        }
      });
    }

    // Player weapon hits boss
    const bossDist = bossPos.current.clone().setY(0).distanceTo(
      swordPosition.clone().setY(0)
    );
    if (swordActive && bossInvuln.current <= 0 && bossDist < 2.0) {
      store.damageBoss(1);
      bossInvuln.current = 0.5;
      sfxHit();
    }
    if (spinActive && bossInvuln.current <= 0 &&
        bossPos.current.clone().setY(0).distanceTo(spinPosition.clone().setY(0)) < 3.5) {
      store.damageBoss(2);
      bossInvuln.current = 0.5;
      sfxHit();
    }
    for (const zone of hitZones.arrows) {
      if (bossInvuln.current <= 0 &&
          bossPos.current.clone().setY(0).distanceTo(zone.pos.clone().setY(0)) < zone.radius+0.6) {
        store.damageBoss(1);
        bossInvuln.current = 0.4;
        sfxHit();
        break;
      }
    }
    for (const zone of hitZones.explosions) {
      if (bossPos.current.distanceTo(zone.pos) < zone.radius + 1.0) {
        store.damageBoss(5);
        bossInvuln.current = 0.6;
        sfxDeath();
        break;
      }
    }

    // Boss melee damage
    if (bossPos.current.distanceTo(playerPosition) < 1.8) {
      store.damagePlayer(0.5);
    }
  });

  return (
    <>
      <group ref={bossRef}>
        <MalgrathBoss hitFlash={bossHitFlash.current} />
      </group>
      <group ref={boltGroupRef}>
        {boltsRef.current.map((_, i) => (
          <group key={`bolt-${i}`} visible={false}>
            <ShadowBolt pos={new THREE.Vector3()} />
          </group>
        ))}
      </group>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function applyHit(enemy: EnemyData, damage: number, sourcePos: THREE.Vector3) {
  enemy.hp -= damage;
  enemy.isHit = true;
  enemy.hitTimer = 0.22;
  enemy.invulnTimer = 0.55;
  const kb = enemy.pos.clone().sub(sourcePos).setY(0).normalize();
  enemy.pos.addScaledVector(kb, 1.3);
  if (enemy.hp <= 0) { enemy.dead = true; sfxDeath(); } else { sfxHit(); }
}
