import React from "react";
import { StyleSheet } from "react-native";
import { Canvas } from "@react-three/fiber/native";
import { useGameStore } from "./store";
import World from "./World";
import Player from "./Player";
import Enemies from "./Enemy";
import Pickups from "./Pickups";
import NPCManager from "./NPCs";
import Weapons from "./Weapons";

function Lighting() {
  const currentArea = useGameStore(s => s.currentArea);
  const isBoss   = currentArea === "boss";
  const isForest = currentArea === "forest";
  const isDesert = currentArea === "desert";
  return (
    <>
      <ambientLight
        intensity={isBoss ? 0.18 : isForest ? 0.38 : 0.62}
        color={isBoss ? "#220011" : isForest ? "#113322" : "#ffffff"}
      />
      <directionalLight
        position={[10, 20, 10]}
        intensity={isBoss ? 0.5 : isDesert ? 1.4 : 1.1}
        color={isBoss ? "#aa0044" : isDesert ? "#ffddaa" : "#ffffff"}
        castShadow={false}
      />
      {isBoss   && <pointLight position={[0, 12, 0]} color="#ff0066" intensity={25} distance={30} />}
      {isForest && <ambientLight intensity={0.18} color="#004422" />}
      {isDesert && <hemisphereLight args={["#ffcc88", "#aa6622", 0.4]} />}
    </>
  );
}

export default function GameCanvas() {
  return (
    <Canvas
      style={StyleSheet.absoluteFillObject}
      camera={{ position: [0, 16, 10], fov: 48, near: 0.1, far: 300 }}
    >
      <Lighting />
      <fog attach="fog" args={["#0a0a1a", 38, 85]} />
      <World />
      <Player />
      <NPCManager />
      <Enemies />
      <Weapons />
      <Pickups />
    </Canvas>
  );
}
