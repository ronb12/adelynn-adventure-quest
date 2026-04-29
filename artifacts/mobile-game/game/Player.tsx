import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { useGameStore, SWORD_DEFS, SWORD_CHESTS, SwordId } from "./store";
import { touchInput, playerState, WeaponId } from "./controls";

const PLAYER_SPEED = 6.5;
const DASH_SPEED = 16;
const DASH_DURATION = 0.22;
const DASH_COOLDOWN = 1.4;
const SWORD_DURATION = 0.35;
const SPIN_DURATION = 0.55;
const AREA_BOUND = 22.5;

// ── Colour palette — Adelynn ──────────────────────────────────────
const C = {
  tunic:   "#e91e8c",
  tunicDk: "#880e4f",
  skin:    "#f5c9a0",
  hair:    "#7b2d14",
  boot:    "#5a0e35",
  bootCuff:"#7a1a4a",
  bootToe: "#3d0824",
  belt:    "#fce4ec",
  gold:    "#fdd835",
  steel:   "#eceff1",
  steelDk: "#90a4ae",
  shPink:  "#f06292",
  shGold:  "#f8bbd0",
};

// ── Sub-components ────────────────────────────────────────────────
function HeroHead() {
  return (
    <group position={[0, 1.55, 0]}>
      {/* Neck */}
      <mesh position={[0, -0.22, 0]}><cylinderGeometry args={[0.14, 0.14, 0.22, 10]} /><meshStandardMaterial color={C.skin} /></mesh>
      {/* Head */}
      <mesh><sphereGeometry args={[0.33, 18, 14]} /><meshStandardMaterial color={C.skin} /></mesh>
      {/* Ears */}
      <mesh position={[-0.34, 0.04, 0]}><sphereGeometry args={[0.08, 8, 6]} /><meshStandardMaterial color={C.skin} /></mesh>
      <mesh position={[0.34, 0.04, 0]}><sphereGeometry args={[0.08, 8, 6]} /><meshStandardMaterial color={C.skin} /></mesh>
      {/* Eyes */}
      <mesh position={[-0.13, 0.06, 0.3]}><sphereGeometry args={[0.065, 10, 8]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
      <mesh position={[0.13, 0.06, 0.3]}><sphereGeometry args={[0.065, 10, 8]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
      {/* Eye whites */}
      <mesh position={[-0.13, 0.07, 0.295]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[0.13, 0.07, 0.295]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="#ffffff" /></mesh>
      {/* Nose + mouth */}
      <mesh position={[0, -0.03, 0.32]}><sphereGeometry args={[0.05, 8, 6]} /><meshStandardMaterial color={C.skin} /></mesh>
      <mesh position={[0, -0.12, 0.3]}><boxGeometry args={[0.13, 0.045, 0.02]} /><meshStandardMaterial color="#e91e8c" roughness={0.5} /></mesh>
      {/* Hair */}
      <mesh position={[0, 0.06, -0.22]}><sphereGeometry args={[0.3, 10, 8]} /><meshStandardMaterial color={C.hair} roughness={0.8} /></mesh>
      <mesh position={[-0.27, -0.02, 0.15]}><sphereGeometry args={[0.11, 8, 6]} /><meshStandardMaterial color={C.hair} roughness={0.8} /></mesh>
      <mesh position={[0.27, -0.02, 0.15]}><sphereGeometry args={[0.11, 8, 6]} /><meshStandardMaterial color={C.hair} roughness={0.8} /></mesh>
      <mesh position={[0, -0.02, -0.32]}><sphereGeometry args={[0.13, 9, 7]} /><meshStandardMaterial color={C.hair} roughness={0.8} /></mesh>
      {/* Ponytail */}
      <mesh position={[0, -0.28, -0.34]} rotation={[0.3, 0, 0]}><cylinderGeometry args={[0.07, 0.05, 0.38, 8]} /><meshStandardMaterial color={C.hair} roughness={0.8} /></mesh>
      <mesh position={[0, -0.52, -0.28]}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color={C.hair} roughness={0.8} /></mesh>
      {/* Hair bow */}
      <mesh position={[0.01, 0.02, -0.34]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.22, 0.08, 0.05]} /><meshStandardMaterial color="#ff4db8" roughness={0.4} /></mesh>
      {/* Hat brim */}
      <mesh position={[0, 0.26, 0]}><cylinderGeometry args={[0.42, 0.42, 0.08, 16]} /><meshStandardMaterial color={C.tunic} roughness={0.55} /></mesh>
      {/* Hat cone */}
      <mesh position={[0, 0.76, -0.04]} rotation={[0.3, 0, 0]}><coneGeometry args={[0.36, 1.0, 14]} /><meshStandardMaterial color={C.tunic} roughness={0.55} /></mesh>
      {/* Hat gem */}
      <mesh position={[0, 0.32, 0.38]}><sphereGeometry args={[0.055, 7, 5]} /><meshStandardMaterial color="#ffd6ec" emissive="#ff4db8" emissiveIntensity={0.6} metalness={0.4} roughness={0.2} /></mesh>
    </group>
  );
}

function HeroTorso({ armorLevel }: { armorLevel: number }) {
  const tunicColor = armorLevel >= 2 ? "#c41e1e" : armorLevel >= 1 ? "#1e50c4" : C.tunic;
  const tunicDk    = armorLevel >= 2 ? "#8b0000" : armorLevel >= 1 ? "#0a2d8b" : C.tunicDk;
  return (
    <group position={[0, 0.72, 0]}>
      <mesh><cylinderGeometry args={[0.3, 0.35, 0.72, 14]} /><meshStandardMaterial color={tunicColor} roughness={0.7} /></mesh>
      <mesh position={[0, 0.1, 0.28]}><boxGeometry args={[0.38, 0.32, 0.04]} /><meshStandardMaterial color={tunicDk} /></mesh>
      {/* Belt */}
      <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.36, 0.38, 0.1, 14]} /><meshStandardMaterial color={C.belt} roughness={0.8} /></mesh>
      <mesh position={[0, -0.3, 0.39]}><boxGeometry args={[0.14, 0.1, 0.04]} /><meshStandardMaterial color={C.gold} metalness={0.5} roughness={0.3} /></mesh>
      {/* Skirt */}
      <mesh position={[0, -0.52, 0]}><cylinderGeometry args={[0.48, 0.55, 0.28, 14]} /><meshStandardMaterial color={tunicDk} roughness={0.65} /></mesh>
      {/* Shield on hip */}
      <group position={[-0.3, -0.12, -0.25]} rotation={[0, -0.4, 0]}>
        <mesh><cylinderGeometry args={[0.3, 0.25, 0.08, 16]} /><meshStandardMaterial color={C.shPink} roughness={0.5} /></mesh>
        <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.18, 0.15, 0.03, 10]} /><meshStandardMaterial color={C.shGold} metalness={0.4} roughness={0.4} /></mesh>
        <mesh position={[0, 0.07, 0.16]}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#ff4db8" emissive="#ff4db8" emissiveIntensity={0.3} /></mesh>
      </group>
    </group>
  );
}

function HeroArm({ side, children }: { side: -1 | 1; children?: React.ReactNode }) {
  return (
    <group position={[side * 0.44, 1.0, 0]}>
      <mesh><sphereGeometry args={[0.15, 10, 8]} /><meshStandardMaterial color={C.tunic} roughness={0.7} /></mesh>
      <mesh position={[0, -0.22, 0]}><cylinderGeometry args={[0.11, 0.1, 0.32, 9]} /><meshStandardMaterial color={C.tunic} roughness={0.7} /></mesh>
      <mesh position={[0, -0.4, 0]}><sphereGeometry args={[0.1, 9, 7]} /><meshStandardMaterial color={C.skin} /></mesh>
      <mesh position={[0, -0.55, 0]}><cylinderGeometry args={[0.09, 0.09, 0.24, 9]} /><meshStandardMaterial color={C.skin} /></mesh>
      <mesh position={[0, -0.72, 0]}><sphereGeometry args={[0.1, 9, 7]} /><meshStandardMaterial color={C.skin} /></mesh>
      {children}
    </group>
  );
}

function HeroLeg({ side }: { side: -1 | 1 }) {
  return (
    <group position={[side * 0.17, 0.33, 0]}>
      {/* Upper leg */}
      <mesh><sphereGeometry args={[0.13, 10, 8]} /><meshStandardMaterial color="#f0c8a8" roughness={0.88} /></mesh>
      <mesh position={[0, -0.18, 0]}><cylinderGeometry args={[0.115, 0.105, 0.28, 10]} /><meshStandardMaterial color="#f0c8a8" roughness={0.88} /></mesh>
      {/* Knee */}
      <mesh position={[0, -0.35, 0]}><sphereGeometry args={[0.105, 10, 8]} /><meshStandardMaterial color="#f0c8a8" roughness={0.88} /></mesh>
      {/* Boot cuff */}
      <mesh position={[0, -0.44, 0]}><cylinderGeometry args={[0.115, 0.108, 0.11, 12]} /><meshStandardMaterial color={C.bootCuff} roughness={0.72} /></mesh>
      <mesh position={[0, -0.39, 0]}><cylinderGeometry args={[0.118, 0.118, 0.03, 12]} /><meshStandardMaterial color={C.gold} metalness={0.55} roughness={0.3} /></mesh>
      {/* Boot shaft */}
      <mesh position={[0, -0.6, 0]}><cylinderGeometry args={[0.105, 0.115, 0.3, 12]} /><meshStandardMaterial color={C.boot} roughness={0.78} /></mesh>
      {/* Ankle + foot */}
      <mesh position={[0, -0.77, 0]}><sphereGeometry args={[0.108, 10, 8]} /><meshStandardMaterial color={C.boot} roughness={0.8} /></mesh>
      <mesh position={[0, -0.8, 0.1]} rotation={[-0.22, 0, 0]}><boxGeometry args={[0.18, 0.13, 0.32]} /><meshStandardMaterial color={C.boot} roughness={0.78} /></mesh>
      <mesh position={[0, -0.8, 0.24]} rotation={[-0.22, 0, 0]}><sphereGeometry args={[0.1, 10, 8]} /><meshStandardMaterial color={C.bootToe} roughness={0.75} /></mesh>
    </group>
  );
}

function SwordMesh({ swordId }: { swordId: SwordId }) {
  const def = SWORD_DEFS[swordId];
  return (
    <group position={[0.04, -0.88, 0]}>
      {/* Pommel */}
      <mesh position={[0, -0.18, 0]}><sphereGeometry args={[0.09, 12, 9]} /><meshStandardMaterial color={def.guard} metalness={0.65} roughness={0.2} /></mesh>
      {/* Grip */}
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.048, 0.056, 0.42, 9]} /><meshStandardMaterial color={def.grip} roughness={0.72} /></mesh>
      {/* Grip wraps */}
      {[-0.08, 0.04, 0.16].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}><torusGeometry args={[0.056, 0.011, 6, 14]} /><meshStandardMaterial color="#cfd8dc" metalness={0.55} roughness={0.28} /></mesh>
      ))}
      {/* Guard */}
      <mesh position={[0, 0.27, 0]}><boxGeometry args={[0.64, 0.078, 0.096]} /><meshStandardMaterial color={def.guard} metalness={0.58} roughness={0.22} /></mesh>
      {/* Blade body */}
      <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.13, 1.1, 0.11]} /><meshStandardMaterial color={def.blade} metalness={0.85} roughness={0.08} emissive={def.emissive} emissiveIntensity={def.emissiveInt} /></mesh>
      {/* Blade tip */}
      <mesh position={[0, 1.6, 0]}><coneGeometry args={[0.065, 0.24, 4]} /><meshStandardMaterial color={def.blade} metalness={0.85} roughness={0.08} emissive={def.emissive} emissiveIntensity={def.emissiveInt} /></mesh>

      {/* Per-sword decorations */}
      {swordId === "flame" && <>
        <mesh position={[0, 1.76, 0]}><coneGeometry args={[0.15, 0.5, 8]} /><meshStandardMaterial color="#ff4400" emissive="#ff6600" emissiveIntensity={4} transparent opacity={0.7} /></mesh>
        <mesh position={[0, 2.05, 0]}><coneGeometry args={[0.08, 0.35, 6]} /><meshStandardMaterial color="#ffcc00" emissive="#ffdd00" emissiveIntensity={5} transparent opacity={0.6} /></mesh>
      </>}
      {swordId === "thunder" && [0.45, 0.85, 1.25].map((y, i) => (
        <mesh key={i} position={[i % 2 === 0 ? 0.08 : -0.08, y, 0.07]} rotation={[0, 0, i % 2 === 0 ? 0.5 : -0.5]}>
          <boxGeometry args={[0.07, 0.18, 0.03]} /><meshStandardMaterial color="#ffee00" emissive="#ffcc00" emissiveIntensity={4} />
        </mesh>
      ))}
      {swordId === "frost" && <>
        <mesh position={[0, 0.27, 0.08]} rotation={[0, 0, Math.PI / 6]}><torusGeometry args={[0.16, 0.026, 6, 6]} /><meshStandardMaterial color="#80d4ff" emissive="#00aaff" emissiveIntensity={2.5} /></mesh>
        <mesh position={[0, 1.75, 0]}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#ffffff" emissive="#80d4ff" emissiveIntensity={3} transparent opacity={0.85} /></mesh>
      </>}
      {swordId === "shadow" && <>
        <mesh position={[0, 1.1, 0.08]}><boxGeometry args={[0.03, 1.0, 0.02]} /><meshStandardMaterial color="#220033" emissive="#6600cc" emissiveIntensity={1.5} /></mesh>
        <mesh position={[0, 1.72, 0]}><sphereGeometry args={[0.08, 8, 6]} /><meshStandardMaterial color="#440077" emissive="#9900ff" emissiveIntensity={4} transparent opacity={0.8} /></mesh>
      </>}
      {swordId === "holy" && <>
        <mesh position={[0, 0.27, 0.06]}><boxGeometry args={[0.6, 0.03, 0.03]} /><meshStandardMaterial color="#ffffcc" emissive="#ffffaa" emissiveIntensity={3} /></mesh>
        <mesh position={[0, 1.82, 0]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color="#ffffee" emissive="#ffffcc" emissiveIntensity={5} transparent opacity={0.85} /></mesh>
      </>}
      {swordId === "viper" && <>
        <mesh position={[0.07, 1.66, 0]} rotation={[0, 0, -0.45]}><coneGeometry args={[0.04, 0.28, 5]} /><meshStandardMaterial color="#00cc44" emissive="#00ff55" emissiveIntensity={3} /></mesh>
        <mesh position={[0, 0.9, 0.08]}><sphereGeometry args={[0.045, 6, 5]} /><meshStandardMaterial color="#00ff55" emissive="#00ff55" emissiveIntensity={4} transparent opacity={0.7} /></mesh>
      </>}
      {swordId === "storm" && <>
        <mesh position={[0, 0.28, 0]}><torusGeometry args={[0.22, 0.035, 8, 14]} /><meshStandardMaterial color="#00d4cc" emissive="#00cccc" emissiveIntensity={2.5} transparent opacity={0.9} /></mesh>
        {[0.55, 1.05, 1.45].map((y, i) => (
          <mesh key={i} position={[i % 2 === 0 ? 0.06 : -0.06, y, 0.07]}>
            <sphereGeometry args={[0.04, 6, 5]} /><meshStandardMaterial color="#aaffff" emissive="#00cccc" emissiveIntensity={3} />
          </mesh>
        ))}
      </>}
      {swordId === "dragon" && <>
        {[0.5, 0.8, 1.1, 1.4].map((y, i) => (
          <mesh key={i} position={[0.09, y, 0.07]}><boxGeometry args={[0.05, 0.1, 0.05]} /><meshStandardMaterial color="#ff2200" emissive="#cc1100" emissiveIntensity={2.5} /></mesh>
        ))}
        <mesh position={[0, 1.78, 0]}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={4} transparent opacity={0.9} /></mesh>
      </>}
      {swordId === "cosmos" && <>
        {[0.5, 0.85, 1.2, 1.55].map((y, i) => (
          <mesh key={i} position={[i % 2 === 0 ? 0.07 : -0.07, y, 0.07]}>
            <sphereGeometry args={[0.055, 8, 6]} /><meshStandardMaterial color="#cc00ff" emissive="#aa00ff" emissiveIntensity={4} />
          </mesh>
        ))}
        <mesh position={[0, 1.8, 0]}><sphereGeometry args={[0.1, 10, 8]} /><meshStandardMaterial color="#ee88ff" emissive="#cc00ff" emissiveIntensity={5} transparent opacity={0.85} /></mesh>
      </>}

      <pointLight position={[0, 1.1, 0]} color={def.light} intensity={1.5} distance={2.5} decay={2} />
    </group>
  );
}

// ── Main Player component ─────────────────────────────────────────
export default function Player() {
  const groupRef    = useRef<THREE.Group>(null!);
  const bodyBobRef  = useRef<THREE.Group>(null!);
  const swordRef    = useRef<THREE.Group>(null!);

  const posRef         = useRef(new THREE.Vector3(0, 0, 0));
  const facingRef      = useRef(new THREE.Vector3(0, 0, -1));
  const swordTimerRef  = useRef(0);
  const spinTimerRef   = useRef(0);
  const spinAngleRef   = useRef(0);
  const dashTimerRef   = useRef(0);
  const dashCoolRef    = useRef(0);
  const hurtFlashRef   = useRef(0);
  const walkTimeRef    = useRef(0);

  const activeSword   = useGameStore(s => s.activeSword);
  const armorLevel    = useGameStore(s => s.armorLevel);
  const hurtCooldownEnd = useGameStore(s => s.hurtCooldownEnd);
  const pendingTransition = useGameStore(s => s.pendingTransition);
  const completeAreaTransition = useGameStore(s => s.completeAreaTransition);
  const gameState     = useGameStore(s => s.gameState);
  const shadowEndTime = useGameStore(s => s.shadowEndTime);

  const swordDef = SWORD_DEFS[activeSword];
  const transitionRef = useRef(false);

  // Sync store for swords / weapons / interact on touch
  useEffect(() => {
    const unsub = useGameStore.subscribe(s => {});
    return unsub;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (pendingTransition && !transitionRef.current) {
      transitionRef.current = true;
      posRef.current.set(pendingTransition.spawnX, 0, pendingTransition.spawnZ);
      completeAreaTransition();
      transitionRef.current = false;
      return;
    }

    if (gameState !== "playing") {
      groupRef.current.position.copy(posRef.current);
      return;
    }

    const dt = Math.min(delta, 0.05);
    useGameStore.getState().tickCombo(dt);

    // ── Consume touch inputs ──────────────────────────────────────
    if (!touchInput.attackConsumed && swordTimerRef.current <= 0 && spinTimerRef.current <= 0) {
      touchInput.attackConsumed = true;
      swordTimerRef.current = SWORD_DURATION;
      touchInput.attack = false;
    }

    if (!touchInput.dashConsumed && dashCoolRef.current <= 0) {
      touchInput.dashConsumed = true;
      dashTimerRef.current = DASH_DURATION;
      dashCoolRef.current = DASH_COOLDOWN;
      touchInput.dash = false;
    }

    if (!touchInput.cycleSwordConsumed) {
      touchInput.cycleSwordConsumed = true;
      useGameStore.getState().cycleSword(1);
    }

    if (!touchInput.cycleWeaponConsumed) {
      touchInput.cycleWeaponConsumed = true;
      useGameStore.getState().cycleWeapon(1);
    }

    if (!touchInput.fireWeaponConsumed) {
      touchInput.fireWeaponConsumed = true;
      const sel = useGameStore.getState().selectedWeapon;
      if (sel !== "sword") useGameStore.getState().fireWeapon(sel);
    }

    if (!touchInput.interactConsumed) {
      touchInput.interactConsumed = true;
      const store = useGameStore.getState();
      if (store.nearNPC) store.startDialogue(store.nearNPC);
      else if (store.nearShop) store.openShop();
      else if (store.nearFountain) store.useFountain();
      else if (store.nearLore) { /* lore handled in HUD tap */ }
    }

    dashCoolRef.current  = Math.max(0, dashCoolRef.current  - dt);
    swordTimerRef.current = Math.max(0, swordTimerRef.current - dt);
    dashTimerRef.current  = Math.max(0, dashTimerRef.current  - dt);

    // ── Spin attack (spin when sword held) ────────────────────────
    const isSpinning = spinTimerRef.current > 0;
    spinTimerRef.current = Math.max(0, spinTimerRef.current - dt);
    if (isSpinning) {
      spinAngleRef.current += dt * 14;
    }

    // ── Movement ──────────────────────────────────────────────────
    const jx = touchInput.joyX;
    const jy = touchInput.joyY;
    const jLen = Math.sqrt(jx * jx + jy * jy);

    if (jLen > 0.08) {
      facingRef.current.set(jx / jLen, 0, jy / jLen);
      walkTimeRef.current += dt * 8;
    } else {
      walkTimeRef.current = 0;
    }

    const isDashing = dashTimerRef.current > 0;
    const speed = isDashing ? DASH_SPEED : PLAYER_SPEED * Math.min(jLen, 1);

    if (jLen > 0.08 || isDashing) {
      const fx = isDashing ? facingRef.current.x : jx;
      const fz = isDashing ? facingRef.current.z : jy;
      const moveLen = Math.sqrt(fx * fx + fz * fz) || 1;
      posRef.current.x = Math.max(-AREA_BOUND, Math.min(AREA_BOUND, posRef.current.x + (fx / moveLen) * speed * dt));
      posRef.current.z = Math.max(-AREA_BOUND, Math.min(AREA_BOUND, posRef.current.z + (fz / moveLen) * speed * dt));
    }

    groupRef.current.position.lerp(posRef.current, 0.4);
    groupRef.current.rotation.y = isSpinning
      ? spinAngleRef.current
      : Math.atan2(-facingRef.current.x, -facingRef.current.z);

    // ── Bob body ──────────────────────────────────────────────────
    if (bodyBobRef.current) {
      bodyBobRef.current.position.y = Math.sin(walkTimeRef.current) * (jLen > 0.08 ? 0.06 : 0.012);
    }

    // ── Sword visibility + spin attack ───────────────────────────
    const isSwordActive = swordTimerRef.current > 0 || isSpinning;
    const swordExtend = isSpinning ? 0 : 1.4;

    playerState.x = posRef.current.x;
    playerState.z = posRef.current.z;
    playerState.facingX = facingRef.current.x;
    playerState.facingZ = facingRef.current.z;
    playerState.swordActive = isSwordActive;
    playerState.swordX = isSpinning
      ? posRef.current.x + Math.cos(spinAngleRef.current) * 1.2
      : posRef.current.x + facingRef.current.x * swordExtend;
    playerState.swordZ = isSpinning
      ? posRef.current.z + Math.sin(spinAngleRef.current) * 1.2
      : posRef.current.z + facingRef.current.z * swordExtend;
    playerState.swordRadius = isSpinning ? 1.4 : 1.1;
    playerState.dashActive = isDashing;
    playerState.isShadowVeil = Date.now() < shadowEndTime;

    if (swordRef.current) swordRef.current.visible = isSwordActive;

    // ── Hurt flash ────────────────────────────────────────────────
    const isHurt = Date.now() < hurtCooldownEnd;
    hurtFlashRef.current = isHurt ? hurtFlashRef.current + dt : 0;
    if (groupRef.current) {
      const flash = isHurt && Math.floor(hurtFlashRef.current * 8) % 2 === 0;
      groupRef.current.visible = !flash;
    }

    // ── Shadow veil transparency ──────────────────────────────────
    const isVeil = Date.now() < shadowEndTime;
    if (groupRef.current) {
      (groupRef.current as any).traverse?.((child: any) => {
        if (child.isMesh && child.material) {
          child.material.transparent = isVeil;
          child.material.opacity = isVeil ? 0.3 : 1.0;
        }
      });
    }

    // ── Camera ────────────────────────────────────────────────────
    state.camera.position.set(posRef.current.x, posRef.current.y + 16, posRef.current.z + 10);
    state.camera.lookAt(posRef.current.x, 0, posRef.current.z);

    // ── Chest / weapon altar proximity ────────────────────────────
    const store = useGameStore.getState();
    const area = store.currentArea;
    for (const chest of SWORD_CHESTS) {
      if (chest.area !== area) continue;
      if (store.chestsOpened.includes(chest.key)) continue;
      const dx = posRef.current.x - chest.x;
      const dz = posRef.current.z - chest.z;
      if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
        store.openChest(chest.key);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group ref={bodyBobRef}>
        <HeroHead />
        <HeroTorso armorLevel={armorLevel} />
        <HeroArm side={-1} />
        <HeroArm side={1}>
          {/* Sword held in right arm */}
          <group ref={swordRef} visible={false} position={[0, -0.9, -0.4]} rotation={[-0.4, 0, 0]}>
            <SwordMesh swordId={activeSword} />
          </group>
        </HeroArm>
        <HeroLeg side={-1} />
        <HeroLeg side={1} />
        {/* Sword glow light */}
        <pointLight position={[0.3, 0.8, -0.5]} color={swordDef.light} intensity={2} distance={3} decay={2} />
      </group>
    </group>
  );
}
