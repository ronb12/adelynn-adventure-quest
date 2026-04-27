import { Canvas } from '@react-three/fiber';
import { Sky, KeyboardControls } from '@react-three/drei';
import { useGameStore } from './game/store';
import { keyMap } from './game/controls';
import { Player } from './game/Player';
import { World } from './game/World';
import { CameraRig } from './game/CameraRig';
import { HUD } from './game/HUD';
import { TitleScreen, GameOverScreen, VictoryScreen } from './game/screens';
import { Enemies } from './game/Enemy';
import { Pickups } from './game/Pickups';

function GameScene() {
  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      <ambientLight intensity={0.6} color="#fff1e0" />
      <directionalLight 
        position={[20, 30, 10]} 
        intensity={1.2} 
        color="#ffeedd"
        castShadow 
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <CameraRig />
      <World />
      <Player />
      <Enemies />
      <Pickups />
    </>
  );
}

export default function App() {
  const gameState = useGameStore((state) => state.gameState);

  return (
    <div className="w-full h-[100dvh] relative bg-sky-100 overflow-hidden font-sans">
      <KeyboardControls map={keyMap}>
        <Canvas shadows camera={{ position: [0, 15, 15], fov: 45 }}>
          {gameState === 'playing' && <GameScene />}
        </Canvas>
      </KeyboardControls>
      
      <HUD />
      {gameState === 'title' && <TitleScreen />}
      {gameState === 'gameover' && <GameOverScreen />}
      {gameState === 'victory' && <VictoryScreen />}
    </div>
  );
}
