import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './store';
import { NPC_DATA, NPCDef } from './npcData';

// ─── Single NPC mesh ─────────────────────────────────────────────
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
        {/* ── Legs ── */}
        {([-0.14, 0.14] as number[]).map((x, i) => (
          <group key={i} position={[x, 0.32, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.1, 0.09, 0.62, 8]} />
              <meshStandardMaterial color={def.bodyColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.38, 0.04]} castShadow>
              <sphereGeometry args={[0.11, 8, 6]} />
              <meshStandardMaterial color="#3e2723" roughness={0.85} />
            </mesh>
          </group>
        ))}

        {/* ── Torso ── */}
        <mesh castShadow position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.66, 12]} />
          <meshStandardMaterial color={def.bodyColor} roughness={0.7} />
        </mesh>
        {/* Accent stripe */}
        <mesh position={[0, 0.92, 0.25]}>
          <boxGeometry args={[0.3, 0.22, 0.04]} />
          <meshStandardMaterial color={def.accentColor} roughness={0.5} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.56, 0]} castShadow>
          <cylinderGeometry args={[0.31, 0.32, 0.1, 12]} />
          <meshStandardMaterial color="#4e342e" roughness={0.8} />
        </mesh>

        {/* ── Arms ── */}
        {([-0.38, 0.38] as number[]).map((x, i) => (
          <group key={i} position={[x, 0.98, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.12, 9, 7]} />
              <meshStandardMaterial color={def.bodyColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.22, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.08, 0.3, 8]} />
              <meshStandardMaterial color={def.bodyColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.4, 0]} castShadow>
              <sphereGeometry args={[0.08, 8, 6]} />
              <meshStandardMaterial color="#f5c9a0" />
            </mesh>
          </group>
        ))}

        {/* ── Neck ── */}
        <mesh position={[0, 1.3, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.12, 0.18, 9]} />
          <meshStandardMaterial color="#f5c9a0" />
        </mesh>

        {/* ── Head ── */}
        <mesh castShadow position={[0, 1.58, 0]}>
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
        <mesh position={[0, 1.78, -0.08]} castShadow>
          <sphereGeometry args={[0.28, 12, 8]} />
          <meshStandardMaterial color={def.hairColor} roughness={0.8} />
        </mesh>

        {/* ── Nameplate (HTML label) ── */}
        <Html position={[0, 2.3, 0]} center distanceFactor={8}>
          <div
            style={{
              background: 'rgba(10,5,25,0.85)',
              border: '1px solid #e91e8c',
              borderRadius: '6px',
              padding: '2px 10px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <div style={{ color: '#ffd6ec', fontWeight: 'bold', fontSize: '11px' }}>{def.name}</div>
            <div style={{ color: '#aaa', fontSize: '9px', textAlign: 'center' }}>{def.title}</div>
          </div>
        </Html>
      </group>
    </group>
  );
}

// ─── NPC proximity manager ───────────────────────────────────────
export function NPCManager() {
  const currentArea = useGameStore(s => s.currentArea);
  const areaNPCs = NPC_DATA.filter(n => n.area === currentArea);

  useFrame(() => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;

    const player = store.playerPosition;
    let closest: string | null = null;
    let closestDist = 2.8; // interaction radius

    for (const npc of areaNPCs) {
      const npcPos = new THREE.Vector3(...npc.position);
      const dist = player.distanceTo(npcPos);
      if (dist < closestDist) {
        closestDist = dist;
        closest = npc.id;
      }
    }

    if (closest !== store.nearNPC) {
      store.setNearNPC(closest);
    }
  });

  return (
    <>
      {areaNPCs.map(npc => (
        <NPCMesh key={npc.id} def={npc} />
      ))}
    </>
  );
}
