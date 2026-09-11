import { useEffect, useRef, useCallback } from 'react';
import { useSecurityStore } from '../store/securityStore';
import { apiClient } from '../lib/api/client';
import { API_ENDPOINTS } from '../constants/api';

export interface ExamSecurityOptions {
  enabled: boolean;
  maxViolations?: number;
  onViolation?: (violation: { type: string; message: string }) => void;
  onAutoSubmit?: () => void;
}

const hasElectronAPI = () =>
  typeof window !== 'undefined' && !!(window as any).electronAPI;

export const useExamSecurity = ({
  enabled,
  maxViolations = 3,
  onViolation,
  onAutoSubmit,
}: ExamSecurityOptions) => {
  const { violations, isSecurityActive, addViolation, clearViolations, setSecurityActive } =
    useSecurityStore();
  const callbacksRef = useRef({ onViolation, onAutoSubmit, maxViolations });
  callbacksRef.current = { onViolation, onAutoSubmit, maxViolations };

  useEffect(() => {
    setSecurityActive(enabled);
    if (!enabled) {
      clearViolations();
      return;
    }

    if (!hasElectronAPI()) return;

    const api = (window as any).electronAPI;

    const record = (type: string, message: string) => {
      addViolation({ type: type as any, timestamp: Date.now(), message });
      callbacksRef.current.onViolation?.({ type, message });
    };

    const handleBlur = () => record('app_blurred', 'The exam window lost focus. Avoid switching to other applications.');
    const handleMinimize = () => record('window_minimized', 'The exam window was minimized.');
    const handleFocus = () => {};
    const handleCloseBlocked = () =>
      record('close_blocked', 'Closing the app is disabled while the exam is in progress.');

    const handleVisibilityChange = () => {
      if (document.hidden) {
        record('app_backgrounded', 'The exam window was hidden.');
      }
    };

    const handleFullScreen = (isFullScreen: boolean) => {
      if (!isFullScreen && useSecurityStore.getState().isSecurityActive) {
        record('fullscreen_violation', 'Fullscreen was exited during the exam.');
        api.setFullScreen(true);
      }
    };

    api.setLockdown?.(true);
    const unsubCloseBlocked = api.onCloseBlocked
      ? api.onCloseBlocked(handleCloseBlocked)
      : null;

    api.onBlur(handleBlur);
    api.onMinimize(handleMinimize);
    api.onFocus(handleFocus);
    api.onFullScreenChange(handleFullScreen);

    const checkInterval = setInterval(() => {
      const count = useSecurityStore.getState().violations.length;
      if (count >= callbacksRef.current.maxViolations) {
        clearInterval(checkInterval);
        callbacksRef.current.onAutoSubmit?.();
      }
    }, 1500);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(checkInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubCloseBlocked?.();
      api.setLockdown?.(false);
    };
  }, [enabled, addViolation, setSecurityActive, clearViolations]);

  const clearAll = useCallback(() => {
    clearViolations();
  }, [clearViolations]);

  return {
    violations,
    isSecurityActive,
    clearViolations: clearAll,
  };
};

export const fetchScenarioImage = async (fileId: string): Promise<string | null> => {
  try {
    const response = await apiClient.get<{ data: string }>(API_ENDPOINTS.FILES.GET(fileId));
    if (response.data?.data) {
      return `data:image/jpeg;base64,${response.data.data}`;
    }
    return null;
  } catch {
    return null;
  }
};