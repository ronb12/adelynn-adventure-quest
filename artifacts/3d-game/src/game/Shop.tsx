import { useGameStore } from './store';

type ItemId = 'arrows' | 'bombs' | 'heart' | 'shurikens' | 'frost' | 'flare' | 'veil' | 'quake' | 'moonbow';

interface ShopItem {
  id: ItemId;
  icon: string;
  name: string;
  desc: string;
  cost: number;
}

const ITEMS: ShopItem[] = [
  { id: 'arrows',   icon: '🏹', name: '10 Arrows',         desc: 'Restock your quiver',                 cost: 20 },
  { id: 'moonbow',  icon: '🌙', name: '10 Moonbow Arrows',  desc: 'Crescent-moon enchanted arrows',      cost: 30 },
  { id: 'bombs',    icon: '🧪', name: '5 Ember Vials',      desc: 'Fiery glass vials — throwable blast',  cost: 30 },
  { id: 'shurikens',icon: '⭐', name: '15 Void Stars',      desc: 'Razor-sharp throwing stars',          cost: 25 },
  { id: 'frost',    icon: '❄️', name: '5 Frost Charges',    desc: 'Ice bolt that slows enemies',         cost: 30 },
  { id: 'flare',    icon: '☀️', name: '3 Solara\'s Flares', desc: 'Area fire burst — smites all nearby', cost: 40 },
  { id: 'veil',     icon: '💠', name: '3 Veil Crystals',    desc: 'Glacira\'s freeze — chills the field', cost: 35 },
  { id: 'quake',    icon: '🪨', name: '2 Strike Runes',     desc: 'Cragus tremor — stuns all enemies',   cost: 45 },
  { id: 'heart',    icon: '❤️', name: 'Potion',             desc: 'Restore 1 heart',                     cost: 25 },
];

export function ShopUI() {
  const showShop  = useGameStore(s => s.showShop);
  const rupees    = useGameStore(s => s.rupees);
  const closeShop = useGameStore(s => s.closeShop);
  const buyItem   = useGameStore(s => s.buyItem);

  if (!showShop) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-auto"
      style={{ zIndex: 8000, background: 'rgba(0,0,0,0.65)' }}
    >
      <div
        className="rounded-2xl border-2 p-6 shadow-2xl max-w-sm w-full mx-4 max-h-[85vh] overflow-y-auto"
        style={{ background: 'rgba(12, 6, 30, 0.97)', borderColor: '#f0c030' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-amber-300 font-serif font-bold text-xl">🏪 Merchant's Shop</h2>
            <p className="text-amber-600 text-xs mt-0.5">"Every weapon has its moment!"</p>
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
                  <div className="text-amber-200 font-semibold text-sm">{item.name}</div>
                  <div className="text-amber-600 text-xs">{item.desc}</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3.5 bg-green-400 rotate-45 border border-green-600" />
                  <span className={`font-bold text-sm ${canAfford ? 'text-green-300' : 'text-gray-500'}`}>
                    {item.cost}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Close hint */}
        <div className="text-center text-amber-700 text-xs">
          Press <kbd className="bg-amber-900/50 px-1 rounded">E</kbd> to close
        </div>
      </div>
    </div>
  );
}
