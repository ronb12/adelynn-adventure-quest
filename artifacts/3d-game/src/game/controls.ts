export enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  attack = 'attack',
  interact = 'interact',
  bow = 'bow',
  bomb = 'bomb',
  boomerang = 'boomerang',
  nextWeapon = 'nextWeapon',
  prevWeapon = 'prevWeapon',
  shield = 'shield',
  swordCycle = 'swordCycle',
}

export const keyMap = [
  { name: Controls.forward,    keys: ['ArrowUp', 'KeyW'] },
  { name: Controls.back,       keys: ['ArrowDown', 'KeyS'] },
  { name: Controls.left,       keys: ['ArrowLeft', 'KeyA'] },
  { name: Controls.right,      keys: ['ArrowRight', 'KeyD'] },
  { name: Controls.attack,     keys: ['Space', 'KeyJ'] },
  { name: Controls.interact,   keys: ['KeyE'] },
  { name: Controls.bow,        keys: ['KeyB'] },
  { name: Controls.bomb,       keys: ['KeyX'] },
  { name: Controls.boomerang,  keys: ['KeyC'] },
  { name: Controls.nextWeapon, keys: ['KeyQ', 'Tab'] },
  { name: Controls.prevWeapon, keys: ['ShiftLeft'] },
  { name: Controls.shield,     keys: ['KeyF'] },
  { name: Controls.swordCycle, keys: ['KeyZ'] },
];

// 14 sub-weapons + 10 sword tiers + shield = 25 total (matches ALTTP's ~24)
export const WEAPONS = [
  'sword',
  'bow',       // Moonbow (crescent-fan arrow)
  'moonbow',   // alternate ranged
  'bomb',      // Ember Vial (throwable explosion)
  'boomerang', // Shadowrang (returning arc)
  'wand',      // Wand of Sparks (magic orb, unlimited)
  'frost',     // Frost Scepter (ice bolt, slows)
  'shuriken',  // Void Stars (spread throw)
  'flare',     // Solara's Flare (area fire burst)
  'veil',      // Glacira's Veil (screen-wide freeze)
  'quake',     // Cragus Strike (screen-wide stun)
  'aura',      // Aura Ring (orbiting crystal shield)
  'shadow',    // Shadow Veil (invisibility cloak)
  'chain',     // Chain Anchor (grapple stun)
] as const;
export type WeaponId = typeof WEAPONS[number];
