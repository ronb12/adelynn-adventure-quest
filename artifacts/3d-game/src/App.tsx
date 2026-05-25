import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Router as WouterRouter, Route, Switch, useLocation } from 'wouter';
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
import { SignInPage, SignUpPage } from './game/AuthPages';
import { MaybeClerkProvider } from './game/clerkCompat';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

function GameScene() {
  const currentArea  = useGameStore(s => s.currentArea);
  const bossDefeated = useGameStore(s => s.bossDefeated);
  const bossDungeonStage = useGameStore(s => s.bossDungeonStage);

  return (
    <>
      <World />
      <CameraRig />
      <Player />
      <Enemies key={`enemies-${currentArea}-${bossDungeonStage}`} />
      {currentArea === 'boss' && !bossDefeated && bossDungeonStage >= 2 && <BossEnemy />}
      <Pickups key={`pickups-${currentArea}`} />
      <Weapons />
    </>
  );
}

function GameApp() {
  const gameState   = useGameStore(s => s.gameState);
  const togglePause = useGameStore(s => s.togglePause);

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
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          camera={{ position: [0, 15, 15], fov: 45 }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFShadowMap;
          }}
        >
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

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <MaybeClerkProvider
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={GameApp} />
      </Switch>
    </MaybeClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
