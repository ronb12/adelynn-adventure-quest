import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { useGameStore } from "./store";
import { NPC_DATA, NPCDef } from "./npcData";
import { playerState } from "./controls";

function NPCMesh({ def }: { def: NPCDef }) {
  const bobRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (bobRef.current) {
      bobRef.current.position.y = Math.sin(clock.elapsedTime * 1.4 + def.position[0]) * 0.04;
    }
  });

  return (
    <group position={def.position}>
      <group ref={bobRef}>
        {/* Legs */}
        {([-0.14, 0.14] as number[]).map((x, i) => (
          <group key={i} position={[x, 0.32, 0]}>
            <mesh>
              <cylinderGeometry args={[0.1, 0.09, 0.62, 8]} />
              <meshStandardMaterial color={def.bodyColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.38, 0.04]}>
              <sphereGeometry args={[0.11, 8, 6]} />
              <meshStandardMaterial color="#3e2723" roughness={0.85} />
            </mesh>
          </group>
        ))}

        {/* Torso */}
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.66, 12]} />
          <meshStandardMaterial color={def.bodyColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.92, 0.25]}>
          <boxGeometry args={[0.3, 0.22, 0.04]} />
          <meshStandardMaterial color={def.accentColor} roughness={0.5} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.56, 0]}>
          <cylinderGeometry args={[0.31, 0.32, 0.1, 12]} />
          <meshStandardMaterial color="#4e342e" roughness={0.8} />
        </mesh>

        {/* Arms */}
        {([-0.38, 0.38] as number[]).map((x, i) => (
          <group key={i} position={[x, 0.98, 0]}>
            <mesh>
              <sphereGeometry args={[0.12, 9, 7]} />
              <meshStandardMaterial color={def.bodyColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.22, 0]}>
              <cylinderGeometry args={[0.09, 0.08, 0.3, 8]} />
              <meshStandardMaterial color={def.bodyColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.4, 0]}>
              <sphereGeometry args={[0.08, 8, 6]} />
              <meshStandardMaterial color="#f5c9a0" />
            </mesh>
          </group>
        ))}

        {/* Neck */}
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.11, 0.12, 0.18, 9]} />
          <meshStandardMaterial color="#f5c9a0" />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.58, 0]}>
          <sphereGeometry args={[0.29, 16, 12]} />
          <meshStandardMaterial color="#f5c9a0" />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.1, 1.62, 0.26]}>
          <sphereGeometry args={[0.048, 8, 6]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.1, 1.62, 0.26]}>
          <sphereGeometry args={[0.048, 8, 6]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        {/* Smile */}
        <mesh position={[0, 1.48, 0.27]}>
          <boxGeometry args={[0.1, 0.03, 0.02]} />
          <meshStandardMaterial color="#c26060" />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 1.78, -0.08]}>
          <sphereGeometry args={[0.28, 12, 8]} />
          <meshStandardMaterial color={def.hairColor} roughness={0.8} />
        </mesh>

        {/* Floating marker dot above head */}
        <mesh position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={3} />
        </mesh>
        <pointLight position={[0, 2.2, 0]} color="#ffd700" intensity={4} distance={3} />
      </group>
    </group>
  );
}

export default function NPCManager() {
  const currentArea = useGameStore(s => s.currentArea);
  const gameState   = useGameStore(s => s.gameState);
  const areaNPCs = NPC_DATA.filter(n => n.area === currentArea);

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
