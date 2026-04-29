import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useGameStore, AreaId, AreaTransition, SWORD_CHESTS, SWORD_DEFS, WEAPON_PICKUPS } from './store';
import { Village } from './Village';
import { NPCManager } from './NPCs';
import { AreaGuardian } from './Enemy';

// ─── Lore Stone Definitions ───────────────────────────────────────
interface LoreStoneDef {
  id: string;
  area: AreaId;
  pos: [number, number, number];
  title: string;
  text: string;
}
const LORE_STONES: LoreStoneDef[] = [
  // ── Sunfield Plains ──
  { id: 'lore-field-1', area: 'field', pos: [15, 0, -5], title: 'Ancient Boundary Stone',
    text: 'Here stood the Northern Gate of Sunfield, raised in the Age of Accord. The glyph reads: "Let no shadow pass while Solara watches." The carving still glows faintly at noon.' },
  { id: 'lore-field-2', area: 'field', pos: [-18, 0, -12], title: "Fallen Knight's Grave",
    text: 'Sir Aldous of the Dawn Order — fell defending Sunfield during Malgrath\'s first raid. His sword broke, but his shield held firm until the last. They say he still walks these plains in moonlight.' },
  { id: 'lore-field-3', area: 'field', pos: [10, 0, -20], title: 'Weathered Map Stone',
    text: 'A carved relief shows ancient Aldenmere — seven shining points mark the Bound Spirits\' sanctuaries. All seven glow on this stone. Outside, none do. Seven hopes. One hero.' },
  // ── Whisper Woods ──
  { id: 'lore-forest-1', area: 'forest', pos: [-6, 0, -10], title: "Druid's Warning",
    text: '"The trees remember what men forget. Thornwick planted each root as a living prayer. Should the Spirit of the Wild fall silent, the forest will turn against all who enter." — Archdruid Selene, 33 years before Malgrath.' },
  { id: 'lore-forest-2', area: 'forest', pos: [14, 0, -8], title: 'Spirit Tree Marker',
    text: 'This ancient oak grew from a seed blessed by Thornwick himself. Its bark used to glow gold at dusk. Malgrath\'s darkness has turned it grey. Even the oldest things wither without the Crown\'s light.' },
  { id: 'lore-forest-3', area: 'forest', pos: [-12, 0, -18], title: "Lost Ranger's Journal",
    text: 'Entry 47: The wolf-things grow bolder — they used to flee torchlight, now they stare through it. Malgrath\'s shadow changed them. Entry 48: (ink-smeared) they found the camp.' },
  // ── Ashrock Summit ──
  { id: 'lore-desert-1', area: 'desert', pos: [14, 0, -10], title: 'Temple Fragment',
    text: 'Part of the great Embris Temple, built above the Spirit Forge where Embris first taught metalworking. The smelting chamber is buried under the summit. Embris melted iron with a song no smith has replicated since.' },
  { id: 'lore-desert-2', area: 'desert', pos: [6, 0, 14], title: "Stone Sentinel's Last Order",
    text: 'Etched at the base of the first frozen soldier: "HOLD. THE. PASS." Captain Dren\'s final command before Malgrath\'s spell swept through the garrison. They obeyed. Perfectly. Forever.' },
  { id: 'lore-desert-3', area: 'desert', pos: [-18, 0, 14], title: "Glacira's Spring",
    text: 'The cracked basin before you once held the purest water in Aldenmere — Glacira\'s gift to the desert people. The old maps call it "The Mercy Pool." The people here named their daughters after her for three generations.' },
  // ── Verdant Ruins ──
  { id: 'lore-jungle-1', area: 'jungle', pos: [14, 0, -8], title: "Thornwick's Lost Sanctuary",
    text: 'Before the jungle swallowed these ruins, they were called Thornwick\'s Sanctuary — a place where all living things could speak with one another. That voice has been silent for one hundred years. The vines that grow here are not natural.' },
  { id: 'lore-jungle-2', area: 'jungle', pos: [-12, 0, 10], title: 'Overgrown Altar',
    text: 'This altar was carved by the first druids to honor the Spirit of the Wild. See the reliefs of wolf and bird flanking the center flame? The druids believed every creature was a letter in a message from the world. None survived long enough to read it.' },
  { id: 'lore-jungle-3', area: 'jungle', pos: [5, 0, 18], title: "Explorer's Last Entry",
    text: 'Journal page, soaked but legible: "Day 12 — The ruins are far older than any map records. Day 14 — Something in the canopy watches every step. Day 15 — The vines moved last night. They were not moved by wind."' },
  // ── Frostpeak Tundra ──
  { id: 'lore-ice-1', area: 'ice', pos: [-15, 0, -10], title: "Glacira's Northern Gate",
    text: 'This marker once stood at the entrance to Glacira\'s Domain — the northernmost Spirit outpost in all Aldenmere. Glacira herself carved it from a single block of eternal ice that, according to the texts, never melted even in summer. It has a crack now.' },
  { id: 'lore-ice-2', area: 'ice', pos: [16, 0, 5], title: 'Frozen Warning Sign',
    text: 'The ice here breathes. Not metaphorically — you can hear it at night, a slow rhythmic exhale from somewhere deep below. The garrison that camped here three years ago left their tents standing. They did not leave themselves.' },
  { id: 'lore-ice-3', area: 'ice', pos: [0, 0, -18], title: 'Ancient Ice Tablet',
    text: 'Carved in old Aldenmerian: "The Frost Wyrm slumbers in the seventh glacier. Do not wake it. Do not feed it. Do not stand on the ice above it and shout your name, no matter how much you think it is a good idea. It is not."' },
  // ── Ember Depths ──
  { id: 'lore-volcano-1', area: 'volcano', pos: [-14, 0, -12], title: 'Scorched Plaque',
    text: 'These depths were once a forge city — Embris built the first of his seven flame-gates here. The forges ran without break for four centuries. When Malgrath poisoned the fire spirits, they didn\'t stop working. They changed what they were making.' },
  { id: 'lore-volcano-2', area: 'volcano', pos: [18, 0, 8], title: "Embris' Second Inscription",
    text: '"Fire is not destruction — fire is the fastest form of change. I have forged forty crowns. They were all imperfect. The Shattered Crown was perfect. I will not forge its equal again." — Embris the Smith, final apprentice notes.' },
  { id: 'lore-volcano-3', area: 'volcano', pos: [4, 0, -20], title: 'Lava-Sealed Tablet',
    text: 'The fire spirits were not created — they were summoned. There is a difference. Created things can be unmade. Summoned things were always here; you merely asked them to be visible. Malgrath asked them to be angry.' },
  // ── Celestial Skylands ──
  { id: 'lore-sky-1', area: 'sky', pos: [12, 0, -10], title: "Solara's Obelisk",
    text: 'The Skylands were raised by Solara herself during the Second War of Shadows — islands of light where her faithful could retreat beyond reach of darkness. "The sky is my floor," she wrote. "Everything above it is home."' },
  { id: 'lore-sky-2', area: 'sky', pos: [-16, 0, 6], title: 'Storm Knight Seal',
    text: 'The Storm Knights patrol these heights. Or patrolled — this seal is their oath-stone, now cracked through. "We hold the sky as others hold the earth. We do not fall. We do not retreat. We do not compromise with storms." They compromised.' },
  { id: 'lore-sky-3', area: 'sky', pos: [5, 0, 20], title: 'Starmap Fragment',
    text: 'Seven stars mark seven gates. Three above, three below, one between. The three above are the Spirit Sanctuaries. You have walked their floors. The one between is here. The three below — look carefully at the direction every portal faces.' },
  // ── Shadowed Crypts ──
  { id: 'lore-crypt-1', area: 'crypt', pos: [-10, 0, -14], title: 'Tomb Inscription',
    text: 'Here lie the warriors of the First Siege of Malgrath\'s Tower — all four thousand of them. The crypt was meant to hold three hundred. The architect made adjustments. The stone ran out. They are stacked.' },
  { id: 'lore-crypt-2', area: 'crypt', pos: [14, 0, 8], title: 'Bone Marker',
    text: 'The dead do not sleep where Malgrath\'s shadow falls. This crypt was sealed for two centuries before Malgrath. It was re-opened from the inside six months ago. The seal shows marks from both directions. The inner marks are newer.' },
  { id: 'lore-crypt-3', area: 'crypt', pos: [0, 0, 20], title: 'Ancient Threshold Seal',
    text: '"Break not this seal. The Void lies beyond, and what waits in the Void does not sleep, does not tire, and does not forgive trespass. If you are reading this, you have already broken the seal. We are sorry."' },
  // ── The Fractured Void ──
  { id: 'lore-void-1', area: 'void', pos: [-12, 0, -8], title: 'Floating Rune Shard',
    text: 'Reality fractures here. The shard you are reading is simultaneously seventeen versions of itself; this is the one that chose to be legible. The others contain warnings. This one chose to be encouraging instead: you are doing very well.' },
  { id: 'lore-void-2', area: 'void', pos: [16, 0, 4], title: 'Dimension Crystal',
    text: 'Malgrath drew power from the Void itself — not summoned, but siphoned, like blood from a wound that does not close. The Void noticed. What reaches through the cracks is not Malgrath\'s magic anymore. It is older. It is curious about you.' },
  { id: 'lore-void-3', area: 'void', pos: [2, 0, -18], title: 'Final Warning Stone',
    text: 'The Shattered Crown hangs beyond this threshold, in the place where Malgrath anchored himself to both worlds. Reclaim it. Not because it will fix everything — it will not — but because some things must be taken back even at great cost. You are the cost.' },
  // ── Crystal Caverns ──
  { id: 'lore-cave-1', area: 'cave', pos: [-14, 0, 8], title: "Adelynn's Childhood Scratching",
    text: 'Scratched into the cave wall near the entrance, in small uneven letters: "I found this cave when I was 7. It is mine. No one else knows. I hid my best marble behind the big purple crystal." The marble is still there.' },
  { id: 'lore-cave-2', area: 'cave', pos: [18, 0, -4], title: "Miner's Note",
    text: 'Pinned under a rock: "The crystals grow an inch every fifty years. The ones taller than a man have been here since before the kingdom. The ones taller than the kingdom have been here since before memory. Do not take them. The cave notices."' },
  { id: 'lore-cave-3', area: 'cave', pos: [4, 0, -18], title: 'Crystal Resonance Log',
    text: '"Day 1: The crystals hum at night. Day 3: The hum has a pattern — it repeats every 40 seconds. Day 7: I figured out the melody. It is the old Sunfield lullaby. Day 8: I did not teach it to the crystals. Someone did, a very long time ago."' },
];

// ── Lore Stone: 3D glow tablet (self-animating) ───────────────────
function LoreStone({ def }: { def: LoreStoneDef }) {
  const tabletRef = useRef<THREE.Group>(null!);
  const runeFaceRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const glow = 0.5 + Math.sin(t * 1.8 + def.id.length) * 0.3;
    const floatY = 0.05 * Math.sin(t * 1.2 + def.id.length * 0.5);
    const near = useGameStore.getState().nearLore === def.id;

    if (tabletRef.current) tabletRef.current.position.y = 0.65 + floatY;
    if (runeFaceRef.current) {
      const mat = runeFaceRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = near ? glow * 2.5 : glow;
    }
    if (lightRef.current) {
      lightRef.current.intensity = near ? glow * 3 : glow * 0.8;
      lightRef.current.distance = near ? 6 : 3;
    }
  });

  return (
    <group position={def.pos}>
      {/* Stone base */}
      <mesh castShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[0.55, 0.35, 0.18]} />
        <meshStandardMaterial color="#5a5070" roughness={0.85} />
      </mesh>
      {/* Floating tablet */}
      <group ref={tabletRef} position={[0, 0.65, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.8, 0.1]} />
          <meshStandardMaterial color="#2a1a4a" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* Glowing rune face */}
        <mesh ref={runeFaceRef} position={[0, 0, 0.056]}>
          <planeGeometry args={[0.5, 0.66]} />
          <meshStandardMaterial
            color="#8844cc" emissive="#4422aa" emissiveIntensity={0.5}
            transparent opacity={0.92}
          />
        </mesh>
        {/* Rune lines */}
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} position={[0, 0.22 - i * 0.14, 0.062]}>
            <planeGeometry args={[0.36, 0.025]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff"
              emissiveIntensity={1} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      <pointLight ref={lightRef} position={[0, 0.65, 0]}
        color="#6622aa" intensity={0.4} distance={3} decay={2} />
    </group>
  );
}

// ── Lore Stones Manager — proximity detection ─────────────────────
function LoreStonesForArea({ area }: { area: AreaId }) {
  const stones = useMemo(() => LORE_STONES.filter(s => s.area === area), [area]);
  const nearLoreRef = useRef<string | null>(null);

  useFrame(() => {
    const pp = useGameStore.getState().playerPosition;
    const { setNearLore } = useGameStore.getState();
    let found: string | null = null;
    for (const s of stones) {
      const dx = pp.x - s.pos[0];
      const dz = pp.z - s.pos[2];
      if (Math.sqrt(dx*dx + dz*dz) < 3.5) { found = s.id; break; }
    }
    if (found !== nearLoreRef.current) {
      nearLoreRef.current = found;
      setNearLore(found);
    }
  });

  return (
    <>
      {stones.map(s => <LoreStone key={s.id} def={s} />)}
    </>
  );
}

// ─── Portal definitions ───────────────────────────────────────────
export interface PortalDef {
  pos: [number, number, number];
  rot: [number, number, number];
  label: string;
  destination: AreaTransition;
  color: string;
}

export const PORTALS: Record<AreaId, PortalDef[]> = {
  field: [
    { pos: [0, 0, -29], rot: [0, 0, 0], label: 'Whisper Woods',
      destination: { area: 'forest', spawnPos: new THREE.Vector3(0, 0, 26) }, color: '#44ff44' },
    { pos: [29, 0, 0], rot: [0, -Math.PI/2, 0], label: 'Ashrock Summit',
      destination: { area: 'desert', spawnPos: new THREE.Vector3(-26, 0, 0) }, color: '#ff8822' },
    { pos: [0, 0, 29], rot: [0, Math.PI, 0], label: 'Crystal Caverns',
      destination: { area: 'cave', spawnPos: new THREE.Vector3(0, 0, -24) }, color: '#9944ff' },
    { pos: [-20, 0, -17], rot: [0, 0, 0], label: "Adelynn's Home",
      destination: { area: 'home', spawnPos: new THREE.Vector3(0, 0, 0) }, color: '#ffcc44' },
  ],
  forest: [
    { pos: [0, 0, 29], rot: [0, Math.PI, 0], label: 'Sunfield Plains',
      destination: { area: 'field', spawnPos: new THREE.Vector3(0, 0, -24) }, color: '#88aaff' },
    { pos: [29, 0, 0], rot: [0, -Math.PI/2, 0], label: 'Verdant Ruins',
      destination: { area: 'jungle', spawnPos: new THREE.Vector3(-26, 0, 0) }, color: '#22ee44' },
  ],
  desert: [
    { pos: [-29, 0, 0], rot: [0, Math.PI/2, 0], label: 'Sunfield Plains',
      destination: { area: 'field', spawnPos: new THREE.Vector3(26, 0, 0) }, color: '#88aaff' },
    { pos: [0, 0, 29], rot: [0, Math.PI, 0], label: 'Frostpeak Tundra',
      destination: { area: 'ice', spawnPos: new THREE.Vector3(0, 0, -26) }, color: '#88ddff' },
  ],
  boss: [
    { pos: [0, 0, 29], rot: [0, Math.PI, 0], label: 'Return to Sunfield Plains',
      destination: { area: 'field', spawnPos: new THREE.Vector3(0, 0, 20) }, color: '#88aaff' },
  ],
  jungle: [
    { pos: [-29, 0, 0], rot: [0, Math.PI/2, 0], label: 'Whisper Woods',
      destination: { area: 'forest', spawnPos: new THREE.Vector3(26, 0, 0) }, color: '#44ff44' },
    { pos: [29, 0, 0], rot: [0, -Math.PI/2, 0], label: 'Celestial Skylands',
      destination: { area: 'sky', spawnPos: new THREE.Vector3(-26, 0, 0) }, color: '#88aaff' },
  ],
  ice: [
    { pos: [0, 0, -29], rot: [0, 0, 0], label: 'Ashrock Summit',
      destination: { area: 'desert', spawnPos: new THREE.Vector3(0, 0, 26) }, color: '#ff8822' },
    { pos: [0, 0, 29], rot: [0, Math.PI, 0], label: 'Ember Depths',
      destination: { area: 'volcano', spawnPos: new THREE.Vector3(0, 0, -26) }, color: '#ff4400' },
  ],
  volcano: [
    { pos: [0, 0, -29], rot: [0, 0, 0], label: 'Frostpeak Tundra',
      destination: { area: 'ice', spawnPos: new THREE.Vector3(0, 0, 26) }, color: '#88ddff' },
    { pos: [29, 0, 0], rot: [0, -Math.PI/2, 0], label: 'Shadowed Crypts',
      destination: { area: 'crypt', spawnPos: new THREE.Vector3(-26, 0, 0) }, color: '#9933cc' },
  ],
  sky: [
    { pos: [-29, 0, 0], rot: [0, Math.PI/2, 0], label: 'Verdant Ruins',
      destination: { area: 'jungle', spawnPos: new THREE.Vector3(26, 0, 0) }, color: '#22ee44' },
    { pos: [0, 0, 29], rot: [0, Math.PI, 0], label: 'Shadowed Crypts',
      destination: { area: 'crypt', spawnPos: new THREE.Vector3(0, 0, -26) }, color: '#9933cc' },
  ],
  crypt: [
    { pos: [0, 0, -29], rot: [0, 0, 0], label: 'Celestial Skylands',
      destination: { area: 'sky', spawnPos: new THREE.Vector3(0, 0, 26) }, color: '#88aaff' },
    { pos: [-29, 0, 0], rot: [0, Math.PI/2, 0], label: 'Ember Depths',
      destination: { area: 'volcano', spawnPos: new THREE.Vector3(26, 0, 0) }, color: '#ff4400' },
    { pos: [0, 0, 29], rot: [0, Math.PI, 0], label: 'The Fractured Void',
      destination: { area: 'void', spawnPos: new THREE.Vector3(0, 0, -26) }, color: '#cc00ff' },
  ],
  void: [
    { pos: [0, 0, -29], rot: [0, 0, 0], label: 'Shadowed Crypts',
      destination: { area: 'crypt', spawnPos: new THREE.Vector3(0, 0, 26) }, color: '#9933cc' },
  ],
  cave: [
    { pos: [0, 0, 29], rot: [0, Math.PI, 0], label: 'Return to Sunfield Plains',
      destination: { area: 'field', spawnPos: new THREE.Vector3(0, 0, 24) }, color: '#88aaff' },
  ],
  home: [
    { pos: [0, 0, 9], rot: [0, Math.PI, 0], label: 'Return to Sunfield Plains',
      destination: { area: 'field', spawnPos: new THREE.Vector3(-20, 0, -12) }, color: '#ffdd88' },
  ],
};

// ── Boss portal in field (only when all 3 shards collected) ──────
const BOSS_PORTAL_DEF: PortalDef = {
  pos: [-29, 0, 0], rot: [0, Math.PI/2, 0],
  label: "Malgrath's Lair",
  destination: { area: 'boss', spawnPos: new THREE.Vector3(0, 0, 22) },
  color: '#9900ff',
};
// ── Boss portal in void (alternate entry, also requires 3 shards) ──
const VOID_BOSS_PORTAL_DEF: PortalDef = {
  pos: [29, 0, 0], rot: [0, -Math.PI/2, 0],
  label: "Enter Malgrath's Lair",
  destination: { area: 'boss', spawnPos: new THREE.Vector3(0, 0, 22) },
  color: '#ff00cc',
};

function seededItems(count: number, rangeLo: number, rangeHi: number, seed: number) {
  const rng = (n: number) => {
    const x = Math.sin(n + seed) * 43758.5453;
    return x - Math.floor(x);
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (rng(i * 2 + 1) - 0.5) * (rangeHi - rangeLo),
    z: (rng(i * 2 + 2) - 0.5) * (rangeHi - rangeLo),
    scale: 0.7 + rng(i * 3 + 3) * 0.6,
    rot: rng(i * 5 + 7) * Math.PI * 2,
  }));
}

// ─── Portal arch ─────────────────────────────────────────────────
function Portal({ def, portalTime }: { def: PortalDef; portalTime: number }) {
  const glow = 0.8 + Math.sin(portalTime * 2.5) * 0.4;
  return (
    <group position={def.pos} rotation={def.rot}>
      <mesh position={[-1.2, 2.5, 0]} castShadow>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#665544" />
      </mesh>
      <mesh position={[1.2, 2.5, 0]} castShadow>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#665544" />
      </mesh>
      <mesh position={[0, 5.2, 0]} castShadow>
        <boxGeometry args={[3.0, 0.5, 0.4]} />
        <meshStandardMaterial color="#665544" />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <planeGeometry args={[2.0, 4.8]} />
        <meshStandardMaterial color={def.color} emissive={def.color}
          emissiveIntensity={glow} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={def.color} intensity={glow * 3} distance={8} decay={2} />
    </group>
  );
}

// ─── Crystal shard chest ─────────────────────────────────────────
const SHARD_COLORS: Record<string, string> = {
  field: '#ffe060', forest: '#9966ff', desert: '#ff6030', 'boss-armor': '#44aaff',
};

function TreasureChest({ pos, area }: { pos: [number, number, number]; area: string }) {
  const chestsOpened = useGameStore(s => s.chestsOpened);
  const opened = chestsOpened.includes(area);
  const color  = SHARD_COLORS[area] ?? '#ffd060';
  return (
    <group position={pos}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.95, 1.05]} />
        <meshStandardMaterial color="#6b4020" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[-0.56, 0.28, 0]}>
        <boxGeometry args={[0.07, 0.95, 1.07]} />
        <meshStandardMaterial color="#404040" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0.56, 0.28, 0]}>
        <boxGeometry args={[0.07, 0.95, 1.07]} />
        <meshStandardMaterial color="#404040" metalness={0.6} roughness={0.5} />
      </mesh>
      <group position={[0, 0.55, -0.5]} rotation={[opened ? -Math.PI*0.72 : 0, 0, 0]}>
        <mesh castShadow position={[0, 0.09, 0.55]}>
          <boxGeometry args={[1.72, 0.2, 1.1]} />
          <meshStandardMaterial color="#8b5030" roughness={0.75} />
        </mesh>
      </group>
      {!opened && (
        <mesh position={[0, 0.48, 0.54]}>
          <boxGeometry args={[0.28, 0.28, 0.06]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.2}
            emissive={color} emissiveIntensity={0.7} />
        </mesh>
      )}
      {opened && (
        <mesh position={[0, 0.9, 0]} rotation={[0.4, Math.PI/4, 0]}>
          <octahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial color={color} transparent opacity={0.75}
            emissive={color} emissiveIntensity={2} metalness={0.3} />
        </mesh>
      )}
      {!opened && (
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.09, 9, 7]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} />
        </mesh>
      )}
      <pointLight position={[0, opened ? 1.2 : 2, 0]} color={color}
        intensity={opened ? 0.6 : 3.5} distance={opened ? 5 : 10} decay={2} />
    </group>
  );
}

// ─── Sword Upgrade Chest ─────────────────────────────────────────
function SwordChest({ chestKey, pos, swordId }: {
  chestKey: string;
  pos: [number, number, number];
  swordId: string;
}) {
  const chestsOpened = useGameStore(s => s.chestsOpened);
  const opened = chestsOpened.includes(chestKey);
  const def = SWORD_DEFS[swordId as keyof typeof SWORD_DEFS];
  const glow = def?.light ?? '#ffdd88';

  return (
    <group position={[pos[0], pos[1] + 0.5, pos[2]]}>
      {/* Gold chest base */}
      <mesh castShadow>
        <boxGeometry args={[1.3, 0.85, 0.95]} />
        <meshStandardMaterial color="#8b6820" roughness={0.75} metalness={0.2} />
      </mesh>
      {/* Gold trim sides */}
      <mesh castShadow position={[-0.45, 0.24, 0]}>
        <boxGeometry args={[0.07, 0.9, 0.97]} />
        <meshStandardMaterial color="#ddaa20" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0.45, 0.24, 0]}>
        <boxGeometry args={[0.07, 0.9, 0.97]} />
        <meshStandardMaterial color="#ddaa20" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Lid */}
      <group position={[0, 0.5, -0.45]} rotation={[opened ? -Math.PI * 0.72 : 0, 0, 0]}>
        <mesh castShadow position={[0, 0.09, 0.48]}>
          <boxGeometry args={[1.38, 0.22, 0.97]} />
          <meshStandardMaterial color="#aa8824" roughness={0.6} metalness={0.35} />
        </mesh>
      </group>
      {/* Gold lock (hidden when opened) */}
      {!opened && (
        <mesh position={[0, 0.44, 0.49]}>
          <boxGeometry args={[0.28, 0.26, 0.06]} />
          <meshStandardMaterial color={glow} metalness={0.9} roughness={0.05}
            emissive={glow} emissiveIntensity={1.2} />
        </mesh>
      )}
      {/* Beacon beam (unopened) */}
      {!opened && <>
        <mesh position={[0, 3.5, 0]}>
          <cylinderGeometry args={[0.06, 0.18, 7, 8]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={2}
            transparent opacity={0.25} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.1, 9, 7]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={5} />
        </mesh>
      </>}
      {/* Sword icon floating when opened */}
      {opened && (
        <mesh position={[0, 0.9, 0]} rotation={[0.3, Math.PI / 4, 0]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color={glow} transparent opacity={0.75}
            emissive={glow} emissiveIntensity={3} metalness={0.5} />
        </mesh>
      )}
      <pointLight position={[0, opened ? 1.2 : 2.5, 0]} color={glow}
        intensity={opened ? 0.8 : 4} distance={opened ? 5 : 12} decay={2} />
    </group>
  );
}

// Renders all sword chests belonging to a given area
function SwordChestsForArea({ area }: { area: string }) {
  const chestsInArea = SWORD_CHESTS.filter(c => c.area === area);
  return (
    <>
      {chestsInArea.map(c => (
        <SwordChest key={c.key} chestKey={c.key} pos={c.pos} swordId={c.swordId} />
      ))}
    </>
  );
}

// ─── Weapon Altar (pedestal like Zelda ALTTP) ─────────────────────
function WeaponAltar({ pickupKey, pos, color, label }: {
  pickupKey: string; pos: [number, number, number]; color: string; label: string;
}) {
  const t             = useRef(0);
  const gemRef        = useRef<THREE.Group>(null!);
  const beamRef       = useRef<THREE.Mesh>(null!);
  const chestsOpened  = useGameStore(s => s.chestsOpened);
  const nearWeapon    = useGameStore(s => s.nearWeaponPickup);
  const collected     = chestsOpened.includes(pickupKey);
  const near          = nearWeapon === pickupKey;

  useFrame((_, delta) => {
    t.current += delta;
    if (!collected && gemRef.current) {
      gemRef.current.position.y = 1.85 + Math.sin(t.current * 2.2) * 0.14;
      gemRef.current.rotation.y = t.current * 1.8;
    }
    if (!collected && beamRef.current) {
      beamRef.current.rotation.y = t.current * 0.6;
      beamRef.current.material = beamRef.current.material as THREE.MeshStandardMaterial;
      (beamRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.18 + Math.sin(t.current * 1.4) * 0.07;
    }
  });

  return (
    <group position={pos}>
      {/* Stone base — three tiers */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.9, 0.4, 12]} />
        <meshStandardMaterial color={collected ? '#55556a' : '#8899aa'} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.54, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.75, 0.28, 12]} />
        <meshStandardMaterial color={collected ? '#444455' : '#99aabc'} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.55, 0.24, 12]} />
        <meshStandardMaterial color={collected ? '#33334a' : '#aabcd0'} roughness={0.8} />
      </mesh>
      {/* Rune ring on top */}
      <mesh position={[0, 0.97, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.42, 20]} />
        <meshStandardMaterial
          color={collected ? '#333' : color}
          emissive={collected ? '#000' : color}
          emissiveIntensity={collected ? 0 : 1.2}
          transparent opacity={0.9} />
      </mesh>

      {/* Floating weapon gem (only when uncollected) */}
      {!collected && (
        <group ref={gemRef} position={[0, 1.85, 0]}>
          <mesh>
            <octahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial
              color={color} emissive={color} emissiveIntensity={2.5}
              metalness={0.3} roughness={0.1} transparent opacity={0.92} />
          </mesh>
          {/* Small inner crystal */}
          <mesh scale={0.45} rotation={[Math.PI / 4, 0, 0]}>
            <octahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial
              color="#ffffff" emissive="#ffffff" emissiveIntensity={3}
              transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {/* Collected — dimmed remnant */}
      {collected && (
        <mesh position={[0, 0.97, 0]}>
          <sphereGeometry args={[0.09, 7, 5]} />
          <meshStandardMaterial color="#333344" emissive="#111" />
        </mesh>
      )}

      {/* Light beam (uncollected only) */}
      {!collected && (
        <>
          <mesh ref={beamRef} position={[0, 4, 0]}>
            <cylinderGeometry args={[0.05, 0.18, 8, 10]} />
            <meshStandardMaterial
              color={color} emissive={color} emissiveIntensity={4}
              transparent opacity={0.2} depthWrite={false} />
          </mesh>
          <pointLight
            position={[0, 2, 0]} color={color}
            intensity={near ? 7 : 4.5} distance={near ? 14 : 9} decay={2} />
        </>
      )}

      {/* Near-pickup label floating above */}
      {near && !collected && (
        <mesh position={[0, 3, 0]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} />
        </mesh>
      )}
      {collected && (
        <pointLight position={[0, 1, 0]} color={color} intensity={0.3} distance={4} decay={2} />
      )}
    </group>
  );
}

function WeaponAltarsForArea({ area }: { area: string }) {
  const altars = WEAPON_PICKUPS.filter(p => p.area === area);
  return (
    <>
      {altars.map(p => (
        <WeaponAltar key={p.key} pickupKey={p.key} pos={p.pos} color={p.color} label={p.label} />
      ))}
    </>
  );
}

// ─── Fairy Fountain ───────────────────────────────────────────────
function FairyFountain({ pos }: { pos: [number, number, number] }) {
  const t = useRef(0);
  const rippleRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    t.current += delta;
    if (rippleRef.current) {
      rippleRef.current.rotation.y = t.current * 0.5;
      rippleRef.current.scale.setScalar(1 + Math.sin(t.current * 2) * 0.05);
    }
  });
  return (
    <group position={pos}>
      {/* Basin rim */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <torusGeometry args={[1.8, 0.25, 10, 24]} />
        <meshStandardMaterial color="#ddccff" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Basin base */}
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.8, 1.6, 0.4, 20]} />
        <meshStandardMaterial color="#c0aaee" roughness={0.4} />
      </mesh>
      {/* Water surface */}
      <mesh ref={rippleRef} position={[0, 0.52, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[1.6, 24]} />
        <meshStandardMaterial color="#88eeff" emissive="#44aaff" emissiveIntensity={0.6}
          transparent opacity={0.85} roughness={0} />
      </mesh>
      {/* Center pillar */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 1.4, 10]} />
        <meshStandardMaterial color="#ccbbff" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Top orb */}
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.4, 14, 12]} />
        <meshStandardMaterial color="#88eeff" emissive="#44ccff" emissiveIntensity={1.5}
          transparent opacity={0.9} roughness={0} />
      </mesh>
      {/* Fairy lights */}
      <pointLight color="#44ccff" intensity={3} distance={12} decay={2} position={[0, 2, 0]} />
      <pointLight color="#aa88ff" intensity={1.5} distance={8} decay={2} position={[0, 0.5, 0]} />
    </group>
  );
}

// ─── Shop Merchant Sign ───────────────────────────────────────────
function MerchantSign({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {/* Post */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 2.4, 7]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
      {/* Sign board */}
      <mesh castShadow position={[0, 2.4, 0]}>
        <boxGeometry args={[1.4, 0.7, 0.12]} />
        <meshStandardMaterial color="#f5deb3" roughness={0.8} />
      </mesh>
      {/* Rupee icon on sign */}
      <mesh position={[-0.35, 2.4, 0.08]} scale={0.15} rotation={[0, 0, Math.PI/4]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#22cc55" metalness={0.8} roughness={0.2} />
      </mesh>
      <pointLight position={[0, 2.4, 0.5]} color="#ffcc44" intensity={1.0} distance={5} decay={2} />
    </group>
  );
}

// ─── Field area ───────────────────────────────────────────────────
function FieldArea() {
  const trees = useMemo(() => seededItems(22, -50, 50, 1), []);
  const rocks = useMemo(() => seededItems(12, -50, 50, 2), []);
  const chestPos: [number, number, number] = [0, 0.5, -22];
  const shardsCollected = useGameStore(s => s.shardsCollected);

  return (
    <>
      <Sky sunPosition={[100, 30, 100]} turbidity={0.1} rayleigh={0.5} />
      <ambientLight intensity={0.65} color="#fff5e0" />
      <directionalLight position={[20, 35, 10]} intensity={1.3} color="#ffeedd" castShadow
        shadow-camera-left={-35} shadow-camera-right={35}
        shadow-camera-top={35} shadow-camera-bottom={-35}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#60bb60" />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.08, -14]} receiveShadow>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#b8a870" />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, Math.PI/2]} position={[14, -0.08, 0]} receiveShadow>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#b8a870" />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, Math.PI/2]} position={[-14, -0.08, 0]} receiveShadow>
        <planeGeometry args={[3.5, 30]} />
        <meshStandardMaterial color="#b8a870" />
      </mesh>

      {trees.map(t => (
        <group key={t.id} position={[t.x, 0, t.z]} scale={t.scale}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.34, 2.4, 7]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
          <mesh position={[0, 3.2, 0]} castShadow>
            <sphereGeometry args={[1.6, 9, 8]} />
            <meshStandardMaterial color="#2e6328" />
          </mesh>
          <mesh position={[0.5, 2.6, 0.3]} castShadow>
            <sphereGeometry args={[1.0, 7, 7]} />
            <meshStandardMaterial color="#3a7a34" />
          </mesh>
        </group>
      ))}

      {rocks.map(r => (
        <mesh key={r.id} position={[r.x, r.scale*0.4, r.z]}
          scale={[r.scale, r.scale*0.7, r.scale]} rotation={[0, r.rot, 0]} castShadow>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#8a8a88" roughness={0.85} />
        </mesh>
      ))}

      <TreasureChest pos={chestPos} area="field" />
      <SwordChestsForArea area="field" />
      <WeaponAltarsForArea area="field" />
      <LoreStonesForArea area="field" />
      <Village />

      {/* Fairy Fountain */}
      <FairyFountain pos={[-20, 0, 20]} />

      {/* Merchant sign near village */}
      <MerchantSign pos={[8, 0, 12]} />

      {/* Adelynn's Cottage exterior */}
      <group position={[-20, 0, -22]}>
        {/* Stone foundation */}
        <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[10.5, 0.4, 8.5]} />
          <meshStandardMaterial color="#9a8a78" roughness={0.95} />
        </mesh>
        {/* Back wall */}
        <mesh position={[0, 3, -4.2]} receiveShadow castShadow>
          <boxGeometry args={[10.5, 6, 0.35]} />
          <meshStandardMaterial color="#c4a882" roughness={0.9} />
        </mesh>
        {/* Left wall */}
        <mesh position={[-5.1, 3, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.35, 6, 8.5]} />
          <meshStandardMaterial color="#b89b72" roughness={0.9} />
        </mesh>
        {/* Right wall */}
        <mesh position={[5.1, 3, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.35, 6, 8.5]} />
          <meshStandardMaterial color="#b89b72" roughness={0.9} />
        </mesh>
        {/* Front wall – left of door */}
        <mesh position={[-3.0, 3, 4.2]} receiveShadow castShadow>
          <boxGeometry args={[4.0, 6, 0.35]} />
          <meshStandardMaterial color="#c4a882" roughness={0.9} />
        </mesh>
        {/* Front wall – right of door */}
        <mesh position={[3.0, 3, 4.2]} receiveShadow castShadow>
          <boxGeometry args={[4.0, 6, 0.35]} />
          <meshStandardMaterial color="#c4a882" roughness={0.9} />
        </mesh>
        {/* Above door lintel */}
        <mesh position={[0, 5.3, 4.2]} receiveShadow castShadow>
          <boxGeometry args={[2.5, 1.4, 0.35]} />
          <meshStandardMaterial color="#a07850" roughness={0.9} />
        </mesh>
        {/* Roof – left slope */}
        <mesh position={[-2.9, 7.1, 0]} rotation={[0, 0, 0.53]} receiveShadow castShadow>
          <boxGeometry args={[0.35, 6.2, 8.9]} />
          <meshStandardMaterial color="#7a4e28" roughness={0.95} />
        </mesh>
        {/* Roof – right slope */}
        <mesh position={[2.9, 7.1, 0]} rotation={[0, 0, -0.53]} receiveShadow castShadow>
          <boxGeometry args={[0.35, 6.2, 8.9]} />
          <meshStandardMaterial color="#7a4e28" roughness={0.95} />
        </mesh>
        {/* Roof ridge */}
        <mesh position={[0, 9.0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.5, 9.2]} />
          <meshStandardMaterial color="#5c3a1a" roughness={0.95} />
        </mesh>
        {/* Roof eave overhang front */}
        <mesh position={[0, 6.15, 4.9]} castShadow>
          <boxGeometry args={[10.5, 0.25, 1.0]} />
          <meshStandardMaterial color="#7a4e28" roughness={0.95} />
        </mesh>
        {/* Roof eave overhang back */}
        <mesh position={[0, 6.15, -4.9]} castShadow>
          <boxGeometry args={[10.5, 0.25, 1.0]} />
          <meshStandardMaterial color="#7a4e28" roughness={0.95} />
        </mesh>
        {/* Chimney */}
        <mesh position={[-3.5, 9.5, -3]} castShadow>
          <boxGeometry args={[1.2, 4.5, 1.2]} />
          <meshStandardMaterial color="#8a7060" roughness={0.95} />
        </mesh>
        <mesh position={[-3.5, 11.9, -3]} castShadow>
          <boxGeometry args={[1.5, 0.4, 1.5]} />
          <meshStandardMaterial color="#6a5040" roughness={0.95} />
        </mesh>
        {/* Chimney warm glow */}
        <pointLight position={[-3.5, 12.5, -3]} color="#ff6622" intensity={2} distance={8} decay={2} />
        {/* Right wall window */}
        <mesh position={[5.12, 3.2, 0]} castShadow>
          <boxGeometry args={[0.05, 1.8, 1.8]} />
          <meshStandardMaterial color="#ffe8b0" emissive="#ffcc44" emissiveIntensity={0.8}
            transparent opacity={0.7} />
        </mesh>
        <mesh position={[5.12, 3.2, 0]} castShadow>
          <boxGeometry args={[0.2, 2.0, 0.12]} />
          <meshStandardMaterial color="#7a5030" roughness={0.9} />
        </mesh>
        <mesh position={[5.12, 3.2, 0]} castShadow>
          <boxGeometry args={[0.2, 0.12, 2.0]} />
          <meshStandardMaterial color="#7a5030" roughness={0.9} />
        </mesh>
        {/* Window warm interior glow */}
        <pointLight position={[4.5, 3.2, 0]} color="#ffaa44" intensity={1.5} distance={8} decay={2} />
        {/* Garden path stones */}
        {[-0.6, 0, 0.6].map((ox, i) => (
          <mesh key={i} position={[ox, 0.22, 5.5 + i * 1.1]} rotation={[-Math.PI/2, 0, ox * 0.3]} receiveShadow>
            <circleGeometry args={[0.38, 7]} />
            <meshStandardMaterial color="#aaa090" roughness={0.9} />
          </mesh>
        ))}
        {/* Flower boxes under window */}
        <mesh position={[5.5, 1.5, 0.5]} castShadow>
          <boxGeometry args={[0.3, 0.4, 1.4]} />
          <meshStandardMaterial color="#7a5030" roughness={0.9} />
        </mesh>
        {[0, 0.5, 1.0].map((oz, i) => (
          <mesh key={i} position={[5.55, 1.85, 0.15 + oz - 0.5]}>
            <sphereGeometry args={[0.18, 7, 7]} />
            <meshStandardMaterial color={['#ff6688', '#ffaacc', '#ff88aa'][i]} />
          </mesh>
        ))}
        {/* Door frame */}
        <mesh position={[-1.2, 2.2, 4.23]} castShadow>
          <boxGeometry args={[0.18, 4.4, 0.28]} />
          <meshStandardMaterial color="#6a4020" roughness={0.9} />
        </mesh>
        <mesh position={[1.2, 2.2, 4.23]} castShadow>
          <boxGeometry args={[0.18, 4.4, 0.28]} />
          <meshStandardMaterial color="#6a4020" roughness={0.9} />
        </mesh>
      </group>

      {/* Boss portal — only visible when all 3 shards collected */}
      {shardsCollected >= 3 && (
        <Portal def={BOSS_PORTAL_DEF} portalTime={0} />
      )}

      <Boundary />
    </>
  );
}

// ─── Forest area ─────────────────────────────────────────────────
function ForestArea() {
  const pines = useMemo(() => seededItems(35, -50, 50, 10), []);
  const mushrooms = useMemo(() => seededItems(14, -50, 50, 11), []);
  return (
    <>
      <color attach="background" args={['#0e1e0e']} />
      <fog attach="fog" args={['#0e1e0e', 12, 45]} />
      <ambientLight intensity={0.3} color="#557755" />
      <directionalLight position={[-5, 20, 5]} intensity={0.5} color="#aaffaa" castShadow
        shadow-camera-left={-35} shadow-camera-right={35}
        shadow-camera-top={35} shadow-camera-bottom={-35}
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 0.5, 0]} color="#33ff88" intensity={1.5} distance={25} decay={1.5} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#1a3a1a" />
      </mesh>

      {mushrooms.map(m => (
        <mesh key={`patch-${m.id}`} rotation={[-Math.PI/2, 0, m.rot]} position={[m.x, -0.05, m.z]}>
          <circleGeometry args={[m.scale*1.2, 7]} />
          <meshStandardMaterial color="#22441a" />
        </mesh>
      ))}

      {pines.map(t => (
        <group key={t.id} position={[t.x, 0, t.z]} scale={t.scale}>
          <mesh position={[0, 2, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.3, 4, 6]} />
            <meshStandardMaterial color="#2a1a0a" />
          </mesh>
          <mesh position={[0, 5.5, 0]} castShadow>
            <coneGeometry args={[1.6, 5.5, 7]} />
            <meshStandardMaterial color="#0d260d" />
          </mesh>
          <mesh position={[0, 7.5, 0]} castShadow>
            <coneGeometry args={[1.0, 3.5, 7]} />
            <meshStandardMaterial color="#102a10" />
          </mesh>
          <mesh position={[0, 9, 0]} castShadow>
            <coneGeometry args={[0.5, 2, 6]} />
            <meshStandardMaterial color="#153015" />
          </mesh>
        </group>
      ))}

      {mushrooms.map(m => (
        <group key={m.id} position={[m.x, 0, m.z]} scale={m.scale*0.5} rotation={[0, m.rot, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 0.8, 7]} />
            <meshStandardMaterial color="#ccbbaa" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.6, 10, 8]} />
            <meshStandardMaterial color="#cc2233" emissive="#330008" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}

      <TreasureChest pos={[0, 0.5, 0]} area="forest" />
      <LoreStonesForArea area="forest" />
      <SwordChestsForArea area="forest" />
      <WeaponAltarsForArea area="forest" />
      {/* Fairy Fountain */}
      <FairyFountain pos={[18, 0, -18]} />
      <Boundary />
    </>
  );
}

// ─── Desert area ─────────────────────────────────────────────────
function DesertArea() {
  const rocks = useMemo(() => seededItems(18, -50, 50, 20), []);
  const pillars = useMemo(() => seededItems(10, -45, 45, 21), []);
  const cacti = useMemo(() => seededItems(15, -48, 48, 22), []);
  const chestPos: [number, number, number] = [0, 0.5, -24];
  return (
    <>
      <color attach="background" args={['#d4956e']} />
      <fog attach="fog" args={['#d4956e', 25, 60]} />
      <ambientLight intensity={0.7} color="#ffe0aa" />
      <directionalLight position={[30, 40, -10]} intensity={1.5} color="#ffddaa" castShadow
        shadow-camera-left={-35} shadow-camera-right={35}
        shadow-camera-top={35} shadow-camera-bottom={-35}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#c8a444" roughness={1} />
      </mesh>

      {cacti.map(c => (
        <mesh key={`sand-${c.id}`} rotation={[-Math.PI/2, 0, c.rot]} position={[c.x, -0.06, c.z]}
          scale={[1, c.scale*0.4+0.1, 1]}>
          <circleGeometry args={[c.scale*1.8, 8]} />
          <meshStandardMaterial color="#d4b054" />
        </mesh>
      ))}

      {pillars.map(p => (
        <group key={p.id} position={[p.x, 0, p.z]} scale={p.scale} rotation={[0, p.rot, 0]}>
          <mesh position={[0, p.scale*2.5, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.9, p.scale*5, 7]} />
            <meshStandardMaterial color="#aa7744" roughness={0.9} />
          </mesh>
          <mesh position={[0, p.scale*5.3, 0]} castShadow>
            <cylinderGeometry args={[0.9, 0.6, p.scale*1.2, 7]} />
            <meshStandardMaterial color="#bb8855" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {rocks.map(r => (
        <mesh key={r.id} position={[r.x, r.scale*0.5, r.z]}
          scale={[r.scale, r.scale*0.75, r.scale]} rotation={[0.3, r.rot, 0]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#997755" roughness={0.9} />
        </mesh>
      ))}

      {cacti.map(c => (
        <group key={c.id} position={[c.x, 0, c.z]} scale={c.scale*0.7} rotation={[0, c.rot, 0]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.3, 2.4, 7]} />
            <meshStandardMaterial color="#4a7a44" />
          </mesh>
          <mesh position={[0.7, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.2, 1.4, 6]} />
            <meshStandardMaterial color="#4a7a44" />
          </mesh>
          <mesh position={[0.7, 1.9, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.15, 0.9, 6]} />
            <meshStandardMaterial color="#4a7a44" />
          </mesh>
        </group>
      ))}

      <TreasureChest pos={chestPos} area="desert" />
      <LoreStonesForArea area="desert" />
      <SwordChestsForArea area="desert" />
      <WeaponAltarsForArea area="desert" />
      {/* Fairy Fountain */}
      <FairyFountain pos={[20, 0, 20]} />
      <Boundary />
    </>
  );
}

// ─── Verdant Ruins (jungle) ───────────────────────────────────────
function JungleArea() {
  const trees  = useMemo(() => seededItems(30, -50, 50, 11), []);
  const ruins  = useMemo(() => seededItems(12, -45, 45, 12), []);
  const vines  = useMemo(() => seededItems(20, -50, 50, 13), []);
  return (
    <>
      <color attach="background" args={['#0d1f0d']} />
      <fog attach="fog" args={['#0d1f0d', 18, 48]} />
      <ambientLight intensity={0.35} color="#44bb44" />
      <directionalLight position={[10, 30, 5]} intensity={0.7} color="#88ff88" castShadow
        shadow-camera-left={-35} shadow-camera-right={35}
        shadow-camera-top={35} shadow-camera-bottom={-35}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight position={[0, 8, 0]} color="#22cc44" intensity={2} distance={40} decay={1.5} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#1a3a0f" roughness={1} />
      </mesh>

      {trees.map(t => (
        <group key={t.id} position={[t.x, 0, t.z]} scale={t.scale * 1.2} rotation={[0, t.rot, 0]}>
          <mesh position={[0, 2, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.4, 4, 7]} />
            <meshStandardMaterial color="#3a2a10" roughness={0.9} />
          </mesh>
          <mesh position={[0, 5, 0]} castShadow>
            <sphereGeometry args={[2.0, 9, 8]} />
            <meshStandardMaterial color="#1a5a1a" roughness={0.8} />
          </mesh>
          <mesh position={[0.8, 3.5, 0.5]} castShadow>
            <sphereGeometry args={[1.2, 7, 7]} />
            <meshStandardMaterial color="#245c1e" roughness={0.85} />
          </mesh>
        </group>
      ))}
      {ruins.map(r => (
        <group key={r.id} position={[r.x, 0, r.z]} rotation={[0, r.rot, 0]}>
          <mesh castShadow position={[0, r.scale * 1.5, 0]}>
            <boxGeometry args={[1.0, r.scale * 3, 1.0]} />
            <meshStandardMaterial color="#4a5a3a" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, r.scale * 3.2, 0]}>
            <boxGeometry args={[1.3, 0.4, 1.3]} />
            <meshStandardMaterial color="#3a4a2a" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {vines.map(v => (
        <mesh key={v.id} position={[v.x, 1.5, v.z]} castShadow rotation={[0.2, v.rot, 0]}>
          <cylinderGeometry args={[0.06, 0.04, 3 + v.scale, 5]} />
          <meshStandardMaterial color="#2a5a20" roughness={1} />
        </mesh>
      ))}
      <LoreStonesForArea area="jungle" />
      <WeaponAltarsForArea area="jungle" />
      <FairyFountain pos={[18, 0, -18]} />
      <Boundary />
    </>
  );
}

// ─── Frostpeak Tundra (ice) ───────────────────────────────────────
function IceArea() {
  const crystals = useMemo(() => seededItems(18, -48, 48, 21), []);
  const rocks    = useMemo(() => seededItems(14, -45, 45, 22), []);
  const drifts   = useMemo(() => seededItems(20, -50, 50, 23), []);
  return (
    <>
      <Sky sunPosition={[100, 5, 50]} turbidity={8} rayleigh={0.3} />
      <fog attach="fog" args={['#aaccee', 22, 55]} />
      <ambientLight intensity={0.7} color="#cce8ff" />
      <directionalLight position={[15, 30, -10]} intensity={0.9} color="#ddeeff" castShadow
        shadow-camera-left={-35} shadow-camera-right={35}
        shadow-camera-top={35} shadow-camera-bottom={-35}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#ddeeff" roughness={0.2} metalness={0.1} />
      </mesh>

      {crystals.map(c => (
        <group key={c.id} position={[c.x, 0, c.z]} rotation={[0, c.rot, 0]}>
          <mesh castShadow position={[0, c.scale * 1.5, 0]} rotation={[0.1, 0, 0.2]}>
            <coneGeometry args={[0.35, c.scale * 3, 5]} />
            <meshStandardMaterial color="#88ccff" emissive="#44aaff"
              emissiveIntensity={0.4} transparent opacity={0.85} metalness={0.3} roughness={0.1} />
          </mesh>
          <mesh castShadow position={[0.4, c.scale * 0.9, 0.2]} rotation={[0.2, 0, -0.3]}>
            <coneGeometry args={[0.22, c.scale * 1.8, 5]} />
            <meshStandardMaterial color="#aaddff" emissive="#66bbff"
              emissiveIntensity={0.3} transparent opacity={0.8} metalness={0.3} roughness={0.1} />
          </mesh>
          <pointLight position={[0, c.scale * 1.5, 0]} color="#88ccff" intensity={0.6} distance={5} decay={2} />
        </group>
      ))}
      {rocks.map(r => (
        <mesh key={r.id} position={[r.x, r.scale * 0.5, r.z]} scale={[r.scale, r.scale * 0.6, r.scale]}
          rotation={[0.2, r.rot, 0]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#99aabb" roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
      {drifts.map(d => (
        <mesh key={d.id} rotation={[-Math.PI/2, 0, d.rot]} position={[d.x, -0.05, d.z]}
          scale={[d.scale * 2, d.scale * 0.9, 1]}>
          <circleGeometry args={[1, 10]} />
          <meshStandardMaterial color="#eef6ff" roughness={0.1} />
        </mesh>
      ))}
      {/* ── Ice Kingdom: Glacira's Keep ── */}
      {/* Outer curtain wall segments (N/S/E/W arcs) */}
      {([
        [[ 0,  1.8, -16], [22, 3.5, 1.2], 0],
        [[ 0,  1.8,  16], [22, 3.5, 1.2], 0],
        [[-16, 1.8,  0],  [1.2, 3.5, 22], 0],
        [[ 16, 1.8,  0],  [1.2, 3.5, 22], 0],
      ] as [number,number,number][][]).map(([p, s], i) => (
        <mesh key={`wall-${i}`} position={p as [number,number,number]} castShadow receiveShadow>
          <boxGeometry args={s as [number,number,number]} />
          <meshStandardMaterial color="#c8e8ff" roughness={0.1} metalness={0.4}
            transparent opacity={0.85} />
        </mesh>
      ))}
      {/* Corner towers */}
      {([[-15,-15],[15,-15],[-15,15],[15,15]] as [number,number][]).map(([x,z], i) => (
        <group key={`tower-${i}`} position={[x, 0, z]}>
          {/* Tower body */}
          <mesh castShadow position={[0, 2.5, 0]}>
            <cylinderGeometry args={[1.8, 2.0, 5.0, 8]} />
            <meshStandardMaterial color="#aad4f0" roughness={0.12} metalness={0.5}
              transparent opacity={0.9} />
          </mesh>
          {/* Battlements ring */}
          {[0,1,2,3,4,5,6,7].map(j => (
            <mesh key={j} castShadow
              position={[Math.cos(j*Math.PI/4)*1.65, 5.4, Math.sin(j*Math.PI/4)*1.65]}>
              <boxGeometry args={[0.55, 0.8, 0.55]} />
              <meshStandardMaterial color="#c0e4ff" roughness={0.1} metalness={0.45}
                transparent opacity={0.9} />
            </mesh>
          ))}
          {/* Tower top cone (ice spire) */}
          <mesh castShadow position={[0, 7.0, 0]}>
            <coneGeometry args={[1.9, 3.5, 8]} />
            <meshStandardMaterial color="#88ccff" emissive="#44aaff"
              emissiveIntensity={0.5} transparent opacity={0.85} metalness={0.3} roughness={0.06} />
          </mesh>
          <pointLight position={[0, 6, 0]} color="#88ddff" intensity={1} distance={10} decay={2} />
        </group>
      ))}
      {/* Main gate arch (south side) */}
      <group position={[0, 0, 16]}>
        <mesh castShadow position={[-3.2, 2.0, 0]}>
          <boxGeometry args={[1.4, 4.0, 1.4]} />
          <meshStandardMaterial color="#b0d8f5" roughness={0.12} metalness={0.4} transparent opacity={0.9} />
        </mesh>
        <mesh castShadow position={[3.2, 2.0, 0]}>
          <boxGeometry args={[1.4, 4.0, 1.4]} />
          <meshStandardMaterial color="#b0d8f5" roughness={0.12} metalness={0.4} transparent opacity={0.9} />
        </mesh>
        <mesh castShadow position={[0, 4.5, 0]}>
          <boxGeometry args={[8, 1.2, 1.4]} />
          <meshStandardMaterial color="#b0d8f5" roughness={0.12} metalness={0.4} transparent opacity={0.9} />
        </mesh>
        {/* Icy portcullis bars */}
        {[-1.4, -0.46, 0.46, 1.4].map((x, i) => (
          <mesh key={i} position={[x, 2.0, 0]}>
            <boxGeometry args={[0.14, 4.0, 0.14]} />
            <meshStandardMaterial color="#88ccff" emissive="#44aaff"
              emissiveIntensity={0.4} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      {/* Keep donjon (central tower) */}
      <group position={[0, 0, -4]}>
        <mesh castShadow position={[0, 3.5, 0]}>
          <boxGeometry args={[5, 7, 5]} />
          <meshStandardMaterial color="#99c8e8" roughness={0.1} metalness={0.45}
            transparent opacity={0.88} />
        </mesh>
        <mesh castShadow position={[0, 8.5, 0]}>
          <coneGeometry args={[3.2, 5.5, 4]} />
          <meshStandardMaterial color="#66aadd" emissive="#3388bb"
            emissiveIntensity={0.4} transparent opacity={0.88} metalness={0.35} roughness={0.06} />
        </mesh>
        {/* Keep windows */}
        {[[-2.51,4.5,0],[2.51,4.5,0],[0,4.5,-2.51],[0,4.5,2.51]].map(([x,y,z], i) => (
          <mesh key={i} position={[x,y,z]}>
            <boxGeometry args={[x!==0?0.06:0.8, 1.0, z!==0?0.06:0.8]} />
            <meshStandardMaterial color="#cceeFF" emissive="#aaddff"
              emissiveIntensity={1.2} transparent opacity={0.7} />
          </mesh>
        ))}
        <pointLight position={[0, 5, 0]} color="#aaddff" intensity={2} distance={14} decay={2} />
      </group>
      {/* Frozen throne / altar in courtyard */}
      <group position={[0, 0, -2]}>
        <mesh castShadow position={[0, 0.6, 0]}>
          <boxGeometry args={[1.8, 1.2, 1.4]} />
          <meshStandardMaterial color="#99ccee" roughness={0.05} metalness={0.5}
            transparent opacity={0.85} />
        </mesh>
        <mesh castShadow position={[0, 1.9, -0.5]}>
          <boxGeometry args={[1.8, 1.4, 0.22]} />
          <meshStandardMaterial color="#aad8ff" roughness={0.05} metalness={0.5}
            transparent opacity={0.82} />
        </mesh>
        <pointLight position={[0, 2.5, 0]} color="#66ccff" intensity={1.8} distance={8} decay={2} />
      </group>
      <LoreStonesForArea area="ice" />
      <WeaponAltarsForArea area="ice" />
      <FairyFountain pos={[-18, 0, 18]} />
      <Boundary />
    </>
  );
}

// ─── Ember Depths (volcano) ───────────────────────────────────────
function VolcanoArea() {
  const rocks    = useMemo(() => seededItems(16, -46, 46, 31), []);
  const pillars  = useMemo(() => seededItems(10, -44, 44, 32), []);
  const magma    = useMemo(() => seededItems(8, -42, 42, 33), []);
  return (
    <>
      <color attach="background" args={['#1a0800']} />
      <fog attach="fog" args={['#1a0800', 18, 45]} />
      <ambientLight intensity={0.25} color="#ff4400" />
      <directionalLight position={[0, 20, 0]} intensity={0.6} color="#ff6600" />
      <pointLight position={[0, 1, 0]}  color="#ff3300" intensity={4} distance={35} decay={1.5} />
      <pointLight position={[-20, 2, 0]}  color="#ff5500" intensity={2} distance={20} decay={2} />
      <pointLight position={[20, 2, 0]}  color="#ff5500" intensity={2} distance={20} decay={2} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#2a0a00" roughness={0.95} />
      </mesh>
      {magma.map(m => (
        <mesh key={m.id} rotation={[-Math.PI/2, 0, m.rot]} position={[m.x, -0.07, m.z]}
          scale={[m.scale * 2.5, m.scale * 1.2, 1]}>
          <circleGeometry args={[1, 12]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={1.5}
            transparent opacity={0.85} />
        </mesh>
      ))}
      {rocks.map(r => (
        <mesh key={r.id} position={[r.x, r.scale * 0.6, r.z]} scale={r.scale}
          rotation={[0.4, r.rot, 0.2]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#3a1800" roughness={0.95} />
        </mesh>
      ))}
      {pillars.map(p => (
        <group key={p.id} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
          <mesh position={[0, p.scale * 3, 0]} castShadow>
            <cylinderGeometry args={[0.7, 1.0, p.scale * 6, 7]} />
            <meshStandardMaterial color="#330a00" roughness={0.9} />
          </mesh>
          <pointLight position={[0, p.scale * 6.5, 0]} color="#ff4400"
            intensity={1.5} distance={8} decay={2} />
        </group>
      ))}
      <LoreStonesForArea area="volcano" />
      <WeaponAltarsForArea area="volcano" />
      <FairyFountain pos={[18, 0, 18]} />
      <Boundary />
    </>
  );
}

// ─── Celestial Skylands (sky) ─────────────────────────────────────
function SkyArea() {
  const platforms = useMemo(() => seededItems(12, -46, 46, 41), []);
  const pillars   = useMemo(() => seededItems(8, -44, 44, 42), []);
  const stars     = useMemo(() => seededItems(25, -50, 50, 43), []);
  return (
    <>
      <color attach="background" args={['#040818']} />
      <fog attach="fog" args={['#040818', 25, 60]} />
      <ambientLight intensity={0.3} color="#4466ff" />
      <directionalLight position={[0, 30, 0]} intensity={0.5} color="#8899ff" />
      <pointLight position={[0, 8, 0]} color="#4466ff" intensity={3} distance={50} decay={1.5} />
      <pointLight position={[-20, 5, -15]} color="#2244cc" intensity={2} distance={25} decay={2} />
      <pointLight position={[20, 5, 15]}  color="#2244cc" intensity={2} distance={25} decay={2} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#0a0a28" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Cloud platforms */}
      {platforms.map(p => (
        <group key={p.id} position={[p.x, 0, p.z]}>
          <mesh castShadow rotation={[-Math.PI/2, 0, p.rot]}
            scale={[p.scale * 2.5, p.scale * 1.5, 1]}>
            <circleGeometry args={[1, 10]} />
            <meshStandardMaterial color="#aabbff" emissive="#4455cc"
              emissiveIntensity={0.3} transparent opacity={0.75} />
          </mesh>
        </group>
      ))}
      {pillars.map(p => (
        <group key={p.id} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
          <mesh position={[0, p.scale * 4, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.7, p.scale * 8, 6]} />
            <meshStandardMaterial color="#1a1a55" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[0, p.scale * 8.3, 0]}>
            <sphereGeometry args={[0.6, 10, 8]} />
            <meshStandardMaterial color="#5566ff" emissive="#4455ff" emissiveIntensity={1.5}
              transparent opacity={0.9} />
          </mesh>
          <pointLight position={[0, p.scale * 8.5, 0]} color="#4466ff"
            intensity={1.5} distance={10} decay={2} />
        </group>
      ))}
      {stars.map(s => (
        <mesh key={s.id} position={[s.x, 0.05 + s.scale * 0.3, s.z]}>
          <octahedronGeometry args={[s.scale * 0.25, 0]} />
          <meshStandardMaterial color="#ffffff" emissive="#aabbff"
            emissiveIntensity={3} transparent opacity={0.8} />
        </mesh>
      ))}
      <LoreStonesForArea area="sky" />
      <WeaponAltarsForArea area="sky" />
      <FairyFountain pos={[-18, 0, 18]} />
      <Boundary />
    </>
  );
}

// ─── Shadowed Crypts (crypt) ──────────────────────────────────────
function CryptArea() {
  const columns = useMemo(() => seededItems(14, -46, 46, 51), []);
  const tombs   = useMemo(() => seededItems(10, -44, 44, 52), []);
  const bones   = useMemo(() => seededItems(20, -50, 50, 53), []);
  return (
    <>
      <color attach="background" args={['#080810']} />
      <fog attach="fog" args={['#080810', 16, 42]} />
      <ambientLight intensity={0.12} color="#3322aa" />
      <directionalLight position={[0, 20, 0]} intensity={0.2} color="#5544cc" />
      <pointLight position={[0, 1, 0]} color="#442288" intensity={3} distance={40} decay={1.5} />
      <pointLight position={[-18, 3, -18]} color="#330066" intensity={2} distance={20} decay={2} />
      <pointLight position={[18, 3, 18]}  color="#330066" intensity={2} distance={20} decay={2} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#0c0c18" roughness={0.9} metalness={0.05} />
      </mesh>
      {columns.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.rot, 0]}>
          <mesh position={[0, c.scale * 3, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.65, c.scale * 6, 8]} />
            <meshStandardMaterial color="#1a1a2a" roughness={0.9} />
          </mesh>
          <mesh position={[0, c.scale * 6.3, 0]} castShadow>
            <boxGeometry args={[1.4, 0.5, 1.4]} />
            <meshStandardMaterial color="#141420" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {tombs.map(t => (
        <group key={t.id} position={[t.x, 0, t.z]} rotation={[0, t.rot, 0]}>
          <mesh castShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[2.0, 1.0, 1.0]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 1.15, 0]}>
            <boxGeometry args={[2.2, 0.3, 1.2]} />
            <meshStandardMaterial color="#242438" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.52, 0.52]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.06]} />
            <meshStandardMaterial color="#442288" emissive="#3311aa" emissiveIntensity={0.8}
              transparent opacity={0.7} />
          </mesh>
          <pointLight position={[0, 0.8, 0]} color="#442288" intensity={0.8} distance={4} decay={2} />
        </group>
      ))}
      {bones.map(b => (
        <mesh key={b.id} position={[b.x, 0.08, b.z]} rotation={[0, b.rot, 0]} scale={b.scale * 0.5}>
          <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
          <meshStandardMaterial color="#ccccaa" roughness={0.9} />
        </mesh>
      ))}
      <LoreStonesForArea area="crypt" />
      <WeaponAltarsForArea area="crypt" />
      <FairyFountain pos={[18, 0, -18]} />
      <Boundary />
    </>
  );
}

// ─── The Fractured Void (void) ────────────────────────────────────
function VoidArea() {
  const shards   = useMemo(() => seededItems(20, -48, 48, 61), []);
  const pillars  = useMemo(() => seededItems(8,  -44, 44, 62), []);
  const rifts    = useMemo(() => seededItems(12, -46, 46, 63), []);
  return (
    <>
      <color attach="background" args={['#020008']} />
      <fog attach="fog" args={['#020008', 14, 38]} />
      <ambientLight intensity={0.1} color="#cc00ff" />
      <directionalLight position={[0, 20, 0]} intensity={0.2} color="#aa00ff" />
      <pointLight position={[0, 1, 0]} color="#8800cc" intensity={4} distance={45} decay={1.5} />
      <pointLight position={[-22, 3, 0]} color="#cc00ff" intensity={2.5} distance={22} decay={2} />
      <pointLight position={[22, 3, 0]}  color="#ff00cc" intensity={2.5} distance={22} decay={2} />
      <pointLight position={[0, 3, -22]} color="#6600ff" intensity={2} distance={20} decay={2} />

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#060010" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Void cracks in floor */}
      {rifts.map(r => (
        <mesh key={r.id} rotation={[-Math.PI/2, 0, r.rot]} position={[r.x, -0.07, r.z]}>
          <planeGeometry args={[r.scale * 0.5, r.scale * 4]} />
          <meshStandardMaterial color="#cc00ff" emissive="#8800ff" emissiveIntensity={2.5}
            transparent opacity={0.7} />
        </mesh>
      ))}
      {shards.map(s => (
        <group key={s.id} position={[s.x, 0, s.z]} rotation={[0, s.rot, 0]}>
          <mesh castShadow position={[0, s.scale * 1.8, 0]} rotation={[0.3, 0, 0.4]}>
            <octahedronGeometry args={[s.scale * 0.8, 0]} />
            <meshStandardMaterial color="#220033" emissive="#cc00ff" emissiveIntensity={1.5}
              transparent opacity={0.7} metalness={0.8} roughness={0.1} />
          </mesh>
          <pointLight position={[0, s.scale * 1.8, 0]} color="#cc00ff"
            intensity={0.8} distance={5} decay={2} />
        </group>
      ))}
      {pillars.map(p => (
        <group key={p.id} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
          <mesh castShadow position={[0, p.scale * 4, 0]}>
            <cylinderGeometry args={[0.4, 0.6, p.scale * 8, 6]} />
            <meshStandardMaterial color="#110022" roughness={0.7} metalness={0.5} />
          </mesh>
          <mesh position={[0, p.scale * 8.5, 0]}>
            <sphereGeometry args={[0.7, 10, 8]} />
            <meshStandardMaterial color="#220044" emissive="#cc00ff" emissiveIntensity={3}
              transparent opacity={0.85} />
          </mesh>
          <pointLight position={[0, p.scale * 8.8, 0]} color="#cc00ff"
            intensity={2} distance={12} decay={2} />
        </group>
      ))}
      <LoreStonesForArea area="void" />
      <WeaponAltarsForArea area="void" />
      <FairyFountain pos={[-18, 0, -18]} />
      <Boundary />
    </>
  );
}

// ─── Boss Lair area ───────────────────────────────────────────────
function BossArea() {
  const columns = useMemo(() => {
    return [
      [-10, 0, -15], [10, 0, -15], [-10, 0, 5], [10, 0, 5],
      [-18, 0, -8], [18, 0, -8], [-18, 0, -22], [18, 0, -22],
    ] as [number, number, number][];
  }, []);

  return (
    <>
      <color attach="background" args={['#0a0014']} />
      <fog attach="fog" args={['#0a0014', 20, 50]} />
      <ambientLight intensity={0.15} color="#4400aa" />
      <directionalLight position={[0, 20, 0]} intensity={0.3} color="#8844ff" />
      {/* Dramatic purple underlighting */}
      <pointLight position={[0, 0.5, 0]} color="#6600cc" intensity={3} distance={30} decay={1.5} />
      <pointLight position={[-15, 2, -15]} color="#440088" intensity={2} distance={20} decay={2} />
      <pointLight position={[15, 2, -15]} color="#440088" intensity={2} distance={20} decay={2} />

      {/* Dark stone floor */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#0d0020" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Floor rune circle */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.09, -5]}>
        <ringGeometry args={[6, 7, 32]} />
        <meshStandardMaterial color="#4400aa" emissive="#3300aa" emissiveIntensity={0.8}
          transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.09, -5]}>
        <ringGeometry args={[2, 3, 32]} />
        <meshStandardMaterial color="#aa00ff" emissive="#aa00ff" emissiveIntensity={1.2}
          transparent opacity={0.7} />
      </mesh>

      {/* Dark columns */}
      {columns.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow position={[0, 4, 0]}>
            <cylinderGeometry args={[0.55, 0.7, 8, 10]} />
            <meshStandardMaterial color="#1a0033" roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh castShadow position={[0, 8.3, 0]}>
            <cylinderGeometry args={[0.8, 0.6, 0.6, 10]} />
            <meshStandardMaterial color="#2a0055" metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Column rune glow */}
          <pointLight position={[0, 1.5, 0]} color="#6600cc" intensity={0.8} distance={4} decay={2} />
        </group>
      ))}

      {/* Back wall */}
      <mesh castShadow position={[0, 5, -30]}>
        <boxGeometry args={[62, 10, 1]} />
        <meshStandardMaterial color="#12002a" roughness={0.8} />
      </mesh>

      {/* Armor chest */}
      <TreasureChest pos={[-8, 0.5, 8]} area="boss-armor" />
      <SwordChestsForArea area="boss" />
      <WeaponAltarsForArea area="boss" />

      <Boundary />
    </>
  );
}

// ─── Crystal Caverns (cave) ───────────────────────────────────────
function CaveArea() {
  const bigCrystals  = useMemo(() => seededItems(22, -46, 46, 71), []);
  const stalactites  = useMemo(() => seededItems(18, -46, 46, 72), []);
  const boulders     = useMemo(() => seededItems(12, -44, 44, 73), []);
  const smallShards  = useMemo(() => seededItems(28, -46, 46, 74), []);
  const hiddenChestPositions: [number, number, number][] = [
    [20, 0.5, -18], [-20, 0.5, -20], [0, 0.5, -26],
  ];

  return (
    <>
      {/* No sky — underground */}
      <color attach="background" args={['#0a0518']} />
      <fog attach="fog" args={['#0a0518', 18, 50]} />
      <ambientLight intensity={0.18} color="#8855ff" />
      <pointLight position={[0,  4, 0]}   color="#8844ff" intensity={3.5} distance={40} decay={1.5} />
      <pointLight position={[-18, 3, 0]}  color="#5522cc" intensity={2}   distance={22} decay={2} />
      <pointLight position={[18,  3, 0]}  color="#aa44ff" intensity={2}   distance={22} decay={2} />
      <pointLight position={[0,   3, -20]} color="#6633dd" intensity={2.5} distance={24} decay={2} />

      {/* Floor */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#1a1028" roughness={0.95} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 8.5, 0]}>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#100820" roughness={1} />
      </mesh>
      {/* Cave walls (box frame) */}
      {([
        [[0, 4.2, -31], [62, 8.5, 0.6]],
        [[0, 4.2,  31], [62, 8.5, 0.6]],
        [[-31, 4.2, 0], [0.6, 8.5, 62]],
        [[ 31, 4.2, 0], [0.6, 8.5, 62]],
      ] as [number,number,number][][]).map(([p, s], i) => (
        <mesh key={i} position={p as [number,number,number]}>
          <boxGeometry args={s as [number,number,number]} />
          <meshStandardMaterial color="#0e0818" roughness={1} />
        </mesh>
      ))}

      {/* Big glowing crystal clusters */}
      {bigCrystals.map(c => (
        <group key={c.id} position={[c.x, 0, c.z]} rotation={[0, c.rot, 0]}>
          {/* Main spike */}
          <mesh castShadow position={[0, c.scale * 2.2, 0]} rotation={[0.08, 0, 0.15]}>
            <coneGeometry args={[0.38, c.scale * 4.5, 6]} />
            <meshStandardMaterial color="#9944ff" emissive="#7722dd"
              emissiveIntensity={1.2} transparent opacity={0.88} metalness={0.2} roughness={0.05} />
          </mesh>
          {/* Side spikes */}
          <mesh castShadow position={[0.5, c.scale * 1.3, 0.3]} rotation={[0.3, 0, -0.4]}>
            <coneGeometry args={[0.24, c.scale * 2.8, 5]} />
            <meshStandardMaterial color="#bb66ff" emissive="#9944cc"
              emissiveIntensity={0.9} transparent opacity={0.82} metalness={0.2} roughness={0.05} />
          </mesh>
          <mesh castShadow position={[-0.4, c.scale * 1.0, -0.2]} rotation={[0.2, 0, 0.3]}>
            <coneGeometry args={[0.18, c.scale * 2.2, 5]} />
            <meshStandardMaterial color="#cc88ff" emissive="#aa66ee"
              emissiveIntensity={0.8} transparent opacity={0.8} metalness={0.2} roughness={0.05} />
          </mesh>
          <pointLight position={[0, c.scale * 2, 0]} color="#aa44ff" intensity={1.2} distance={8} decay={2} />
        </group>
      ))}

      {/* Stalactites hanging from ceiling */}
      {stalactites.map(s => (
        <group key={s.id} position={[s.x, 8.5, s.z]}>
          <mesh position={[0, -s.scale * 1.5, 0]} rotation={[Math.PI, s.rot, 0]}>
            <coneGeometry args={[0.22, s.scale * 3.0, 5]} />
            <meshStandardMaterial color="#2a1848" roughness={0.88} />
          </mesh>
          {/* Drip crystal tip */}
          <mesh position={[0, -s.scale * 2.9, 0]} rotation={[Math.PI, s.rot, 0]}>
            <coneGeometry args={[0.08, 0.4, 4]} />
            <meshStandardMaterial color="#9955dd" emissive="#7733bb" emissiveIntensity={0.6}
              transparent opacity={0.75} />
          </mesh>
        </group>
      ))}

      {/* Mossy boulders on floor */}
      {boulders.map(b => (
        <mesh key={b.id} position={[b.x, b.scale * 0.5, b.z]}
          scale={[b.scale, b.scale * 0.75, b.scale]} rotation={[0.2, b.rot, 0.1]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#2a1e3a" roughness={0.92} />
        </mesh>
      ))}

      {/* Small crystal shards scattered on floor */}
      {smallShards.map(sh => (
        <mesh key={sh.id} position={[sh.x, sh.scale * 0.6, sh.z]}
          rotation={[0.3, sh.rot, 0.2]} castShadow>
          <coneGeometry args={[0.12, sh.scale * 1.2, 4]} />
          <meshStandardMaterial color="#cc88ff" emissive="#aa55dd"
            emissiveIntensity={0.5} transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Hidden treasure chests — tucked into crystal clusters */}
      {hiddenChestPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Chest body */}
          <mesh castShadow position={[0, 0.22, 0]}>
            <boxGeometry args={[0.8, 0.44, 0.55]} />
            <meshStandardMaterial color="#4a3510" roughness={0.82} />
          </mesh>
          {/* Chest lid */}
          <mesh castShadow position={[0, 0.52, 0]}>
            <boxGeometry args={[0.84, 0.22, 0.58]} />
            <meshStandardMaterial color="#5a4218" roughness={0.75} />
          </mesh>
          {/* Gold clasp */}
          <mesh position={[0, 0.44, 0.3]}>
            <boxGeometry args={[0.14, 0.1, 0.06]} />
            <meshStandardMaterial color="#d4a840" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Glow to indicate hidden treasure */}
          <pointLight position={[0, 0.8, 0]} color="#ffcc44" intensity={1.2} distance={4} decay={2} />
          {/* Sparkle ring */}
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[0.7, 0.85, 12]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffaa00"
              emissiveIntensity={1.5} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Cave entrance archway (south wall opening) */}
      <group position={[0, 0, 26]}>
        {/* Left pillar */}
        <mesh castShadow position={[-2.2, 3, 0]}>
          <boxGeometry args={[1.4, 6.5, 1.2]} />
          <meshStandardMaterial color="#1a1030" roughness={0.95} />
        </mesh>
        {/* Right pillar */}
        <mesh castShadow position={[2.2, 3, 0]}>
          <boxGeometry args={[1.4, 6.5, 1.2]} />
          <meshStandardMaterial color="#1a1030" roughness={0.95} />
        </mesh>
        {/* Arch above opening */}
        <mesh castShadow position={[0, 6.2, 0]}>
          <boxGeometry args={[6, 1.2, 1.2]} />
          <meshStandardMaterial color="#1a1030" roughness={0.95} />
        </mesh>
        {/* Rune carving on arch */}
        <mesh position={[0, 6.2, 0.61]}>
          <boxGeometry args={[4.5, 0.5, 0.06]} />
          <meshStandardMaterial color="#9944ff" emissive="#7722cc"
            emissiveIntensity={1.8} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Childhood marble (Adelynn's) — behind big crystal cluster */}
      <group position={[-9, 0.18, 6]}>
        <mesh>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshStandardMaterial color="#44ddff" emissive="#22aadd"
            emissiveIntensity={2} transparent opacity={0.9} metalness={0.4} roughness={0} />
        </mesh>
        <pointLight color="#44ccff" intensity={0.8} distance={2.5} decay={2} />
      </group>

      <TreasureChest pos={[-24, 0.5, -5]} area="cave" />
      <LoreStonesForArea area="cave" />
      <WeaponAltarsForArea area="cave" />
      <FairyFountain pos={[20, 0, 20]} />
      <Boundary />
    </>
  );
}

// ─── Adelynn's Home interior ─────────────────────────────────────
// Room opens toward +Z (camera sits at player.z + 15 looking inward).
// No solid south wall so the camera has a clear view of the interior.
// Player spawns at z=0; back wall is at z=-12; furniture in -z zone.
// Blanket that peels back when lying down, covers during sleep, re-folds when rising
function AnimatedBlanket() {
  const blanketRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (!blanketRef.current) return;
    const phase = useGameStore.getState().sleepPhase;
    // Blanket rests at z=0.5 (foot of bed), centered at bed origin [-5,0,-7]
    // Peel back: translate +z so foot-end folds away
    let offsetZ = 0;
    let scaleZ  = 1;
    if (phase === 'lying') {
      offsetZ = 0.7;   // folded toward foot
      scaleZ  = 0.7;
    } else if (phase === 'sleeping' || phase === 'waking') {
      offsetZ = 0;
      scaleZ  = 1;
    } else if (phase === 'rising') {
      offsetZ = 0.4;
      scaleZ  = 0.85;
    }
    blanketRef.current.position.z = THREE.MathUtils.lerp(blanketRef.current.position.z, 0.5 + offsetZ, 0.08);
    blanketRef.current.scale.z    = THREE.MathUtils.lerp(blanketRef.current.scale.z,    scaleZ,         0.08);
  });
  return (
    <mesh ref={blanketRef} position={[0, 0.75, 0.5]} castShadow receiveShadow>
      <boxGeometry args={[2.8, 0.14, 3.6]} />
      <meshStandardMaterial color="#e8a0b8" roughness={0.9} />
    </mesh>
  );
}

function HomeArea() {
  return (
    <>
      <color attach="background" args={['#2a1608']} />
      <fog attach="fog" args={['#2a1608', 22, 40]} />

      {/* Strong ambient so everything is visible through the open doorway */}
      <ambientLight intensity={1.4} color="#ffcc99" />
      {/* Main overhead fill */}
      <pointLight position={[0, 8, -2]} color="#ffcc88" intensity={6} distance={30} decay={1.2} />
      {/* Fireplace ember glow */}
      <pointLight position={[-6, 1.2, -10.2]} color="#ff6622" intensity={5} distance={14} decay={1.8} />
      {/* Warm candle pools */}
      <pointLight position={[3, 2.0, 2]}   color="#ffaa44" intensity={2.5} distance={8}  decay={1.8} />
      <pointLight position={[-4, 2.5, -5]} color="#ffbb55" intensity={2.0} distance={7}  decay={1.8} />
      {/* Sky fill from open doorway */}
      <directionalLight position={[0, 12, 10]} intensity={0.9} color="#ffe8cc" />

      {/* ── Wooden floor (16 wide × 22 deep; room z: -12 to +10) ─── */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[16, 22]} />
        <meshStandardMaterial color="#7a4e28" roughness={0.85} />
      </mesh>
      {/* Floor plank lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[i * 2 - 7, 0.005, -1]} receiveShadow>
          <planeGeometry args={[0.05, 22]} />
          <meshStandardMaterial color="#5a3615" roughness={0.9} />
        </mesh>
      ))}

      {/* ── Walls (room opens toward +Z — no south wall so camera
               at player.z+15 has an unobstructed view in) ─────── */}
      {/* Back wall (north) */}
      <mesh position={[0, 2.8, -12]} receiveShadow castShadow>
        <boxGeometry args={[16, 5.6, 0.3]} />
        <meshStandardMaterial color="#c4a882" roughness={0.9} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-8, 2.8, -1]} receiveShadow castShadow>
        <boxGeometry args={[0.3, 5.6, 22]} />
        <meshStandardMaterial color="#b89b72" roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh position={[8, 2.8, -1]} receiveShadow castShadow>
        <boxGeometry args={[0.3, 5.6, 22]} />
        <meshStandardMaterial color="#b89b72" roughness={0.9} />
      </mesh>
      {/* South side: only a partial stub on each side (narrow wings) so
          the opening is wide enough for the camera angle but still
          gives a "doorway" feel */}
      <mesh position={[-6, 2.8, 10]} receiveShadow castShadow>
        <boxGeometry args={[4, 5.6, 0.3]} />
        <meshStandardMaterial color="#c4a882" roughness={0.9} />
      </mesh>
      <mesh position={[6, 2.8, 10]} receiveShadow castShadow>
        <boxGeometry args={[4, 5.6, 0.3]} />
        <meshStandardMaterial color="#c4a882" roughness={0.9} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 5.6, -1]} receiveShadow>
        <boxGeometry args={[16, 0.25, 22]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.9} />
      </mesh>
      {/* Ceiling beams */}
      {[-6, 0, 6].map((bx, i) => (
        <mesh key={i} position={[bx, 5.35, -1]} castShadow>
          <boxGeometry args={[0.4, 0.4, 22]} />
          <meshStandardMaterial color="#5c3a1a" roughness={0.95} />
        </mesh>
      ))}
      {/* Door frame at z=9 — two pillars + lintel around portal */}
      <mesh position={[-2.1, 2.8, 9]} castShadow>
        <boxGeometry args={[0.35, 5.6, 0.35]} />
        <meshStandardMaterial color="#7a5030" roughness={0.8} />
      </mesh>
      <mesh position={[2.1, 2.8, 9]} castShadow>
        <boxGeometry args={[0.35, 5.6, 0.35]} />
        <meshStandardMaterial color="#7a5030" roughness={0.8} />
      </mesh>
      <mesh position={[0, 5.0, 9]} castShadow>
        <boxGeometry args={[4.6, 0.4, 0.35]} />
        <meshStandardMaterial color="#7a5030" roughness={0.8} />
      </mesh>

      {/* ── Fireplace ──────────────────────────────────────── */}
      <group position={[-7.5, 0, -10.5]}>
        {/* Stone mantle surround */}
        <mesh position={[0, 2.2, 0.15]} castShadow>
          <boxGeometry args={[3.4, 4.4, 0.6]} />
          <meshStandardMaterial color="#8a7060" roughness={0.95} />
        </mesh>
        {/* Firebox cutout visual (darker rect) */}
        <mesh position={[0, 1.1, 0.45]}>
          <boxGeometry args={[2.0, 2.2, 0.05]} />
          <meshStandardMaterial color="#1a0800" />
        </mesh>
        {/* Mantle shelf */}
        <mesh position={[0, 4.6, 0.5]} castShadow>
          <boxGeometry args={[3.8, 0.22, 0.9]} />
          <meshStandardMaterial color="#7a5030" roughness={0.85} />
        </mesh>
        {/* Ember/fire glow block */}
        <mesh position={[0, 0.3, 0.38]}>
          <boxGeometry args={[1.6, 0.45, 0.3]} />
          <meshStandardMaterial color="#ff5500" emissive="#ff4400" emissiveIntensity={3}
            transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0.6, 0.35]}>
          <boxGeometry args={[1.1, 0.4, 0.2]} />
          <meshStandardMaterial color="#ff8800" emissive="#ff7700" emissiveIntensity={4}
            transparent opacity={0.85} />
        </mesh>
        {/* Log on fire */}
        <mesh position={[-0.4, 0.16, 0.4]} rotation={[0, 0.4, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 1.6, 7]} />
          <meshStandardMaterial color="#3a1a0a" roughness={0.95} />
        </mesh>
        <mesh position={[0.3, 0.16, 0.42]} rotation={[0, -0.3, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.4, 7]} />
          <meshStandardMaterial color="#2a1206" roughness={0.95} />
        </mesh>
        {/* Mantle decorations */}
        <mesh position={[-1.1, 4.85, 0.5]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.55, 7]} />
          <meshStandardMaterial color="#e8d5a0" />
        </mesh>
        <mesh position={[-1.1, 5.13, 0.5]}>
          <sphereGeometry args={[0.1, 7, 6]} />
          <meshStandardMaterial color="#ffcc44" emissive="#ffaa00" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.9, 4.85, 0.5]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.45, 7]} />
          <meshStandardMaterial color="#e8d5a0" />
        </mesh>
        <mesh position={[0.9, 5.1, 0.5]}>
          <sphereGeometry args={[0.09, 7, 6]} />
          <meshStandardMaterial color="#ffcc44" emissive="#ffaa00" emissiveIntensity={2} />
        </mesh>
        {/* Framed portrait on mantle */}
        <mesh position={[0, 4.85, 0.52]} castShadow>
          <boxGeometry args={[0.7, 0.55, 0.05]} />
          <meshStandardMaterial color="#5c3a1a" roughness={0.85} />
        </mesh>
        <mesh position={[0, 4.85, 0.55]}>
          <boxGeometry args={[0.56, 0.42, 0.02]} />
          <meshStandardMaterial color="#c8a476" />
        </mesh>
      </group>

      {/* ── Bed (Adelynn's) ──────────────────────────────────── */}
      <group position={[-5, 0, -7]}>
        {/* Bed frame / platform */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.44, 5.2]} />
          <meshStandardMaterial color="#6a3a18" roughness={0.85} metalness={0.05} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, 0.58, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.3, 4.5]} />
          <meshStandardMaterial color="#f9e8f0" roughness={0.9} />
        </mesh>
        {/* Blanket — animates during sleep cutscene */}
        <AnimatedBlanket />
        {/* Pillow left */}
        <mesh position={[-0.68, 0.8, -1.8]} castShadow>
          <boxGeometry args={[1.0, 0.22, 0.7]} />
          <meshStandardMaterial color="#fffde7" roughness={0.9} />
        </mesh>
        {/* Pillow right */}
        <mesh position={[0.68, 0.8, -1.8]} castShadow>
          <boxGeometry args={[1.0, 0.22, 0.7]} />
          <meshStandardMaterial color="#fff0f8" roughness={0.9} />
        </mesh>
        {/* Headboard */}
        <mesh position={[0, 1.5, -2.55]} castShadow>
          <boxGeometry args={[3.2, 2.6, 0.22]} />
          <meshStandardMaterial color="#5a2e0e" roughness={0.85} />
        </mesh>
        {/* Headboard carved panel */}
        <mesh position={[0, 1.55, -2.44]}>
          <boxGeometry args={[2.5, 1.9, 0.06]} />
          <meshStandardMaterial color="#7a4a22" roughness={0.8} />
        </mesh>
        {/* Heart carving on headboard */}
        <mesh position={[0, 1.8, -2.38]}>
          <boxGeometry args={[0.5, 0.42, 0.05]} />
          <meshStandardMaterial color="#9a5a2a" roughness={0.75} />
        </mesh>
        {/* Footboard */}
        <mesh position={[0, 0.9, 2.62]} castShadow>
          <boxGeometry args={[3.2, 1.35, 0.22]} />
          <meshStandardMaterial color="#5a2e0e" roughness={0.85} />
        </mesh>
        {/* Canopy posts */}
        {[[-1.55, -2.55], [1.55, -2.55], [-1.55, 2.55], [1.55, 2.55]].map(([px, pz], i) => (
          <mesh key={i} position={[px, 2.1, pz]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 4.2, 7]} />
            <meshStandardMaterial color="#5a2e0e" roughness={0.85} />
          </mesh>
        ))}
        {/* Canopy top rails */}
        <mesh position={[0, 4.2, -2.55]} castShadow>
          <boxGeometry args={[3.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#7a4422" roughness={0.85} />
        </mesh>
        <mesh position={[0, 4.2, 2.55]} castShadow>
          <boxGeometry args={[3.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#7a4422" roughness={0.85} />
        </mesh>
        <mesh position={[-1.55, 4.2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.1, 5.1]} />
          <meshStandardMaterial color="#7a4422" roughness={0.85} />
        </mesh>
        <mesh position={[1.55, 4.2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.1, 5.1]} />
          <meshStandardMaterial color="#7a4422" roughness={0.85} />
        </mesh>
        {/* Canopy fabric panels */}
        <mesh position={[-1.55, 2.6, 0]}>
          <boxGeometry args={[0.04, 3.2, 5.0]} />
          <meshStandardMaterial color="#f8c8d8" transparent opacity={0.55} side={2} />
        </mesh>
        <mesh position={[1.55, 2.6, 0]}>
          <boxGeometry args={[0.04, 3.2, 5.0]} />
          <meshStandardMaterial color="#f8c8d8" transparent opacity={0.55} side={2} />
        </mesh>
        <mesh position={[0, 2.6, 2.55]}>
          <boxGeometry args={[3.0, 3.2, 0.04]} />
          <meshStandardMaterial color="#f8c8d8" transparent opacity={0.42} side={2} />
        </mesh>
        {/* Canopy top fabric */}
        <mesh position={[0, 4.22, 0]}>
          <boxGeometry args={[3.0, 0.04, 5.0]} />
          <meshStandardMaterial color="#f0b8cc" transparent opacity={0.7} side={2} />
        </mesh>
        {/* Bed glow (soft) */}
        <pointLight position={[0, 1.5, 0]} color="#ffccdd" intensity={0.8} distance={4} decay={2} />
      </group>

      {/* ── Rug ─────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.008, -1]}>
        <planeGeometry args={[9, 12]} />
        <meshStandardMaterial color="#8B2222" roughness={0.95} />
      </mesh>
      {/* Rug border pattern */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.009, -1]}>
        <planeGeometry args={[7.8, 10.8]} />
        <meshStandardMaterial color="#992828" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, -1]}>
        <planeGeometry args={[6.2, 9.2]} />
        <meshStandardMaterial color="#cc4444" roughness={0.9} />
      </mesh>
      {/* Rug center diamond */}
      <mesh rotation={[-Math.PI/2, Math.PI/4, 0]} position={[0, 0.011, -1]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshStandardMaterial color="#e8c050" roughness={0.9} />
      </mesh>

      {/* ── Bookshelf ────────────────────────────────────────── */}
      <group position={[6.8, 0, -8]}>
        {/* Shelf unit back */}
        <mesh position={[0.1, 2.4, 0]} castShadow>
          <boxGeometry args={[0.22, 4.8, 3.2]} />
          <meshStandardMaterial color="#6a4020" roughness={0.9} />
        </mesh>
        {/* Shelf boards */}
        {[0.5, 1.5, 2.5, 3.5].map((sy, i) => (
          <mesh key={i} position={[0, sy, 0]} castShadow>
            <boxGeometry args={[0.7, 0.12, 3.2]} />
            <meshStandardMaterial color="#7a5030" roughness={0.85} />
          </mesh>
        ))}
        {/* Books – row 1 */}
        {['#cc4444','#4488cc','#44aa66','#cc9922','#885588','#dd6633','#338866'].map((col, i) => (
          <mesh key={i} position={[-0.1, 0.9, i * 0.42 - 1.26]} castShadow>
            <boxGeometry args={[0.6, 0.72, 0.33]} />
            <meshStandardMaterial color={col} roughness={0.8} />
          </mesh>
        ))}
        {/* Books – row 2 */}
        {['#6644aa','#cc5522','#4499cc','#88aa22','#cc2266','#557700'].map((col, i) => (
          <mesh key={i} position={[-0.1, 1.9, i * 0.46 - 1.15]} castShadow>
            <boxGeometry args={[0.6, 0.68, 0.36]} />
            <meshStandardMaterial color={col} roughness={0.8} />
          </mesh>
        ))}
        {/* Books – row 3 */}
        {['#225588','#99cc44','#aa3344','#66aacc','#cc8833'].map((col, i) => (
          <mesh key={i} position={[-0.1, 2.9, i * 0.52 - 1.04]} castShadow>
            <boxGeometry args={[0.6, 0.62, 0.41]} />
            <meshStandardMaterial color={col} roughness={0.8} />
          </mesh>
        ))}
        {/* Decorative items on top */}
        <mesh position={[-0.1, 4.9, -1]}>
          <sphereGeometry args={[0.2, 10, 8]} />
          <meshStandardMaterial color="#44ccff" emissive="#22aadd" emissiveIntensity={1.2}
            transparent opacity={0.85} />
        </mesh>
        <mesh position={[-0.1, 4.85, 0.5]} castShadow>
          <boxGeometry args={[0.18, 0.6, 0.22]} />
          <meshStandardMaterial color="#c8a060" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[-0.1, 4.9, 1]}>
          <coneGeometry args={[0.16, 0.45, 5]} />
          <meshStandardMaterial color="#ff88aa" />
        </mesh>
      </group>

      {/* ── Dining table + chairs ────────────────────────────── */}
      <group position={[3, 0, 2]}>
        {/* Table top */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.1, 14]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.8} />
        </mesh>
        {/* Table pedestal */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.22, 1.0, 8]} />
          <meshStandardMaterial color="#6a3e20" roughness={0.9} />
        </mesh>
        {/* Table base */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.12, 8]} />
          <meshStandardMaterial color="#6a3e20" roughness={0.9} />
        </mesh>
        {/* Chairs */}
        {[0, Math.PI].map((angle, i) => (
          <group key={i} position={[Math.sin(angle) * 1.8, 0, Math.cos(angle) * 1.8]}
            rotation={[0, angle + Math.PI, 0]}>
            {/* Seat */}
            <mesh position={[0, 0.7, 0]} castShadow>
              <boxGeometry args={[0.7, 0.1, 0.7]} />
              <meshStandardMaterial color="#7a5030" roughness={0.85} />
            </mesh>
            {/* Legs */}
            {[[-0.28,-0.28],[0.28,-0.28],[-0.28,0.28],[0.28,0.28]].map(([lx,lz],j) => (
              <mesh key={j} position={[lx, 0.35, lz]} castShadow>
                <boxGeometry args={[0.07, 0.7, 0.07]} />
                <meshStandardMaterial color="#6a4020" roughness={0.9} />
              </mesh>
            ))}
            {/* Backrest */}
            <mesh position={[0, 1.2, -0.31]} castShadow>
              <boxGeometry args={[0.7, 0.9, 0.07]} />
              <meshStandardMaterial color="#7a5030" roughness={0.85} />
            </mesh>
          </group>
        ))}
        {/* Candle on table */}
        <mesh position={[0, 1.17, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.3, 7]} />
          <meshStandardMaterial color="#fffde0" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.33, 0]}>
          <coneGeometry args={[0.03, 0.15, 5]} />
          <meshStandardMaterial color="#ff9900" emissive="#ff6600" emissiveIntensity={4}
            transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 8]} />
          <meshStandardMaterial color="#b09050" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Place settings */}
        {[0, Math.PI].map((angle, i) => (
          <mesh key={i} position={[Math.sin(angle) * 0.8, 1.16, Math.cos(angle) * 0.8]}
            rotation={[-Math.PI/2, 0, 0]}>
            <circleGeometry args={[0.28, 10]} />
            <meshStandardMaterial color="#e8d0b0" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* ── Vanity / writing desk ────────────────────────────── */}
      <group position={[7.2, 0, 0]}>
        {/* Desk surface */}
        <mesh position={[-0.1, 1.08, 0]} castShadow>
          <boxGeometry args={[0.65, 0.1, 2.0]} />
          <meshStandardMaterial color="#7a5030" roughness={0.85} />
        </mesh>
        {/* Desk legs */}
        {[[-0.22, -0.85],[-0.22, 0.85]].map(([lx,lz],i) => (
          <mesh key={i} position={[lx, 0.54, lz]} castShadow>
            <boxGeometry args={[0.08, 1.08, 0.08]} />
            <meshStandardMaterial color="#6a4020" roughness={0.9} />
          </mesh>
        ))}
        {/* Mirror */}
        <mesh position={[0.15, 2.1, 0]} castShadow>
          <boxGeometry args={[0.1, 1.2, 0.8]} />
          <meshStandardMaterial color="#6a4020" roughness={0.85} />
        </mesh>
        <mesh position={[0.2, 2.1, 0]}>
          <boxGeometry args={[0.04, 1.0, 0.64]} />
          <meshStandardMaterial color="#ccddee" metalness={0.8} roughness={0.1}
            envMapIntensity={1.0} />
        </mesh>
        {/* Small items on desk */}
        <mesh position={[-0.15, 1.16, -0.55]}>
          <cylinderGeometry args={[0.07, 0.07, 0.28, 7]} />
          <meshStandardMaterial color="#fffde0" roughness={0.9} />
        </mesh>
        <mesh position={[-0.15, 1.3, -0.55]}>
          <coneGeometry args={[0.025, 0.12, 5]} />
          <meshStandardMaterial color="#ff9900" emissive="#ff6600" emissiveIntensity={3} transparent opacity={0.9} />
        </mesh>
        {/* Candle plate */}
        <mesh position={[-0.15, 1.14, -0.55]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 8]} />
          <meshStandardMaterial color="#c8a050" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Ink + quill */}
        <mesh position={[-0.15, 1.14, 0]}>
          <boxGeometry args={[0.14, 0.18, 0.14]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
        </mesh>
        <mesh position={[0.02, 1.25, 0.15]} rotation={[0.2, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.012, 0.004, 0.5, 5]} />
          <meshStandardMaterial color="#f4e8c8" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Sword display rack on right wall ──────────────── */}
      <group position={[7.6, 2.4, -3.5]}>
        {/* Rack bar */}
        <mesh rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.4, 7]} />
          <meshStandardMaterial color="#5c3a1a" roughness={0.85} />
        </mesh>
        {/* Display sword */}
        <mesh position={[0, -0.5, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.06, 1.6, 0.04]} />
          <meshStandardMaterial color="#f4c2d8" emissive="#ff80c0" emissiveIntensity={0.6}
            metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.24, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.06]} />
          <meshStandardMaterial color="#b0bec5" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* ── Right-wall window ────────────────────────────────── */}
      <group position={[7.85, 3.0, 4]}>
        {/* Frame */}
        <mesh castShadow>
          <boxGeometry args={[0.14, 2.2, 0.14]} />
          <meshStandardMaterial color="#7a5030" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.06, 1.8, 1.8]} />
          <meshStandardMaterial color="#ffe8b0" emissive="#ffcc44" emissiveIntensity={0.7}
            transparent opacity={0.65} side={2} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.1, 1.9]} />
          <meshStandardMaterial color="#7a5030" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Back-wall window with star/moon view ────────────── */}
      <group position={[3.5, 3.0, -11.87]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 2.0, 0.14]} />
          <meshStandardMaterial color="#7a5030" roughness={0.9} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.5, 1.7, 0.06]} />
          <meshStandardMaterial color="#112244" emissive="#1a2244" emissiveIntensity={0.8}
            transparent opacity={0.82} side={2} />
        </mesh>
        {/* Stars in the window */}
        {[[0.3,0.4],[-0.4,0.2],[0.1,-0.5],[-0.3,-0.2],[0.5,-0.1]].map(([sx,sy],i) => (
          <mesh key={i} position={[sx, sy, 0.04]}>
            <sphereGeometry args={[0.04, 5, 5]} />
            <meshStandardMaterial color="#ffffcc" emissive="#ffffaa" emissiveIntensity={4} />
          </mesh>
        ))}
        {/* Moon */}
        <mesh position={[-0.45, 0.48, 0.04]}>
          <sphereGeometry args={[0.2, 10, 8]} />
          <meshStandardMaterial color="#fffde0" emissive="#eee8a0" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[-0.3, 0.54, 0.06]}>
          <sphereGeometry args={[0.14, 8, 6]} />
          <meshStandardMaterial color="#112244" />
        </mesh>
      </group>

      {/* ── Potted plant near bookshelf ──────────────────────── */}
      <group position={[5.5, 0, -5]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.22, 0.8, 8]} />
          <meshStandardMaterial color="#7a4422" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.2, 0.16, 0.44, 8]} />
          <meshStandardMaterial color="#6a5a3a" roughness={0.95} />
        </mesh>
        {[0,1.1,2.2,3.3,4.4,5.5].map((a, i) => (
          <group key={i} position={[Math.cos(a)*0.22, 0.85, Math.sin(a)*0.22]}
            rotation={[0.3, a, 0.4]}>
            <mesh castShadow>
              <boxGeometry args={[0.07, 0.55, 0.04]} />
              <meshStandardMaterial color="#2a6a28" roughness={0.85} />
            </mesh>
          </group>
        ))}
        {[0,2.0,4.0].map((a, i) => (
          <mesh key={i} position={[Math.cos(a)*0.3, 1.35, Math.sin(a)*0.3]}>
            <sphereGeometry args={[0.1, 7, 7]} />
            <meshStandardMaterial color="#ff88aa" />
          </mesh>
        ))}
      </group>

      {/* ── Small chest under bed-side ───────────────────────── */}
      <group position={[-2.4, 0, -5.5]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.7, 0.55, 0.55]} />
          <meshStandardMaterial color="#5a3a18" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.48, 0]} castShadow>
          <boxGeometry args={[0.72, 0.22, 0.57]} />
          <meshStandardMaterial color="#4a2e10" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.42, 0.29]}>
          <boxGeometry args={[0.14, 0.1, 0.06]} />
          <meshStandardMaterial color="#d4a840" metalness={0.7} roughness={0.25} />
        </mesh>
        <pointLight position={[0, 0.9, 0]} color="#ffcc44" intensity={0.6} distance={2.5} decay={2} />
      </group>

      {/* ── Framed picture near door ──────────────────────────── */}
      <group position={[-7.8, 3.5, 5]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 1.1, 0.9]} />
          <meshStandardMaterial color="#5c3a1a" roughness={0.85} />
        </mesh>
        <mesh position={[0.08, 0, 0]}>
          <boxGeometry args={[0.04, 0.9, 0.7]} />
          <meshStandardMaterial color="#c4a882" roughness={0.85} />
        </mesh>
      </group>

      {/* ── Area boundary (room: x -8..8, z -12..10) ────────── */}
      <group>
        {([
          [[0,  3, -12.15], [16, 6, 0.3]],
          [[-8.15, 3, -1],  [0.3, 6, 22]],
          [[8.15, 3, -1],   [0.3, 6, 22]],
          [[0, 3, 10.15],   [16, 6, 0.3]],
        ] as [number, number, number][][]).map(([p, s], i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <boxGeometry args={s as [number, number, number]} />
            <meshStandardMaterial transparent opacity={0} />
          </mesh>
        ))}
      </group>
    </>
  );
}

// ─── Invisible world boundary ─────────────────────────────────────
function Boundary() {
  return (
    <group>
      {([
        [[0, 3, -31], [62, 6, 0.4]],
        [[0, 3, 31],  [62, 6, 0.4]],
        [[-31, 3, 0], [0.4, 6, 62]],
        [[31, 3, 0],  [0.4, 6, 62]],
      ] as [number, number, number][][]).map(([p, s], i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={s as [number, number, number]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

// ─── World component ──────────────────────────────────────────────
const SHOP_POS = new THREE.Vector3(8, 0, 12);
const FOUNTAIN_POSITIONS: Partial<Record<AreaId, THREE.Vector3>> = {
  field:  new THREE.Vector3(-20, 0, 20),
  forest: new THREE.Vector3(18, 0, -18),
  desert: new THREE.Vector3(20, 0, 20),
};

export function World() {
  const portalTimeRef = useRef(0);
  const currentArea = useGameStore(state => state.currentArea);
  const portals = PORTALS[currentArea] ?? [];
  const shardsCollected = useGameStore(s => s.shardsCollected);

  // All portals visible in the current area
  const allPortals: PortalDef[] = [...portals];
  if (currentArea === 'field' && shardsCollected >= 3) {
    allPortals.push(BOSS_PORTAL_DEF);
  }
  if (currentArea === 'void' && shardsCollected >= 3) {
    allPortals.push(VOID_BOSS_PORTAL_DEF);
  }

  useFrame((_, delta) => {
    const { playerPosition, gameState } = useGameStore.getState();
    if (gameState !== 'playing') return;
    portalTimeRef.current += delta;

    // Portal proximity check
    for (const portal of allPortals) {
      const ppos = new THREE.Vector3(...portal.pos);
      if (playerPosition.distanceTo(ppos) < 2.2) {
        useGameStore.getState().triggerAreaTransition(portal.destination);
        return;
      }
    }

    // Shop proximity
    if (currentArea === 'field') {
      useGameStore.getState().setNearShop(playerPosition.distanceTo(SHOP_POS) < 3.5);
    } else {
      useGameStore.getState().setNearShop(false);
    }

    // Fairy fountain proximity
    const fountainPos = FOUNTAIN_POSITIONS[currentArea];
    if (fountainPos) {
      useGameStore.getState().setNearFountain(playerPosition.distanceTo(fountainPos) < 3.0);
    } else {
      useGameStore.getState().setNearFountain(false);
    }

    // Bed proximity (only inside home)
    if (currentArea === 'home') {
      const bedPos = new THREE.Vector3(-5, 0, -7);
      useGameStore.getState().setNearBed(playerPosition.distanceTo(bedPos) < 3.0);
    } else {
      useGameStore.getState().setNearBed(false);
    }
  });

  return (
    <>
      {allPortals.map((def, i) => (
        <Portal key={i} def={def} portalTime={portalTimeRef.current} />
      ))}

      {currentArea === 'field'   && <FieldArea />}
      {currentArea === 'forest'  && <ForestArea />}
      {currentArea === 'desert'  && <DesertArea />}
      {currentArea === 'boss'    && <BossArea />}
      {currentArea === 'jungle'  && <JungleArea />}
      {currentArea === 'ice'     && <IceArea />}
      {currentArea === 'volcano' && <VolcanoArea />}
      {currentArea === 'sky'     && <SkyArea />}
      {currentArea === 'crypt'   && <CryptArea />}
      {currentArea === 'void'    && <VoidArea />}
      {currentArea === 'cave'    && <CaveArea />}
      {currentArea === 'home'    && <HomeArea />}
      <AreaGuardian />
      <NPCManager />
    </>
  );
}
