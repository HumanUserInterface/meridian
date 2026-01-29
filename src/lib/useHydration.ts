import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Checks if we're on the client (not SSR)
 */
export function useHydration() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
