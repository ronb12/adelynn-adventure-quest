import React, { useRef, useCallback } from "react";
import { View, StyleSheet, PanResponder, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { touchInput } from "./controls";
import { useGameStore } from "./store";

const { width: W, height: H } = Dimensions.get("window");
const JOYSTICK_RADIUS = 55;
const JOYSTICK_DOT = 22;

export default function TouchControls() {
  const joystickOriginRef = useRef<{ x: number; y: number } | null>(null);
  const togglePause = useGameStore(s => s.togglePause);
  const gameState = useGameStore(s => s.gameState);

  const joystickContainerRef = useRef<View>(null);
  const dotRef = useRef<View>(null);
  const dotX = useRef(0);
  const dotY = useRef(0);

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
        dotX.current = nx;
        dotY.current = ny;
        if (dotRef.current) {
          dotRef.current.setNativeProps({
            style: {
              transform: [{ translateX: nx }, { translateY: ny }],
            },
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

  const handlePause = useCallback(() => {
    if (gameState === "playing" || gameState === "paused") {
      togglePause();
      Haptics.selectionAsync();
    }
  }, [gameState, togglePause]);

  if (gameState === "title" || gameState === "gameover" || gameState === "victory") return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.leftZone} {...panResponder.panHandlers}>
        <View style={styles.joystickBase}>
          <View ref={dotRef} style={styles.joystickDot} />
        </View>
      </View>

      <View style={styles.rightZone} pointerEvents="box-none">
        <TouchableOpacity style={styles.dashBtn} onPress={handleDash} activeOpacity={0.7}>
          <Ionicons name="flash" size={22} color="#60d8ff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.attackBtn} onPressIn={handleAttack} activeOpacity={0.7}>
          <Ionicons name="cut" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.pauseBtn} onPress={handlePause} activeOpacity={0.7}>
        <Ionicons name={gameState === "paused" ? "play" : "pause"} size={20} color="#e8e0d4" />
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
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  leftZone: {
    width: W * 0.44,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  joystickBase: {
    width: JOYSTICK_RADIUS * 2,
    height: JOYSTICK_RADIUS * 2,
    borderRadius: JOYSTICK_RADIUS,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  joystickDot: {
    width: JOYSTICK_DOT * 2,
    height: JOYSTICK_DOT * 2,
    borderRadius: JOYSTICK_DOT,
    backgroundColor: "rgba(255,255,255,0.7)",
    position: "absolute",
  },
  rightZone: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    gap: 16,
    paddingRight: 10,
  },
  attackBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#c0392b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e74c3c",
    shadowColor: "#ff0000",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  dashBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1a3a6a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3a6aaa",
    shadowColor: "#4488ff",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 8,
  },
  pauseBtn: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
});
