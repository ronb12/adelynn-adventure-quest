import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useGameStore } from "../game/store";
import GameCanvas from "../game/GameCanvas";
import HUD from "../game/HUD";
import TouchControls from "../game/TouchControls";

export default function GameScreen() {
  const gameState = useGameStore(s => s.gameState);

  useEffect(() => {
    if (gameState === "title") {
      router.replace("/");
    }
  }, [gameState === "title"]);

  return (
    <View style={styles.container}>
      <GameCanvas />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <HUD />
      </View>
      <TouchControls />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050508",
  },
});
