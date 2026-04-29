import { create } from "zustand";

export type GameState = "title" | "playing" | "paused" | "gameover" | "victory";
export type AreaId = "field" | "forest" | "desert" | "boss";
export type SwordId = "crystal" | "flame" | "frost" | "thunder" | "shadow" | "holy";

export interface SwordDef {
  name: string;
  damage: number;
  desc: string;
  color: string;
  emissive: string;
}

export const SWORD_DEFS: Record<SwordId, SwordDef> = {
  crystal: { name: "Crystal Sword", damage: 1.0, desc: "Your trusty starting blade.", color: "#f48fb1", emissive: "#ff80c0" },
  flame:   { name: "Flame Sword",   damage: 1.5, desc: "Fiery blade. +50% damage.", color: "#ff7733", emissive: "#ff5500" },
  frost:   { name: "Frost Edge",    damage: 1.1, desc: "Ice-cold precision.", color: "#80d4ff", emissive: "#00aaff" },
  thunder: { name: "Thunder Blade", damage: 1.2, desc: "Crackles with lightning.", color: "#ffee22", emissive: "#ffcc00" },
  shadow:  { name: "Shadow Blade",  damage: 1.3, desc: "Strikes from the dark.", color: "#9933ff", emissive: "#6600cc" },
  holy:    { name: "Holy Blade",    damage: 2.0, desc: "Sacred light. Double damage!", color: "#fffff0", emissive: "#ffffc0" },
};

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
};

interface PendingTransition {
  area: AreaId;
  spawnX: number;
  spawnZ: number;
}

interface GameStore {
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
  activeSword: SwordId;
  unlockedSwords: SwordId[];
  chestsOpened: string[];
  loreRead: string[];
  nearLore: string | null;
  bossHP: number;
  bossMaxHP: number;
  bossDefeated: boolean;
  hurtCooldownEnd: number;
  areasVisited: AreaId[];

  setGameState: (s: GameState) => void;
  togglePause: () => void;
  resetGame: () => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  addRupees: (n: number) => void;
  addKill: (pts: number) => void;
  tickCombo: (delta: number) => void;
  unlockSword: (id: SwordId) => void;
  setActiveSword: (id: SwordId) => void;
  openChest: (key: string) => void;
  markLoreRead: (id: string) => void;
  setNearLore: (id: string | null) => void;
  damageBoss: (amount: number) => void;
  triggerAreaTransition: (t: PendingTransition) => void;
  completeAreaTransition: () => void;
  visitArea: (area: AreaId) => void;
}

const INITIAL = {
  gameState: "title",
  hearts: 6,
  maxHearts: 8,
  rupees: 0,
  score: 0,
  comboCount: 0,
  comboTimer: 0,
  maxCombo: 0,
  runStartTime: 0,
  totalKills: 0,
  currentArea: "field",
  pendingTransition: null,
  activeSword: "crystal",
  unlockedSwords: ["crystal"],
  chestsOpened: [],
  loreRead: [],
  nearLore: null,
  bossHP: 20,
  bossMaxHP: 20,
  bossDefeated: false,
  hurtCooldownEnd: 0,
  areasVisited: ["field"],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL,

  setGameState: (s) => set({ gameState: s }),
  togglePause: () => set((st) => ({
    gameState: st.gameState === "paused" ? "playing" : "paused",
  })),
  resetGame: () => set({
    ...INITIAL,
    gameState: "playing",
    runStartTime: Date.now(),
  }),

  damagePlayer: (amount) => {
    const { hurtCooldownEnd, hearts } = get();
    if (Date.now() < hurtCooldownEnd) return;
    const newHearts = Math.max(0, hearts - amount);
    set({
      hearts: newHearts,
      hurtCooldownEnd: Date.now() + 2000,
      gameState: newHearts <= 0 ? "gameover" : "playing",
    });
  },

  healPlayer: (amount) => set((st) => ({
    hearts: Math.min(st.maxHearts, st.hearts + amount),
  })),

  addRupees: (n) => set((st) => ({ rupees: st.rupees + n })),

  addKill: (pts) => set((st) => {
    const newCombo = st.comboCount + 1;
    const multiplier = Math.min(newCombo, 8);
    const earned = pts * multiplier;
    return {
      score: st.score + earned,
      comboCount: newCombo,
      comboTimer: 2.5,
      maxCombo: Math.max(st.maxCombo, newCombo),
      totalKills: st.totalKills + 1,
    };
  }),

  tickCombo: (delta) => {
    const { comboTimer } = get();
    if (comboTimer <= 0) return;
    const newTimer = comboTimer - delta;
    if (newTimer <= 0) set({ comboTimer: 0, comboCount: 0 });
    else set({ comboTimer: newTimer });
  },

  unlockSword: (id) => set((st) => ({
    unlockedSwords: st.unlockedSwords.includes(id) ? st.unlockedSwords : [...st.unlockedSwords, id],
    activeSword: id,
  })),

  setActiveSword: (id) => set({ activeSword: id }),

  openChest: (key) => set((st) => ({
    chestsOpened: st.chestsOpened.includes(key) ? st.chestsOpened : [...st.chestsOpened, key],
  })),

  markLoreRead: (id) => set((st) => ({
    loreRead: st.loreRead.includes(id) ? st.loreRead : [...st.loreRead, id],
    nearLore: null,
  })),

  setNearLore: (id) => set({ nearLore: id }),

  damageBoss: (amount) => {
    const { bossHP } = get();
    const newHP = Math.max(0, bossHP - amount);
    if (newHP <= 0) {
      set({ bossHP: 0, bossDefeated: true, gameState: "victory" });
    } else {
      set({ bossHP: newHP });
    }
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
}));
