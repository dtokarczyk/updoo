'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to check if component is mounted on client side.
 * Useful for avoiding hydration mismatches when using browser-only APIs like localStorage.
 *
 * @returns true if component is mounted on client, false otherwise
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const mounted = useMounted();
 *
 *   if (!mounted) return null; // or return a safe default
 *
 *   // Safe to use localStorage, window, etc.
 *   const value = localStorage.getItem('key');
 *   return <div>{value}</div>;
 * }
 * ```
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  return mounted;
}
