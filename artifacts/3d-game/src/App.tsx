import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { ClerkProvider } from '@clerk/react';
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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

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

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey ?? ''}
      proxyUrl={clerkProxyUrl}
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
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
