import { useGameStore } from './store';
import { Button } from '@/components/ui/button';

export function TitleScreen() {
  const setGameState = useGameStore(state => state.setGameState);
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-100/90 text-amber-900 pointer-events-auto">
      <h1 className="text-6xl font-bold mb-8 font-serif tracking-widest drop-shadow-md">HERO'S QUEST</h1>
      <p className="mb-8 max-w-md text-center text-lg">
        Explore the world, defeat enemies, collect rupees, and find the ancient chest!
      </p>
      <Button 
        size="lg" 
        className="text-xl px-8 py-6 bg-emerald-700 hover:bg-emerald-800 text-white font-serif"
        onClick={() => setGameState('playing')}
      >
        Begin Adventure
      </Button>
    </div>
  );
}

export function GameOverScreen() {
  const resetGame = useGameStore(state => state.resetGame);
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-red-500 pointer-events-auto">
      <h1 className="text-6xl font-bold mb-8 font-serif tracking-widest drop-shadow-md">You Fell</h1>
      <Button 
        size="lg" 
        className="text-xl px-8 py-6 bg-red-800 hover:bg-red-900 text-white font-serif"
        onClick={() => resetGame()}
      >
        Restart Journey
      </Button>
    </div>
  );
}

export function VictoryScreen() {
  const resetGame = useGameStore(state => state.resetGame);
  const rupees = useGameStore(state => state.rupees);
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-100/90 text-amber-900 pointer-events-auto">
      <h1 className="text-6xl font-bold mb-8 font-serif tracking-widest drop-shadow-md text-emerald-700">Triumph!</h1>
      <p className="mb-8 text-2xl">
        You found the chest and collected {rupees} rupees!
      </p>
      <Button 
        size="lg" 
        className="text-xl px-8 py-6 bg-emerald-700 hover:bg-emerald-800 text-white font-serif"
        onClick={() => resetGame()}
      >
        Play Again
      </Button>
    </div>
  );
}
