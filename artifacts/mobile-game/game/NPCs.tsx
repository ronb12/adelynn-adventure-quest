import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { useGameStore } from "./store";
import { NPC_DATA, NPCDef } from "./npcData";
import { playerState } from "./controls";

type BehaviorType = "patrol" | "work" | "contemplate" | "wave" | "wander" | "idle";

function getBehavior(def: NPCDef): BehaviorType {
  const t = def.title.toLowerCase();
  if (
    t.includes("guard") || t.includes("knight") || t.includes("scout") ||
    t.includes("warden") || t.includes("soldier") || t.includes("lieutenant")
  ) return "patrol";
  if (
    t.includes("merchant") || t.includes("innkeeper") || t.includes("seller") ||
    t.includes("shrine keeper") || t.includes("shop")
  ) return "wave";
  if (
    t.includes("miner") || t.includes("harvest") || t.includes("fisher") ||
    t.includes("smith") || t.includes("cobbler") || t.includes("sculptor") ||
    t.includes("cartographer") || t.includes("weaver") || t.includes("alchemist") ||
    t.includes("blast") || t.includes("water-seller") || t.includes("lava") ||
    t.includes("tamer") || t.includes("botanist") || t.includes("herbalist") ||
    t.includes("lockpick") || t.includes("architect") || t.includes("shepherd") ||
    t.includes("tracker")
  ) return "work";
  if (
    t.includes("sage") || t.includes("seer") || t.includes("oracle") ||
    t.includes("scholar") || t.includes("historian") || t.includes("lore") ||
    t.includes("archivist") || t.includes("tree speaker") || t.includes("keeper of") ||
    t.includes("void") || t.includes("spirit") || t.includes("fragment")
  ) return "contemplate";
  if (
    t.includes("wander") || t.includes("hermit") || t.includes("pilgrim") ||
    t.includes("drifter") || t.includes("lost") || t.includes("spelunk") ||
    t.includes("survivor") || t.includes("child")
  ) return "wander";
  return "idle";
}

function NPCMesh({ def }: { def: NPCDef }) {
  const behavior = getBehavior(def);

  const rootRef     = useRef<THREE.Group>(null!);
  const bobRef      = useRef<THREE.Group>(null!);
  const headRef     = useRef<THREE.Group>(null!);
  const leftArmRef  = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);

  const patrolOffset  = useRef(0);
  const patrolDir     = useRef(1);
  const wanderTarget  = useRef({ x: 0, z: 0 });
  const wanderTimer   = useRef(Math.random() * 3);
  const seed          = useRef(def.position[0] * 7.3 + def.position[2] * 13.1);

  useFrame((_, delta) => {
    const t = Date.now() * 0.001;

    // Player proximity — face the player within 5 units
    const rx = rootRef.current?.position.x ?? 0;
    const rz = rootRef.current?.position.z ?? 0;
    const dx = playerState.x - (def.position[0] + rx);
    const dz = playerState.z - (def.position[2] + rz);
    const playerDist = Math.sqrt(dx * dx + dz * dz);
    const facePlayer = playerDist < 4.5;

    if (facePlayer && rootRef.current) {
      const targetAngle = Math.atan2(dx, dz);
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y, targetAngle, Math.min(delta * 3.5, 1)
      );
    }

    switch (behavior) {
      // ── PATROL: pace left-right, arm swing like walking ───────────
      case "patrol": {
        patrolOffset.current += patrolDir.current * delta * 0.75;
        if (Math.abs(patrolOffset.current) > 1.6) patrolDir.current *= -1;

        if (rootRef.current) {
          rootRef.current.position.x = patrolOffset.current;
          if (!facePlayer) {
            rootRef.current.rotation.y = THREE.MathUtils.lerp(
              rootRef.current.rotation.y,
              patrolDir.current > 0 ? Math.PI / 2 : -Math.PI / 2,
              delta * 4
            );
          }
        }
        if (bobRef.current) {
          bobRef.current.position.y = Math.abs(Math.sin(t * 4 + seed.current)) * 0.06;
        }
        if (leftArmRef.current)  leftArmRef.current.rotation.x  =  Math.sin(t * 4 + seed.current) * 0.45;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 4 + seed.current) * 0.45;
        break;
      }

      // ── WORK: lean forward, alternating arm pumping ────────────────
      case "work": {
        if (bobRef.current) {
          bobRef.current.position.y = Math.sin(t * 2.2 + seed.current) * 0.05;
          if (!facePlayer) bobRef.current.rotation.x = Math.sin(t * 1.8 + seed.current) * 0.12;
        }
        if (leftArmRef.current)  leftArmRef.current.rotation.x  =  Math.sin(t * 2.2 + seed.current) * 0.65 - 0.35;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 2.2 + seed.current) * 0.65 - 0.35;
        if (!facePlayer && rootRef.current) {
          rootRef.current.rotation.y = THREE.MathUtils.lerp(
            rootRef.current.rotation.y, def.position[2] > 0 ? 0 : Math.PI, delta * 1
          );
        }
        break;
      }

      // ── CONTEMPLATE: slow spin + head look-around ─────────────────
      case "contemplate": {
        if (!facePlayer && rootRef.current) {
          rootRef.current.rotation.y += delta * 0.22;
        }
        if (bobRef.current) {
          bobRef.current.position.y = Math.sin(t * 0.9 + seed.current) * 0.04;
        }
        if (headRef.current) {
          headRef.current.rotation.y = Math.sin(t * 0.45 + seed.current) * 0.4;
          headRef.current.rotation.x = Math.sin(t * 0.7)                 * 0.1;
        }
        if (leftArmRef.current)  leftArmRef.current.rotation.x  = -0.25 + Math.sin(t * 0.6) * 0.1;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -0.25 + Math.sin(t * 0.6) * 0.1;
        break;
      }

      // ── WAVE: right arm raised and oscillating in greeting ─────────
      case "wave": {
        if (!facePlayer && rootRef.current) {
          rootRef.current.rotation.y = Math.sin(t * 0.3 + seed.current) * 0.35;
        }
        if (bobRef.current) {
          bobRef.current.position.y = Math.sin(t * 1.2 + seed.current) * 0.04;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -0.85 + Math.sin(t * 2.8) * 0.28;
          rightArmRef.current.rotation.x = -0.25;
        }
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = 0.1;
        }
        break;
      }

      // ── WANDER: slow random drift in ~2.5-unit radius ─────────────
      case "wander": {
        wanderTimer.current -= delta;
        if (wanderTimer.current <= 0) {
          wanderTarget.current = {
            x: (Math.random() - 0.5) * 2.8,
            z: (Math.random() - 0.5) * 2.8,
          };
          wanderTimer.current = 2.8 + Math.random() * 2.5;
        }
        if (rootRef.current) {
          const cx = rootRef.current.position.x;
          const cz = rootRef.current.position.z;
          const tx = wanderTarget.current.x;
          const tz = wanderTarget.current.z;
          const distToTarget = Math.sqrt((tx - cx) ** 2 + (tz - cz) ** 2);
          if (distToTarget > 0.12) {
            rootRef.current.position.x = THREE.MathUtils.lerp(cx, tx, delta * 0.7);
            rootRef.current.position.z = THREE.MathUtils.lerp(cz, tz, delta * 0.7);
            if (!facePlayer) {
              const angle = Math.atan2(tx - cx, tz - cz);
              rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, angle, delta * 2.5);
            }
          }
        }
        if (bobRef.current) {
          bobRef.current.position.y = Math.abs(Math.sin(t * 2 + seed.current)) * 0.04;
        }
        if (leftArmRef.current)  leftArmRef.current.rotation.x  =  Math.sin(t * 2 + seed.current) * 0.28;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 2 + seed.current) * 0.28;
        break;
      }

      // ── IDLE: gentle bob, slow head sway ──────────────────────────
      default: {
        if (bobRef.current) {
          bobRef.current.position.y = Math.sin(t * 1.4 + seed.current) * 0.04;
        }
        if (!facePlayer && headRef.current) {
          headRef.current.rotation.y = Math.sin(t * 0.5 + seed.current) * 0.2;
        }
        break;
      }
    }

    // Everyone: head tracks player when close
    if (facePlayer && headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, delta * 3);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, delta * 3);
    }
  });

  return (
    <group position={def.position}>
      <group ref={rootRef}>
        <group ref={bobRef}>
          {/* Left leg */}
          <group position={[-0.14, 0.32, 0]}>
            <mesh><cylinderGeometry args={[0.1, 0.09, 0.62, 8]} /><meshStandardMaterial color={def.bodyColor} roughness={0.7} /></mesh>
            <mesh position={[0, -0.38, 0.04]}><sphereGeometry args={[0.11, 8, 6]} /><meshStandardMaterial color="#3e2723" roughness={0.85} /></mesh>
          </group>
          {/* Right leg */}
          <group position={[0.14, 0.32, 0]}>
            <mesh><cylinderGeometry args={[0.1, 0.09, 0.62, 8]} /><meshStandardMaterial color={def.bodyColor} roughness={0.7} /></mesh>
            <mesh position={[0, -0.38, 0.04]}><sphereGeometry args={[0.11, 8, 6]} /><meshStandardMaterial color="#3e2723" roughness={0.85} /></mesh>
          </group>

          {/* Torso */}
          <mesh position={[0, 0.82, 0]}>
            <cylinderGeometry args={[0.25, 0.3, 0.66, 12]} />
            <meshStandardMaterial color={def.bodyColor} roughness={0.7} />
          </mesh>
          {/* Chest detail */}
          <mesh position={[0, 0.92, 0.25]}>
            <boxGeometry args={[0.3, 0.22, 0.04]} />
            <meshStandardMaterial color={def.accentColor} roughness={0.5} />
          </mesh>
          {/* Belt */}
          <mesh position={[0, 0.56, 0]}>
            <cylinderGeometry args={[0.31, 0.32, 0.1, 12]} />
            <meshStandardMaterial color="#4e342e" roughness={0.8} />
          </mesh>

          {/* Left arm (independent ref) */}
          <group ref={leftArmRef} position={[-0.38, 0.98, 0]}>
            <mesh><sphereGeometry args={[0.12, 9, 7]} /><meshStandardMaterial color={def.bodyColor} roughness={0.7} /></mesh>
            <mesh position={[0, -0.22, 0]}><cylinderGeometry args={[0.09, 0.08, 0.3, 8]} /><meshStandardMaterial color={def.bodyColor} roughness={0.7} /></mesh>
            <mesh position={[0, -0.4, 0]}><sphereGeometry args={[0.08, 8, 6]} /><meshStandardMaterial color="#f5c9a0" /></mesh>
          </group>

          {/* Right arm (independent ref) */}
          <group ref={rightArmRef} position={[0.38, 0.98, 0]}>
            <mesh><sphereGeometry args={[0.12, 9, 7]} /><meshStandardMaterial color={def.bodyColor} roughness={0.7} /></mesh>
            <mesh position={[0, -0.22, 0]}><cylinderGeometry args={[0.09, 0.08, 0.3, 8]} /><meshStandardMaterial color={def.bodyColor} roughness={0.7} /></mesh>
            <mesh position={[0, -0.4, 0]}><sphereGeometry args={[0.08, 8, 6]} /><meshStandardMaterial color="#f5c9a0" /></mesh>
          </group>

          {/* Neck */}
          <mesh position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.11, 0.12, 0.18, 9]} />
            <meshStandardMaterial color="#f5c9a0" />
          </mesh>

          {/* Head group (independent ref for look-around) */}
          <group ref={headRef} position={[0, 1.58, 0]}>
            <mesh><sphereGeometry args={[0.29, 16, 12]} /><meshStandardMaterial color="#f5c9a0" /></mesh>
            {/* Left eye */}
            <mesh position={[-0.1, 0.04, 0.26]}><sphereGeometry args={[0.048, 8, 6]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
            {/* Right eye */}
            <mesh position={[0.1, 0.04, 0.26]}><sphereGeometry args={[0.048, 8, 6]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
            {/* Smile */}
            <mesh position={[0, -0.1, 0.27]}><boxGeometry args={[0.1, 0.03, 0.02]} /><meshStandardMaterial color="#c26060" /></mesh>
            {/* Hair */}
            <mesh position={[0, 0.2, -0.08]}><sphereGeometry args={[0.28, 12, 8]} /><meshStandardMaterial color={def.hairColor} roughness={0.8} /></mesh>
          </group>

          {/* Floating marker */}
          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={3} />
          </mesh>
          <pointLight position={[0, 2.2, 0]} color="#ffd700" intensity={4} distance={3} />
        </group>
      </group>
    </group>
  );
}

export default function NPCManager() {
  const currentArea = useGameStore(s => s.currentArea);
  const gameState   = useGameStore(s => s.gameState);
  const areaNPCs    = NPC_DATA.filter(n => n.area === currentArea);

  const nearNPCRef = useRef<string | null>(null);

  useFrame(() => {
    if (gameState !== "playing") return;

    let closest: string | null = null;
    let closestDist = 2.8;

    for (const npc of areaNPCs) {
      const dx = playerState.x - npc.position[0];
      const dz = playerState.z - npc.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < closestDist) {
        closestDist = dist;
        closest = npc.id;
      }
    }

    if (closest !== nearNPCRef.current) {
      nearNPCRef.current = closest;
      useGameStore.getState().setNearNPC(closest);
    }
  });

  return (
    <>
      {areaNPCs.map(npc => <NPCMesh key={npc.id} def={npc} />)}
    </>
  );
}
