import { useSyncExternalStore, useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectsStore } from '@/stores/projectsStore';

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

/**
 * Checks if Zustand stores have finished hydrating from localStorage.
 * This is crucial because persist middleware hydrates asynchronously.
 */
export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if stores have already hydrated
    const projectStoreHydrated = useProjectStore.persist.hasHydrated();
    const projectsStoreHydrated = useProjectsStore.persist.hasHydrated();

    if (projectStoreHydrated && projectsStoreHydrated) {
      setHydrated(true);
      return;
    }

    // Subscribe to hydration completion
    const unsubProject = useProjectStore.persist.onFinishHydration(() => {
      if (useProjectsStore.persist.hasHydrated()) {
        setHydrated(true);
      }
    });

    const unsubProjects = useProjectsStore.persist.onFinishHydration(() => {
      if (useProjectStore.persist.hasHydrated()) {
        setHydrated(true);
      }
    });

    return () => {
      unsubProject();
      unsubProjects();
    };
  }, []);

  return hydrated;
}
