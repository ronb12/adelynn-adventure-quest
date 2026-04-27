import { useState, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hitZones } from './hitZones';
import { useGameStore } from './store';
import { sfxExplosion } from './AudioManager';

let _id = 0;
const nextId = () => ++_id;

// ── Constants ─────────────────────────────────────────────────────
const ARROW_SPEED  = 18;
const ARROW_LIFE   = 1.0;
const ARROW_RADIUS = 0.8;

const MOONBOW_SPEED  = 22;
const MOONBOW_LIFE   = 1.2;
const MOONBOW_RADIUS = 0.75;
const MOONBOW_DAMAGE = 1.2;

const FROST_SPEED  = 13;
const FROST_LIFE   = 1.8;
const FROST_RADIUS = 0.9;
const FROST_DAMAGE = 1.0;

const BOOM_SPEED     = 10;
const BOOM_MAX_DIST  = 9;
const BOOM_RADIUS    = 0.9;
const BOOM_LIFE      = 3.5;

const BOMB_FUSE   = 2.2;
const BOMB_RADIUS = 3.4;

const WAND_SPEED  = 14;
const WAND_LIFE   = 1.4;
const WAND_RADIUS = 0.9;
const WAND_DAMAGE = 1.5;

const SHURIKEN_SPEED  = 16;
const SHURIKEN_LIFE   = 0.9;
const SHURIKEN_RADIUS = 0.6;
const SHURIKEN_DAMAGE = 0.6;

const CHAIN_SPEED  = 20;
const CHAIN_LIFE   = 0.8;
const CHAIN_RADIUS = 1.0;

// ── Arrow (Moonbow fan) ──────────────────────────────────────────
function ArrowProjectile({ id, startPos, vel, onDone }: {
  id: number; startPos: THREE.Vector3; vel: THREE.Vector3; onDone: (id: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const pos = useRef(startPos.clone());
  const age = useRef(0);

  useFrame((_, delta) => {
    if (useGameStore.getState().gameState !== 'playing') return;
    age.current += delta;
    pos.current.addScaledVector(vel, delta);
    if (ref.current) ref.current.position.copy(pos.current);

    hitZones.arrows.push({ id, pos: pos.current.clone(), radius: ARROW_RADIUS });

    if (age.current > ARROW_LIFE ||
        Math.abs(pos.current.x) > 31 || Math.abs(pos.current.z) > 31) {
      onDone(id);
    }
  });

  return (
    <group ref={ref} position={startPos}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.85, 5]} />
        <meshStandardMaterial color="#c8a040" />
      </mesh>
      <mesh position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.24, 4]} />
        <meshStandardMaterial color="#999999" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.48]} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
        <planeGeometry args={[0.24, 0.12]} />
        <meshStandardMaterial color="#ee6622" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Moonbow crescent shard ────────────────────────────────────────
function MoonbowProjectile({ id, startPos, vel, onDone }: {
  id: number; startPos: THREE.Vector3; vel: THREE.Vector3; onDone: (id: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const pos = useRef(startPos.clone());
  const age = useRef(0);
  const spin = useRef(0);

  useFrame((_, delta) => {
    if (useGameStore.getState().gameState !== 'playing') return;
    age.current += delta;
    spin.current += delta * 10;
    pos.current.addScaledVector(vel, delta);
    if (ref.current) {
      ref.current.position.copy(pos.current);
      ref.current.rotation.y = spin.current;
      const fade = Math.max(0, 1 - age.current / MOONBOW_LIFE);
      ref.current.scale.setScalar(0.7 + fade * 0.5);
    }
    hitZones.moonbow.push({ id, pos: pos.current.clone(), radius: MOONBOW_RADIUS, damage: MOONBOW_DAMAGE });
    if (age.current > MOONBOW_LIFE ||
        Math.abs(pos.current.x) > 31 || Math.abs(pos.current.z) > 31) {
      onDone(id);
    }
  });

  return (
    <group ref={ref} position={startPos}>
      {/* Crescent shape from partial torus */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.07, 8, 18, Math.PI * 1.3]} />
        <meshStandardMaterial color="#c8e8ff" emissive="#88ccff" emissiveIntensity={2.5}
          metalness={0.3} roughness={0.2} />
      </mesh>
      <pointLight color="#88ccff" intensity={3} distance={4} decay={2} />
    </group>
  );
}

// ── Frost bolt ────────────────────────────────────────────────────
function FrostBoltProjectile({ id, startPos, vel, onDone }: {
  id: number; startPos: THREE.Vector3; vel: THREE.Vector3; onDone: (id: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const pos = useRef(startPos.clone());
  const age = useRef(0);
  const spin = useRef(0);

  useFrame((_, delta) => {
    if (useGameStore.getState().gameState !== 'playing') return;
    age.current += delta;
    spin.current += delta * 6;
    pos.current.addScaledVector(vel, delta);
    if (ref.current) {
      ref.current.position.copy(pos.current);
      ref.current.rotation.y = spin.current;
    }
    hitZones.frost.push({ id, pos: pos.current.clone(), radius: FROST_RADIUS, damage: FROST_DAMAGE, slow: true });
    if (age.current > FROST_LIFE ||
        Math.abs(pos.current.x) > 31 || Math.abs(pos.current.z) > 31) {
      onDone(id);
    }
  });

  return (
    <group ref={ref} position={startPos}>
      {/* Core */}
      <mesh>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#aaddff" emissive="#00aaff" emissiveIntensity={3}
          transparent opacity={0.9} roughness={0} metalness={0.1} />
      </mesh>
      {/* Outer shell */}
      <mesh>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#cceeFF" emissive="#44ccff" emissiveIntensity={1.5}
          transparent opacity={0.25} roughness={0} wireframe />
      </mesh>
      <pointLight color="#44bbff" intensity={5} distance={5} decay={2} />
    </group>
  );
}

// ── Bomb (Ember Vial) ──────────────────────────────────────────────
function BombProjectile({ id, startPos, onDone }: {
  id: number; startPos: THREE.Vector3; onDone: (id: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const age = useRef(0);
  const exploded = useRef(false);

  useFrame((_, delta) => {
    if (useGameStore.getState().gameState !== 'playing') return;
    age.current += delta;

    const t = Math.min(age.current / BOMB_FUSE, 1);
    const pulse = 0.9 + Math.sin(t * 28) * 0.1 * t;
    if (ref.current) ref.current.scale.setScalar(pulse);

    if (age.current >= BOMB_FUSE && !exploded.current) {
      exploded.current = true;
      hitZones.explosions.push({ id, pos: startPos.clone(), radius: BOMB_RADIUS });
      onDone(id);
    }
  });

  return (
    <group ref={ref} position={startPos}>
      {/* Round flask body */}
      <mesh castShadow>
        <sphereGeometry args={[0.38, 13, 11]} />
        <meshStandardMaterial color="#cc2200" emissive="#660000" emissiveIntensity={0.6}
          transparent opacity={0.85} roughness={0.2} />
      </mesh>
      {/* Glass neck */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.14, 0.22, 7]} />
        <meshStandardMaterial color="#ffccaa" transparent opacity={0.7} roughness={0.1} />
      </mesh>
      {/* Cork */}
      <mesh position={[0, 0.54, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.1, 6]} />
        <meshStandardMaterial color="#996644" roughness={0.8} />
      </mesh>
      <pointLight color="#ff5500" intensity={2} distance={4} decay={2} />
    </group>
  );
}

// ── Boomerang (Shadowrang) ─────────────────────────────────────────
function BoomerangProjectile({ id, startPos, vel, onDone }: {
  id: number; startPos: THREE.Vector3; vel: THREE.Vector3; onDone: (id: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const pos = useRef(startPos.clone());
  const curVel = useRef(vel.clone());
  const age = useRef(0);
  const returning = useRef(false);
  const spin = useRef(0);

  useFrame((_, delta) => {
    if (useGameStore.getState().gameState !== 'playing') return;
    age.current += delta;
    spin.current += delta * 12;

    const playerPos = useGameStore.getState().playerPosition;

    if (!returning.current) {
      const dist = pos.current.distanceTo(startPos);
      if (dist >= BOOM_MAX_DIST) returning.current = true;
      else pos.current.addScaledVector(curVel.current, delta);
    }

    if (returning.current) {
      const target = playerPos.clone().setY(0.9);
      const toPlayer = target.sub(pos.current).normalize();
      curVel.current.lerp(toPlayer.multiplyScalar(BOOM_SPEED), 0.18);
      pos.current.addScaledVector(curVel.current.clone().normalize().multiplyScalar(BOOM_SPEED), delta);

      if (pos.current.distanceTo(playerPos) < 1.1 || age.current > BOOM_LIFE) {
        onDone(id);
        return;
      }
    }

    if (ref.current) {
      ref.current.position.copy(pos.current);
      ref.current.rotation.y = spin.current;
    }

    hitZones.boomerang = { id, pos: pos.current.clone(), radius: BOOM_RADIUS, stun: true };
  });

  return (
    <group ref={ref} position={startPos}>
      <mesh castShadow>
        <torusGeometry args={[0.38, 0.07, 7, 14, Math.PI * 1.5]} />
        <meshStandardMaterial color="#8833cc" emissive="#6600aa" emissiveIntensity={1.2}
          metalness={0.5} roughness={0.3} />
      </mesh>
      <pointLight color="#cc66ff" intensity={1.5} distance={3} decay={2} />
    </group>
  );
}

// ── Wand of Sparks ────────────────────────────────────────────────
function WandProjectile({ id, startPos, vel, onDone }: {
  id: number; startPos: THREE.Vector3; vel: THREE.Vector3; onDone: (id: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const pos = useRef(startPos.clone());
  const age = useRef(0);
  const spin = useRef(0);

  useFrame((_, delta) => {
    if (useGameStore.getState().gameState !== 'playing') return;
    age.current += delta;
    spin.current += delta * 8;
    pos.current.addScaledVector(vel, delta);
    if (ref.current) {
      ref.current.position.copy(pos.current);
      ref.current.rotation.y = spin.current;
      const fade = Math.max(0, 1 - age.current / WAND_LIFE);
      ref.current.scale.setScalar(0.6 + fade * 0.6);
    }

    hitZones.wand.push({ id, pos: pos.current.clone(), radius: WAND_RADIUS, damage: WAND_DAMAGE });

    if (age.current > WAND_LIFE ||
        Math.abs(pos.current.x) > 31 || Math.abs(pos.current.z) > 31) {
      onDone(id);
    }
  });

  return (
    <group ref={ref} position={startPos}>
      <mesh>
        <sphereGeometry args={[0.28, 14, 11]} />
        <meshStandardMaterial color="#cc44ff" emissive="#aa00ff" emissiveIntensity={3}
          transparent opacity={0.85} roughness={0} metalness={0} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color="#ff88ff" emissive="#cc00ff" emissiveIntensity={1.5}
          transparent opacity={0.3} roughness={0} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.04, 6, 14]} />
        <meshStandardMaterial color="#ffaaff" emissive="#ff44ff" emissiveIntensity={4} />
      </mesh>
      <pointLight color="#cc44ff" intensity={4} distance={5} decay={2} />
    </group>
  );
}

// ── Shuriken (Void Stars) ─────────────────────────────────────────
function ShurikenProjectile({ id, startPos, vel, onDone }: {
  id: number; startPos: THREE.Vector3; vel: THREE.Vector3; onDone: (id: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const pos = useRef(startPos.clone());
  const age = useRef(0);
  const spin = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (useGameStore.getState().gameState !== 'playing') return;
    age.current += delta;
    spin.current += delta * 18;
    pos.current.addScaledVector(vel, delta);
    if (ref.current) {
      ref.current.position.copy(pos.current);
      ref.current.rotation.z = spin.current;
    }

    hitZones.shurikens.push({ id, pos: pos.current.clone(), radius: SHURIKEN_RADIUS, damage: SHURIKEN_DAMAGE });

    if (age.current > SHURIKEN_LIFE ||
        Math.abs(pos.current.x) > 31 || Math.abs(pos.current.z) > 31) {
      onDone(id);
    }
  });

  return (
    <group ref={ref} position={startPos}>
      <mesh>
        <boxGeometry args={[0.38, 0.1, 0.1]} />
        <meshStandardMaterial color="#c0c8d8" metalness={0.88} roughness={0.1} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.38, 0.1, 0.1]} />
        <meshStandardMaterial color="#c0c8d8" metalness={0.88} roughness={0.1} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.38, 0.1, 0.1]} />
        <meshStandardMaterial color="#aabbcc" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.38, 0.1, 0.1]} />
        <meshStandardMaterial color="#aabbcc" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.05} />
      </mesh>
      <pointLight color="#88aaff" intensity={1.5} distance={3} decay={2} />
    </group>
  );
}

// ── Chain Anchor (grapple) ────────────────────────────────────────
function ChainProjectile({ id, startPos, vel, onDone }: {
  id: number; startPos: THREE.Vector3; vel: THREE.Vector3; onDone: (id: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const pos = useRef(startPos.clone());
  const age = useRef(0);

  useFrame((_, delta) => {
    if (useGameStore.getState().gameState !== 'playing') return;
    age.current += delta;
    pos.current.addScaledVector(vel, delta);
    if (ref.current) ref.current.position.copy(pos.current);

    hitZones.chain = { id, pos: pos.current.clone(), radius: CHAIN_RADIUS, stun: true, damage: 0.5 };

    if (age.current > CHAIN_LIFE ||
        Math.abs(pos.current.x) > 31 || Math.abs(pos.current.z) > 31) {
      onDone(id);
    }
  });

  // Visual: anchor head + 3 chain links behind it
  const chainDir = vel.clone().normalize();
  return (
    <group ref={ref} position={startPos}>
      {/* Anchor head */}
      <mesh>
        <torusGeometry args={[0.18, 0.055, 6, 10]} />
        <meshStandardMaterial color="#887766" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.06, 0.28, 0.06]} />
        <meshStandardMaterial color="#776655" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Chain links */}
      {[0.5, 0.9, 1.3].map((d, i) => (
        <mesh key={i} position={[
          chainDir.x * d,
          0,
          chainDir.z * d,
        ]}>
          <torusGeometry args={[0.1, 0.035, 5, 8]} />
          <meshStandardMaterial color="#666655" metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
      <pointLight color="#cc9944" intensity={2} distance={4} decay={2} />
    </group>
  );
}

// ── Explosion flash (bomb post-boom) ──────────────────────────────
function ExplosionFlash({ pos, id, color, onDone }: {
  pos: THREE.Vector3; id: number; color?: string; onDone: (id: number) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const age = useRef(0);

  useFrame((_, delta) => {
    age.current += delta;
    if (ref.current) {
      const s = 1 + age.current * 10;
      ref.current.scale.setScalar(s);
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 1 - age.current * 4);
    }
    if (age.current > 0.55) onDone(id);
  });

  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[BOMB_RADIUS * 0.45, 12, 10]} />
      <meshStandardMaterial
        color={color ?? '#ff8800'} emissive={color ?? '#ff4400'} emissiveIntensity={3}
        transparent opacity={1}
      />
    </mesh>
  );
}

// ── Solara's Flare (area fire burst) ──────────────────────────────
function FlareEffect({ pos, id, onDone }: { pos: THREE.Vector3; id: number; onDone: (id: number) => void }) {
  const ref = useRef<THREE.Group>(null);
  const age = useRef(0);

  useFrame((_, delta) => {
    age.current += delta;
    if (ref.current) {
      const s = 1 + age.current * 8;
      ref.current.scale.setScalar(s);
      ref.current.children.forEach((c) => {
        const mat = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat?.opacity !== undefined) mat.opacity = Math.max(0, 1 - age.current * 3);
      });
    }
    if (age.current > 0.7) onDone(id);
  });

  return (
    <group ref={ref} position={pos}>
      <mesh>
        <sphereGeometry args={[0.8, 14, 10]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ff6600" emissiveIntensity={4}
          transparent opacity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.4, 10, 8]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2}
          transparent opacity={0.5} />
      </mesh>
      <pointLight color="#ff8800" intensity={20} distance={12} decay={2} />
    </group>
  );
}

// ── Glacira's Veil (screen freeze wave) ───────────────────────────
function VeilEffect({ pos, id, onDone }: { pos: THREE.Vector3; id: number; onDone: (id: number) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const age = useRef(0);

  useFrame((_, delta) => {
    age.current += delta;
    if (ref.current) {
      ref.current.scale.setScalar(1 + age.current * 14);
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 0.7 - age.current * 1.8);
    }
    if (age.current > 0.6) onDone(id);
  });

  return (
    <mesh ref={ref} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.1, 0.9, 32]} />
      <meshStandardMaterial color="#88ddff" emissive="#44bbff" emissiveIntensity={3}
        transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Cragus Strike (ground tremor) ─────────────────────────────────
function QuakeEffect({ pos, id, onDone }: { pos: THREE.Vector3; id: number; onDone: (id: number) => void }) {
  const ref = useRef<THREE.Group>(null);
  const age = useRef(0);

  useFrame((_, delta) => {
    age.current += delta;
    if (ref.current) {
      const s = 1 + age.current * 16;
      ref.current.scale.setScalar(s);
      ref.current.children.forEach((c, i) => {
        const mat = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat?.opacity !== undefined) mat.opacity = Math.max(0, 0.8 - age.current * i * 1.2);
      });
    }
    if (age.current > 0.65) onDone(id);
  });

  return (
    <group ref={ref} position={pos.clone().setY(0.08)}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.6, 32]} />
        <meshStandardMaterial color="#bb8833" emissive="#886600" emissiveIntensity={2}
          transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.4]}>
        <ringGeometry args={[0.2, 0.9, 32]} />
        <meshStandardMaterial color="#aa7722" emissive="#664400" emissiveIntensity={1.5}
          transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Aura Ring (orbiting crystals rendered each frame) ─────────────
function AuraRing() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;
    const t = state.clock.elapsedTime;
    const playerPos = store.playerPosition;
    const now = Date.now();
    const active = now < store.auraEndTime;
    if (ref.current) ref.current.visible = active;
    if (!active) return;

    // Reposition each crystal child
    const orbs = ref.current?.children ?? [];
    const count = orbs.length;
    for (let i = 0; i < count; i++) {
      const angle = t * 2.8 + (i / count) * Math.PI * 2;
      const x = playerPos.x + Math.cos(angle) * 1.3;
      const z = playerPos.z + Math.sin(angle) * 1.3;
      orbs[i].position.set(x, 1.0, z);
      hitZones.aura.push({
        id: 9000 + i,
        pos: new THREE.Vector3(x, 1.0, z),
        radius: 0.65,
        damage: 0.25,
      });
    }
  });

  return (
    <group ref={ref}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <group key={i}>
          <mesh>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#ff88ff" emissive="#cc00cc" emissiveIntensity={3}
              transparent opacity={0.9} />
          </mesh>
          <pointLight color="#ff44ff" intensity={2.5} distance={3} decay={2} />
        </group>
      ))}
    </group>
  );
}

// ── Shadow Veil overlay (player goes semi-transparent) ────────────
function ShadowVeilOverlay() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const store = useGameStore.getState();
    const active = Date.now() < store.shadowEndTime;
    if (ref.current) ref.current.visible = active;
    if (!active || !ref.current) return;
    const playerPos = store.playerPosition;
    ref.current.position.set(playerPos.x, 0.05, playerPos.z);
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.0, 24]} />
      <meshStandardMaterial color="#440088" emissive="#220044" emissiveIntensity={2}
        transparent opacity={0.55} />
    </mesh>
  );
}

// ── Weapon manager ────────────────────────────────────────────────
interface ProjEntry {
  id: number;
  type: 'arrow' | 'moonbow' | 'bomb' | 'boomerang' | 'wand' | 'shuriken' | 'frost' | 'chain';
  startPos: THREE.Vector3;
  vel: THREE.Vector3;
}

interface ExplosionEntry {
  id: number;
  pos: THREE.Vector3;
  type: 'bomb' | 'flare' | 'veil' | 'quake';
}

export function Weapons() {
  const [projectiles, setProjectiles] = useState<ProjEntry[]>([]);
  const [explosions, setExplosions]   = useState<ExplosionEntry[]>([]);

  useFrame(() => {
    // Clear hit zones each frame
    hitZones.arrows.length = 0;
    hitZones.moonbow.length = 0;
    hitZones.boomerang = null;
    hitZones.explosions.length = 0;
    hitZones.wand.length = 0;
    hitZones.shurikens.length = 0;
    hitZones.frost.length = 0;
    hitZones.chain = null;
    hitZones.aura.length = 0;

    const store = useGameStore.getState();
    if (!store.pendingWeaponFire) return;

    const w = store.pendingWeaponFire;
    store.clearPendingWeaponFire();

    const playerPos = store.playerPosition.clone();
    const dir = store.playerDirection.clone().setY(0).normalize();
    const startPos = playerPos.clone().addScaledVector(dir, 0.9).setY(1.0);

    if (w === 'bow') {
      if (store.useArrow()) {
        setProjectiles(prev => [...prev, {
          id: nextId(), type: 'arrow',
          startPos, vel: dir.clone().multiplyScalar(ARROW_SPEED),
        }]);
      }
    } else if (w === 'moonbow') {
      // 3-arrow crescent fan, uses moonbow ammo
      if (store.useMoonbowAmmo()) {
        const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
        [-0.25, 0, 0.25].forEach(spread => {
          const vel = dir.clone().addScaledVector(right, spread).normalize().multiplyScalar(MOONBOW_SPEED);
          setProjectiles(prev => [...prev, {
            id: nextId(), type: 'moonbow',
            startPos: startPos.clone().addScaledVector(right, spread * 0.5),
            vel,
          }]);
        });
      }
    } else if (w === 'frost') {
      if (store.useFrostCharge()) {
        setProjectiles(prev => [...prev, {
          id: nextId(), type: 'frost',
          startPos, vel: dir.clone().multiplyScalar(FROST_SPEED),
        }]);
      }
    } else if (w === 'bomb') {
      if (store.useBomb()) {
        const bombPos = playerPos.clone().addScaledVector(dir, 1.4).setY(0.42);
        setProjectiles(prev => [...prev, {
          id: nextId(), type: 'bomb', startPos: bombPos, vel: new THREE.Vector3(),
        }]);
      }
    } else if (w === 'boomerang') {
      const hasBoomerang = projectiles.some(p => p.type === 'boomerang');
      if (!hasBoomerang) {
        setProjectiles(prev => [...prev, {
          id: nextId(), type: 'boomerang',
          startPos, vel: dir.clone().multiplyScalar(BOOM_SPEED),
        }]);
      }
    } else if (w === 'wand') {
      setProjectiles(prev => [...prev, {
        id: nextId(), type: 'wand',
        startPos, vel: dir.clone().multiplyScalar(WAND_SPEED),
      }]);
    } else if (w === 'shuriken') {
      if (store.useShuriken()) {
        const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
        [0, -0.22, 0.22].forEach(offset => {
          const spreadVel = dir.clone().addScaledVector(right, offset).normalize().multiplyScalar(SHURIKEN_SPEED);
          setProjectiles(prev => [...prev, {
            id: nextId(), type: 'shuriken',
            startPos: startPos.clone().addScaledVector(right, offset * 0.4),
            vel: spreadVel,
          }]);
        });
      }
    } else if (w === 'flare') {
      // Solara's Flare — large area blast at player location
      if (store.useFlareCharge()) {
        sfxExplosion();
        hitZones.explosions.push({ id: nextId(), pos: playerPos.clone(), radius: 9 });
        setExplosions(prev => [...prev, { id: nextId(), pos: playerPos.clone().setY(0.8), type: 'flare' }]);
      }
    } else if (w === 'veil') {
      // Glacira's Veil — huge frost wave (slows all)
      if (store.useVeilCrystal()) {
        hitZones.frost.push({ id: nextId(), pos: playerPos.clone(), radius: 22, slow: true, damage: 0.5 });
        setExplosions(prev => [...prev, { id: nextId(), pos: playerPos.clone().setY(0.1), type: 'veil' }]);
      }
    } else if (w === 'quake') {
      // Cragus Strike — ground tremor stuns all
      if (store.useQuakeRune()) {
        hitZones.explosions.push({ id: nextId(), pos: playerPos.clone(), radius: 22 });
        setExplosions(prev => [...prev, { id: nextId(), pos: playerPos.clone().setY(0.05), type: 'quake' }]);
      }
    } else if (w === 'aura') {
      // Aura Ring — cooldown-based orbiting shield
      if (Date.now() >= store.auraEndTime) {
        store.activateAura();
      }
    } else if (w === 'shadow') {
      // Shadow Veil — cooldown-based invisibility
      if (Date.now() >= store.shadowEndTime) {
        store.activateShadow();
      }
    } else if (w === 'chain') {
      // Chain Anchor — cooldown grapple stun
      if (Date.now() >= store.chainCooldownEnd) {
        store.activateChain();
        setProjectiles(prev => [...prev, {
          id: nextId(), type: 'chain',
          startPos, vel: dir.clone().multiplyScalar(CHAIN_SPEED),
        }]);
      }
    }
  });

  const removeProj = useCallback((id: number, type: string, pos?: THREE.Vector3) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
    if (type === 'bomb' && pos) {
      sfxExplosion();
      setExplosions(prev => [...prev, { id, pos, type: 'bomb' }]);
    }
  }, []);

  const removeExplosion = useCallback((id: number) => {
    setExplosions(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <>
      {projectiles.map(p => {
        if (p.type === 'arrow') return (
          <ArrowProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProj(id, 'arrow')} />
        );
        if (p.type === 'moonbow') return (
          <MoonbowProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProj(id, 'moonbow')} />
        );
        if (p.type === 'frost') return (
          <FrostBoltProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProj(id, 'frost')} />
        );
        if (p.type === 'bomb') return (
          <BombProjectile key={p.id} id={p.id} startPos={p.startPos}
            onDone={(id) => {
              const entry = projectiles.find(pp => pp.id === id);
              removeProj(id, 'bomb', entry?.startPos);
            }} />
        );
        if (p.type === 'boomerang') return (
          <BoomerangProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProj(id, 'boomerang')} />
        );
        if (p.type === 'wand') return (
          <WandProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProj(id, 'wand')} />
        );
        if (p.type === 'chain') return (
          <ChainProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProj(id, 'chain')} />
        );
        return (
          <ShurikenProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProj(id, 'shuriken')} />
        );
      })}

      {explosions.map(e => {
        if (e.type === 'flare') return (
          <FlareEffect key={`fl-${e.id}`} id={e.id} pos={e.pos} onDone={removeExplosion} />
        );
        if (e.type === 'veil') return (
          <VeilEffect key={`vl-${e.id}`} id={e.id} pos={e.pos} onDone={removeExplosion} />
        );
        if (e.type === 'quake') return (
          <QuakeEffect key={`qk-${e.id}`} id={e.id} pos={e.pos} onDone={removeExplosion} />
        );
        return (
          <ExplosionFlash key={`ex-${e.id}`} id={e.id} pos={e.pos} onDone={removeExplosion} />
        );
      })}

      <AuraRing />
      <ShadowVeilOverlay />
    </>
  );
}
