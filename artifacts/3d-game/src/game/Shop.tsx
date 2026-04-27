import { useGameStore } from './store';

interface ShopItem {
  id: 'arrows' | 'bombs' | 'heart';
  icon: string;
  name: string;
  desc: string;
  cost: number;
}

const ITEMS: ShopItem[] = [
  { id: 'arrows', icon: '🏹', name: '10 Arrows',   desc: 'Restock your quiver',    cost: 20 },
  { id: 'bombs',  icon: '💣', name: '5 Bombs',      desc: 'Blast your foes',        cost: 30 },
  { id: 'heart',  icon: '❤️', name: 'Potion',       desc: 'Restore 1 heart',        cost: 25 },
];

export function ShopUI() {
  const showShop = useGameStore(s => s.showShop);
  const rupees   = useGameStore(s => s.rupees);
  const closeShop = useGameStore(s => s.closeShop);
  const buyItem   = useGameStore(s => s.buyItem);

  if (!showShop) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-auto"
      style={{ zIndex: 8000, background: 'rgba(0,0,0,0.65)' }}
    >
      <div
        className="rounded-2xl border-2 p-6 shadow-2xl max-w-sm w-full mx-4"
        style={{ background: 'rgba(12, 6, 30, 0.97)', borderColor: '#f0c030' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-amber-300 font-serif font-bold text-xl">🏪 Merchant's Shop</h2>
            <p className="text-amber-600 text-xs mt-0.5">"Welcome, brave soul!"</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-5 bg-green-400 rotate-45 border border-green-600" />
            <span className="text-green-300 font-bold text-lg">{rupees}</span>
          </div>
        </div>

        {/* Items */}
        <div className="flex flex-col gap-2 mb-4">
          {ITEMS.map(item => {
            const canAfford = rupees >= item.cost;
            return (
              <button
                key={item.id}
                onClick={() => { if (canAfford) buyItem(item.id, item.cost); }}
                disabled={!canAfford}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                  ${canAfford
                    ? 'border-amber-700 bg-amber-900/20 hover:bg-amber-800/40 cursor-pointer'
                    : 'border-gray-700 bg-gray-900/20 opacity-50 cursor-not-allowed'}`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-amber-100 font-bold text-sm">{item.name}</div>
                  <div className="text-gray-400 text-xs">{item.desc}</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-4 bg-green-400 rotate-45 border border-green-600 scale-75" />
                  <span className={`font-bold text-sm ${canAfford ? 'text-green-300' : 'text-gray-500'}`}>
                    {item.cost}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Close */}
        <button
          onClick={closeShop}
          className="w-full py-2 rounded-xl border border-amber-600 text-amber-300 text-sm font-bold hover:bg-amber-900/30 cursor-pointer transition-all"
        >
          Leave Shop (E)
        </button>
        <p className="text-center text-gray-600 text-xs mt-2 font-mono">Press E again to close</p>
      </div>
    </div>
  );
}
