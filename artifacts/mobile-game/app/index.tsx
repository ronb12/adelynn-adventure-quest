import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useGameStore } from "../game/store";
import { loadBestRecord, BestRecord } from "../game/saveManager";

const SHARDS = [
  { name: "Shard of Dawn",  place: "Sunfield Plains", color: "#ffe060" },
  { name: "Shard of Dusk",  place: "Whisper Woods",   color: "#b084ff" },
  { name: "Shard of Ember", place: "Ashrock Summit",  color: "#ff8844" },
];

function StarField() {
  const stars = React.useMemo(() =>
    Array.from({ length: 55 }).map((_, i) => ({
      left:    `${(i * 37 + 11) % 100}%`,
      top:     `${(i * 53 + 7) % 100}%`,
      size:    i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
      opacity: 0.2 + (i % 7) * 0.08,
    })), []
  );
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map((s, i) => (
        <View key={i} style={{
          position: "absolute",
          left: s.left as any, top: s.top as any,
          width: s.size, height: s.size,
          borderRadius: s.size / 2,
          backgroundColor: i % 8 === 0 ? "#ffe08880" : "#ffffffcc",
          opacity: s.opacity,
        }} />
      ))}
    </View>
  );
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const resetGame = useGameStore(s => s.resetGame);
  const [bestRecord, setBestRecord] = useState<BestRecord | null>(null);

  const crownPulse = useRef(new Animated.Value(1)).current;
  const fadeIn     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadBestRecord().then(setBestRecord);

    Animated.timing(fadeIn, {
      toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.quad),
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(crownPulse, { toValue: 1.12, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(crownPulse, { toValue: 1.0,  duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, []);

  const handlePlay = () => {
    resetGame();
    router.push("/game");
  };

  return (
    <View style={styles.root}>
      {/* Background gradient — matches web's dark purple/black */}
      <LinearGradient
        colors={["#080418", "#120830", "#0c0520", "#050308"]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Radial glow behind crown */}
      <View style={styles.radialGlow} pointerEvents="none" />

      <StarField />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeIn }]}>

          {/* Crown icon — glowing, pulsing */}
          <Animated.Text style={[styles.crown, { transform: [{ scale: crownPulse }] }]}>
            👑
          </Animated.Text>

          {/* Title */}
          <Text style={styles.title1}>Adelynn's Adventure Quest</Text>
          <Text style={styles.title2}>The Shattered Crown</Text>

          {/* Lore */}
          <View style={styles.loreBox}>
            <Text style={styles.loreText}>
              Malgrath shattered the Crown of Radiance into three Crystal Shards.
              Adelynn must recover them all and restore the kingdom of Aldenmere!
            </Text>
          </View>

          {/* Crystal Shards row */}
          <View style={styles.shardsRow}>
            {SHARDS.map(s => (
              <View key={s.name} style={styles.shardCard}>
                <Text style={styles.shardGem}>💎</Text>
                <Text style={[styles.shardName, { color: s.color }]}>{s.name}</Text>
                <Text style={styles.shardPlace}>{s.place}</Text>
              </View>
            ))}
          </View>

          {/* Best record */}
          {bestRecord && (
            <View style={styles.bestRow}>
              <Text style={styles.bestIcon}>🏆</Text>
              <Text style={styles.bestText}>
                Best: {bestRecord.score.toLocaleString()} pts · ×{bestRecord.maxCombo} combo
              </Text>
            </View>
          )}

          {/* Play button — amber like the web */}
          <TouchableOpacity style={styles.playBtn} onPress={handlePlay} activeOpacity={0.82}>
            <LinearGradient
              colors={["#d97706", "#b45309"]}
              style={styles.playBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.playArrow}>▶</Text>
              <Text style={styles.playText}>Begin the Quest</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Controls hint */}
          <View style={styles.hintsBox}>
            {[
              ["🕹️", "Left stick", "Move"],
              ["⚔️", "Red button", "Attack / Spin"],
              ["💨", "Blue button", "Dash"],
              ["✨", "Green button", "Weapon"],
            ].map(([icon, key, action]) => (
              <View key={key} style={styles.hintRow}>
                <Text style={styles.hintIcon}>{icon}</Text>
                <Text style={styles.hintKey}>{key}</Text>
                <Text style={styles.hintSep}>—</Text>
                <Text style={styles.hintAction}>{action}</Text>
              </View>
            ))}
          </View>

        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.footerText}>
          4 Areas · 8 Enemy Types · 10 Swords · 13 Weapons
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050308" },

  radialGlow: {
    position: "absolute",
    top: "10%", left: "50%",
    width: 340, height: 340,
    marginLeft: -170,
    borderRadius: 170,
    backgroundColor: "transparent",
    shadowColor: "#f0c030",
    shadowOpacity: 0.18,
    shadowRadius: 90,
    elevation: 0,
  },

  scroll: { alignItems: "center" },
  content: { alignItems: "center", width: "100%", paddingHorizontal: 20 },

  crown: {
    fontSize: 64,
    marginBottom: 10,
    textShadowColor: "#f0c030",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },

  title1: {
    color: "#fcd34d",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "#f0c030",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    marginBottom: 4,
    lineHeight: 36,
  },

  title2: {
    color: "#f59e0b",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 5,
    textTransform: "uppercase",
    marginBottom: 20,
    opacity: 0.9,
  },

  loreBox: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(161,98,7,0.35)",
    marginBottom: 18,
  },
  loreText: {
    color: "rgba(253,230,138,0.85)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    textAlign: "center",
  },

  shardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    width: "100%",
    justifyContent: "center",
  },
  shardCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(120,40,180,0.4)",
  },
  shardGem: { fontSize: 22, marginBottom: 4 },
  shardName: { fontSize: 10, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 2 },
  shardPlace: { fontSize: 9, color: "rgba(200,190,220,0.65)", fontFamily: "Inter_400Regular", textAlign: "center" },

  bestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  bestIcon: { fontSize: 14 },
  bestText: {
    color: "#fbbf24",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  playBtn: {
    width: "78%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#d97706",
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 12,
    marginBottom: 24,
  },
  playBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 28,
  },
  playArrow: { color: "#fff", fontSize: 18 },
  playText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },

  hintsBox: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hintIcon: { fontSize: 14, width: 24, textAlign: "center" },
  hintKey: { color: "#fcd34d", fontSize: 12, fontFamily: "Inter_600SemiBold", width: 88 },
  hintSep: { color: "rgba(255,255,255,0.3)", fontSize: 12 },
  hintAction: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular" },

  footer: { alignItems: "center", paddingTop: 6 },
  footerText: {
    color: "rgba(255,255,255,0.22)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
  },
});
