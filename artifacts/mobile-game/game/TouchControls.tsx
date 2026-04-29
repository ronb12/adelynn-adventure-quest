import React, { useRef, useCallback } from "react";
import {
  View, StyleSheet, PanResponder, TouchableOpacity, Dimensions, Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { touchInput } from "./controls";
import { useGameStore } from "./store";

const { width: W } = Dimensions.get("window");
const JOYSTICK_RADIUS = 52;
const JOYSTICK_DOT = 20;

export default function TouchControls() {
  const joystickOriginRef = useRef<{ x: number; y: number } | null>(null);
  const dotRef = useRef<View>(null);
  const togglePause = useGameStore(s => s.togglePause);
  const gameState = useGameStore(s => s.gameState);
  const selectedWeapon = useGameStore(s => s.selectedWeapon);
  const activeSword = useGameStore(s => s.activeSword);
  const showShop = useGameStore(s => s.showShop);
  const activeDialogue = useGameStore(s => s.activeDialogue);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        joystickOriginRef.current = { x: pageX, y: pageY };
        touchInput.joyX = 0;
        touchInput.joyY = 0;
      },
      onPanResponderMove: (evt) => {
        if (!joystickOriginRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        const dx = pageX - joystickOriginRef.current.x;
        const dy = pageY - joystickOriginRef.current.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const maxLen = JOYSTICK_RADIUS;
        const clampedLen = Math.min(len, maxLen);
        const nx = len > 0 ? (dx / len) * clampedLen : 0;
        const ny = len > 0 ? (dy / len) * clampedLen : 0;
        touchInput.joyX = nx / maxLen;
        touchInput.joyY = ny / maxLen;
        if (dotRef.current) {
          dotRef.current.setNativeProps({
            style: { transform: [{ translateX: nx }, { translateY: ny }] },
          });
        }
      },
      onPanResponderRelease: () => {
        touchInput.joyX = 0;
        touchInput.joyY = 0;
        joystickOriginRef.current = null;
        if (dotRef.current) {
          dotRef.current.setNativeProps({ style: { transform: [{ translateX: 0 }, { translateY: 0 }] } });
        }
      },
      onPanResponderTerminate: () => {
        touchInput.joyX = 0;
        touchInput.joyY = 0;
        joystickOriginRef.current = null;
      },
    })
  ).current;

  const handleAttack = useCallback(() => {
    touchInput.attack = true;
    touchInput.attackConsumed = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDash = useCallback(() => {
    if (!touchInput.dashConsumed) return;
    touchInput.dash = true;
    touchInput.dashConsumed = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleFireWeapon = useCallback(() => {
    if (!touchInput.fireWeaponConsumed) return;
    touchInput.fireWeapon = true;
    touchInput.fireWeaponConsumed = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleInteract = useCallback(() => {
    if (!touchInput.interactConsumed) return;
    touchInput.interact = true;
    touchInput.interactConsumed = false;
    Haptics.selectionAsync();
  }, []);

  const handleCycleSword = useCallback(() => {
    if (!touchInput.cycleSwordConsumed) return;
    touchInput.cycleSword = true;
    touchInput.cycleSwordConsumed = false;
    Haptics.selectionAsync();
  }, []);

  const handleCycleWeapon = useCallback(() => {
    if (!touchInput.cycleWeaponConsumed) return;
    touchInput.cycleWeapon = true;
    touchInput.cycleWeaponConsumed = false;
    Haptics.selectionAsync();
  }, []);

  const handlePause = useCallback(() => {
    if (gameState === "playing" || gameState === "paused") {
      togglePause();
      Haptics.selectionAsync();
    }
  }, [gameState, togglePause]);

  if (gameState === "title" || gameState === "gameover" || gameState === "victory") return null;
  if (showShop || activeDialogue) {
    // While shop/dialogue open, only show pause
    return (
      <View style={styles.container} pointerEvents="box-none">
        <TouchableOpacity style={styles.pauseBtn} onPress={handlePause} activeOpacity={0.7}>
          <Ionicons name={gameState === "paused" ? "play" : "pause"} size={18} color="#e8e0d4" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Left: Joystick */}
      <View style={styles.leftZone} {...panResponder.panHandlers}>
        <View style={styles.joystickBase}>
          <View ref={dotRef} style={styles.joystickDot} />
        </View>
      </View>

      {/* Right: Action buttons */}
      <View style={styles.rightZone} pointerEvents="box-none">
        {/* Top row: small utility buttons */}
        <View style={styles.smallButtonRow}>
          {/* Sword cycle */}
          <TouchableOpacity style={styles.smallBtn} onPress={handleCycleSword} activeOpacity={0.7}>
            <Text style={styles.smallBtnIcon}>⚔️</Text>
            <Text style={styles.smallBtnLabel}>Z</Text>
          </TouchableOpacity>
          {/* Weapon cycle */}
          <TouchableOpacity style={styles.smallBtn} onPress={handleCycleWeapon} activeOpacity={0.7}>
            <Text style={styles.smallBtnIcon}>🏹</Text>
            <Text style={styles.smallBtnLabel}>Q</Text>
          </TouchableOpacity>
          {/* Interact */}
          <TouchableOpacity style={[styles.smallBtn, styles.interactBtn]} onPress={handleInteract} activeOpacity={0.7}>
            <Text style={styles.smallBtnIcon}>💬</Text>
            <Text style={styles.smallBtnLabel}>Y</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom row: main action buttons */}
        <View style={styles.mainButtonRow}>
          {/* Dash */}
          <TouchableOpacity style={styles.dashBtn} onPress={handleDash} activeOpacity={0.7}>
            <Ionicons name="flash" size={20} color="#60d8ff" />
            <Text style={styles.dashLabel}>R</Text>
          </TouchableOpacity>
          {/* Fire weapon */}
          <TouchableOpacity style={styles.weaponBtn} onPressIn={handleFireWeapon} activeOpacity={0.7}>
            <Text style={styles.weaponBtnLabel}>B</Text>
            <Text style={styles.weaponBtnIcon}>🏹</Text>
          </TouchableOpacity>
          {/* Attack */}
          <TouchableOpacity style={styles.attackBtn} onPressIn={handleAttack} activeOpacity={0.7}>
            <Ionicons name="cut" size={26} color="#ffffff" />
            <Text style={styles.attackLabel}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pause button */}
      <TouchableOpacity style={styles.pauseBtn} onPress={handlePause} activeOpacity={0.7}>
        <Ionicons name={gameState === "paused" ? "play" : "pause"} size={18} color="#e8e0d4" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  leftZone: {
    width: W * 0.42,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  joystickBase: {
    width: JOYSTICK_RADIUS * 2,
    height: JOYSTICK_RADIUS * 2,
    borderRadius: JOYSTICK_RADIUS,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  joystickDot: {
    width: JOYSTICK_DOT * 2,
    height: JOYSTICK_DOT * 2,
    borderRadius: JOYSTICK_DOT,
    backgroundColor: "rgba(255,255,255,0.65)",
    position: "absolute",
  },
  rightZone: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    gap: 8,
    paddingRight: 6,
  },
  smallButtonRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 4,
  },
  mainButtonRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  smallBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(60,40,100,0.75)",
    borderWidth: 1.5,
    borderColor: "rgba(200,160,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  interactBtn: {
    backgroundColor: "rgba(80,60,20,0.75)",
    borderColor: "rgba(255,220,60,0.4)",
  },
  smallBtnIcon: { fontSize: 16, lineHeight: 18 },
  smallBtnLabel: { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "bold", marginTop: -2 },
  dashBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1a3a6a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3a6aaa",
    shadowColor: "#4488ff",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    gap: 0,
  },
  dashLabel: { color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: "bold" },
  weaponBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#1a2a5a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#5555cc",
    shadowColor: "#5577ff",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  weaponBtnLabel: { color: "#c8d8ff", fontSize: 16, fontWeight: "bold", lineHeight: 18 },
  weaponBtnIcon: { fontSize: 14, lineHeight: 16, marginTop: -2 },
  attackBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#c0392b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e74c3c",
    shadowColor: "#ff0000",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    gap: 0,
  },
  attackLabel: { color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: "bold" },
  pauseBtn: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
});
