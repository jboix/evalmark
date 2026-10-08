/**
 * An element's width, for charts drawn in real pixels.
 */
import type { RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * Follows the width of an element.
 *
 * @param initial - The width before the first measure.
 * @returns A ref to attach and the current width, in pixels.
 */
export function useWidth<T extends HTMLElement>(initial: number): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (measured !== undefined && measured > 0) setWidth(Math.floor(measured));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
