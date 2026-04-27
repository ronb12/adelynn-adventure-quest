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

// ── Weapon manager (called from Player on keypress) ───────────────
interface ProjEntry {
  id: number;
  type: 'arrow' | 'bomb' | 'boomerang';
  startPos: THREE.Vector3;
  vel: THREE.Vector3;
}

interface ExplosionEntry { id: number; pos: THREE.Vector3; }

export function Weapons() {
  const [projectiles, setProjectiles] = useState<ProjEntry[]>([]);
  const [explosions, setExplosions] = useState<ExplosionEntry[]>([]);

  // Clear hit zones each frame
  useFrame(() => {
    hitZones.arrows.length = 0;
    hitZones.boomerang = null;
    hitZones.explosions.length = 0;

    // Check for pending weapon fire
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
        ) : (
          <BoomerangProjectile key={p.id} id={p.id} startPos={p.startPos} vel={p.vel}
            onDone={(id) => removeProjAndMaybeExplode(id, 'boomerang')} />
        )
      )}
      {explosions.map(e => (
        <ExplosionFlash key={`ex-${e.id}`} id={e.id} pos={e.pos} onDone={removeExplosion} />
      ))}
    </>
  );
}
