import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore, SWORD_DEFS, LORE_STONES, AreaId } from "./store";
import { NPC_DATA } from "./npcData";
import { WEAPON_ICONS, WEAPON_LABELS, WeaponId, playerState } from "./controls";
import { saveBestRecord } from "./saveManager";
import colors from "../constants/colors";

const AREA_BOUND = 22.5;
const MAP_SIZE = 76;

// ── Hearts ────────────────────────────────────────────────────────
function Hearts() {
  const hearts = useGameStore(s => s.hearts);
  const maxHearts = useGameStore(s => s.maxHearts);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hearts, { top: insets.top + 10 }]}>
      {Array.from({ length: maxHearts }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < hearts ? "heart" : "heart-outline"}
          size={17}
          color={i < hearts ? colors.light.heart : "#553344"}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}

// ── Score / Sword panel ───────────────────────────────────────────
function ScorePanel() {
  const score = useGameStore(s => s.score);
  const runStartTime = useGameStore(s => s.runStartTime);
  const activeSword = useGameStore(s => s.activeSword);
  const rupees = useGameStore(s => s.rupees);
  const shardsCollected = useGameStore(s => s.shardsCollected);
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);
  const swordDef = SWORD_DEFS[activeSword];

  useEffect(() => {
    if (!runStartTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - runStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [runStartTime]);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <View style={[styles.scorePanel, { top: insets.top + 8 }]}>
      <Text style={styles.scoreText}>{score.toLocaleString()}</Text>
      <Text style={styles.timerText}>{mins}:{secs}</Text>
      <Text style={[styles.swordLabel, { color: swordDef.emissive }]}>{swordDef.icon} {swordDef.name}</Text>
      <View style={styles.miniRow}>
        <Text style={styles.miniStat}>💎 {shardsCollected}/3</Text>
        <Text style={styles.miniStat}>💰 {rupees}</Text>
      </View>
    </View>
  );
}

// ── Weapon display strip ──────────────────────────────────────────
function WeaponDisplay() {
  const selectedWeapon = useGameStore(s => s.selectedWeapon);
  const unlockedWeapons = useGameStore(s => s.unlockedWeapons);
  const arrows         = useGameStore(s => s.arrows);
  const bombs          = useGameStore(s => s.bombs);
  const shurikens      = useGameStore(s => s.shurikens);
  const frostCharges   = useGameStore(s => s.frostCharges);
  const flareCharges   = useGameStore(s => s.flareCharges);
  const veilCrystals   = useGameStore(s => s.veilCrystals);
  const quakeRunes     = useGameStore(s => s.quakeRunes);
  const moonbowAmmo    = useGameStore(s => s.moonbowAmmo);
  const fireRodCharges = useGameStore(s => s.fireRodCharges);
  const iceRodCharges  = useGameStore(s => s.iceRodCharges);
  const hammerCharges  = useGameStore(s => s.hammerCharges);
  const netCharges     = useGameStore(s => s.netCharges);
  const capeCharges    = useGameStore(s => s.capeCharges);
  const bombosCharges  = useGameStore(s => s.bombosCharges);
  const etherCharges   = useGameStore(s => s.etherCharges);
  const dipCharges     = useGameStore(s => s.dipCharges);
  const insets = useSafeAreaInsets();

  if (unlockedWeapons.length <= 1 && selectedWeapon === "sword") return null;

  const ammoMap: Record<WeaponId, number | null> = {
    sword: null, bow: arrows, wand: null, bomb: bombs, boomerang: null,
    frost: frostCharges, shuriken: shurikens, flare: flareCharges, moonbow: moonbowAmmo,
    veil: veilCrystals, quake: quakeRunes, aura: null, shadow: null, chain: null,
    firerod: fireRodCharges, icerod: iceRodCharges, hammer: hammerCharges, net: netCharges,
    cape: capeCharges, bombos: bombosCharges, ether: etherCharges, dipsgram: dipCharges,
  };

  const ammo = ammoMap[selectedWeapon];

  // color accent per weapon type
  const accentMap: Partial<Record<WeaponId, string>> = {
    firerod: "#ff6622", icerod: "#66ccff", hammer: "#ccaa44",
    net: "#88dd66", cape: "#cc88ff", bombos: "#ff4444",
    ether: "#88ffee", dipsgram: "#ffdd44",
    frost: "#99ccff", flare: "#ff8833", veil: "#bb99ff",
    quake: "#cc8822", moonbow: "#aaddff",
  };
  const accent = accentMap[selectedWeapon] ?? "#ffffff";

  return (
    <View style={[styles.weaponDisplay, { top: insets.top + 80 }]}>
      <Text style={styles.weaponIcon}>{WEAPON_ICONS[selectedWeapon]}</Text>
      <View>
        <Text style={styles.weaponName}>{WEAPON_LABELS[selectedWeapon]}</Text>
        {ammo !== null && (
          <View style={styles.weaponAmmoRow}>
            <View style={[styles.weaponAmmoBar, { width: Math.min(ammo * 5, 60), backgroundColor: accent }]} />
            <Text style={[styles.weaponAmmo, { color: accent }]}>×{ammo}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Combo popup ───────────────────────────────────────────────────
function ComboPopup() {
  const comboCount = useGameStore(s => s.comboCount);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const prevCombo = useRef(0);

  useEffect(() => {
    if (comboCount > prevCombo.current && comboCount >= 2) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 5 }),
        Animated.delay(600),
        Animated.timing(scaleAnim, { toValue: 0, useNativeDriver: true, duration: 200 }),
      ]).start();
    }
    prevCombo.current = comboCount;
  }, [comboCount]);

  if (comboCount < 2) return null;
  return (
    <Animated.View style={[styles.comboPopup, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.comboX}>x{comboCount}</Text>
      <Text style={styles.comboLabel}>COMBO!</Text>
    </Animated.View>
  );
}

// ── Item fanfare popup ────────────────────────────────────────────
function ItemFanfare() {
  const itemFanfare = useGameStore(s => s.itemFanfare);
  const setItemFanfare = useGameStore(s => s.setItemFanfare);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-30)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (itemFanfare) {
      if (timerRef.current) clearTimeout(timerRef.current);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 200, friction: 8 }),
      ]).start();
      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 30, duration: 400, useNativeDriver: true }),
        ]).start(() => setItemFanfare(null));
      }, 2800);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [itemFanfare?.name]);

  if (!itemFanfare) return null;

  return (
    <Animated.View style={[styles.fanfareContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.fanfareGot}>✨ GOT ITEM!</Text>
      <Text style={styles.fanfareIcon}>{itemFanfare.icon}</Text>
      <Text style={styles.fanfareName}>{itemFanfare.name}</Text>
      <Text style={styles.fanfareDesc}>{itemFanfare.desc}</Text>
    </Animated.View>
  );
}

// ── NPC dialogue ──────────────────────────────────────────────────
function NPCDialogue() {
  const activeDialogue = useGameStore(s => s.activeDialogue);
  const advanceDialogue = useGameStore(s => s.advanceDialogue);
  const closeDialogue = useGameStore(s => s.closeDialogue);
  const insets = useSafeAreaInsets();

  if (!activeDialogue) return null;
  const npc = NPC_DATA.find(n => n.id === activeDialogue.npcId);
  if (!npc) return null;
  const line = npc.dialogue[activeDialogue.line] ?? "";
  const isLast = activeDialogue.line >= activeDialogue.maxLines - 1;

  return (
    <TouchableOpacity
      style={[styles.dialogueContainer, { bottom: insets.bottom + 175 }]}
      onPress={isLast ? closeDialogue : advanceDialogue}
      activeOpacity={0.95}
    >
      <View style={styles.dialogueHeader}>
        <View style={[styles.dialogueNameBubble, { backgroundColor: npc.bodyColor }]}>
          <Text style={styles.dialogueName}>{npc.name}</Text>
        </View>
        <Text style={styles.dialogueTitle}>{npc.title}</Text>
        <Text style={styles.dialoguePagination}>{activeDialogue.line + 1}/{activeDialogue.maxLines}</Text>
      </View>
      <Text style={styles.dialogueLine}>{line}</Text>
      <View style={styles.dialogueFooter}>
        <Text style={styles.dialogueTapHint}>{isLast ? "Tap to close" : "Tap to continue »"}</Text>
        <TouchableOpacity style={styles.dialogueCloseBtn} onPress={closeDialogue}>
          <Ionicons name="close" size={14} color="#a090c0" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── NPC "talk" prompt ─────────────────────────────────────────────
function NPCPrompt() {
  const nearNPC = useGameStore(s => s.nearNPC);
  const activeDialogue = useGameStore(s => s.activeDialogue);
  const insets = useSafeAreaInsets();
  if (!nearNPC || activeDialogue) return null;
  const npc = NPC_DATA.find(n => n.id === nearNPC);
  if (!npc) return null;
  return (
    <View style={[styles.npcPrompt, { bottom: insets.bottom + 175 }]}>
      <Text style={styles.npcPromptText}>💬 {npc.name} — tap Y to talk</Text>
    </View>
  );
}

// ── Fountain prompt ────────────────────────────────────────────────
function FountainPrompt() {
  const nearFountain = useGameStore(s => s.nearFountain);
  const activeDialogue = useGameStore(s => s.activeDialogue);
  const insets = useSafeAreaInsets();
  if (!nearFountain || activeDialogue) return null;
  return (
    <View style={[styles.npcPrompt, { bottom: insets.bottom + 175 }]}>
      <Text style={styles.npcPromptText}>✨ Fairy Fountain — tap Y to heal</Text>
    </View>
  );
}

// ── Shop UI ───────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { id: "arrows",   label: "Arrows +10",      icon: "🏹", cost: 20  },
  { id: "moonbow",  label: "Moonbow Ammo +15", icon: "🌙", cost: 25  },
  { id: "bombs",    label: "Bombs +5",         icon: "🧪", cost: 35  },
  { id: "shurikens",label: "Stars +15",        icon: "⭐", cost: 15  },
  { id: "frost",    label: "Frost +5",         icon: "❄️", cost: 30  },
  { id: "flare",    label: "Flare +3",         icon: "☀️", cost: 40  },
  { id: "veil",     label: "Veil Crystal",     icon: "💠", cost: 60  },
  { id: "quake",    label: "Quake Rune",       icon: "🪨", cost: 55  },
  { id: "heart",    label: "Restore Hearts",   icon: "❤️", cost: 80  },
];

function ShopUI() {
  const showShop = useGameStore(s => s.showShop);
  const closeShop = useGameStore(s => s.closeShop);
  const rupees = useGameStore(s => s.rupees);
  const buyItem = useGameStore(s => s.buyItem);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBuy = useCallback((item: typeof SHOP_ITEMS[0]) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    const ok = buyItem(item.id, item.cost);
    setFeedbackMsg(ok ? `Bought ${item.label}!` : "Not enough rupees!");
    feedbackTimer.current = setTimeout(() => setFeedbackMsg(null), 1500);
  }, [buyItem]);

  if (!showShop) return null;
  return (
    <View style={styles.shopOverlay}>
      <View style={styles.shopCard}>
        <View style={styles.shopHeader}>
          <Text style={styles.shopTitle}>🏪 Zarko's Wares</Text>
          <View style={styles.shopRupees}>
            <Text style={styles.shopRupeesText}>💰 {rupees} Rupees</Text>
          </View>
        </View>
        {feedbackMsg && (
          <View style={styles.shopFeedback}>
            <Text style={styles.shopFeedbackText}>{feedbackMsg}</Text>
          </View>
        )}
        <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
          {SHOP_ITEMS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.shopRow, rupees < item.cost && styles.shopRowDim]}
              onPress={() => handleBuy(item)}
            >
              <Text style={styles.shopItemIcon}>{item.icon}</Text>
              <Text style={styles.shopItemLabel}>{item.label}</Text>
              <View style={[styles.shopCostBadge, rupees < item.cost && { backgroundColor: "#442222" }]}>
                <Text style={styles.shopCostText}>💰 {item.cost}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.shopCloseBtn} onPress={closeShop}>
          <Text style={styles.shopCloseBtnText}>Close Shop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Near-shop prompt ──────────────────────────────────────────────
function ShopPrompt() {
  const nearShop = useGameStore(s => s.nearShop);
  const showShop = useGameStore(s => s.showShop);
  const activeDialogue = useGameStore(s => s.activeDialogue);
  const insets = useSafeAreaInsets();
  if (!nearShop || showShop || activeDialogue) return null;
  return (
    <View style={[styles.npcPrompt, { bottom: insets.bottom + 175 }]}>
      <Text style={styles.npcPromptText}>🏪 Zarko's Shop — tap Y to browse</Text>
    </View>
  );
}

// ── Boss health bar ────────────────────────────────────────────────
function BossHealthBar() {
  const bossHP = useGameStore(s => s.bossHP);
  const bossMaxHP = useGameStore(s => s.bossMaxHP);
  const currentArea = useGameStore(s => s.currentArea);
  const bossDefeated = useGameStore(s => s.bossDefeated);
  const insets = useSafeAreaInsets();
  if (currentArea !== "boss" || bossDefeated) return null;
  const pct = bossHP / bossMaxHP;
  return (
    <View style={[styles.bossBarContainer, { bottom: insets.bottom + 180 }]}>
      <Text style={styles.bossName}>☠ MALGRATHAK ☠</Text>
      <View style={styles.bossBarBg}>
        <View style={[styles.bossBarFill, { width: `${pct * 100}%`, backgroundColor: pct < 0.3 ? "#ff2244" : "#cc0066" }]} />
      </View>
    </View>
  );
}

// ── Lore popup ────────────────────────────────────────────────────
function LorePopup() {
  const nearLore = useGameStore(s => s.nearLore);
  const loreRead = useGameStore(s => s.loreRead);
  const currentArea = useGameStore(s => s.currentArea);
  const markLoreRead = useGameStore(s => s.markLoreRead);
  const setNearLore = useGameStore(s => s.setNearLore);
  const activeDialogue = useGameStore(s => s.activeDialogue);
  const insets = useSafeAreaInsets();
  if (!nearLore || activeDialogue) return null;
  const stones = LORE_STONES[currentArea] ?? [];
  const stone = stones.find(s => s.id === nearLore);
  if (!stone) return null;
  const isRead = loreRead.includes(nearLore);
  return (
    <View style={[styles.loreContainer, { bottom: insets.bottom + 190 }]}>
      {!isRead ? (
        <>
          <Text style={styles.loreTitle}>📜 Lore Stone</Text>
          <Text style={styles.loreText}>{stone.text}</Text>
          <TouchableOpacity style={styles.loreBtn} onPress={() => markLoreRead(stone.id)}>
            <Text style={styles.loreBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.loreHint}>Already read · Tap to dismiss</Text>
          <TouchableOpacity onPress={() => setNearLore(null)}>
            <Text style={[styles.loreBtnText, { marginTop: 8 }]}>Dismiss</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ── Pause menu ────────────────────────────────────────────────────
function PauseMenu() {
  const gameState = useGameStore(s => s.gameState);
  const togglePause = useGameStore(s => s.togglePause);
  const resetGame = useGameStore(s => s.resetGame);
  if (gameState !== "paused") return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.menuCard}>
        <Text style={styles.menuTitle}>PAUSED</Text>
        <TouchableOpacity style={styles.menuBtn} onPress={togglePause}>
          <Ionicons name="play" size={22} color="#fff" />
          <Text style={styles.menuBtnText}>Resume</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuBtn, styles.menuBtnDanger]} onPress={resetGame}>
          <Ionicons name="refresh" size={22} color="#fff" />
          <Text style={styles.menuBtnText}>Restart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Game Over screen ──────────────────────────────────────────────
function GameOverScreen() {
  const gameState = useGameStore(s => s.gameState);
  const score = useGameStore(s => s.score);
  const maxCombo = useGameStore(s => s.maxCombo);
  const totalKills = useGameStore(s => s.totalKills);
  const shardsCollected = useGameStore(s => s.shardsCollected);
  const resetGame = useGameStore(s => s.resetGame);
  useEffect(() => {
    if (gameState === "gameover") saveBestRecord({ score, maxCombo, kills: totalKills });
  }, [gameState]);
  if (gameState !== "gameover") return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.menuCard}>
        <Text style={[styles.menuTitle, { color: "#ff4444", fontSize: 32 }]}>DEFEATED</Text>
        <Text style={styles.statText}>Score: {score.toLocaleString()}</Text>
        <Text style={styles.statText}>Best Combo: x{maxCombo}</Text>
        <Text style={styles.statText}>Enemies Slain: {totalKills}</Text>
        <Text style={styles.statText}>Crystal Shards: {shardsCollected}/3</Text>
        <TouchableOpacity style={[styles.menuBtn, { marginTop: 20 }]} onPress={resetGame}>
          <Ionicons name="refresh" size={22} color="#fff" />
          <Text style={styles.menuBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Victory screen ─────────────────────────────────────────────────
function VictoryScreen() {
  const gameState = useGameStore(s => s.gameState);
  const score = useGameStore(s => s.score);
  const maxCombo = useGameStore(s => s.maxCombo);
  const totalKills = useGameStore(s => s.totalKills);
  const runStartTime = useGameStore(s => s.runStartTime);
  const resetGame = useGameStore(s => s.resetGame);
  const elapsed = runStartTime ? Math.floor((Date.now() - runStartTime) / 1000) : 0;
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");
  useEffect(() => {
    if (gameState === "victory") saveBestRecord({ score, maxCombo, kills: totalKills });
  }, [gameState]);
  if (gameState !== "victory") return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.menuCard}>
        <Text style={[styles.menuTitle, { color: "#f59e0b", fontSize: 28 }]}>👑 VICTORY!</Text>
        <Text style={styles.victorySubtitle}>The Crown of Radiance is Restored!</Text>
        <Text style={styles.statText}>Score: {score.toLocaleString()}</Text>
        <Text style={styles.statText}>Time: {mins}:{secs}</Text>
        <Text style={styles.statText}>Best Combo: x{maxCombo}</Text>
        <Text style={styles.statText}>Enemies Slain: {totalKills}</Text>
        <TouchableOpacity style={[styles.menuBtn, { marginTop: 20, backgroundColor: "#8b5cf6" }]} onPress={resetGame}>
          <Ionicons name="play" size={22} color="#fff" />
          <Text style={styles.menuBtnText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Stamina Bar ───────────────────────────────────────────────────
function StaminaBar() {
  const [stamina, setStamina] = useState(100);
  const insets = useSafeAreaInsets();
  const gameState = useGameStore(s => s.gameState);
  useEffect(() => {
    const id = setInterval(() => setStamina(playerState.staminaCurrent), 80);
    return () => clearInterval(id);
  }, []);
  if (gameState === "gameover" || gameState === "victory" || gameState === "paused") return null;
  const pct = Math.max(0, Math.min(1, stamina / 100));
  const barColor = pct > 0.5 ? "#44dd66" : pct > 0.25 ? "#ffcc00" : "#ff4422";
  return (
    <View style={[styles.staminaWrap, { top: insets.top + 38 }]}>
      <View style={styles.staminaBg}>
        <View style={[styles.staminaFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

// ── Shield Indicator ──────────────────────────────────────────────
function ShieldIndicator() {
  const isBlocking = useGameStore(s => s.isBlocking);
  const parryWindow = useGameStore(s => s.parryWindowUntil);
  const now = Date.now();
  const isParry = isBlocking && parryWindow > now;
  return isBlocking ? (
    <View style={[styles.shieldIndicator, isParry && styles.shieldIndicatorParry]}>
      <Text style={styles.shieldIndicatorIcon}>🛡️</Text>
      {isParry && <Text style={styles.shieldIndicatorText}>PARRY!</Text>}
    </View>
  ) : null;
}

// ── Mini-map ──────────────────────────────────────────────────────
const AREA_LANDMARKS: Record<string, Array<{ x: number; z: number; color: string; shape: "circle" | "diamond" | "square" }>> = {
  field:  [
    { x: 22, z: 0, color: "#22ff88", shape: "diamond" },
    { x: -22, z: 0, color: "#ffaa44", shape: "diamond" },
    { x: -18, z: -18, color: "#44aaff", shape: "circle" },
  ],
  forest: [
    { x: -20, z: 0, color: "#66ff88", shape: "diamond" },
    { x: 0, z: -22, color: "#ff4444", shape: "diamond" },
    { x: 18, z: 18, color: "#44aaff", shape: "circle" },
  ],
  desert: [
    { x: 20, z: 0, color: "#66ff88", shape: "diamond" },
    { x: 0, z: -22, color: "#ff4444", shape: "diamond" },
    { x: 18, z: -18, color: "#44aaff", shape: "circle" },
  ],
  boss: [{ x: -18, z: 18, color: "#44aaff", shape: "circle" }],
};

function MiniMap() {
  const [px, setPx] = useState(0);
  const [pz, setPz] = useState(0);
  const currentArea = useGameStore(s => s.currentArea);
  const gameState = useGameStore(s => s.gameState);
  useEffect(() => {
    const id = setInterval(() => {
      setPx(playerState.x);
      setPz(playerState.z);
    }, 100);
    return () => clearInterval(id);
  }, []);
  if (gameState === "gameover" || gameState === "victory") return null;
  const scale = MAP_SIZE / (AREA_BOUND * 2);
  const toMapX = (wx: number) => MAP_SIZE / 2 + wx * scale;
  const toMapY = (wz: number) => MAP_SIZE / 2 + wz * scale;
  const landmarks = AREA_LANDMARKS[currentArea] ?? [];
  return (
    <View style={styles.miniMapWrap}>
      <View style={styles.miniMapBg}>
        {/* Cardinal grid lines */}
        <View style={styles.miniMapGridH} />
        <View style={styles.miniMapGridV} />
        {/* Landmarks */}
        {landmarks.map((lm, i) => {
          const mx = toMapX(lm.x);
          const my = toMapY(lm.z);
          if (lm.shape === "diamond") {
            return (
              <View key={i} style={[styles.miniMapDiamond, {
                left: mx - 4, top: my - 4,
                borderColor: lm.color,
              }]} />
            );
          }
          if (lm.shape === "circle") {
            return (
              <View key={i} style={[styles.miniMapCircle, {
                left: mx - 3, top: my - 3,
                backgroundColor: lm.color,
              }]} />
            );
          }
          return (
            <View key={i} style={[styles.miniMapSquare, {
              left: mx - 3, top: my - 3,
              backgroundColor: lm.color,
            }]} />
          );
        })}
        {/* Player dot */}
        <View style={[styles.miniMapPlayer, {
          left: toMapX(px) - 4,
          top: toMapY(pz) - 4,
        }]} />
      </View>
    </View>
  );
}

// ── Area chapter info ─────────────────────────────────────────────
const AREA_INFO: Record<AreaId, { name: string; subtitle: string; color: string }> = {
  field:    { name: "Verdant Fields",       subtitle: "Chapter I — The Journey Begins",   color: "#44cc66" },
  forest:   { name: "Thornwood Forest",     subtitle: "Chapter II — Into the Dark",       color: "#228833" },
  desert:   { name: "Ashrock Sands",        subtitle: "Chapter III — Heat of Betrayal",   color: "#ffaa44" },
  boss:     { name: "Malgrath's Sanctum",   subtitle: "Final Chapter — The Shattered Crown", color: "#ff4488" },
  cave:     { name: "Deepstone Caverns",    subtitle: "Chapter IV — Bones of the Earth",  color: "#886633" },
  jungle:   { name: "Verdant Depths",       subtitle: "Chapter V — The Ancient Green",    color: "#22aa44" },
  ice:      { name: "Frostpeak Tundra",     subtitle: "Chapter VI — Frozen in Time",      color: "#88ccff" },
  volcano:  { name: "Ashrock Caldera",      subtitle: "Chapter VII — Heart of Fire",      color: "#ff6622" },
  sky:      { name: "Celestial Skylands",   subtitle: "Chapter VIII — Above the Clouds",  color: "#4488ff" },
  shadow:   { name: "Shadow Realm",         subtitle: "Chapter IX — Mirror of Darkness",  color: "#aa44ff" },
  dungeon1:  { name: "Shadowmere Crypt",    subtitle: "Dungeon I — The Walking Dead",      color: "#9966ff" },
  dungeon2:  { name: "Ashrock Forge",       subtitle: "Dungeon II — Forged in Flame",      color: "#ff4400" },
  dungeon3:  { name: "Crystal Spire",       subtitle: "Dungeon III — The Frozen Summit",   color: "#aaddff" },
  dungeon4:  { name: "Swamp Temple",        subtitle: "Dungeon IV — Beneath the Murk",     color: "#33bb66" },
  dungeon5:  { name: "Skull Woods",         subtitle: "Dungeon V — Kingdom of the Dead",   color: "#ccbb88" },
  dungeon6:  { name: "Thieves' Lair",       subtitle: "Dungeon VI — The Phantom Guild",    color: "#9933cc" },
  dungeon7:  { name: "Ice Palace",          subtitle: "Dungeon VII — Glacira's Prison",    color: "#88ddff" },
  dungeon8:  { name: "Misery Mire",         subtitle: "Dungeon VIII — The Shapeless Dark", color: "#88aa33" },
  dungeon9:  { name: "Turtle Rock",         subtitle: "Dungeon IX — The Dragon's Bones",   color: "#ff5511" },
  dungeon10: { name: "Palace of Darkness",  subtitle: "Dungeon X — Crystallised Despair",  color: "#6600cc" },
  dungeon11: { name: "Malgrath's Fortress", subtitle: "Dungeon XI — End of All Shadows",   color: "#cc00ff" },
};

function AreaChapterCard() {
  const currentArea = useGameStore(s => s.currentArea);
  const storyChaptersSeen = useGameStore(s => s.storyChaptersSeen);
  const markChapterSeen = useGameStore(s => s.markChapterSeen);
  const gameState = useGameStore(s => s.gameState);
  const opacity = useRef(new Animated.Value(0)).current;
  const lastArea = useRef<AreaId | null>(null);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (storyChaptersSeen.includes(currentArea)) return;
    if (lastArea.current === currentArea) return;
    lastArea.current = currentArea;
    markChapterSeen(currentArea);
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [currentArea, gameState]);

  const info = AREA_INFO[currentArea];

  return (
    <Animated.View style={[styles.chapterCard, { opacity, borderColor: info.color + "88" }]} pointerEvents="none">
      <Text style={[styles.chapterSubtitle, { color: info.color }]}>{info.subtitle}</Text>
      <Text style={styles.chapterName}>{info.name}</Text>
    </Animated.View>
  );
}

// ── Archery Range Mini-Game ───────────────────────────────────────
function ArcheryRange() {
  const showArchery     = useGameStore(s => s.showArchery);
  const nearArchery     = useGameStore(s => s.nearArchery);
  const openArchery     = useGameStore(s => s.openArchery);
  const closeArchery    = useGameStore(s => s.closeArchery);
  const recordArcheryScore = useGameStore(s => s.recordArcheryScore);
  const archeryBestScore   = useGameStore(s => s.archeryBestScore);
  const gameState          = useGameStore(s => s.gameState);

  const [phase, setPhase] = React.useState<"idle"|"playing"|"done">("idle");
  const [score, setScore] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(20);
  const [targets, setTargets] = React.useState<{id:number;hit:boolean;x:number;y:number}[]>([]);
  const timerRef = React.useRef<ReturnType<typeof setInterval>|null>(null);
  const targetIdRef = React.useRef(0);

  const spawnTarget = React.useCallback(() => {
    const id = ++targetIdRef.current;
    const x = 15 + Math.random() * 230;
    const y = 30 + Math.random() * 160;
    setTargets(prev => [...prev.filter(t => !t.hit).slice(-4), { id, hit: false, x, y }]);
    setTimeout(() => setTargets(prev => prev.filter(t => t.id !== id)), 1800);
  }, []);

  const startGame = React.useCallback(() => {
    setScore(0); setTimeLeft(20); setTargets([]); targetIdRef.current = 0;
    setPhase("playing");
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase("done");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    const spawnLoop = () => {
      spawnTarget();
      if (targetIdRef.current < 25) setTimeout(spawnLoop, 700 + Math.random() * 400);
    };
    spawnLoop();
  }, [spawnTarget]);

  const hitTarget = (id: number) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, hit: true } : t));
    setScore(s => s + 1);
  };

  const finish = () => {
    recordArcheryScore(score);
    setPhase("idle");
  };

  if (!showArchery && !nearArchery) return null;
  if (gameState !== "playing") return null;

  if (!showArchery) {
    return (
      <View style={styles.miniGamePrompt}>
        <Text style={styles.miniGamePromptText}>🏹 Archery Range</Text>
        <TouchableOpacity style={styles.miniGameBtn} onPress={openArchery}>
          <Text style={styles.miniGameBtnText}>Play</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.miniGameOverlay}>
      <View style={styles.miniGamePanel}>
        <Text style={styles.miniGameTitle}>🏹 Archery Range</Text>
        {phase === "idle" && (
          <>
            <Text style={styles.miniGameDesc}>Tap targets as they appear! Best: {archeryBestScore}</Text>
            <TouchableOpacity style={styles.miniGamePlayBtn} onPress={startGame}>
              <Text style={styles.miniGamePlayText}>START</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeArchery}><Text style={styles.miniGameClose}>✕ Leave</Text></TouchableOpacity>
          </>
        )}
        {phase === "playing" && (
          <View style={styles.archeryField}>
            <Text style={styles.miniGameScore}>Score: {score}  ⏱ {timeLeft}s</Text>
            {targets.filter(t => !t.hit).map(t => (
              <TouchableOpacity key={t.id} style={[styles.archeryTarget, { left: t.x, top: t.y }]} onPress={() => hitTarget(t.id)}>
                <Text style={{ fontSize: 28 }}>🎯</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {phase === "done" && (
          <>
            <Text style={styles.miniGameDesc}>You hit {score} targets!</Text>
            <Text style={styles.miniGameDesc}>{score >= 15 ? "🏆 Perfect!" : score >= 8 ? "⭐ Great!" : "Keep practising!"}</Text>
            <TouchableOpacity style={styles.miniGamePlayBtn} onPress={finish}>
              <Text style={styles.miniGamePlayText}>Claim Prize</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// ── Fishing Pond Mini-Game ────────────────────────────────────────
function FishingPond() {
  const showFishing      = useGameStore(s => s.showFishing);
  const nearFishing      = useGameStore(s => s.nearFishing);
  const openFishing      = useGameStore(s => s.openFishing);
  const closeFishing     = useGameStore(s => s.closeFishing);
  const recordFishingScore = useGameStore(s => s.recordFishingScore);
  const fishingBestScore   = useGameStore(s => s.fishingBestScore);
  const gameState          = useGameStore(s => s.gameState);

  const [phase, setPhase] = React.useState<"idle"|"waiting"|"bite"|"miss"|"done">("idle");
  const [casts, setCasts] = React.useState(0);
  const [caught, setCaught] = React.useState(0);
  const biteTimeout = React.useRef<ReturnType<typeof setTimeout>|null>(null);
  const biteWindow  = React.useRef<ReturnType<typeof setTimeout>|null>(null);

  const MAX_CASTS = 5;

  const nextCast = React.useCallback((currentCasts: number, currentCaught: number) => {
    if (currentCasts >= MAX_CASTS) { setPhase("done"); return; }
    setPhase("waiting");
    const delay = 1500 + Math.random() * 2000;
    biteTimeout.current = setTimeout(() => {
      setPhase("bite");
      biteWindow.current = setTimeout(() => {
        setPhase("miss");
        setTimeout(() => nextCast(currentCasts + 1, currentCaught), 800);
        setCasts(c => c + 1);
      }, 900);
    }, delay);
  }, []);

  const cast = () => { setCasts(0); setCaught(0); nextCast(0, 0); };

  const reel = () => {
    if (phase !== "bite") return;
    clearTimeout(biteTimeout.current!);
    clearTimeout(biteWindow.current!);
    const c = caught + 1;
    setCaught(c);
    const nc = casts + 1;
    setCasts(nc);
    setPhase("idle");
    setTimeout(() => nextCast(nc, c), 600);
  };

  const finish = () => { recordFishingScore(caught); setPhase("idle"); };

  if (!showFishing && !nearFishing) return null;
  if (gameState !== "playing") return null;

  if (!showFishing) {
    return (
      <View style={[styles.miniGamePrompt, { bottom: 200 }]}>
        <Text style={styles.miniGamePromptText}>🎣 Fishing Pond</Text>
        <TouchableOpacity style={styles.miniGameBtn} onPress={openFishing}>
          <Text style={styles.miniGameBtnText}>Fish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fishIcon = phase === "bite" ? "🐟" : phase === "miss" ? "💨" : "🌊";
  const fishMsg  = phase === "bite" ? "BITE! TAP NOW!" : phase === "miss" ? "Too slow!" : phase === "waiting" ? "Waiting..." : "";

  return (
    <View style={styles.miniGameOverlay}>
      <View style={styles.miniGamePanel}>
        <Text style={styles.miniGameTitle}>🎣 Fishing Pond</Text>
        {phase === "idle" && casts === 0 && (
          <>
            <Text style={styles.miniGameDesc}>Tap when you see 🐟! Best: {fishingBestScore} fish</Text>
            <TouchableOpacity style={styles.miniGamePlayBtn} onPress={cast}>
              <Text style={styles.miniGamePlayText}>CAST LINE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeFishing}><Text style={styles.miniGameClose}>✕ Leave</Text></TouchableOpacity>
          </>
        )}
        {(phase === "waiting" || phase === "bite" || phase === "miss") && (
          <TouchableOpacity style={styles.fishingTapArea} onPress={reel} activeOpacity={0.7}>
            <Text style={[styles.fishingBobber, phase === "bite" && { color: "#ffdd00" }]}>{fishIcon}</Text>
            <Text style={[styles.fishingMsg, phase === "bite" && { color: "#ffdd00" }]}>{fishMsg}</Text>
            <Text style={styles.miniGameScore}>Cast {casts + 1}/{MAX_CASTS} — Caught: {caught}</Text>
          </TouchableOpacity>
        )}
        {phase === "done" && (
          <>
            <Text style={styles.miniGameDesc}>Caught {caught} fish! {caught >= 4 ? "🏆" : caught >= 2 ? "⭐" : "🎣"}</Text>
            <TouchableOpacity style={styles.miniGamePlayBtn} onPress={finish}>
              <Text style={styles.miniGamePlayText}>Claim Prize</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// ── Special items strip ───────────────────────────────────────────
function SpecialItemsStrip() {
  const hasMagicMirror = useGameStore(s => s.hasMagicMirror);
  const hasSpeedBoots  = useGameStore(s => s.hasSpeedBoots);
  const hasHookshot    = useGameStore(s => s.hasHookshot);
  const smallKeys      = useGameStore(s => s.smallKeys);
  const insets = useSafeAreaInsets();

  const items = [
    hasMagicMirror && { icon: "🪞", label: "Mirror" },
    hasSpeedBoots  && { icon: "👟", label: "Boots" },
    hasHookshot    && { icon: "⛓️", label: "Hook" },
    smallKeys > 0  && { icon: "🗝️", label: `×${smallKeys}` },
  ].filter(Boolean) as { icon: string; label: string }[];

  if (items.length === 0) return null;

  return (
    <View style={[styles.itemsStrip, { top: insets.top + 130 }]}>
      {items.map((item, i) => (
        <View key={i} style={styles.itemBadge}>
          <Text style={styles.itemBadgeIcon}>{item.icon}</Text>
          <Text style={styles.itemBadgeLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Root HUD ──────────────────────────────────────────────────────
export default function HUD() {
  const gameState = useGameStore(s => s.gameState);
  if (gameState === "title") return null;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Hearts />
      <StaminaBar />
      <ScorePanel />
      <WeaponDisplay />
      <ShieldIndicator />
      <MiniMap />
      <ComboPopup />
      <AreaChapterCard />
      <SpecialItemsStrip />
      <ItemFanfare />
      <NPCDialogue />
      <NPCPrompt />
      <FountainPrompt />
      <ShopPrompt />
      <ShopUI />
      <LorePopup />
      <BossHealthBar />
      <ArcheryRange />
      <FishingPond />
      <PauseMenu />
      <GameOverScreen />
      <VictoryScreen />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  hearts: {
    position: "absolute",
    left: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    maxWidth: 200,
  },
  scorePanel: {
    position: "absolute",
    right: 14,
    alignItems: "flex-end",
  },
  scoreText: {
    color: "#f59e0b",
    fontSize: 17,
    fontWeight: "bold",
    fontFamily: "Inter_700Bold",
  },
  timerText: {
    color: "#a0a0cc",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  swordLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    opacity: 0.85,
    marginTop: 1,
  },
  miniRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  miniStat: { color: "#c4b8e0", fontSize: 11, fontFamily: "Inter_400Regular" },
  weaponDisplay: {
    position: "absolute",
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  weaponIcon: { fontSize: 22 },
  weaponName: { color: "#e8e0f8", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  weaponAmmo: { color: "#a0a0cc", fontSize: 11, fontFamily: "Inter_400Regular" },
  weaponAmmoRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  weaponAmmoBar: { height: 3, borderRadius: 2, opacity: 0.7 },
  comboPopup: {
    position: "absolute",
    top: "30%",
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  comboX: {
    color: "#f59e0b",
    fontSize: 36,
    fontWeight: "bold",
    fontFamily: "Inter_700Bold",
  },
  comboLabel: {
    color: "#ffd700",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
  },
  // Item fanfare
  fanfareContainer: {
    position: "absolute",
    top: "18%",
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "rgba(10,5,25,0.92)",
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#ffd700",
    shadowColor: "#ffd700",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
    minWidth: 200,
  },
  fanfareGot: { color: "#ffd700", fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 3, marginBottom: 4 },
  fanfareIcon: { fontSize: 40, marginBottom: 6 },
  fanfareName: { color: "#ffffff", fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4, textAlign: "center" },
  fanfareDesc: { color: "#c4b8e0", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  // NPC dialogue
  dialogueContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(10,5,22,0.96)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#6644cc",
    padding: 14,
    shadowColor: "#6644cc",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogueHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  dialogueNameBubble: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dialogueName: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  dialogueTitle: { color: "#c4b8e0", fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  dialoguePagination: { color: "#7a6a9a", fontSize: 11, fontFamily: "Inter_400Regular" },
  dialogueLine: { color: "#e8e0f4", fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 10 },
  dialogueFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dialogueTapHint: { color: "#8878b8", fontSize: 12, fontFamily: "Inter_400Regular" },
  dialogueCloseBtn: { padding: 4 },
  // NPC / Fountain / Shop prompt
  npcPrompt: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(10,5,22,0.85)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  npcPromptText: { color: "#ffd700", fontSize: 13, fontFamily: "Inter_500Medium" },
  // Shop
  shopOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
  },
  shopCard: {
    backgroundColor: "#1a1228",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ffcc44",
    padding: 20,
    width: "88%",
    maxWidth: 360,
    shadowColor: "#ffcc44",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  shopHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  shopTitle: { color: "#ffd700", fontSize: 18, fontFamily: "Inter_700Bold" },
  shopRupees: { backgroundColor: "#2a1e08", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  shopRupeesText: { color: "#ffd700", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  shopFeedback: {
    backgroundColor: "rgba(255,200,0,0.15)", borderRadius: 8, padding: 8, marginBottom: 10,
    borderWidth: 1, borderColor: "rgba(255,200,0,0.3)",
  },
  shopFeedbackText: { color: "#ffd700", fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    gap: 10,
  },
  shopRowDim: { opacity: 0.45 },
  shopItemIcon: { fontSize: 22, width: 30, textAlign: "center" },
  shopItemLabel: { color: "#e8e0d4", fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  shopCostBadge: { backgroundColor: "#2a2010", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  shopCostText: { color: "#ffd700", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  shopCloseBtn: {
    marginTop: 14, backgroundColor: "#3a1a6a", borderRadius: 12,
    paddingVertical: 12, alignItems: "center",
  },
  shopCloseBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  // Boss bar
  bossBarContainer: {
    position: "absolute",
    left: 40, right: 40,
    alignItems: "center",
  },
  bossName: { color: "#ff4488", fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 3, marginBottom: 4 },
  bossBarBg: {
    width: "100%", height: 10, borderRadius: 5,
    backgroundColor: "#330011", borderWidth: 1, borderColor: "#660033", overflow: "hidden",
  },
  bossBarFill: { height: "100%", borderRadius: 5 },
  // Lore
  loreContainer: {
    position: "absolute",
    left: 24, right: 24,
    backgroundColor: "rgba(15,10,30,0.92)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8b5cf6",
    padding: 16,
  },
  loreTitle: { color: "#b89aff", fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 8 },
  loreText: { color: "#e8e0d4", fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, fontStyle: "italic", marginBottom: 12 },
  loreHint: { color: "#7a7090", fontSize: 13, textAlign: "center", fontFamily: "Inter_400Regular" },
  loreBtn: { alignSelf: "flex-end", paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "#8b5cf6", borderRadius: 8 },
  loreBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuCard: {
    backgroundColor: "#1a1228",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3d2a5a",
    padding: 32,
    width: "80%",
    maxWidth: 320,
    alignItems: "center",
  },
  menuTitle: { color: "#e8e0d4", fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: 4, marginBottom: 24 },
  victorySubtitle: { color: "#b89aff", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -16, marginBottom: 20, textAlign: "center" },
  menuBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#4c2a8a",
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, marginVertical: 6,
    width: "100%", justifyContent: "center",
  },
  menuBtnDanger: { backgroundColor: "#7a1a1a" },
  menuBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  statText: { color: "#c4b8e0", fontSize: 14, fontFamily: "Inter_400Regular", marginVertical: 3 },

  // ── Stamina bar
  staminaWrap: {
    position: "absolute",
    left: 14,
  },
  staminaBg: {
    width: 120,
    height: 7,
    backgroundColor: "rgba(20,10,10,0.6)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  staminaFill: {
    height: "100%",
    borderRadius: 4,
  },

  // ── Shield indicator
  shieldIndicator: {
    position: "absolute",
    bottom: 220,
    left: "50%" as any,
    transform: [{ translateX: -22 }],
    backgroundColor: "rgba(0,60,30,0.8)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: "#2a8a5a",
  },
  shieldIndicatorParry: {
    backgroundColor: "rgba(60,120,255,0.85)",
    borderColor: "#88aaff",
    shadowColor: "#88aaff",
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },
  shieldIndicatorIcon: { fontSize: 18 },
  shieldIndicatorText: { color: "#ffffff", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },

  // ── Mini-map
  miniMapWrap: {
    position: "absolute",
    bottom: 200,
    left: 14,
  },
  miniMapBg: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    backgroundColor: "rgba(10,10,20,0.7)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    position: "relative",
  },
  miniMapGridH: {
    position: "absolute",
    left: 0,
    top: MAP_SIZE / 2 - 0.5,
    width: MAP_SIZE,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  miniMapGridV: {
    position: "absolute",
    left: MAP_SIZE / 2 - 0.5,
    top: 0,
    width: 1,
    height: MAP_SIZE,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  miniMapPlayer: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 4,
  },
  miniMapDiamond: {
    position: "absolute",
    width: 8,
    height: 8,
    transform: [{ rotate: "45deg" }],
    borderWidth: 1.5,
    borderRadius: 1,
  },
  miniMapCircle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.9,
  },
  miniMapSquare: {
    position: "absolute",
    width: 6,
    height: 6,
    opacity: 0.9,
  },

  // Chapter card
  chapterCard: {
    position: "absolute",
    bottom: 220,
    left: 30,
    right: 30,
    backgroundColor: "rgba(5,2,18,0.88)",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  chapterSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  chapterName: {
    color: "#ffffff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },

  // Special items strip
  itemsStrip: {
    position: "absolute",
    right: 14,
    flexDirection: "column",
    gap: 6,
  },
  itemBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10,8,20,0.75)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  itemBadgeIcon: { fontSize: 14 },
  itemBadgeLabel: {
    color: "#e8e0d4",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  // Mini-game styles
  miniGamePrompt: {
    position: "absolute",
    bottom: 160,
    left: "50%",
    transform: [{ translateX: -80 }],
    alignItems: "center",
    backgroundColor: "rgba(10,10,20,0.88)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,200,50,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 10,
  },
  miniGamePromptText: {
    color: "#ffd700",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  miniGameBtn: {
    backgroundColor: "#ffd700",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  miniGameBtnText: {
    color: "#1a1200",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  miniGameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  miniGamePanel: {
    backgroundColor: "#12101e",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,200,50,0.4)",
    padding: 24,
    width: 300,
    alignItems: "center",
    gap: 14,
  },
  miniGameTitle: {
    color: "#ffd700",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  miniGameDesc: {
    color: "#c8c0a0",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  miniGameScore: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  miniGamePlayBtn: {
    backgroundColor: "#ffd700",
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  miniGamePlayText: {
    color: "#1a1200",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  miniGameClose: {
    color: "#888",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  archeryField: {
    width: 260,
    height: 220,
    backgroundColor: "rgba(0,40,0,0.5)",
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(100,200,100,0.3)",
  },
  archeryTarget: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  fishingTapArea: {
    width: 200,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fishingBobber: {
    fontSize: 52,
    color: "#ffffff",
  },
  fishingMsg: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#aaaaaa",
    letterSpacing: 1,
  },
});
