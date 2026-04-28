// ─── Sunfield Village — houses, well, fences ─────────────────────

function Cottage({
  pos, rot = 0, roofColor = '#8b3a3a', wallColor = '#f5f0e8', size = 1,
}: {
  pos: [number, number, number];
  rot?: number;
  roofColor?: string;
  wallColor?: string;
  size?: number;
}) {
  const w = 3.2 * size;
  const d = 2.8 * size;
  const h = 2.0 * size;

  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* ── Stone base / foundation ── */}
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[w + 0.3, 0.36, d + 0.3]} />
        <meshStandardMaterial color="#9e9e9e" roughness={0.9} />
      </mesh>

      {/* ── Walls ── */}
      <mesh castShadow receiveShadow position={[0, h / 2 + 0.36, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={0.82} />
      </mesh>

      {/* ── Beams / timber frame ── */}
      <mesh position={[0, h + 0.36, 0]}>
        <boxGeometry args={[w + 0.1, 0.12, d + 0.1]} />
        <meshStandardMaterial color="#5d4037" roughness={0.8} />
      </mesh>

      {/* ── Peaked roof (two sloped panels) ── */}
      {/* Left slope */}
      <mesh castShadow position={[-w * 0.28, h + 0.36 + 0.55 * size, 0]}
        rotation={[0, 0, -0.55]}>
        <boxGeometry args={[w * 0.62, 0.14, d + 0.5]} />
        <meshStandardMaterial color={roofColor} roughness={0.75} />
      </mesh>
      {/* Right slope */}
      <mesh castShadow position={[w * 0.28, h + 0.36 + 0.55 * size, 0]}
        rotation={[0, 0, 0.55]}>
        <boxGeometry args={[w * 0.62, 0.14, d + 0.5]} />
        <meshStandardMaterial color={roofColor} roughness={0.75} />
      </mesh>
      {/* Ridge beam */}
      <mesh castShadow position={[0, h + 0.36 + 0.96 * size, 0]}>
        <boxGeometry args={[0.18, 0.18, d + 0.6]} />
        <meshStandardMaterial color="#4e342e" roughness={0.7} />
      </mesh>
      {/* Roof end gables */}
      <mesh position={[0, h + 0.36 + 0.48 * size, d / 2 + 0.07]}
        rotation={[0, 0, 0]}>
        <boxGeometry args={[w + 0.04, 1.0 * size, 0.12]} />
        <meshStandardMaterial color={wallColor} roughness={0.82} />
      </mesh>
      <mesh position={[0, h + 0.36 + 0.48 * size, -(d / 2 + 0.07)]}>
        <boxGeometry args={[w + 0.04, 1.0 * size, 0.12]} />
        <meshStandardMaterial color={wallColor} roughness={0.82} />
      </mesh>

      {/* ── Door (front face) ── */}
      <mesh position={[0, 0.72 + 0.36, d / 2 + 0.02]}>
        <boxGeometry args={[0.7 * size, 1.44 * size, 0.07]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.85} />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 0.72 + 0.36, d / 2 + 0.05]}>
        <boxGeometry args={[0.78 * size, 1.52 * size, 0.05]} />
        <meshStandardMaterial color="#4e342e" roughness={0.8} />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.22 * size, 0.7 + 0.36, d / 2 + 0.07]}>
        <sphereGeometry args={[0.055, 7, 5]} />
        <meshStandardMaterial color="#d4a840" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ── Windows (two sides) ── */}
      {/* Front-left */}
      <mesh position={[-0.9 * size, h * 0.55 + 0.36, d / 2 + 0.03]}>
        <boxGeometry args={[0.55 * size, 0.55 * size, 0.06]} />
        <meshStandardMaterial color="#aad4f5" transparent opacity={0.65} metalness={0.1} />
      </mesh>
      <mesh position={[-0.9 * size, h * 0.55 + 0.36, d / 2 + 0.05]}>
        <boxGeometry args={[0.63 * size, 0.63 * size, 0.04]} />
        <meshStandardMaterial color="#4e342e" roughness={0.8} />
      </mesh>
      {/* Front-right */}
      <mesh position={[0.9 * size, h * 0.55 + 0.36, d / 2 + 0.03]}>
        <boxGeometry args={[0.55 * size, 0.55 * size, 0.06]} />
        <meshStandardMaterial color="#aad4f5" transparent opacity={0.65} metalness={0.1} />
      </mesh>
      <mesh position={[0.9 * size, h * 0.55 + 0.36, d / 2 + 0.05]}>
        <boxGeometry args={[0.63 * size, 0.63 * size, 0.04]} />
        <meshStandardMaterial color="#4e342e" roughness={0.8} />
      </mesh>
      {/* Side window */}
      <mesh position={[w / 2 + 0.03, h * 0.55 + 0.36, 0]}>
        <boxGeometry args={[0.06, 0.55 * size, 0.55 * size]} />
        <meshStandardMaterial color="#aad4f5" transparent opacity={0.65} metalness={0.1} />
      </mesh>
      <mesh position={[w / 2 + 0.05, h * 0.55 + 0.36, 0]}>
        <boxGeometry args={[0.04, 0.63 * size, 0.63 * size]} />
        <meshStandardMaterial color="#4e342e" roughness={0.8} />
      </mesh>

      {/* ── Chimney ── */}
      <mesh castShadow position={[0.7 * size, h + 0.36 + 1.0 * size, -0.5 * size]}>
        <boxGeometry args={[0.36 * size, 1.1 * size, 0.36 * size]} />
        <meshStandardMaterial color="#9e9e9e" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Well({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {/* Stone ring */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.8, 0.85, 0.8, 14]} />
        <meshStandardMaterial color="#9e9e9e" roughness={0.9} />
      </mesh>
      {/* Inner well hole (dark) */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.82, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>
      {/* Posts */}
      {([-0.65, 0.65] as number[]).map((x, i) => (
        <mesh key={i} castShadow position={[x, 1.2, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 1.6, 7]} />
          <meshStandardMaterial color="#5d4037" roughness={0.8} />
        </mesh>
      ))}
      {/* Crossbeam */}
      <mesh castShadow position={[0, 2.05, 0]}>
        <boxGeometry args={[1.4, 0.14, 0.14]} />
        <meshStandardMaterial color="#5d4037" roughness={0.8} />
      </mesh>
      {/* Bucket */}
      <mesh position={[0.1, 1.5, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.28, 8]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.75} />
      </mesh>
      {/* Rope */}
      <mesh position={[0.1, 1.78, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.55, 5]} />
        <meshStandardMaterial color="#d4b483" roughness={0.9} />
      </mesh>
    </group>
  );
}

function FencePost({ pos }: { pos: [number, number, number] }) {
  return (
    <mesh castShadow position={pos}>
      <boxGeometry args={[0.1, 1.0, 0.1]} />
      <meshStandardMaterial color="#6d4c26" roughness={0.85} />
    </mesh>
  );
}

function FenceSection({
  from, to,
}: {
  from: [number, number, number];
  to: [number, number, number];
}) {
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2 + 0.5,
    (from[2] + to[2]) / 2,
  ];
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);

  return (
    <group>
      <FencePost pos={[from[0], from[1] + 0.5, from[2]]} />
      <FencePost pos={[to[0], to[1] + 0.5, to[2]]} />
      {/* Rail top */}
      <mesh position={mid} rotation={[0, angle, 0]}>
        <boxGeometry args={[0.07, 0.07, len]} />
        <meshStandardMaterial color="#8d6239" roughness={0.82} />
      </mesh>
      {/* Rail mid */}
      <mesh position={[mid[0], mid[1] - 0.28, mid[2]]} rotation={[0, angle, 0]}>
        <boxGeometry args={[0.07, 0.07, len]} />
        <meshStandardMaterial color="#8d6239" roughness={0.82} />
      </mesh>
    </group>
  );
}

// ─── Adelynn's House ──────────────────────────────────────────────
function AdelynnHouse() {
  const w = 4.2, d = 3.6, h = 2.4;
  return (
    <group position={[-7, 0, 10]}>
      {/* Stone foundation */}
      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[w + 0.5, 0.44, d + 0.5]} />
        <meshStandardMaterial color="#8a8a7a" roughness={0.88} />
      </mesh>
      {/* Walls */}
      <mesh castShadow receiveShadow position={[0, h / 2 + 0.44, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#f8f2e0" roughness={0.78} />
      </mesh>
      {/* Timber frame accents */}
      {/* Horizontal beam */}
      <mesh position={[0, h + 0.44, 0]}>
        <boxGeometry args={[w + 0.12, 0.14, d + 0.12]} />
        <meshStandardMaterial color="#4e3320" roughness={0.78} />
      </mesh>
      {/* Vertical corner beams */}
      {([-w/2, w/2] as number[]).flatMap(x => ([-d/2, d/2] as number[]).map(z =>
        <mesh key={`${x}${z}`} castShadow position={[x, h / 2 + 0.44, z]}>
          <boxGeometry args={[0.13, h, 0.13]} />
          <meshStandardMaterial color="#4e3320" roughness={0.78} />
        </mesh>
      ))}
      {/* Roof — pink/lavender tile (Adelynn's style) */}
      <mesh castShadow position={[-w * 0.27, h + 0.44 + 0.65, 0]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[w * 0.62, 0.16, d + 0.6]} />
        <meshStandardMaterial color="#c06080" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[w * 0.27, h + 0.44 + 0.65, 0]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[w * 0.62, 0.16, d + 0.6]} />
        <meshStandardMaterial color="#c06080" roughness={0.72} />
      </mesh>
      {/* Ridge beam */}
      <mesh castShadow position={[0, h + 0.44 + 1.1, 0]}>
        <boxGeometry args={[0.2, 0.2, d + 0.7]} />
        <meshStandardMaterial color="#3a2010" roughness={0.72} />
      </mesh>
      {/* Gables */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[0, h + 0.44 + 0.54, side * (d / 2 + 0.08)]}>
          <boxGeometry args={[w + 0.06, 1.1, 0.14]} />
          <meshStandardMaterial color="#f8f2e0" roughness={0.78} />
        </mesh>
      ))}
      {/* Chimney */}
      <mesh castShadow position={[0.8, h + 0.44 + 1.15, -0.6]}>
        <boxGeometry args={[0.44, 1.3, 0.44]} />
        <meshStandardMaterial color="#9a9080" roughness={0.88} />
      </mesh>
      {/* Smoke puff */}
      <mesh position={[0.8, h + 0.44 + 2.1, -0.6]}>
        <sphereGeometry args={[0.28, 8, 7]} />
        <meshStandardMaterial color="#ddddcc" transparent opacity={0.4} roughness={1} />
      </mesh>

      {/* Front door — pink */}
      <mesh position={[0, 0.88 + 0.44, d / 2 + 0.03]}>
        <boxGeometry args={[0.85, 1.76, 0.08]} />
        <meshStandardMaterial color="#cc6688" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.88 + 0.44, d / 2 + 0.07]}>
        <boxGeometry args={[0.95, 1.86, 0.06]} />
        <meshStandardMaterial color="#4e3320" roughness={0.78} />
      </mesh>
      {/* Heart door knocker */}
      <mesh position={[0.15, 1.1 + 0.44, d / 2 + 0.1]}>
        <sphereGeometry args={[0.07, 8, 7]} />
        <meshStandardMaterial color="#e8c020" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Windows */}
      {([-1.1, 1.1] as number[]).map(x => (
        <group key={x}>
          <mesh position={[x, h * 0.55 + 0.44, d / 2 + 0.04]}>
            <boxGeometry args={[0.7, 0.7, 0.07]} />
            <meshStandardMaterial color="#ffeecc" transparent opacity={0.7} emissive="#ffe8aa" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[x, h * 0.55 + 0.44, d / 2 + 0.07]}>
            <boxGeometry args={[0.78, 0.78, 0.05]} />
            <meshStandardMaterial color="#4e3320" roughness={0.78} />
          </mesh>
        </group>
      ))}
      {/* Side window */}
      <mesh position={[w / 2 + 0.04, h * 0.55 + 0.44, 0]}>
        <boxGeometry args={[0.07, 0.65, 0.65]} />
        <meshStandardMaterial color="#ffeecc" transparent opacity={0.7} emissive="#ffe8aa" emissiveIntensity={0.4} />
      </mesh>

      {/* Warm interior glow */}
      <pointLight position={[0, 1.5, 0]} color="#ffdd88" intensity={0.8} distance={6} decay={2} />

      {/* Garden flower patches */}
      {([
        [-1.8, 0.02, d/2 + 0.8, '#e91e8c'],
        [-0.6, 0.02, d/2 + 0.9, '#ff80ab'],
        [ 0.6, 0.02, d/2 + 0.9, '#f06292'],
        [ 1.8, 0.02, d/2 + 0.8, '#ffd54f'],
        [-1.4, 0.02, d/2 + 1.5, '#f48fb1'],
        [ 1.4, 0.02, d/2 + 1.5, '#ffcc02'],
      ] as [number,number,number,string][]).map(([x,y,z,col], i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[x, y, z]}>
          <circleGeometry args={[0.35, 7]} />
          <meshStandardMaterial color={col} roughness={1} />
        </mesh>
      ))}
      {/* Garden path stones */}
      {[0.4, 1.0, 1.6, 2.2].map((dz, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, d/2 + dz]}>
          <circleGeometry args={[0.3, 7]} />
          <meshStandardMaterial color="#c0b8a0" roughness={0.9} />
        </mesh>
      ))}

      {/* Small fence around garden */}
      {([
        [[-2.8, 0, d/2 + 0.2], [-2.8, 0, d/2 + 2.0]],
        [[-2.8, 0, d/2 + 2.0], [ 2.8, 0, d/2 + 2.0]],
        [[ 2.8, 0, d/2 + 2.0], [ 2.8, 0, d/2 + 0.2]],
      ] as [number,number,number][][]).map(([from, to], i) => (
        <group key={i}>
          {/* Rail */}
          <mesh position={[
            (from[0]+to[0])/2, 0.55, (from[2]+to[2])/2
          ]} rotation={[0, Math.atan2(to[0]-from[0], to[2]-from[2]), 0]}>
            <boxGeometry args={[0.07, 0.07,
              Math.sqrt((to[0]-from[0])**2+(to[2]-from[2])**2)]} />
            <meshStandardMaterial color="#a07040" roughness={0.82} />
          </mesh>
        </group>
      ))}

      {/* Nameplate sign */}
      <group position={[-2.6, 0, d/2 + 0.4]} rotation={[0, 0.5, 0]}>
        <mesh castShadow position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.055, 0.065, 1.8, 7]} />
          <meshStandardMaterial color="#6d4c26" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, 1.85, 0]}>
          <boxGeometry args={[1.5, 0.55, 0.12]} />
          <meshStandardMaterial color="#e8d090" roughness={0.6} />
        </mesh>
        {/* Pink stripe decoration on sign */}
        <mesh position={[0, 1.85, 0.07]}>
          <boxGeometry args={[1.4, 0.12, 0.04]} />
          <meshStandardMaterial color="#cc6688" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

export function Village() {
  return (
    <group>
      {/* ── Adelynn's House ── */}
      <AdelynnHouse />

      {/* ── Three cottages ── */}
      <Cottage pos={[6, 0, 8]}  rot={0}                roofColor="#8b3a2a" wallColor="#f5f0e8" />
      <Cottage pos={[14, 0, 5]} rot={-Math.PI * 0.08}  roofColor="#6d4c26" wallColor="#eee8d8" size={0.9} />
      <Cottage pos={[10, 0, 15]} rot={Math.PI * 0.05}  roofColor="#4a4a6e" wallColor="#f0ede0" size={0.95} />

      {/* ── Well at village centre ── */}
      <Well pos={[9.5, 0, 10]} />

      {/* ── Fence around the village square ── */}
      <FenceSection from={[4, 0, 5]}   to={[4, 0, 13]} />
      <FenceSection from={[4, 0, 13]}  to={[12, 0, 17]} />
      <FenceSection from={[12, 0, 17]} to={[17, 0, 13]} />
      <FenceSection from={[17, 0, 13]} to={[17, 0, 5]} />
      <FenceSection from={[17, 0, 5]}  to={[4, 0, 5]} />

      {/* ── Village sign post ── */}
      <group position={[5.2, 0, 4.2]} rotation={[0, 0.3, 0]}>
        <mesh castShadow position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 1.8, 7]} />
          <meshStandardMaterial color="#6d4c26" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, 1.85, 0]}>
          <boxGeometry args={[1.4, 0.55, 0.12]} />
          <meshStandardMaterial color="#d4a84a" roughness={0.6} />
        </mesh>
      </group>

      {/* ── Flower patches ── */}
      {([
        [7, 0, 13.5], [8.5, 0, 14], [16, 0, 9], [5, 0, 9],
      ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p[0], 0.02, p[2]]}>
          <circleGeometry args={[0.6, 7]} />
          <meshStandardMaterial color={['#e91e8c', '#ffd54f', '#f06292', '#ffcc02'][i]} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
