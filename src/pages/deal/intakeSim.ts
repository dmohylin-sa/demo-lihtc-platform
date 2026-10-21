// Replay trigger for the intake animation on the Documents page. The guided tour calls replay().
import { create } from 'zustand';

interface IntakeSim {
  token: number;
  replay: () => void;
}

export const useIntakeSim = create<IntakeSim>((set) => ({
  token: 0,
  replay: () => set((s) => ({ token: s.token + 1 })),
}));
