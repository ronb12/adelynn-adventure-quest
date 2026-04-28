import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { useGameStore } from './game/store';
import { keyMap } from './game/controls';
import { Player } from './game/Player';
import { World } from './game/World';
import { CameraRig } from './game/CameraRig';
import { HUD } from './game/HUD';
import { TitleScreen, GameOverScreen, VictoryScreen, PauseScreen } from './game/screens';
import { Enemies, BossEnemy } from './game/Enemy';
import { Pickups } from './game/Pickups';
import { Weapons } from './game/Weapons';
import { AudioSystem, MuteButton } from './game/AudioSystem';
import { ShopUI } from './game/Shop';
import { SaveSystem } from './game/SaveSystem';
import { MobileControls } from './game/MobileControls';

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
  const gameState   = useGameStore(s => s.gameState);
  const togglePause = useGameStore(s => s.togglePause);

  // Escape key toggles pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause]);

  const isInGame = gameState === 'playing' || gameState === 'paused';

  return (
    <div className="w-full h-[100dvh] relative overflow-hidden font-sans bg-black" style={{ touchAction: 'none' }}>
      <KeyboardControls map={keyMap}>
        <Canvas shadows camera={{ position: [0, 15, 15], fov: 45 }}>
          {isInGame && <GameScene />}
        </Canvas>
      </KeyboardControls>

      <AudioSystem />
      <SaveSystem />
      <MuteButton />
      {isInGame && <HUD />}
      {isInGame && <ShopUI />}
      <MobileControls />

      {gameState === 'title'    && <div className="absolute inset-0" style={{ zIndex: 9999 }}><TitleScreen /></div>}
      {gameState === 'paused'   && <div className="absolute inset-0" style={{ zIndex: 9000 }}><PauseScreen /></div>}
      {gameState === 'gameover' && <div className="absolute inset-0" style={{ zIndex: 9999 }}><GameOverScreen /></div>}
      {gameState === 'victory'  && <div className="absolute inset-0" style={{ zIndex: 9999 }}><VictoryScreen /></div>}
    </div>
  );
}
