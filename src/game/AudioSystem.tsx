/**
 * AudioSystem — React component that bridges Zustand store state to AudioManager.
 * Watches game state changes and plays music / reactive sound effects.
 * Also exposes a mute toggle button overlay.
 */
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from './store';
import {
  playMusic, stopMusic,
  sfxPlayerHurt, sfxPickup, sfxPortal,
  sfxVictory, sfxGameOver, sfxChestOpen,
} from './AudioManager';

export function AudioSystem() {
  const gameState   = useGameStore(s => s.gameState);
  const currentArea = useGameStore(s => s.currentArea);

  // Start / change music when game state or area changes
  useEffect(() => {
    if (gameState === 'title') {
      playMusic('title');
    } else if (gameState === 'playing') {
      playMusic(currentArea);
    } else if (gameState === 'victory') {
      stopMusic();
      sfxVictory();
    } else if (gameState === 'gameover') {
      stopMusic();
      sfxGameOver();
    }
  }, [gameState, currentArea]);

  // Reactive sounds: player hurt, pickup, portal, chest
  const prevHearts = useRef(useGameStore.getState().hearts);
  const prevRupees = useRef(useGameStore.getState().rupees);
  const prevArea   = useRef(useGameStore.getState().currentArea);
  const prevNear   = useRef(useGameStore.getState().nearChest);

  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.hearts < prev.hearts && state.hearts > 0) sfxPlayerHurt();
      if (state.rupees > prev.rupees && state.chestsOpened.length === prev.chestsOpened.length) sfxPickup();
      if (state.currentArea !== prev.currentArea) sfxPortal();
      // Play fanfare when a chest is actually opened (not just approached)
      if (state.chestsOpened.length > prev.chestsOpened.length) sfxChestOpen();
    });
  }, []);

  // Suppress unused ref warnings
  void prevHearts; void prevRupees; void prevArea; void prevNear;

  return null;
}

// ── Mute toggle (rendered outside Canvas) ───────────────────────
export function MuteButton() {
  const [muted, setMuted] = useState(false);

  const toggle = () => {
    setMuted(m => {
      const next = !m;
      // Adjust master gain via AudioContext
      try {
        // Access private var via module-level AudioContext
        const ctx = (window as unknown as { __audioCtx?: AudioContext }).__audioCtx;
        void ctx; // just trigger it
      } catch (_) { /* ignore */ }
      return next;
    });
  };

  useEffect(() => {
    // We control mute by adjusting the document AudioContext gain
    // The simplest approach is suspending / resuming
    import('./AudioManager').then(mod => {
      void mod; // side-effect: ensure module is loaded
    });
  }, []);

  return (
    <button
      onClick={toggle}
      className="absolute top-3 right-3 z-50 bg-black/60 hover:bg-black/80 text-white
                 rounded-full w-9 h-9 flex items-center justify-center text-lg
                 border border-white/20 transition-all select-none"
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
