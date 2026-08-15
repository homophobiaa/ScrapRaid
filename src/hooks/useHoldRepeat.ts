import { useCallback, useEffect, useRef } from 'react';

const FIRST_DELAY_MS = 380;
const REPEAT_MS = 55;

/**
 * Press-and-hold auto-repeat for the crop steppers. Returns pointer handlers to
 * spread onto a button; the button's own `onClick` still handles taps, keyboard
 * activation and assistive tech.
 */
export function useHoldRepeat(action: () => void): {
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
} {
  const timeout = useRef<number | null>(null);
  const interval = useRef<number | null>(null);
  const latest = useRef(action);
  latest.current = action;

  const stop = useCallback(() => {
    if (timeout.current !== null) window.clearTimeout(timeout.current);
    if (interval.current !== null) window.clearInterval(interval.current);
    timeout.current = null;
    interval.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    timeout.current = window.setTimeout(() => {
      interval.current = window.setInterval(() => latest.current(), REPEAT_MS);
    }, FIRST_DELAY_MS);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  };
}
