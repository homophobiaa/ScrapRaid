import { useEffect, useState, type RefObject } from 'react';

/**
 * Reports whether an element is currently in the viewport. Used to hide the
 * mobile total bar while the full result readout is already on screen.
 */
export function useOnScreen(ref: RefObject<Element | null>): boolean {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry?.isIntersecting ?? true),
      { threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return onScreen;
}
