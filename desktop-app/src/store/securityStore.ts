import { create } from 'zustand';

export type SecurityViolationType =
  | 'app_backgrounded'
  | 'app_blurred'
  | 'window_minimized'
  | 'fullscreen_violation'
  | 'focus_lost';

export interface SecurityViolation {
  type: SecurityViolationType;
  timestamp: number;
  message: string;
}

interface SecurityState {
  violations: SecurityViolation[];
  isSecurityActive: boolean;
}

interface SecurityActions {
  addViolation: (violation: SecurityViolation) => void;
  clearViolations: () => void;
  setSecurityActive: (active: boolean) => void;
  getViolationCount: () => number;
  hasViolationType: (type: SecurityViolationType) => boolean;
}

export const useSecurityStore = create<SecurityState & SecurityActions>((set, get) => ({
  violations: [],
  isSecurityActive: false,

  addViolation: (violation) =>
    set((state) => ({
      violations: [...state.violations, violation],
    })),

  clearViolations: () =>
    set({ violations: [] }),

  setSecurityActive: (active) =>
    set({ isSecurityActive: active }),

  getViolationCount: () => get().violations.length,

  hasViolationType: (type) =>
    get().violations.some((v) => v.type === type),
}));