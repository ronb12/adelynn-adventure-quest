import { useGameStore } from './store';
import { Controls } from './controls';

export function HUD() {
  const { hearts, maxHearts, rupees, gameState } = useGameStore();

  if (gameState !== 'playing') return null;

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex gap-1">
          {Array.from({ length: maxHearts }).map((_, i) => (
            <div key={i} className="w-6 h-6 text-red-500">
              <svg viewBox="0 0 24 24" fill={i < hearts ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 font-bold text-xl text-green-600 drop-shadow-md">
          <div className="w-4 h-6 bg-green-500 rotate-45 transform origin-center border border-green-700"></div>
          <span>{rupees}</span>
        </div>
      </div>
      <div className="text-center text-gray-800 font-mono text-sm drop-shadow-sm bg-white/50 inline-block self-center px-4 py-1 rounded-full">
        WASD move • SPACE attack • E interact
      </div>
    </div>
  );
}
