import { useEffect, useRef } from 'react';
import { useGameStore } from './store';

// Auto-save triggers: saves on meaningful progress events
// Mounted inside <App> so it runs whenever the game is in any state
export function SaveSystem() {
  const chestsOpened        = useGameStore(s => s.chestsOpened);
  const heartPiecesCollected = useGameStore(s => s.heartPiecesCollected);
  const currentArea          = useGameStore(s => s.currentArea);
  const bossDefeated         = useGameStore(s => s.bossDefeated);
  const armorLevel           = useGameStore(s => s.armorLevel);
  const gameState            = useGameStore(s => s.gameState);
  const performSave          = useGameStore(s => s.performSave);

  const prevArea  = useRef(currentArea);
  const prevState = useRef(gameState);

  // Save on chest opened
  useEffect(() => {
    if (gameState === 'playing') performSave();
  }, [chestsOpened]);                 // eslint-disable-line react-hooks/exhaustive-deps

  // Save on heart piece collected
  useEffect(() => {
    if (gameState === 'playing') performSave();
  }, [heartPiecesCollected]);         // eslint-disable-line react-hooks/exhaustive-deps

  // Save on area transition
  useEffect(() => {
    if (gameState === 'playing' && currentArea !== prevArea.current) {
      prevArea.current = currentArea;
      performSave();
    }
  }, [currentArea]);                  // eslint-disable-line react-hooks/exhaustive-deps

  // Save on boss defeated
  useEffect(() => {
    if (bossDefeated && gameState === 'playing') performSave();
  }, [bossDefeated]);                 // eslint-disable-line react-hooks/exhaustive-deps

  // Save on armor upgrade
  useEffect(() => {
    if (gameState === 'playing') performSave();
  }, [armorLevel]);                   // eslint-disable-line react-hooks/exhaustive-deps

  // Save when game transitions from playing → gameover/victory
  useEffect(() => {
    if (prevState.current === 'playing' && (gameState === 'gameover' || gameState === 'victory')) {
      performSave();
    }
    prevState.current = gameState;
  }, [gameState]);                    // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
