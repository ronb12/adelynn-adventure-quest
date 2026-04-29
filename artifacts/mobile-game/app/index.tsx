import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ImageBackground, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../game/store";
import { loadBestRecord, BestRecord } from "../game/saveManager";
import colors from "../constants/colors";

const TITLE_1 = "ADELYNN'S";
const TITLE_2 = "ADVENTURE QUEST";
const SUBTITLE = "The Shattered Crown";

function MenuScreen() {
  const insets = useSafeAreaInsets();
  const resetGame = useGameStore(s => s.resetGame);
  const [bestRecord, setBestRecord] = useState<BestRecord | null>(null);

  useEffect(() => {
    loadBestRecord().then(setBestRecord);
  }, []);

  const handlePlay = () => {
    resetGame();
    router.push("/game");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a1f", "#1a0a2e", "#0d0818", "#050508"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.starsContainer, StyleSheet.absoluteFillObject]}>
        {Array.from({ length: 32 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${(i * 37 + 11) % 100}%` as any,
                top: `${(i * 53 + 7) % 100}%` as any,
                width: i % 4 === 0 ? 3 : 2,
                height: i % 4 === 0 ? 3 : 2,
                opacity: 0.4 + (i % 5) * 0.12,
              },
            ]}
          />
        ))}
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <View style={styles.crownContainer}>
          <View style={styles.crownShard1} />
          <View style={styles.crownBase} />
          <View style={styles.crownShard2} />
          <View style={styles.crownShard3} />
        </View>

        <Text style={styles.titleSmall}>{TITLE_1}</Text>
        <Text style={styles.titleBig}>{TITLE_2}</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>{SUBTITLE}</Text>

        {bestRecord && (
          <View style={styles.bestRecord}>
            <Ionicons name="trophy" size={14} color="#f59e0b" />
            <Text style={styles.bestText}>
              Best: {bestRecord.score.toLocaleString()} pts · x{bestRecord.maxCombo} combo
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.playBtn} onPress={handlePlay} activeOpacity={0.85}>
          <LinearGradient
            colors={["#7c3aed", "#5b21b6"]}
            style={styles.playBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="play" size={26} color="#fff" />
            <Text style={styles.playBtnText}>BEGIN QUEST</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.loreTeaser}>
          <Text style={styles.loreTeaserText}>
            "The Crown of Aetheron was shattered by Malgrathak's dark power.{"\n"}
            Only Adelynn can restore it and save the realm."
          </Text>
        </View>

        <View style={styles.controlsHint}>
          <View style={styles.hintRow}>
            <View style={styles.hintIcon}>
              <Ionicons name="radio-button-on" size={16} color="rgba(255,255,255,0.5)" />
            </View>
            <Text style={styles.hintText}>Left stick — Move</Text>
          </View>
          <View style={styles.hintRow}>
            <View style={styles.hintIcon}>
              <Ionicons name="cut" size={16} color="#e74c3c" />
            </View>
            <Text style={styles.hintText}>Red button — Attack</Text>
          </View>
          <View style={styles.hintRow}>
            <View style={styles.hintIcon}>
              <Ionicons name="flash" size={16} color="#60d8ff" />
            </View>
            <Text style={styles.hintText}>Blue button — Dash</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.footerText}>4 Areas · 7 Enemy Types · 12 Lore Stones</Text>
      </View>
    </View>
  );
}

export default MenuScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050508" },
  starsContainer: {},
  star: { position: "absolute", backgroundColor: "#ffffff", borderRadius: 2 },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  crownContainer: {
    width: 80,
    height: 50,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  crownBase: {
    width: 60,
    height: 20,
    backgroundColor: "#8b5cf6",
    borderRadius: 4,
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },
  crownShard1: {
    position: "absolute",
    bottom: 14,
    left: 0,
    width: 12,
    height: 28,
    backgroundColor: "#f59e0b",
    transform: [{ rotate: "-20deg" }],
    borderRadius: 2,
    opacity: 0.85,
  },
  crownShard2: {
    position: "absolute",
    bottom: 14,
    right: 0,
    width: 12,
    height: 28,
    backgroundColor: "#60d8ff",
    transform: [{ rotate: "20deg" }],
    borderRadius: 2,
    opacity: 0.85,
  },
  crownShard3: {
    position: "absolute",
    bottom: 16,
    left: "50%",
    marginLeft: -6,
    width: 12,
    height: 34,
    backgroundColor: "#f9fafb",
    borderRadius: 2,
    opacity: 0.9,
  },
  titleSmall: {
    color: "#b89aff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 5,
    marginBottom: 4,
  },
  titleBig: {
    color: "#ffffff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    textAlign: "center",
    textShadowColor: "#8b5cf6",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: "#8b5cf6",
    marginVertical: 10,
    borderRadius: 1,
  },
  subtitle: {
    color: "#f59e0b",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
    marginBottom: 16,
  },
  bestRecord: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  bestText: {
    color: "#f59e0b",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  playBtn: {
    width: "75%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 24,
  },
  playBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  playBtnText: {
    color: "#ffffff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  loreTeaser: {
    backgroundColor: "rgba(15,10,30,0.7)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 20,
    width: "100%",
  },
  loreTeaserText: {
    color: "#9988bb",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    fontStyle: "italic",
    textAlign: "center",
  },
  controlsHint: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  hintIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  hintText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
  },
});
