export enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  attack = 'attack',
  interact = 'interact',
}

export const keyMap = [
  { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
  { name: Controls.back, keys: ['ArrowDown', 'KeyS'] },
  { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
  { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
  { name: Controls.attack, keys: ['Space', 'KeyJ'] },
  { name: Controls.interact, keys: ['KeyE'] },
];
