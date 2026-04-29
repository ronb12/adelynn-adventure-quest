import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { useGameStore } from "./store";
import { playerState, weaponHitZones, weaponEffects, WeaponId } from "./controls";

let _wid = 0;
const nextId = () => `w${++_wid}`;

interface Proj {
  id: string; x: number; z: number; dx: number; dz: number;
  speed: number; damage: number; life: number; type: string;
  // boomerang
  boomerangReturn?: boolean; startX?: number; startZ?: number; maxDist?: number; traveled?: number;
}

interface AuraOrb { id: string; angle: number; }

// ── Per-weapon mesh ───────────────────────────────────────────────
function ProjMesh({ p }: { p: Proj }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => { if (ref.current) ref.current.position.set(p.x, 0.7, p.z); });

  if (p.type === "arrow") return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.04, 0.04, 0.7, 5]} />
      <meshStandardMaterial color="#c8a040" />
    </mesh>
  );
  if (p.type === "moonbow") return (
    <mesh ref={ref}>
      <torusGeometry args={[0.2, 0.06, 6, 8, Math.PI]} />
      <meshStandardMaterial color="#8844cc" emissive="#6622aa" emissiveIntensity={2} />
    </mesh>
  );
  if (p.type === "wand") return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.18, 8, 8]} />
      <meshStandardMaterial color="#ff88dd" emissive="#ff44cc" emissiveIntensity={2.5} />
    </mesh>
  );
  if (p.type === "boomerang") return (
    <mesh ref={ref} rotation={[0, Date.now() * 0.01, 0]}>
      <torusGeometry args={[0.22, 0.06, 6, 8, Math.PI * 1.5]} />
      <meshStandardMaterial color="#ffaa44" emissive="#ff8800" emissiveIntensity={1.5} />
    </mesh>
  );
  if (p.type === "frost") return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.2]} />
      <meshStandardMaterial color="#44ccff" emissive="#00aaff" emissiveIntensity={2} />
    </mesh>
  );
  if (p.type === "shuriken") return (
    <mesh ref={ref} rotation={[0, Date.now() * 0.015, 0]}>
      <tetrahedronGeometry args={[0.15]} />
      <meshStandardMaterial color="#00ffcc" emissive="#00ccaa" emissiveIntensity={2} />
    </mesh>
  );
  if (p.type === "bomb") return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.22, 8, 8]} />
      <meshStandardMaterial color="#ff4422" emissive="#cc2200" emissiveIntensity={1.5} />
    </mesh>
  );
  if (p.type === "chain") return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
      <meshStandardMaterial color="#888899" emissive="#5566aa" emissiveIntensity={1} />
    </mesh>
  );
  if (p.type === "firerod") return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial color="#ff5500" emissive="#ff3300" emissiveIntensity={3.5} />
    </mesh>
  );
  if (p.type === "icerod") return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.22]} />
      <meshStandardMaterial color="#aaeeff" emissive="#44aaff" emissiveIntensity={3} />
    </mesh>
  );
  // default (flare, etc.)
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.22, 8, 8]} />
      <meshStandardMaterial color="#ff8800" emissive="#ff6600" emissiveIntensity={3} />
    </mesh>
  );
}

function BombExplosion({ x, z, onDone }: { x: number; z: number; onDone: () => void }) {
  const ref = useRef<THREE.Mesh>(null!);
  const life = useRef(0.5);
  useFrame((_, delta) => {
    life.current -= delta;
    if (ref.current) {
      const s = 1 - life.current * 2;
      ref.current.scale.setScalar(Math.max(0.1, s * 5));
      (ref.current.material as THREE.MeshStandardMaterial).opacity = life.current * 2;
    }
    if (life.current <= 0) onDone();
  });
  return (
    <mesh ref={ref} position={[x, 0.5, z]}>
      <sphereGeometry args={[0.8, 8, 8]} />
      <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={3} transparent opacity={0.8} />
    </mesh>
  );
}

function AuraMesh({ orbs }: { orbs: AuraOrb[] }) {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(playerState.x, 0.8, playerState.z);
    }
  });
  return (
    <group ref={groupRef}>
      {orbs.map(o => {
        const ox = Math.cos(o.angle) * 1.4;
        const oz = Math.sin(o.angle) * 1.4;
        return (
          <mesh key={o.id} position={[ox, 0, oz]}>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshStandardMaterial color="#ffff44" emissive="#dddd00" emissiveIntensity={3} />
          </mesh>
        );
      })}
      <pointLight position={[0, 0, 0]} color="#ffff44" intensity={8} distance={5} />
    </group>
  );
}

export default function Weapons() {
  const projRef   = useRef<Proj[]>([]);
  const [, triggerRender] = useState(0);
  const auraOrbsRef = useRef<AuraOrb[]>([]);
  const auraAngle = useRef(0);
  const [explosions, setExplosions] = useState<{ id: string; x: number; z: number }[]>([]);

  const gameState = useGameStore(s => s.gameState);
  const pendingWeaponFire = useGameStore(s => s.pendingWeaponFire);
  const auraEndTime = useGameStore(s => s.auraEndTime);

  // Consume pending weapon fire in a frame so we never call store actions during render
  const spawnQueueRef = useRef<WeaponId | null>(null);
  if (pendingWeaponFire) {
    spawnQueueRef.current = pendingWeaponFire;
    useGameStore.getState().clearPendingWeaponFire();
  }

  function spawnWeapon(w: WeaponId) {
    const store = useGameStore.getState();
    const px = playerState.x, pz = playerState.z;
    const fx = playerState.facingX, fz = playerState.facingZ;

    if (w === "bow") {
      if (!store.useArrow()) return;
      projRef.current.push({ id: nextId(), x: px, z: pz, dx: fx, dz: fz, speed: 18, damage: 1.0, life: 1.0, type: "arrow" });
    } else if (w === "moonbow") {
      if (!store.useMoonbowAmmo()) return;
      for (let i = -1; i <= 1; i++) {
        const ang = Math.atan2(fz, fx) + i * 0.3;
        projRef.current.push({ id: nextId(), x: px, z: pz, dx: Math.cos(ang), dz: Math.sin(ang), speed: 22, damage: 1.2, life: 1.2, type: "moonbow" });
      }
    } else if (w === "wand") {
      projRef.current.push({ id: nextId(), x: px, z: pz, dx: fx, dz: fz, speed: 14, damage: 1.5, life: 1.4, type: "wand" });
    } else if (w === "boomerang") {
      projRef.current.push({ id: nextId(), x: px, z: pz, dx: fx, dz: fz, speed: 10, damage: 0.75, life: 3.5, type: "boomerang", boomerangReturn: false, startX: px, startZ: pz, maxDist: 9, traveled: 0 });
    } else if (w === "frost") {
      if (!store.useFrostCharge()) return;
      projRef.current.push({ id: nextId(), x: px, z: pz, dx: fx, dz: fz, speed: 13, damage: 1.0, life: 1.8, type: "frost" });
    } else if (w === "shuriken") {
      if (!store.useShuriken()) return;
      for (let i = -1; i <= 1; i++) {
        const ang = Math.atan2(fz, fx) + i * 0.5;
        projRef.current.push({ id: nextId(), x: px, z: pz, dx: Math.cos(ang), dz: Math.sin(ang), speed: 16, damage: 0.6, life: 0.9, type: "shuriken" });
      }
    } else if (w === "bomb") {
      if (!store.useBomb()) return;
      projRef.current.push({ id: nextId(), x: px, z: pz, dx: fx * 0.6, dz: fz * 0.6, speed: 7, damage: 2.0, life: 2.2, type: "bomb" });
    } else if (w === "flare") {
      if (!store.useFlareCharge()) return;
      // Flare — instant area burst
      weaponHitZones.push({ id: nextId(), x: px, z: pz, radius: 4, damage: 2.0, type: "flare" });
      setExplosions(prev => [...prev, { id: nextId(), x: px, z: pz }]);
      setTimeout(() => weaponHitZones.splice(0, weaponHitZones.length), 100);
    } else if (w === "shadow") {
      store.activateShadow();
    } else if (w === "aura") {
      store.activateAura();
      auraOrbsRef.current = [0, 1, 2, 3].map(i => ({ id: `ao${i}`, angle: (i / 4) * Math.PI * 2 }));
      triggerRender(n => n + 1);
    } else if (w === "veil") {
      if (!store.useVeilCrystal()) return;
      weaponEffects.freezeUntil = Date.now() + 2500;
      setExplosions(prev => [...prev, { id: nextId(), x: px, z: pz }]);
    } else if (w === "quake") {
      if (!store.useQuakeRune()) return;
      weaponEffects.stunUntil = Date.now() + 2000;
      weaponHitZones.push({ id: nextId(), x: px, z: pz, radius: 15, damage: 0.5, type: "quake" });
      setExplosions(prev => [...prev, { id: nextId(), x: px, z: pz }]);
      setTimeout(() => weaponHitZones.splice(0, weaponHitZones.length), 150);
    } else if (w === "chain") {
      store.activateChain();
      projRef.current.push({ id: nextId(), x: px, z: pz, dx: fx, dz: fz, speed: 20, damage: 0.5, life: 0.8, type: "chain" });
    } else if (w === "firerod") {
      if (!store.useFireRod()) return;
      // Three-way fire beam spread
      for (let i = -1; i <= 1; i++) {
        const ang = Math.atan2(fz, fx) + i * 0.25;
        projRef.current.push({ id: nextId(), x: px, z: pz, dx: Math.cos(ang), dz: Math.sin(ang), speed: 22, damage: 1.8, life: 1.2, type: "firerod" });
      }
    } else if (w === "icerod") {
      if (!store.useIceRod()) return;
      // Freeze cone — instant range projectile + freeze effect
      projRef.current.push({ id: nextId(), x: px, z: pz, dx: fx, dz: fz, speed: 18, damage: 1.2, life: 1.5, type: "icerod" });
      weaponEffects.freezeUntil = Math.max(weaponEffects.freezeUntil, Date.now() + 3000);
    } else if (w === "hammer") {
      if (!store.useHammer()) return;
      // Ground slam — instant wide area around player
      weaponHitZones.push({ id: nextId(), x: px, z: pz, radius: 3.0, damage: 2.5, type: "hammer" });
      setExplosions(prev => [...prev, { id: nextId(), x: px, z: pz }]);
      setTimeout(() => weaponHitZones.splice(0, weaponHitZones.length), 120);
    } else if (w === "net") {
      if (!store.useNet()) return;
      // Stun zone in front of player
      const tx = px + fx * 2.5;
      const tz = pz + fz * 2.5;
      weaponHitZones.push({ id: nextId(), x: tx, z: tz, radius: 3.5, damage: 0.25, type: "net" });
      weaponEffects.stunUntil = Math.max(weaponEffects.stunUntil, Date.now() + 2500);
      setExplosions(prev => [...prev, { id: nextId(), x: tx, z: tz }]);
      setTimeout(() => weaponHitZones.splice(0, weaponHitZones.length), 120);
    } else if (w === "cape") {
      if (!store.useCape()) return;
      // Brief invincibility (uses shadowEndTime the same way the Shadow Veil does)
      store.activateShadow();
    } else if (w === "bombos") {
      if (!store.useBombos()) return;
      // Explosive ring — large area, high damage
      weaponHitZones.push({ id: nextId(), x: px, z: pz, radius: 18, damage: 2.0, type: "bombos" });
      setExplosions(prev => [...prev, { id: nextId(), x: px, z: pz }]);
      setTimeout(() => weaponHitZones.splice(0, weaponHitZones.length), 150);
    } else if (w === "ether") {
      if (!store.useEther()) return;
      // Freeze every enemy on screen
      weaponEffects.freezeUntil = Math.max(weaponEffects.freezeUntil, Date.now() + 3500);
      setExplosions(prev => [...prev, { id: nextId(), x: px, z: pz }]);
    } else if (w === "dipsgram") {
      if (!store.useDip()) return;
      // Lightning — hits all, stun + damage
      weaponHitZones.push({ id: nextId(), x: px, z: pz, radius: 22, damage: 1.5, type: "dipsgram" });
      weaponEffects.stunUntil = Math.max(weaponEffects.stunUntil, Date.now() + 1800);
      setExplosions(prev => [...prev, { id: nextId(), x: px, z: pz }]);
      setTimeout(() => weaponHitZones.splice(0, weaponHitZones.length), 150);
    }
    triggerRender(n => n + 1);
  }

  useFrame((_, delta) => {
    if (gameState !== "playing") return;
    const dt = Math.min(delta, 0.05);

    // Consume queued weapon fire
    if (spawnQueueRef.current) {
      spawnWeapon(spawnQueueRef.current);
      spawnQueueRef.current = null;
    }

    // Clear last frame's weapon hit zones
    weaponHitZones.length = 0;

    // Aura spin
    if (auraOrbsRef.current.length > 0) {
      auraAngle.current += dt * 2.5;
      const isAuraActive = Date.now() < auraEndTime;
      if (!isAuraActive) {
        auraOrbsRef.current = [];
        triggerRender(n => n + 1);
      } else {
        for (let i = 0; i < auraOrbsRef.current.length; i++) {
          auraOrbsRef.current[i].angle = (i / auraOrbsRef.current.length) * Math.PI * 2 + auraAngle.current;
          const ox = playerState.x + Math.cos(auraOrbsRef.current[i].angle) * 1.4;
          const oz = playerState.z + Math.sin(auraOrbsRef.current[i].angle) * 1.4;
          weaponHitZones.push({ id: auraOrbsRef.current[i].id, x: ox, z: oz, radius: 0.6, damage: 0.5, type: "aura" });
        }
      }
    }

    let anyDone = false;

    for (const p of projRef.current) {
      p.life -= dt;
      if (p.life <= 0) { anyDone = true; continue; }

      if (p.type === "boomerang") {
        const dist = Math.sqrt((p.x - p.startX!) ** 2 + (p.z - p.startZ!) ** 2);
        if (!p.boomerangReturn && dist > (p.maxDist ?? 9)) p.boomerangReturn = true;
        if (p.boomerangReturn) {
          const bx = playerState.x - p.x;
          const bz = playerState.z - p.z;
          const bl = Math.sqrt(bx * bx + bz * bz) || 1;
          p.dx = bx / bl;
          p.dz = bz / bl;
          if (bl < 1) { p.life = -1; anyDone = true; continue; }
        }
      }

      p.x += p.dx * p.speed * dt;
      p.z += p.dz * p.speed * dt;

      // Bounds check
      if (Math.abs(p.x) > 26 || Math.abs(p.z) > 26) { p.life = -1; anyDone = true; continue; }

      // Bomb explodes on timer end
      if (p.type === "bomb" && p.life <= 0) {
        weaponHitZones.push({ id: p.id, x: p.x, z: p.z, radius: 3.4, damage: p.damage, type: "bomb" });
        setExplosions(prev => [...prev, { id: nextId(), x: p.x, z: p.z }]);
        anyDone = true;
        continue;
      }

      // Register hit zone
      weaponHitZones.push({ id: p.id, x: p.x, z: p.z, radius: 0.9, damage: p.damage, type: p.type });

      // Frost slows
      if (p.type === "frost") {
        weaponEffects.stunUntil = Math.max(weaponEffects.stunUntil, Date.now() + 1500);
      }
    }

    if (anyDone) {
      projRef.current = projRef.current.filter(p => p.life > 0);
      triggerRender(n => n + 1);
    }
  });

  return (
    <>
      {projRef.current.map(p => <ProjMesh key={p.id} p={p} />)}
      {auraOrbsRef.current.length > 0 && <AuraMesh orbs={auraOrbsRef.current} />}
      {explosions.map(e => (
        <BombExplosion key={e.id} x={e.x} z={e.z} onDone={() => setExplosions(prev => prev.filter(x => x.id !== e.id))} />
      ))}
    </>
  );
}
