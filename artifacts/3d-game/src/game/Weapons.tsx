import { useState, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hitZones } from './hitZones';
import { useGameStore } from './store';
import { sfxExplosion } from './AudioManager';

let _id = 0;
const nextId = () => ++_id;

const ARROW_SPEED  = 18;
const ARROW_LIFE   = 1.0;
const ARROW_RADIUS = 0.8;

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

// ── Individual projectile components ──────────────────────────────

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
      <mesh castShadow>
        <sphereGeometry args={[0.42, 13, 11]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.32, 5]} />
        <meshStandardMaterial color="#664422" />
      </mesh>
      <pointLight color="#ff6600" intensity={2} distance={4} decay={2} />
    </group>
  );
}

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
        <meshStandardMaterial color="#d4a840" metalness={0.4} roughness={0.4} />
      </mesh>
      <pointLight color="#ffdd88" intensity={1.2} distance={3} decay={2} />
    </group>
  );
}

// ── Wand of Sparks projectile ─────────────────────────────────────
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
      // Fade out near end of life
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
      {/* Core orb */}
      <mesh>
        <sphereGeometry args={[0.28, 14, 11]} />
        <meshStandardMaterial
          color="#cc44ff" emissive="#aa00ff" emissiveIntensity={3}
          transparent opacity={0.85} roughness={0} metalness={0}
        />
      </mesh>
      {/* Outer shell */}
      <mesh>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial
          color="#ff88ff" emissive="#cc00ff" emissiveIntensity={1.5}
          transparent opacity={0.3} roughness={0}
        />
      </mesh>
      {/* Spark ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.04, 6, 14]} />
        <meshStandardMaterial color="#ffaaff" emissive="#ff44ff" emissiveIntensity={4} />
      </mesh>
      <pointLight color="#cc44ff" intensity={4} distance={5} decay={2} />
    </group>
  );
}

// ── Shuriken (throwing star) projectile ───────────────────────────
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
      {/* 4-point star made of crossed boxes */}
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
      {/* Centre disc */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.05} />
      </mesh>
      <pointLight color="#88aaff" intensity={1.5} distance={3} decay={2} />
    </group>
  );
}

// Explosion flash (post-boom visual)
function ExplosionFlash({ pos, id, onDone }: { pos: THREE.Vector3; id: number; onDone: (id: number) => void }) {
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
        color="#ff8800" emissive="#ff4400" emissiveIntensity={3}
        transparent opacity={1}
      />
    </mesh>
  );
}

// ── Weapon manager ────────────────────────────────────────────────
interface ProjEntry {
  id: number;
  type: 'arrow' | 'bomb' | 'boomerang' | 'wand' | 'shuriken';
  startPos: THREE.Vector3;
  vel: THREE.Vector3;
}

interface ExplosionEntry { id: number; pos: THREE.Vector3; }

export function Weapons() {
  const [projectiles, setProjectiles] = useState<ProjEntry[]>([]);
  const [explosions, setExplosions] = useState<ExplosionEntry[]>([]);

  useFrame(() => {
    // Clear hit zones each frame
    hitZones.arrows.length = 0;
    hitZones.boomerang = null;
    hitZones.explosions.length = 0;
    hitZones.wand.length = 0;
    hitZones.shurikens.length = 0;

    const store = useGameStore.getState();
    if (store.pendingWeaponFire) {
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
        // Wand: magic orb — unlimited (cooldown handled in Player.tsx)
        setProjectiles(prev => [...prev, {
          id: nextId(), type: 'wand',
          startPos, vel: dir.clone().multiplyScalar(WAND_SPEED),
        }]);
      } else if (w === 'shuriken') {
        // 3 shurikens in a spread, uses 1 shuriken each
        if (store.useShuriken()) {
          const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
          const offsets = [0, -0.22, 0.22]; // center, left, right spread
          offsets.forEach(offset => {
            const spreadVel = dir.clone().addScaledVector(right, offset).normalize().multiplyScalar(SHURIKEN_SPEED);
            setProjectiles(prev => [...prev, {
              id: nextId(), type: 'shuriken',
              startPos: startPos.clone().addScaledVector(right, offset * 0.4),
              vel: spreadVel,
            }]);
          });
        }
      }
    }
  });

  const removeProjAndMaybeExplode = useCallback((id: number, type: string, pos?: THREE.Vector3) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
    if (type === 'bomb' && pos) {
      sfxExplosion();
      setExplosions(prev => [...prev, { id, pos }]);
    }
  }, []);

  const removeExplosion = useCallback((id: number) => {
    setExplosions(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <>
      {projectiles.map(p =>
        p.type === 'arrow' ? (
          <ArrowProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProjAndMaybeExplode(id, 'arrow')} />
        ) : p.type === 'bomb' ? (
          <BombProjectile key={p.id} id={p.id} startPos={p.startPos}
            onDone={(id) => {
              const entry = projectiles.find(pp => pp.id === id);
              removeProjAndMaybeExplode(id, 'bomb', entry?.startPos);
            }} />
        ) : p.type === 'boomerang' ? (
          <BoomerangProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProjAndMaybeExplode(id, 'boomerang')} />
        ) : p.type === 'wand' ? (
          <WandProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProjAndMaybeExplode(id, 'wand')} />
        ) : (
          <ShurikenProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProjAndMaybeExplode(id, 'shuriken')} />
        )
      )}
      {explosions.map(e => (
        <ExplosionFlash key={`ex-${e.id}`} id={e.id} pos={e.pos} onDone={removeExplosion} />
      ))}
    </>
  );
}
