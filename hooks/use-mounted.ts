"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to determine if component has mounted on the client
 * Useful for preventing hydration mismatches and safely using browser APIs
 * 
 * @returns {boolean} - Whether the component has mounted
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted;
}

/**
 * Hook to safely use window or other browser APIs
 * Returns undefined until component has mounted
 * 
 * @template T The return type of the provided function
 * @param {() => T} fn - Function that uses browser APIs
 * @param {T} [fallback] - Optional fallback value to use during SSR
 * @returns {T | undefined} - The result of the function or fallback/undefined during SSR
 */
export function useClientOnly<T>(fn: () => T, fallback?: T): T | undefined {
  const mounted = useMounted();
  
  if (!mounted) {
    return fallback;
  }
  
  return fn();
}

export default useMounted; 