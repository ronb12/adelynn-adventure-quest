import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { useGameStore, SWORD_DEFS } from "./store";
import { touchInput, playerState } from "./controls";

const PLAYER_SPEED = 6.5;
const DASH_SPEED = 16;
const DASH_DURATION = 0.22;
const DASH_COOLDOWN = 1.4;
const SWORD_DURATION = 0.35;
const AREA_BOUND = 22.5;

export default function Player() {
  const groupRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Mesh>(null!);
  const swordRef = useRef<THREE.Mesh>(null!);
  const capeRef = useRef<THREE.Mesh>(null!);

  const posRef = useRef(new THREE.Vector3(0, 0, 0));
  const facingRef = useRef(new THREE.Vector3(0, 0, -1));
  const swordTimerRef = useRef(0);
  const dashTimerRef = useRef(0);
  const dashCooldownRef = useRef(0);
  const hurtFlashRef = useRef(0);

  const activeSword = useGameStore(s => s.activeSword);
  const hurtCooldownEnd = useGameStore(s => s.hurtCooldownEnd);

  const swordDef = SWORD_DEFS[activeSword];
  const pendingTransition = useGameStore(s => s.pendingTransition);
  const completeAreaTransition = useGameStore(s => s.completeAreaTransition);
  const gameState = useGameStore(s => s.gameState);

  const hasResetRef = useRef(false);
  const transitionInProgressRef = useRef(false);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (pendingTransition && !transitionInProgressRef.current) {
      transitionInProgressRef.current = true;
      posRef.current.set(pendingTransition.spawnX, 0, pendingTransition.spawnZ);
      completeAreaTransition();
      hasResetRef.current = false;
      transitionInProgressRef.current = false;
      return;
    }

    if (gameState !== "playing") {
      groupRef.current.position.copy(posRef.current);
      return;
    }

    const dt = Math.min(delta, 0.05);
    useGameStore.getState().tickCombo(dt);

    if (!touchInput.attackConsumed && swordTimerRef.current <= 0) {
      touchInput.attackConsumed = true;
      swordTimerRef.current = SWORD_DURATION;
    }

    if (!touchInput.dashConsumed && dashCooldownRef.current <= 0) {
      touchInput.dashConsumed = true;
      dashTimerRef.current = DASH_DURATION;
      dashCooldownRef.current = DASH_COOLDOWN;
    }

    dashCooldownRef.current = Math.max(0, dashCooldownRef.current - dt);
    swordTimerRef.current = Math.max(0, swordTimerRef.current - dt);
    dashTimerRef.current = Math.max(0, dashTimerRef.current - dt);

    const jx = touchInput.joyX;
    const jy = touchInput.joyY;
    const jLen = Math.sqrt(jx * jx + jy * jy);

    if (jLen > 0.08) {
      const nx = jx / jLen;
      const ny = jy / jLen;
      facingRef.current.set(nx, 0, ny);
    }

    const isDashing = dashTimerRef.current > 0;
    const speed = isDashing ? DASH_SPEED : PLAYER_SPEED * Math.min(jLen, 1);

    if (jLen > 0.08 || isDashing) {
      const fx = isDashing ? facingRef.current.x : jx;
      const fz = isDashing ? facingRef.current.z : jy;
      const moveLen = Math.sqrt(fx * fx + fz * fz) || 1;
      posRef.current.x = Math.max(-AREA_BOUND, Math.min(AREA_BOUND,
        posRef.current.x + (fx / moveLen) * speed * dt
      ));
      posRef.current.z = Math.max(-AREA_BOUND, Math.min(AREA_BOUND,
        posRef.current.z + (fz / moveLen) * speed * dt
      ));
    }

    groupRef.current.position.lerp(posRef.current, 0.4);
    groupRef.current.rotation.y = Math.atan2(-facingRef.current.x, -facingRef.current.z);

    const isSwordActive = swordTimerRef.current > 0;
    const swordExtend = 1.4;
    playerState.x = posRef.current.x;
    playerState.z = posRef.current.z;
    playerState.facingX = facingRef.current.x;
    playerState.facingZ = facingRef.current.z;
    playerState.swordActive = isSwordActive;
    playerState.swordX = posRef.current.x + facingRef.current.x * swordExtend;
    playerState.swordZ = posRef.current.z + facingRef.current.z * swordExtend;
    playerState.dashActive = isDashing;

    if (swordRef.current) {
      swordRef.current.visible = isSwordActive;
    }

    if (headRef.current) {
      headRef.current.position.y = 1.15 + Math.sin(Date.now() * 0.003) * 0.02;
    }

    const isHurt = Date.now() < hurtCooldownEnd;
    hurtFlashRef.current = isHurt ? hurtFlashRef.current + dt : 0;
    if (groupRef.current) {
      const flash = isHurt && Math.floor(hurtFlashRef.current * 8) % 2 === 0;
      groupRef.current.visible = !flash;
    }

    state.camera.position.set(
      posRef.current.x,
      posRef.current.y + 16,
      posRef.current.z + 10
    );
    state.camera.lookAt(posRef.current.x, 0, posRef.current.z);
  });

  const swordColor = swordDef.color;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.25, 0.65, 6, 10]} />
        <meshStandardMaterial color="#2a8a5c" />
      </mesh>
      <mesh ref={headRef} position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.26, 10, 10]} />
        <meshStandardMaterial color="#e8b88a" />
      </mesh>
      <mesh position={[0, 1.25, -0.04]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.35, 0.12, 0.22]} />
        <meshStandardMaterial color="#3a5a18" />
      </mesh>
      <mesh ref={capeRef} position={[0, 0.7, 0.18]}>
        <planeGeometry args={[0.38, 0.7]} />
        <meshStandardMaterial color={swordColor} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={swordRef} visible={false} position={[0.2, 0.75, -0.85]} rotation={[-0.2, 0, 0.15]}>
        <boxGeometry args={[0.06, 0.06, 1.1]} />
        <meshStandardMaterial color={swordColor} emissive={swordDef.emissive} emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <cylinderGeometry args={[0.28, 0.32, 0.18, 8]} />
        <meshStandardMaterial color="#446622" />
      </mesh>
    </group>
  );
}
