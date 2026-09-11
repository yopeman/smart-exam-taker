import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, BackHandler, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useSecurityStore } from '../store/securityStore';

export type SecurityViolationType = 
  | 'app_backgrounded'
  | 'screenshot_attempted'
  | 'screen_recording_detected'
  | 'dnd_disabled'
  | 'back_navigation_attempted'
  | 'fullscreen_disabled'
  | 'app_blurred'
  | 'fullscreen_violation';

export interface SecurityViolation {
  type: SecurityViolationType;
  timestamp: number;
  message: string;
}

export interface UseExamSecurityOptions {
  enabled?: boolean;
  onViolation?: (violation: SecurityViolation) => void;
  onAutoSubmit?: () => void;
}

export function useExamSecurity(options: UseExamSecurityOptions = {}) {
  const {
    enabled = true,
    onViolation,
    onAutoSubmit,
  } = options;

  const router = useRouter();
  const {
    violations,
    addViolation,
    clearViolations,
    isSecurityActive,
    setSecurityActive,
  } = useSecurityStore();

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [isDndEnabled, setIsDndEnabled] = useState(true);
  const backHandlerRef = useRef<(() => boolean) | null>(null);
  const fullscreenCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmittedRef = useRef(false);
  const onViolationRef = useRef(onViolation);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  onViolationRef.current = onViolation;
  onAutoSubmitRef.current = onAutoSubmit;

  const triggerAutoSubmit = useCallback(
    (type: 'app_blurred' | 'fullscreen_violation', message: string) => {
      if (autoSubmittedRef.current) return;
      autoSubmittedRef.current = true;

      const violation: SecurityViolation = {
        type,
        timestamp: Date.now(),
        message: `${message} - exam submitted`,
      };
      addViolation(violation);
      onViolationRef.current?.(violation);
      onAutoSubmitRef.current?.();
    },
    [addViolation]
  );

  // Prevent screenshot and screen recording
  useEffect(() => {
    if (!enabled || !isSecurityActive) return;

    const setupScreenCapture = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (error) {
        console.error('Failed to prevent screen capture:', error);
      }
    };

    const cleanupScreenCapture = async () => {
      try {
        await ScreenCapture.allowScreenCaptureAsync();
      } catch (error) {
        console.error('Failed to allow screen capture:', error);
      }
    };

    setupScreenCapture();
    return () => {
      cleanupScreenCapture();
    };
  }, [enabled, isSecurityActive]);

  // Prevent back navigation (both hardware and gesture)
  useEffect(() => {
    if (!enabled || !isSecurityActive) return;

    // Prevent hardware back button
    const handleHardwareBack = () => {
      const violation: SecurityViolation = {
        type: 'back_navigation_attempted',
        timestamp: Date.now(),
        message: 'Back navigation attempted during exam',
      };
      addViolation(violation);
      onViolationRef.current?.(violation);
      return true;
    };

    backHandlerRef.current = handleHardwareBack;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);

    // Override router's back behavior by preventing navigation
    const originalBack = router.back;
    router.back = () => {
      handleHardwareBack();
    };

    return () => {
      backHandler.remove();
      router.back = originalBack;
      backHandlerRef.current = null;
    };
  }, [enabled, isSecurityActive, addViolation, router]);

  // Handle app state changes (focus loss) — submit immediately
  useEffect(() => {
    if (!enabled || !isSecurityActive) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        triggerAutoSubmit('app_blurred', 'App lost focus');
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const blurSub = AppState.addEventListener('blur', () => {
      triggerAutoSubmit('app_blurred', 'App lost window focus');
    });

    return () => {
      subscription?.remove();
      blurSub?.remove();
    };
  }, [enabled, isSecurityActive, triggerAutoSubmit]);

  // Check fullscreen status using Dimensions — submit immediately on violation
  useEffect(() => {
    if (!enabled || !isSecurityActive) return;

    const checkFullscreen = () => {
      const screenDim = Dimensions.get('screen');
      const windowDim = Dimensions.get('window');
      const windowOffset = 50;

      const isNotFullscreen =
        screenDim.width > windowDim.width + windowOffset ||
        screenDim.height > windowDim.height + windowOffset;

      if (isNotFullscreen) {
        triggerAutoSubmit('fullscreen_violation', 'App is not in fullscreen mode');
      }
    };

    checkFullscreen();
    fullscreenCheckIntervalRef.current = setInterval(checkFullscreen, 1000);

    return () => {
      if (fullscreenCheckIntervalRef.current) {
        clearInterval(fullscreenCheckIntervalRef.current);
        fullscreenCheckIntervalRef.current = null;
      }
    };
  }, [enabled, isSecurityActive, triggerAutoSubmit]);


  const startSecurity = useCallback(() => {
    autoSubmittedRef.current = false;
    setSecurityActive(true);
    clearViolations();
  }, [setSecurityActive, clearViolations]);

  const stopSecurity = useCallback(() => {
    setSecurityActive(false);
  }, [setSecurityActive]);

  return {
    violations,
    isSecurityActive,
    isScreenRecording,
    isDndEnabled,
    startSecurity,
    stopSecurity,
    clearViolations,
  };
}
