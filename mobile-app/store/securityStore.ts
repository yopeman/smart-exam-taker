import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SecurityViolationType = 
  | 'app_backgrounded'
  | 'screenshot_attempted'
  | 'screen_recording_detected'
  | 'dnd_disabled'
  | 'back_navigation_attempted'
  | 'fullscreen_disabled';

export interface SecurityViolation {
  type: SecurityViolationType;
  timestamp: number;
  message: string;
}

interface SecurityState {
  violations: SecurityViolation[];
  isSecurityActive: boolean;
  focusLossCountdown: number;
}

interface SecurityActions {
  addViolation: (violation: SecurityViolation) => void;
  clearViolations: () => void;
  setSecurityActive: (active: boolean) => void;
  setFocusLossCountdown: (countdown: number) => void;
  getViolationCount: () => number;
  hasViolationType: (type: SecurityViolationType) => boolean;
}

export const useSecurityStore = create<SecurityState & SecurityActions>()(
  persist(
    (set, get) => ({
      violations: [],
      isSecurityActive: false,
      focusLossCountdown: 0,

      addViolation: (violation) => 
        set((state) => ({
          violations: [...state.violations, violation]
        })),

      clearViolations: () => 
        set({ violations: [] }),

      setSecurityActive: (active) => 
        set({ isSecurityActive: active }),

      setFocusLossCountdown: (countdown) => 
        set({ focusLossCountdown: countdown }),

      getViolationCount: () => get().violations.length,

      hasViolationType: (type) => 
        get().violations.some((v) => v.type === type),
    }),
    {
      name: 'security-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        violations: state.violations,
        isSecurityActive: state.isSecurityActive,
      }),
    }
  )
);
