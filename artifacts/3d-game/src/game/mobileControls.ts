// Module-level mobile input state — read by Player.tsx each frame.
// MobileControls.tsx writes into this object via touch events.
export const mobileInput = {
  forward:    false,
  back:       false,
  left:       false,
  right:      false,
  attack:     false,
  shield:     false,
  run:        false,
  jump:       false,
  // Impulse flags — Player.tsx clears these after reading
  interact:   false,
  nextWeapon: false,
  prevWeapon: false,
  swordCycle: false,
};
