import { useEffect, useRef, useState } from 'react';

const PULSE_MS = 1400;

/**
 * Fires a short-lived flag whenever the raid level climbs, so the result panel
 * can flash its warning lamp. Dropping to a lower tier stays silent.
 */
export function useTierEscalation(level: number, enabled: boolean): boolean {
  const previous = useRef(level);
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    const rose = level > previous.current;
    previous.current = level;
    if (!rose || !enabled) return;

    setEscalating(true);
    const timer = window.setTimeout(() => setEscalating(false), PULSE_MS);
    return () => window.clearTimeout(timer);
  }, [level, enabled]);

  return escalating;
}
