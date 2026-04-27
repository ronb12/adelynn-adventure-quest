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

export const WEAPONS = ['sword', 'bow', 'bomb', 'boomerang', 'wand', 'shuriken'] as const;
export type WeaponId = typeof WEAPONS[number];
