import { create } from "zustand";
import { WeaponId } from "./controls";
import { NPC_DATA } from "./npcData";

export type GameState = "title" | "playing" | "paused" | "gameover" | "victory";
export type AreaId =
  | "field" | "forest" | "desert" | "boss"
  | "cave" | "jungle" | "ice" | "volcano" | "sky"
  | "shadow" | "dungeon1" | "dungeon2" | "dungeon3";

// ── Sword definitions ────────────────────────────────────────────
export type SwordId =
  | "crystal" | "flame" | "thunder" | "frost" | "shadow"
  | "holy"    | "viper" | "storm"   | "dragon" | "cosmos";

export interface SwordDef {
  name: string; damage: number; desc: string; icon: string;
  blade: string; guard: string; grip: string;
  emissive: string; emissiveInt: number; light: string;
}

export const SWORD_DEFS: Record<SwordId, SwordDef> = {
  crystal: { name: "Crystal Sword",  damage: 1.0, desc: "Your trusty starting blade.",       icon: "⚔️",  blade: "#f48fb1", guard: "#b0bec5", grip: "#e91e8c", emissive: "#ff80c0", emissiveInt: 0.4, light: "#ff80c0" },
  flame:   { name: "Flame Sword",    damage: 1.5, desc: "Fiery blade. +50% damage.",          icon: "🔥",  blade: "#ff7733", guard: "#cc3300", grip: "#880000", emissive: "#ff5500", emissiveInt: 1.5, light: "#ff6600" },
  thunder: { name: "Thunder Blade",  damage: 1.2, desc: "Crackles with lightning energy.",    icon: "⚡",  blade: "#ffee22", guard: "#aa8800", grip: "#443300", emissive: "#ffcc00", emissiveInt: 1.8, light: "#ffdd00" },
  frost:   { name: "Frost Edge",     damage: 1.1, desc: "Ice-cold precision blade.",          icon: "❄️",  blade: "#80d4ff", guard: "#4488bb", grip: "#003366", emissive: "#00aaff", emissiveInt: 1.2, light: "#44ccff" },
  shadow:  { name: "Shadow Blade",   damage: 1.3, desc: "Strikes from the darkness.",         icon: "🌑",  blade: "#9933ff", guard: "#440088", grip: "#1a0033", emissive: "#6600cc", emissiveInt: 1.5, light: "#8800ff" },
  holy:    { name: "Holy Blade",     damage: 2.0, desc: "Sacred light. Double damage!",       icon: "✨",  blade: "#fffff0", guard: "#ddcc66", grip: "#996600", emissive: "#ffffc0", emissiveInt: 2.2, light: "#ffffaa" },
  viper:   { name: "Viper Fang",     damage: 1.2, desc: "Venomous strike from the shadows.",  icon: "🐍",  blade: "#22dd55", guard: "#115522", grip: "#002200", emissive: "#00ff55", emissiveInt: 1.2, light: "#00ee44" },
  storm:   { name: "Storm Sword",    damage: 1.4, desc: "Wind-forged. Wider spin radius.",     icon: "🌪️", blade: "#00d4cc", guard: "#005566", grip: "#001a1a", emissive: "#00cccc", emissiveInt: 1.5, light: "#00ddcc" },
  dragon:  { name: "Dragon Blade",   damage: 2.5, desc: "Immense power. 2.5× base damage!",   icon: "🐉",  blade: "#ff2200", guard: "#880000", grip: "#330000", emissive: "#cc1100", emissiveInt: 2.0, light: "#ff3300" },
  cosmos:  { name: "Cosmos Blade",   damage: 2.0, desc: "Star-forged. The ultimate weapon.",  icon: "🌟",  blade: "#cc00ff", guard: "#660099", grip: "#220033", emissive: "#aa00ff", emissiveInt: 2.5, light: "#cc00ff" },
};

// ── Sword chests ─────────────────────────────────────────────────
export const SWORD_CHESTS: { key: string; x: number; z: number; area: AreaId; swordId: SwordId }[] = [
  { key: "sword-flame",   x: 15,  z: -14, area: "field",  swordId: "flame"   },
  { key: "sword-viper",   x: -15, z: 14,  area: "field",  swordId: "viper"   },
  { key: "sword-thunder", x: 14,  z: -14, area: "desert", swordId: "thunder" },
  { key: "sword-storm",   x: -14, z: 14,  area: "desert", swordId: "storm"   },
  { key: "sword-frost",   x: -14, z: -14, area: "forest", swordId: "frost"   },
  { key: "sword-shadow",  x: 14,  z: -14, area: "forest", swordId: "shadow"  },
  { key: "sword-holy",    x: 10,  z: 5,   area: "boss",    swordId: "holy"    },
  { key: "sword-dragon",  x: -10, z: -5,  area: "boss",    swordId: "dragon"  },
  { key: "sword-cosmos",  x: 0,   z: -15, area: "boss",    swordId: "cosmos"  },
  { key: "sword-cave1",   x: 12,  z: 8,   area: "cave",    swordId: "thunder" },
  { key: "sword-jungle1", x: -14, z: 12,  area: "jungle",  swordId: "viper"   },
  { key: "sword-ice1",    x: 10,  z: -10, area: "ice",     swordId: "frost"   },
  { key: "sword-vol1",    x: -10, z: 8,   area: "volcano", swordId: "flame"   },
  { key: "sword-sky1",    x: 14,  z: -14, area: "sky",     swordId: "storm"   },
  { key: "sword-shad1",   x: 0,   z: -16, area: "shadow",  swordId: "shadow"  },
  { key: "sword-d1",      x: 0,   z: -18, area: "dungeon1",swordId: "holy"    },
  { key: "sword-d2",      x: 0,   z: -18, area: "dungeon2",swordId: "cosmos"  },
  { key: "sword-d3",      x: 0,   z: -18, area: "dungeon3",swordId: "dragon"  },
];

// ── Weapon pickups ────────────────────────────────────────────────
export interface WeaponPickupDef {
  key: string; weaponId: WeaponId; area: AreaId;
  x: number; z: number;
  label: string; icon: string; color: string; desc: string;
  starterAmmo?: Partial<Record<"arrows"|"bombs"|"shurikens"|"frostCharges"|"flareCharges"|"veilCrystals"|"quakeRunes"|"moonbowAmmo", number>>;
}

export const WEAPON_PICKUPS: WeaponPickupDef[] = [
  { key: "weapon-bow",       weaponId: "bow",       area: "field",  x: 18,  z: 6,   label: "Aldenmere Bow",  icon: "🏹", color: "#88aaff", desc: "Fire arrows at distant foes.",           starterAmmo: { arrows: 20 } },
  { key: "weapon-boomerang", weaponId: "boomerang", area: "field",  x: -18, z: -5,  label: "Shadowrang",     icon: "🌒", color: "#ffaa44", desc: "Returning arc weapon. Unlimited uses." },
  { key: "weapon-wand",      weaponId: "wand",      area: "forest", x: 16,  z: 5,   label: "Wand of Sparks", icon: "🪄", color: "#ff88dd", desc: "Fires magic orbs. Unlimited uses." },
  { key: "weapon-frost",     weaponId: "frost",     area: "forest", x: -8,  z: 16,  label: "Frost Scepter",  icon: "❄️", color: "#44ccff", desc: "Ice bolt that slows enemies.",           starterAmmo: { frostCharges: 10 } },
  { key: "weapon-moonbow",   weaponId: "moonbow",   area: "forest", x: 4,   z: -18, label: "Moonbow",        icon: "🌙", color: "#8844cc", desc: "Moon-crescent fan-shot.",               starterAmmo: { moonbowAmmo: 15 } },
  { key: "weapon-bomb",      weaponId: "bomb",      area: "desert", x: -16, z: -14, label: "Ember Vial",     icon: "🧪", color: "#ff4422", desc: "Throwable explosive. Area damage.",      starterAmmo: { bombs: 8 } },
  { key: "weapon-shuriken",  weaponId: "shuriken",  area: "desert", x: 16,  z: -14, label: "Void Stars",     icon: "⭐", color: "#00ffcc", desc: "Spread-throw spinning stars.",           starterAmmo: { shurikens: 25 } },
  { key: "weapon-flare",     weaponId: "flare",     area: "desert", x: -8,  z: -18, label: "Solara's Flare", icon: "☀️", color: "#ff8800", desc: "Area fire burst. Hits all nearby.",      starterAmmo: { flareCharges: 5 } },
  { key: "weapon-shadow",    weaponId: "shadow",    area: "boss",   x: -16, z: -6,  label: "Shadow Veil",    icon: "🌑", color: "#aa00ff", desc: "Vanish from sight for 2.5 seconds." },
  { key: "weapon-veil",      weaponId: "veil",      area: "boss",   x: 16,  z: -6,  label: "Glacira's Veil", icon: "💠", color: "#00aaff", desc: "Instantly freeze all nearby enemies.",   starterAmmo: { veilCrystals: 3 } },
  { key: "weapon-quake",     weaponId: "quake",     area: "boss",   x: 12,  z: 12,  label: "Cragus Strike",  icon: "🪨", color: "#aa8844", desc: "Ground slam stuns all on-screen foes.", starterAmmo: { quakeRunes: 3 } },
  { key: "weapon-aura",      weaponId: "aura",      area: "boss",   x: -12, z: 12,  label: "Aura Ring",      icon: "💫", color: "#ffff44", desc: "Orbiting crystal shield for 4 seconds." },
  { key: "weapon-chain",     weaponId: "chain",     area: "boss",   x: 0,   z: 12,  label: "Chain Anchor",   icon: "⛓️", color: "#8888aa", desc: "Grapple and stun with a chain throw." },
];

// ── Lore stones ───────────────────────────────────────────────────
export const LORE_STONES: Record<AreaId, Array<{ id: string; text: string; x: number; z: number }>> = {
  field: [
    { id: "field-1", text: "\"Long before the Crown was shattered, Adelynn trained in these very plains. Her footsteps left marks in the soil that time cannot erase.\"", x: 8, z: -12 },
    { id: "field-2", text: "\"Three shards of the Crown were scattered across the realm. Only one who is pure of heart may reunite them.\"", x: -14, z: 8 },
    { id: "field-3", text: "\"Malgrath's shadow grew from these hills. He was not always evil — once, he was Adelynn's teacher.\"", x: 16, z: 14 },
  ],
  forest: [
    { id: "forest-1", text: "\"The Whisper Woods remember every creature that has walked within. The trees speak to those who listen.\"", x: -10, z: -8 },
    { id: "forest-2", text: "\"A BriarWolf is born from the grief of the forest. They are not evil — only wounded.\"", x: 14, z: 10 },
    { id: "forest-3", text: "\"The first shard rests at the edge of the world where light meets shadow. Look where the trees thin.\"", x: -16, z: 14 },
  ],
  desert: [
    { id: "desert-1", text: "\"Ashrock Sands were once a flourishing oasis. Malgrath's corruption turned water to dust and hope to ash.\"", x: 10, z: -12 },
    { id: "desert-2", text: "\"EmberScorpions feed on the magical residue left behind by the shattered Crown. They are drawn to shards.\"", x: -12, z: 8 },
    { id: "desert-3", text: "\"The ancient inscription at the ruins reads: Only the sword forged in starlight can pierce Malgrath's armor.\"", x: 16, z: 16 },
  ],
  boss: [
    { id: "boss-1", text: "\"This is Malgrath's inner sanctum. Every stone drips with corrupted power. Do not let despair take hold.\"", x: -8, z: 8 },
    { id: "boss-2", text: "\"You have come far, Adelynn. But power alone won't defeat him — you must remember why you fight.\"", x: 8, z: -8 },
    { id: "boss-3", text: "\"The shattered pieces of the Crown long to be reunited. Even Malgrath, deep down, yearns for the light he lost.\"", x: 0, z: 12 },
  ],
  cave: [
    { id: "cave-1", text: "\"The Deepstone Caverns have swallowed whole armies. Their bones now walk the dark passages as skeletons.\"", x: -10, z: -8 },
    { id: "cave-2", text: "\"A Rockgolem is born when the mountain grows angry. It cannot be hurt from the front — circle behind.\"", x: 12, z: 6 },
    { id: "cave-3", text: "\"Somewhere in this cave, the Mirror of Worlds was hidden. It shows not what is, but what could be.\"", x: -6, z: 14 },
  ],
  jungle: [
    { id: "jungle-1", text: "\"The Verdant Depths are older than recorded time. The Lizardmen here remember the world before the Crown.\"", x: 10, z: -12 },
    { id: "jungle-2", text: "\"Jungle Trolls are territorial above all else. Defeat one and its territory is yours to traverse safely.\"", x: -14, z: 8 },
    { id: "jungle-3", text: "\"In the canopy above lurks the Shadowmere Crypt entrance. The dungeon key lies hidden near the great fern.\"", x: 6, z: 16 },
  ],
  ice: [
    { id: "ice-1", text: "\"Frostpeak Tundra — the glaciers here are ancient as the first winter. Ice Wolves have stalked these fields for centuries.\"", x: -12, z: -10 },
    { id: "ice-2", text: "\"The Frost Phantom is not truly alive — it is the lingering grief of a warrior who died without purpose.\"", x: 10, z: 8 },
    { id: "ice-3", text: "\"The Speed Boots of Aldenmere rest frozen in the ice. The warrior who wore them outran even fate itself.\"", x: -8, z: 16 },
  ],
  volcano: [
    { id: "vol-1", text: "\"Ashrock Caldera — the heat here is not merely physical. Malgrath's essence bled into the stone and ignited it.\"", x: 8, z: -12 },
    { id: "vol-2", text: "\"Lava Beasts cannot be defeated by fire — they absorb it. Use ice, shadow, or holy power.\"", x: -10, z: 6 },
    { id: "vol-3", text: "\"The Ashrock Forge dungeon lies ahead. Within: the Hookshot of the Ancients, forged from volcanic chain.\"", x: 14, z: 14 },
  ],
  sky: [
    { id: "sky-1", text: "\"The Celestial Skylands float on ancient magic. The Thunder Birds here were once messenger spirits for the gods.\"", x: -10, z: -10 },
    { id: "sky-2", text: "\"From this height you can see all three shards of the Crown glowing in the world below. They call to each other.\"", x: 12, z: 8 },
    { id: "sky-3", text: "\"The wind here carries whispers. Malgrath's voice: 'Come to me, Adelynn. You cannot save what is already broken.'\"", x: -8, z: 14 },
  ],
  shadow: [
    { id: "shad-1", text: "\"The Shadow Realm is a dark mirror of the world you know. Everything here is inverted — even kindness becomes cruelty.\"", x: -12, z: -8 },
    { id: "shad-2", text: "\"Shadow Slimes are pure corruption given form. They were once ordinary slimes before Malgrath's blight reached them.\"", x: 10, z: 6 },
    { id: "shad-3", text: "\"The Shadow Crown shard pulses here. It is the darkest piece — the one that first broke and fell into the abyss.\"", x: 0, z: -14 },
  ],
  dungeon1: [
    { id: "d1-1", text: "\"Shadowmere Crypt — built as a tomb for the fallen warriors of the Crown War. Now the dead walk its halls.\"", x: -8, z: -6 },
    { id: "d1-2", text: "\"The Crystal Spiders here spin webs of hardened magic. Their silk can hold even a VoidWraith in place.\"", x: 8, z: 4 },
    { id: "d1-3", text: "\"The dungeon boss guards the Map of All Shadows. Defeat it to reveal every secret in the world above.\"", x: 0, z: 10 },
  ],
  dungeon2: [
    { id: "d2-1", text: "\"The Ashrock Forge — ancient dwarven craftsmen built weapons here for both sides of the Crown War, caring only for coin.\"", x: -8, z: -6 },
    { id: "d2-2", text: "\"Volcano Demons are the forge-masters' failed experiments — men who were melted into the machinery and never came out.\"", x: 8, z: 4 },
    { id: "d2-3", text: "\"The Hookshot is sealed in the innermost forge room. It was meant to be Adelynn's gift — before everything changed.\"", x: 0, z: 10 },
  ],
  dungeon3: [
    { id: "d3-1", text: "\"Crystal Spire — a fortress of frozen magic at the peak of the Ice Mountains. The walls themselves sing in cold winds.\"", x: -8, z: -6 },
    { id: "d3-2", text: "\"Frost Phantoms here are at their strongest. They draw power from the ice and reform seconds after being struck.\"", x: 8, z: 4 },
    { id: "d3-3", text: "\"The final Crown shard lies at the summit. Destroy the guardian and the path to Malgrath's true sanctum opens.\"", x: 0, z: 10 },
  ],
};

// ── Item fanfare ──────────────────────────────────────────────────
export interface ItemFanfare {
  name: string; icon: string; desc: string;
}

interface PendingTransition {
  area: AreaId; spawnX: number; spawnZ: number;
}

interface GameStore {
  // Core state
  gameState: GameState;
  hearts: number;
  maxHearts: number;
  rupees: number;
  score: number;
  comboCount: number;
  comboTimer: number;
  maxCombo: number;
  runStartTime: number;
  totalKills: number;
  currentArea: AreaId;
  pendingTransition: PendingTransition | null;
  areasVisited: AreaId[];

  // Swords
  activeSword: SwordId;
  unlockedSwords: SwordId[];

  // Weapons
  selectedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  pendingWeaponFire: WeaponId | null;
  arrows: number;
  bombs: number;
  shurikens: number;
  frostCharges: number;
  flareCharges: number;
  veilCrystals: number;
  quakeRunes: number;
  moonbowAmmo: number;
  auraEndTime: number;
  shadowEndTime: number;
  chainCooldownEnd: number;

  // Progression
  chestsOpened: string[];
  shardsCollected: number;
  heartPiecesCollected: string[];
  armorLevel: 0 | 1 | 2;
  itemFanfare: ItemFanfare | null;

  // Lore
  loreRead: string[];
  nearLore: string | null;

  // NPCs
  nearNPC: string | null;
  activeDialogue: { npcId: string; line: number; maxLines: number } | null;
  talkedToNPCs: string[];

  // Shop / world
  nearShop: boolean;
  showShop: boolean;
  nearFountain: boolean;

  // Boss
  bossHP: number;
  bossMaxHP: number;
  bossDefeated: boolean;
  hurtCooldownEnd: number;

  // Shield / Parry
  isBlocking: boolean;
  parryWindowUntil: number;
  parryCounterActive: boolean;

  // Special items (world-altering)
  hasMagicMirror: boolean;
  hasSpeedBoots: boolean;
  hasHookshot: boolean;
  smallKeys: number;
  dungeonMapsFound: string[];
  storyChaptersSeen: AreaId[];

  // Actions
  setGameState: (s: GameState) => void;
  togglePause: () => void;
  resetGame: () => void;
  damagePlayer: (amount: number) => void;
  setBlocking: (v: boolean) => void;
  triggerParryCounter: () => void;
  healPlayer: (amount: number) => void;
  fullHeal: () => void;
  addRupees: (n: number) => void;
  addKill: (pts: number) => void;
  tickCombo: (delta: number) => void;
  addArrows: (n: number) => void;
  addBombs: (n: number) => void;
  addShurikens: (n: number) => void;
  addFrostCharges: (n: number) => void;
  addFlareCharges: (n: number) => void;
  addVeilCrystals: (n: number) => void;
  addQuakeRunes: (n: number) => void;
  addMoonbowAmmo: (n: number) => void;
  useArrow: () => boolean;
  useBomb: () => boolean;
  useShuriken: () => boolean;
  useFrostCharge: () => boolean;
  useFlareCharge: () => boolean;
  useVeilCrystal: () => boolean;
  useQuakeRune: () => boolean;
  useMoonbowAmmo: () => boolean;
  activateAura: () => void;
  activateShadow: () => void;
  activateChain: () => void;
  unlockSword: (id: SwordId) => void;
  setActiveSword: (id: SwordId) => void;
  cycleSword: (dir: 1 | -1) => void;
  cycleWeapon: (dir: 1 | -1) => void;
  setSelectedWeapon: (w: WeaponId) => void;
  fireWeapon: (w: WeaponId) => void;
  clearPendingWeaponFire: () => void;
  openChest: (key: string) => void;
  unlockWeaponPickup: (weaponId: WeaponId, pickupKey: string) => void;
  collectHeartPiece: (id: string) => void;
  setItemFanfare: (item: ItemFanfare | null) => void;
  markLoreRead: (id: string) => void;
  setNearLore: (id: string | null) => void;
  setNearNPC: (id: string | null) => void;
  startDialogue: (npcId: string) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;
  setNearShop: (v: boolean) => void;
  openShop: () => void;
  closeShop: () => void;
  buyItem: (item: string, cost: number) => boolean;
  setNearFountain: (v: boolean) => void;
  useFountain: () => void;
  damageBoss: (amount: number) => void;
  triggerAreaTransition: (t: PendingTransition) => void;
  completeAreaTransition: () => void;
  visitArea: (area: AreaId) => void;
  setArmorLevel: (level: 0 | 1 | 2) => void;
  collectSpecialItem: (item: "magicMirror" | "speedBoots" | "hookshot", areaKey?: string) => void;
  addSmallKeys: (n: number) => void;
  useSmallKey: () => boolean;
  markChapterSeen: (area: AreaId) => void;
  useMagicMirror: () => void;
}

const INITIAL_STATE = {
  gameState: "title" as GameState,
  hearts: 8,
  maxHearts: 8,
  rupees: 0,
  score: 0,
  comboCount: 0,
  comboTimer: 0,
  maxCombo: 0,
  runStartTime: 0,
  totalKills: 0,
  currentArea: "field" as AreaId,
  pendingTransition: null,
  areasVisited: ["field" as AreaId],
  activeSword: "crystal" as SwordId,
  unlockedSwords: ["crystal" as SwordId],
  selectedWeapon: "sword" as WeaponId,
  unlockedWeapons: ["sword" as WeaponId],
  pendingWeaponFire: null,
  arrows: 10,
  bombs: 5,
  shurikens: 15,
  frostCharges: 8,
  flareCharges: 3,
  veilCrystals: 3,
  quakeRunes: 2,
  moonbowAmmo: 10,
  auraEndTime: 0,
  shadowEndTime: 0,
  chainCooldownEnd: 0,
  chestsOpened: [] as string[],
  shardsCollected: 0,
  heartPiecesCollected: [] as string[],
  armorLevel: 0 as 0 | 1 | 2,
  itemFanfare: null,
  loreRead: [] as string[],
  nearLore: null,
  nearNPC: null,
  activeDialogue: null,
  talkedToNPCs: [] as string[],
  nearShop: false,
  showShop: false,
  nearFountain: false,
  bossHP: 20,
  bossMaxHP: 20,
  bossDefeated: false,
  hurtCooldownEnd: 0,
  isBlocking: false,
  parryWindowUntil: 0,
  parryCounterActive: false,
  hasMagicMirror: false,
  hasSpeedBoots: false,
  hasHookshot: false,
  smallKeys: 0,
  dungeonMapsFound: [] as string[],
  storyChaptersSeen: [] as AreaId[],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  setGameState: (s) => set({ gameState: s }),
  togglePause: () => set((st) => ({
    gameState: st.gameState === "paused" ? "playing" : "paused",
  })),
  resetGame: () => set({ ...INITIAL_STATE, gameState: "playing", runStartTime: Date.now() }),

  damagePlayer: (amount) => {
    const { hurtCooldownEnd, hearts, armorLevel, shadowEndTime, isBlocking, parryWindowUntil } = get();
    const now = Date.now();
    if (now < hurtCooldownEnd) return;
    if (now < shadowEndTime) return;
    if (isBlocking) {
      if (now < parryWindowUntil) {
        set({ parryCounterActive: true, hurtCooldownEnd: now + 400 });
        return;
      }
      const armorReduction = armorLevel === 2 ? 0.5 : armorLevel === 1 ? 0.75 : 1.0;
      const newHearts = Math.max(0, hearts - amount * 0.25 * armorReduction);
      set({ hearts: newHearts, hurtCooldownEnd: now + 600, gameState: newHearts <= 0 ? "gameover" : "playing" });
      return;
    }
    const reduction = armorLevel === 2 ? 0.5 : armorLevel === 1 ? 0.75 : 1.0;
    const newHearts = Math.max(0, hearts - amount * reduction);
    set({
      hearts: newHearts,
      hurtCooldownEnd: now + 2000,
      gameState: newHearts <= 0 ? "gameover" : "playing",
    });
  },
  setBlocking: (v) => {
    if (v && !get().isBlocking) {
      set({ isBlocking: true, parryWindowUntil: Date.now() + 300 });
    } else {
      set({ isBlocking: v });
    }
  },
  triggerParryCounter: () => set({ parryCounterActive: true }),
  healPlayer: (amount) => set((st) => ({ hearts: Math.min(st.maxHearts, st.hearts + amount) })),
  fullHeal: () => set((st) => ({ hearts: st.maxHearts })),
  addRupees: (n) => set((st) => ({ rupees: st.rupees + n })),

  addKill: (pts) => set((st) => {
    const newCombo = st.comboCount + 1;
    const mult = Math.min(newCombo, 8);
    return {
      score: st.score + pts * mult,
      comboCount: newCombo,
      comboTimer: 2.5,
      maxCombo: Math.max(st.maxCombo, newCombo),
      totalKills: st.totalKills + 1,
    };
  }),

  tickCombo: (delta) => {
    const { comboTimer } = get();
    if (comboTimer <= 0) return;
    const t = comboTimer - delta;
    if (t <= 0) set({ comboTimer: 0, comboCount: 0 });
    else set({ comboTimer: t });
  },

  addArrows: (n) => set((st) => ({ arrows: Math.min(st.arrows + n, 99) })),
  addBombs: (n) => set((st) => ({ bombs: Math.min(st.bombs + n, 20) })),
  addShurikens: (n) => set((st) => ({ shurikens: Math.min(st.shurikens + n, 60) })),
  addFrostCharges: (n) => set((st) => ({ frostCharges: Math.min(st.frostCharges + n, 20) })),
  addFlareCharges: (n) => set((st) => ({ flareCharges: Math.min(st.flareCharges + n, 10) })),
  addVeilCrystals: (n) => set((st) => ({ veilCrystals: Math.min(st.veilCrystals + n, 10) })),
  addQuakeRunes: (n) => set((st) => ({ quakeRunes: Math.min(st.quakeRunes + n, 8) })),
  addMoonbowAmmo: (n) => set((st) => ({ moonbowAmmo: Math.min(st.moonbowAmmo + n, 60) })),

  useArrow: () => { const n = get().arrows; if (n <= 0) return false; set({ arrows: n - 1 }); return true; },
  useBomb: () => { const n = get().bombs; if (n <= 0) return false; set({ bombs: n - 1 }); return true; },
  useShuriken: () => { const n = get().shurikens; if (n <= 0) return false; set({ shurikens: n - 1 }); return true; },
  useFrostCharge: () => { const n = get().frostCharges; if (n <= 0) return false; set({ frostCharges: n - 1 }); return true; },
  useFlareCharge: () => { const n = get().flareCharges; if (n <= 0) return false; set({ flareCharges: n - 1 }); return true; },
  useVeilCrystal: () => { const n = get().veilCrystals; if (n <= 0) return false; set({ veilCrystals: n - 1 }); return true; },
  useQuakeRune: () => { const n = get().quakeRunes; if (n <= 0) return false; set({ quakeRunes: n - 1 }); return true; },
  useMoonbowAmmo: () => { const n = get().moonbowAmmo; if (n <= 0) return false; set({ moonbowAmmo: n - 1 }); return true; },

  activateAura: () => set({ auraEndTime: Date.now() + 4000 }),
  activateShadow: () => set({ shadowEndTime: Date.now() + 2500 }),
  activateChain: () => set({ chainCooldownEnd: Date.now() + 4000 }),

  unlockSword: (id) => set((st) => ({
    unlockedSwords: st.unlockedSwords.includes(id) ? st.unlockedSwords : [...st.unlockedSwords, id],
    activeSword: id,
  })),
  setActiveSword: (id) => set({ activeSword: id }),
  cycleSword: (dir) => set((st) => {
    const ids = st.unlockedSwords;
    if (ids.length <= 1) return {};
    const idx = ids.indexOf(st.activeSword);
    const next = (idx + dir + ids.length) % ids.length;
    return { activeSword: ids[next] };
  }),
  cycleWeapon: (dir) => set((st) => {
    const avail = st.unlockedWeapons;
    if (avail.length <= 1) return {};
    const idx = avail.indexOf(st.selectedWeapon);
    const next = (idx + dir + avail.length) % avail.length;
    return { selectedWeapon: avail[next] };
  }),
  setSelectedWeapon: (w) => set({ selectedWeapon: w }),
  fireWeapon: (w) => set({ pendingWeaponFire: w }),
  clearPendingWeaponFire: () => set({ pendingWeaponFire: null }),

  openChest: (key) => set((st) => {
    if (st.chestsOpened.includes(key)) return {};
    const newOpened = [...st.chestsOpened, key];

    // Armor chest
    if (key === "boss-armor") {
      const newLevel = Math.min(2, st.armorLevel + 1) as 0 | 1 | 2;
      return {
        chestsOpened: newOpened,
        armorLevel: newLevel,
        itemFanfare: {
          name: st.armorLevel === 0 ? "Blue Tunic" : "Red Tunic",
          icon: "🛡️",
          desc: st.armorLevel === 0 ? "Reduces damage taken by 25%!" : "Reduces damage taken by 50%!",
        },
      };
    }

    // Sword chests
    const sc = SWORD_CHESTS.find(c => c.key === key);
    if (sc) {
      const def = SWORD_DEFS[sc.swordId];
      return {
        chestsOpened: newOpened,
        unlockedSwords: st.unlockedSwords.includes(sc.swordId) ? st.unlockedSwords : [...st.unlockedSwords, sc.swordId],
        activeSword: sc.swordId,
        itemFanfare: { name: def.name, icon: def.icon, desc: def.desc },
      };
    }

    // Crystal shard chests (field/forest/desert)
    const rupeesGain = 25 + Math.floor(Math.random() * 20);
    const newShards = st.shardsCollected + 1;
    const shardNames: Record<string, string> = { field: "Shard of Dawn", forest: "Shard of Dusk", desert: "Shard of Ember" };
    return {
      chestsOpened: newOpened,
      shardsCollected: newShards,
      rupees: st.rupees + rupeesGain,
      itemFanfare: {
        name: shardNames[key] ?? "Crystal Shard",
        icon: "💎",
        desc: `Crystal Shard ${newShards}/3 collected! +${rupeesGain} Rupees`,
      },
    };
  }),

  unlockWeaponPickup: (weaponId, pickupKey) => set((st) => {
    if (st.chestsOpened.includes(pickupKey)) return {};
    const pickup = WEAPON_PICKUPS.find(p => p.key === pickupKey);
    const ammo = pickup?.starterAmmo ?? {};
    return {
      chestsOpened: [...st.chestsOpened, pickupKey],
      unlockedWeapons: st.unlockedWeapons.includes(weaponId) ? st.unlockedWeapons : [...st.unlockedWeapons, weaponId],
      selectedWeapon: weaponId,
      arrows:       ammo.arrows       ? Math.min(st.arrows       + ammo.arrows,       99) : st.arrows,
      bombs:        ammo.bombs        ? Math.min(st.bombs        + ammo.bombs,        20) : st.bombs,
      shurikens:    ammo.shurikens    ? Math.min(st.shurikens    + ammo.shurikens,    60) : st.shurikens,
      frostCharges: ammo.frostCharges ? Math.min(st.frostCharges + ammo.frostCharges, 20) : st.frostCharges,
      flareCharges: ammo.flareCharges ? Math.min(st.flareCharges + ammo.flareCharges, 10) : st.flareCharges,
      veilCrystals: ammo.veilCrystals ? Math.min(st.veilCrystals + ammo.veilCrystals, 10) : st.veilCrystals,
      quakeRunes:   ammo.quakeRunes   ? Math.min(st.quakeRunes   + ammo.quakeRunes,    8) : st.quakeRunes,
      moonbowAmmo:  ammo.moonbowAmmo  ? Math.min(st.moonbowAmmo  + ammo.moonbowAmmo,  60) : st.moonbowAmmo,
      itemFanfare: pickup ? { name: pickup.label, icon: pickup.icon, desc: pickup.desc } : null,
    };
  }),

  collectHeartPiece: (id) => set((st) => {
    if (st.heartPiecesCollected.includes(id)) return {};
    const newPieces = [...st.heartPiecesCollected, id];
    const newMax = 8 + Math.floor(newPieces.length / 4) * 2;
    const didExpand = newPieces.length % 4 === 0;
    return {
      heartPiecesCollected: newPieces,
      maxHearts: newMax,
      hearts: didExpand ? Math.min(st.hearts + 2, newMax) : st.hearts,
      itemFanfare: didExpand
        ? { name: "Heart Container +1!", icon: "❤️", desc: "Maximum hearts increased!" }
        : { name: "Heart Piece", icon: "💛", desc: `${newPieces.length % 4 || 4}/4 pieces collected!` },
    };
  }),

  setItemFanfare: (item) => set({ itemFanfare: item }),

  markLoreRead: (id) => set((st) => ({ loreRead: st.loreRead.includes(id) ? st.loreRead : [...st.loreRead, id], nearLore: null })),
  setNearLore: (id) => set({ nearLore: id }),

  setNearNPC: (id) => set({ nearNPC: id }),
  startDialogue: (npcId) => set((st) => {
    const npc = NPC_DATA.find(n => n.id === npcId);
    if (!npc) return {};
    const alreadyTalked = st.talkedToNPCs.includes(npcId);
    return {
      activeDialogue: { npcId, line: 0, maxLines: npc.dialogue.length },
      talkedToNPCs: alreadyTalked ? st.talkedToNPCs : [...st.talkedToNPCs, npcId],
    };
  }),
  advanceDialogue: () => set((st) => {
    if (!st.activeDialogue) return {};
    const { line, maxLines } = st.activeDialogue;
    if (line + 1 >= maxLines) return { activeDialogue: null };
    return { activeDialogue: { ...st.activeDialogue, line: line + 1 } };
  }),
  closeDialogue: () => set({ activeDialogue: null }),

  setNearShop: (v) => set({ nearShop: v }),
  openShop: () => set({ showShop: true }),
  closeShop: () => set({ showShop: false }),
  buyItem: (item, cost) => {
    const st = get();
    if (st.rupees < cost) return false;
    const updates: Partial<typeof INITIAL_STATE> = { rupees: st.rupees - cost };
    if (item === "arrows") updates.arrows = Math.min(st.arrows + 10, 99);
    else if (item === "bombs") updates.bombs = Math.min(st.bombs + 5, 20);
    else if (item === "heart") updates.hearts = Math.min(st.hearts + 2, st.maxHearts);
    else if (item === "shurikens") updates.shurikens = Math.min(st.shurikens + 15, 60);
    else if (item === "frost") updates.frostCharges = Math.min(st.frostCharges + 5, 20);
    else if (item === "flare") updates.flareCharges = Math.min(st.flareCharges + 3, 10);
    else if (item === "veil") updates.veilCrystals = Math.min(st.veilCrystals + 2, 10);
    else if (item === "quake") updates.quakeRunes = Math.min(st.quakeRunes + 2, 8);
    else if (item === "moonbow") updates.moonbowAmmo = Math.min(st.moonbowAmmo + 15, 60);
    set(updates as any);
    return true;
  },

  setNearFountain: (v) => set({ nearFountain: v }),
  useFountain: () => set((st) => ({ hearts: st.maxHearts })),

  damageBoss: (amount) => {
    const { bossHP } = get();
    const newHP = Math.max(0, bossHP - amount);
    if (newHP <= 0) set({ bossHP: 0, bossDefeated: true, gameState: "victory" });
    else set({ bossHP: newHP });
  },

  triggerAreaTransition: (t) => set({ pendingTransition: t }),
  completeAreaTransition: () => {
    const t = get().pendingTransition;
    if (!t) return;
    set((st) => ({
      currentArea: t.area,
      pendingTransition: null,
      areasVisited: st.areasVisited.includes(t.area) ? st.areasVisited : [...st.areasVisited, t.area],
    }));
  },
  visitArea: (area) => set((st) => ({
    areasVisited: st.areasVisited.includes(area) ? st.areasVisited : [...st.areasVisited, area],
  })),
  setArmorLevel: (level) => set({ armorLevel: level }),

  collectSpecialItem: (item, areaKey) => set((st) => {
    if (areaKey && st.chestsOpened.includes(areaKey)) return {};
    const names = { magicMirror: "Magic Mirror", speedBoots: "Speed Boots", hookshot: "Hookshot" };
    const icons = { magicMirror: "🪞", speedBoots: "👟", hookshot: "⛓️" };
    const descs = {
      magicMirror: "Reveals the Shadow Realm — a dark mirror of the world!",
      speedBoots: "Move 35% faster. Outrun anything!",
      hookshot: "Grapple enemies. Stuns on impact!",
    };
    return {
      hasMagicMirror: item === "magicMirror" ? true : st.hasMagicMirror,
      hasSpeedBoots: item === "speedBoots" ? true : st.hasSpeedBoots,
      hasHookshot: item === "hookshot" ? true : st.hasHookshot,
      chestsOpened: areaKey ? [...st.chestsOpened, areaKey] : st.chestsOpened,
      itemFanfare: { name: names[item], icon: icons[item], desc: descs[item] },
    };
  }),
  addSmallKeys: (n) => set((st) => ({ smallKeys: st.smallKeys + n })),
  useSmallKey: () => {
    const { smallKeys } = get();
    if (smallKeys <= 0) return false;
    set({ smallKeys: smallKeys - 1 });
    return true;
  },
  markChapterSeen: (area) => set((st) => ({
    storyChaptersSeen: st.storyChaptersSeen.includes(area) ? st.storyChaptersSeen : [...st.storyChaptersSeen, area],
  })),
  useMagicMirror: () => {
    const { currentArea, hasMagicMirror, triggerAreaTransition } = get();
    if (!hasMagicMirror) return;
    const mirrorMap: Partial<Record<AreaId, { area: AreaId; spawnX: number; spawnZ: number }>> = {
      field:  { area: "shadow", spawnX: 0, spawnZ: 0 },
      shadow: { area: "field",  spawnX: 0, spawnZ: 0 },
      forest: { area: "jungle", spawnX: 0, spawnZ: 0 },
      jungle: { area: "forest", spawnX: 0, spawnZ: 0 },
      desert: { area: "volcano",spawnX: 0, spawnZ: 0 },
      volcano:{ area: "desert", spawnX: 0, spawnZ: 0 },
      cave:   { area: "ice",    spawnX: 0, spawnZ: 0 },
      ice:    { area: "cave",   spawnX: 0, spawnZ: 0 },
      sky:    { area: "shadow", spawnX: 0, spawnZ: 0 },
    };
    const dest = mirrorMap[currentArea];
    if (dest) triggerAreaTransition(dest);
  },
}));
