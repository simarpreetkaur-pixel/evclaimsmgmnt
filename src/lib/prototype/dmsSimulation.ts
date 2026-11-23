'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

export type DmsSimulationMode = 'none' | 'integrated';

const STORAGE_KEY = 'pp_dms_simulation';

export const DMS_SIMULATION_OPTIONS: Array<{
  mode: DmsSimulationMode;
  title: string;
}> = [
  {
    mode: 'none',
    title: 'No DMS integration',
  },
  {
    mode: 'integrated',
    title: 'DMS integration',
  },
];

type DmsSimulationStore = {
  mode: DmsSimulationMode;
  setMode: (mode: DmsSimulationMode) => void;
  hydrate: () => void;
};

export const useDmsSimulationStore = create<DmsSimulationStore>((set) => ({
  mode: 'none',
  setMode: (mode) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, mode);
    }
    set({ mode });
  },
  hydrate: () => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'none' || stored === 'integrated') {
      set({ mode: stored });
    }
  },
}));

export function useDmsIntegrated() {
  const mode = useDmsSimulationStore((state) => state.mode);
  const hydrate = useDmsSimulationStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return mode === 'integrated';
}
