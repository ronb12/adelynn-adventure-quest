import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { useGameStore } from './game/store';
import { keyMap } from './game/controls';
import { Player } from './game/Player';
import { World } from './game/World';
import { CameraRig } from './game/CameraRig';
import { HUD } from './game/HUD';
import { TitleScreen, GameOverScreen, VictoryScreen } from './game/screens';
import { Enemies } from './game/Enemy';
import { Pickups } from './game/Pickups';
import { Weapons } from './game/Weapons';
import { AudioSystem, MuteButton } from './game/AudioSystem';

function GameScene() {
  const currentArea = useGameStore(s => s.currentArea);
  return (
    <>
      {/* World renders its own sky/fog/lighting per area */}
      <World />
      <CameraRig />
      {/* key resets state on area change */}
      <Enemies key={`enemies-${currentArea}`} />
      <Player />
      <Pickups key={`pickups-${currentArea}`} />
      <Weapons />
    </>
  );
}

export default function App() {
  const gameState = useGameStore((state) => state.gameState);

  return (
    <div className="w-full h-[100dvh] relative overflow-hidden font-sans bg-black">
      <KeyboardControls map={keyMap}>
        <Canvas shadows camera={{ position: [0, 15, 15], fov: 45 }}>
          {gameState === 'playing' && <GameScene />}
        </Canvas>
      </KeyboardControls>

      <AudioSystem />
      <MuteButton />
      <HUD />
      {gameState === 'title'    && <TitleScreen />}
      {gameState === 'gameover' && <GameOverScreen />}
      {gameState === 'victory'  && <VictoryScreen />}
    </div>
  );
}
