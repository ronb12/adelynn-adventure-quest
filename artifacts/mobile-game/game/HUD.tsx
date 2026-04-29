import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore, SWORD_DEFS, LORE_STONES } from "./store";
import { saveBestRecord } from "./saveManager";
import colors from "../constants/colors";

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
          size={20}
          color={i < hearts ? colors.light.heart : "#553344"}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

function ScorePanel() {
  const score = useGameStore(s => s.score);
  const comboCount = useGameStore(s => s.comboCount);
  const runStartTime = useGameStore(s => s.runStartTime);
  const activeSword = useGameStore(s => s.activeSword);
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
      <Text style={[styles.swordLabel, { color: swordDef.color }]}>{swordDef.name}</Text>
    </View>
  );
}

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
      <Text style={styles.bossName}>MALGRATHAK</Text>
      <View style={styles.bossBarBg}>
        <View style={[styles.bossBarFill, { width: `${pct * 100}%`, backgroundColor: pct < 0.3 ? "#ff2244" : "#cc0066" }]} />
      </View>
    </View>
  );
}

function LorePopup() {
  const nearLore = useGameStore(s => s.nearLore);
  const loreRead = useGameStore(s => s.loreRead);
  const currentArea = useGameStore(s => s.currentArea);
  const markLoreRead = useGameStore(s => s.markLoreRead);
  const setNearLore = useGameStore(s => s.setNearLore);
  const insets = useSafeAreaInsets();
  if (!nearLore) return null;
  const stones = LORE_STONES[currentArea] ?? [];
  const stone = stones.find(s => s.id === nearLore);
  if (!stone) return null;
  const isRead = loreRead.includes(nearLore);
  return (
    <View style={[styles.loreContainer, { bottom: insets.bottom + 190 }]}>
      {isRead ? (
        <Text style={styles.loreHint}>Already read · Tap to dismiss</Text>
      ) : (
        <>
          <Text style={styles.loreTitle}>Lore Stone</Text>
          <Text style={styles.loreText}>{stone.text}</Text>
          <TouchableOpacity style={styles.loreBtn} onPress={() => markLoreRead(stone.id)}>
            <Text style={styles.loreBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </>
      )}
      {isRead && (
        <TouchableOpacity onPress={() => setNearLore(null)}>
          <Text style={styles.loreBtnText}>Dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

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

function GameOverScreen() {
  const gameState = useGameStore(s => s.gameState);
  const score = useGameStore(s => s.score);
  const maxCombo = useGameStore(s => s.maxCombo);
  const totalKills = useGameStore(s => s.totalKills);
  const resetGame = useGameStore(s => s.resetGame);

  useEffect(() => {
    if (gameState === "gameover") {
      saveBestRecord({ score, maxCombo, kills: totalKills });
    }
  }, [gameState]);

  if (gameState !== "gameover") return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.menuCard}>
        <Text style={[styles.menuTitle, { color: "#ff4444", fontSize: 32 }]}>DEFEATED</Text>
        <Text style={styles.statText}>Score: {score.toLocaleString()}</Text>
        <Text style={styles.statText}>Best Combo: x{maxCombo}</Text>
        <Text style={styles.statText}>Enemies Slain: {totalKills}</Text>
        <TouchableOpacity style={[styles.menuBtn, { marginTop: 20 }]} onPress={resetGame}>
          <Ionicons name="refresh" size={22} color="#fff" />
          <Text style={styles.menuBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    if (gameState === "victory") {
      saveBestRecord({ score, maxCombo, kills: totalKills });
    }
  }, [gameState]);

  if (gameState !== "victory") return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.menuCard}>
        <Text style={[styles.menuTitle, { color: "#f59e0b", fontSize: 28 }]}>VICTORY!</Text>
        <Text style={styles.victorySubtitle}>The Crown is Restored</Text>
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

export default function HUD() {
  const gameState = useGameStore(s => s.gameState);
  if (gameState === "title") return null;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Hearts />
      <ScorePanel />
      <ComboPopup />
      <LorePopup />
      <BossHealthBar />
      <PauseMenu />
      <GameOverScreen />
      <VictoryScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  hearts: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  scorePanel: {
    position: "absolute",
    right: 16,
    alignItems: "flex-end",
  },
  scoreText: {
    color: "#f59e0b",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Inter_700Bold",
  },
  timerText: {
    color: "#a0a0cc",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  swordLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    opacity: 0.85,
  },
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
  bossBarContainer: {
    position: "absolute",
    left: 40,
    right: 40,
    alignItems: "center",
  },
  bossName: {
    color: "#ff4488",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    marginBottom: 4,
  },
  bossBarBg: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#330011",
    borderWidth: 1,
    borderColor: "#660033",
    overflow: "hidden",
  },
  bossBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  loreContainer: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "rgba(15,10,30,0.92)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8b5cf6",
    padding: 16,
  },
  loreTitle: {
    color: "#b89aff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  loreText: {
    color: "#e8e0d4",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 12,
  },
  loreHint: {
    color: "#7a7090",
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  loreBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#8b5cf6",
    borderRadius: 8,
  },
  loreBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
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
  menuTitle: {
    color: "#e8e0d4",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
    marginBottom: 24,
  },
  victorySubtitle: {
    color: "#b89aff",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: -16,
    marginBottom: 20,
    letterSpacing: 1,
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#4c2a8a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 6,
    width: "100%",
    justifyContent: "center",
  },
  menuBtnDanger: { backgroundColor: "#7a1a1a" },
  menuBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  statText: {
    color: "#c4b8e0",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginVertical: 3,
  },
});
