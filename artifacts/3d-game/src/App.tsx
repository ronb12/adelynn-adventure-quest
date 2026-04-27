import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { useGameStore } from './game/store';
import { keyMap } from './game/controls';
import { Player } from './game/Player';
import { World } from './game/World';
import { CameraRig } from './game/CameraRig';
import { HUD } from './game/HUD';
import { TitleScreen, GameOverScreen, VictoryScreen } from './game/screens';
import { Enemies, BossEnemy } from './game/Enemy';
import { Pickups } from './game/Pickups';
import { Weapons } from './game/Weapons';
import { AudioSystem, MuteButton } from './game/AudioSystem';
import { ShopUI } from './game/Shop';
import { SaveSystem } from './game/SaveSystem';

function GameScene() {
  const currentArea  = useGameStore(s => s.currentArea);
  const bossDefeated = useGameStore(s => s.bossDefeated);

  return (
    <>
      <World />
      <CameraRig />
      <Player />
      {currentArea !== 'boss' && <Enemies key={`enemies-${currentArea}`} />}
      {currentArea === 'boss' && !bossDefeated && <BossEnemy />}
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
      <SaveSystem />
      <MuteButton />
      <HUD />
      <ShopUI />

      {gameState === 'title'    && <div className="absolute inset-0" style={{ zIndex: 9999 }}><TitleScreen /></div>}
      {gameState === 'gameover' && <div className="absolute inset-0" style={{ zIndex: 9999 }}><GameOverScreen /></div>}
      {gameState === 'victory'  && <div className="absolute inset-0" style={{ zIndex: 9999 }}><VictoryScreen /></div>}
    </div>
  );
}
