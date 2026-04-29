import { useEffect, useRef, useState, useCallback } from 'react';
import { mobileInput } from './mobileControls';
import { useGameStore } from './store';

// ── Detect if device supports touch ──────────────────────────────
export function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      setMobile(
        window.matchMedia('(pointer: coarse)').matches ||
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      );
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

// ── Virtual Joystick ─────────────────────────────────────────────
const BASE_R  = 58;  // outer ring radius px
const KNOB_R  = 22;  // inner knob radius px
const DEADZONE = 0.22;

function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchId  = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const resetKnob = useCallback(() => {
    mobileInput.forward = false;
    mobileInput.back    = false;
    mobileInput.left    = false;
    mobileInput.right   = false;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    }
  }, []);

  const handleMove = useCallback((cx: number, cy: number) => {
    const dx = cx - centerRef.current.x;
    const dy = cy - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = BASE_R;
    const clamp = Math.min(dist, maxDist);
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;

    // Move knob visually
    if (knobRef.current) {
      knobRef.current.style.transform =
        `translate(calc(-50% + ${nx * clamp}px), calc(-50% + ${ny * clamp}px))`;
    }

    // Normalised values -1..1
    const normX = clamp > maxDist * DEADZONE ? nx : 0;
    const normY = clamp > maxDist * DEADZONE ? ny : 0;

    mobileInput.right   = normX >  0.35;
    mobileInput.left    = normX < -0.35;
    mobileInput.forward = normY < -0.35;
    mobileInput.back    = normY >  0.35;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchId.current !== null) return;
    const t = e.changedTouches[0];
    touchId.current = t.identifier;
    const rect = baseRef.current!.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    handleMove(t.clientX, t.clientY);
  }, [handleMove]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchId.current) {
        handleMove(e.touches[i].clientX, e.touches[i].clientY);
        break;
      }
    }
  }, [handleMove]);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        touchId.current = null;
        resetKnob();
        break;
      }
    }
  }, [resetKnob]);

  useEffect(() => {
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchMove, onTouchEnd]);

  return (
    <div
      ref={baseRef}
      onTouchStart={onTouchStart}
      className="relative select-none"
      style={{
        width:  BASE_R * 2,
        height: BASE_R * 2,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        border: '2px solid rgba(255,255,255,0.25)',
        touchAction: 'none',
      }}
    >
      {/* Directional guides */}
      {['↑','↓','←','→'].map((arrow, i) => {
        const positions = [
          { top: 4, left: '50%', transform: 'translateX(-50%)' },
          { bottom: 4, left: '50%', transform: 'translateX(-50%)' },
          { left: 4, top: '50%', transform: 'translateY(-50%)' },
          { right: 4, top: '50%', transform: 'translateY(-50%)' },
        ];
        return (
          <span key={i} className="absolute text-white/30 text-xs font-bold pointer-events-none"
            style={positions[i]}>{arrow}</span>
        );
      })}
      {/* Knob */}
      <div
        ref={knobRef}
        className="absolute pointer-events-none"
        style={{
          width: KNOB_R * 2,
          height: KNOB_R * 2,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.35)',
          border: '2px solid rgba(255,255,255,0.55)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'none',
        }}
      />
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────
interface ActionButtonProps {
  label: string;
  sublabel?: string;
  color: string;
  size?: number;
  onPress?: () => void;
  onRelease?: () => void;
  flag?: keyof typeof mobileInput;
}

function ActionButton({ label, sublabel, color, size = 60, onPress, onRelease, flag }: ActionButtonProps) {
  const pressedRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (pressedRef.current) return;
    pressedRef.current = true;
    if (flag) (mobileInput[flag] as boolean) = true;
    onPress?.();
  }, [flag, onPress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    pressedRef.current = false;
    if (flag && flag !== 'attack' && flag !== 'shield' && flag !== 'jump') {
      // Impulse — keep true for ~1 frame, Player.tsx clears it
    } else if (flag) {
      (mobileInput[flag] as boolean) = false;
    }
    onRelease?.();
  }, [flag, onRelease]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="flex flex-col items-center justify-center select-none active:scale-90 transition-transform"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        border: '2px solid rgba(255,255,255,0.4)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <span className="text-white font-bold text-sm leading-none">{label}</span>
      {sublabel && <span className="text-white/70 text-xs leading-none mt-0.5">{sublabel}</span>}
    </div>
  );
}

// ── Main MobileControls overlay ───────────────────────────────────
export function MobileControls() {
  const isMobile = useIsMobile();
  const gameState = useGameStore(s => s.gameState);
  const store = useGameStore.getState;

  // Impulse-flag flusher (called from Player.tsx, but we also auto-clear after 80ms)
  useEffect(() => {
    const id = setInterval(() => {
      mobileInput.interact   = false;
      mobileInput.nextWeapon = false;
      mobileInput.prevWeapon = false;
      mobileInput.swordCycle = false;
    }, 80);
    return () => clearInterval(id);
  }, []);

  if (!isMobile || gameState !== 'playing') return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 7000 }}
    >
      {/* ── Left side: joystick ── */}
      <div
        className="absolute pointer-events-auto"
        style={{ bottom: 32, left: 24 }}
      >
        <Joystick />
      </div>

      {/* ── Right side: action buttons ── */}
      <div
        className="absolute pointer-events-auto flex flex-col items-end gap-3"
        style={{ bottom: 32, right: 20 }}
      >
        {/* Row 1: Interact + Weapon cycle buttons */}
        <div className="flex gap-2">
          <ActionButton
            label="Z" sublabel="Sword"
            color="rgba(170,0,255,0.7)" size={44}
            flag="swordCycle"
          />
          <ActionButton
            label="«" sublabel="Prev"
            color="rgba(60,80,120,0.7)" size={44}
            flag="prevWeapon"
          />
          <ActionButton
            label="»" sublabel="Next"
            color="rgba(60,80,120,0.7)" size={44}
            flag="nextWeapon"
          />
          <ActionButton
            label="E" sublabel="Talk"
            color="rgba(30,130,60,0.7)" size={44}
            flag="interact"
          />
        </div>

        {/* Row 2: Main action buttons */}
        <div className="flex gap-3 items-end">
          <ActionButton
            label="🛡" sublabel="Block"
            color="rgba(60,60,180,0.75)" size={52}
            flag="shield"
          />
          <ActionButton
            label="↑" sublabel="Jump"
            color="rgba(40,160,80,0.80)" size={52}
            flag="jump"
          />
          <ActionButton
            label="⚔" sublabel="Attack"
            color="rgba(220,60,60,0.85)" size={72}
            flag="attack"
          />
        </div>
      </div>
    </div>
  );
}
