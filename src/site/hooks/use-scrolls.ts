/**
 * Whether an element scrolls sideways, so the page can let the keyboard reach it.
 */
import type { RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * Whether an element is a box that scrolls and its content is wider than it.
 *
 * @param element - The element.
 * @returns `true` when it scrolls sideways.
 */
function scrollsSideways(element: HTMLElement): boolean {
  return (
    getComputedStyle(element).overflowX !== 'visible' && element.scrollWidth > element.clientWidth
  );
}

/**
 * Follows whether an element scrolls sideways, as it and its children change size.
 *
 * @returns A ref to attach, and whether the element scrolls sideways now.
 */
export function useScrolls<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const observer = new ResizeObserver(() => setScrolls(scrollsSideways(element)));
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    return () => observer.disconnect();
  }, []);
  return [ref, scrolls];
}
