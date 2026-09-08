import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, BackHandler, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useSecurityStore } from '../store/securityStore';

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

export interface UseExamSecurityOptions {
  enabled?: boolean;
  onViolation?: (violation: SecurityViolation) => void;
  onAutoSubmit?: () => void;
  focusLossTimeout?: number; // seconds before auto-submit on focus loss
}

export function useExamSecurity(options: UseExamSecurityOptions = {}) {
  const {
    enabled = true,
    onViolation,
    onAutoSubmit,
    focusLossTimeout = 5,
  } = options;

  const router = useRouter();
  const {
    violations,
    addViolation,
    clearViolations,
    isSecurityActive,
    setSecurityActive,
    focusLossCountdown,
    setFocusLossCountdown,
  } = useSecurityStore();

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const focusLossTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [isDndEnabled, setIsDndEnabled] = useState(true);
  const backHandlerRef = useRef<(() => boolean) | null>(null);

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

    const subscription = ScreenCapture.addScreenshotListener(() => {
      const violation: SecurityViolation = {
        type: 'screenshot_attempted',
        timestamp: Date.now(),
        message: 'Screenshot attempted - exam will be auto-submitted',
      };
      addViolation(violation);
      onViolation?.(violation);
      onAutoSubmit?.();
    });

    const checkScreenRecording = async () => {
      try {
        const recording = await ScreenCapture.getScreenCaptureInfo();
        setIsScreenRecording(recording.isRecording);
        if (recording.isRecording) {
          const violation: SecurityViolation = {
            type: 'screen_recording_detected',
            timestamp: Date.now(),
            message: 'Screen recording detected - exam will be auto-submitted',
          };
          addViolation(violation);
          onViolation?.(violation);
          onAutoSubmit?.();
        }
      } catch (error) {
        console.error('Failed to check screen recording:', error);
      }
    };

    const recordingInterval = setInterval(checkScreenRecording, 2000);

    return () => {
      subscription?.remove();
      clearInterval(recordingInterval);
      cleanupScreenCapture();
    };
  }, [enabled, isSecurityActive, addViolation, onViolation, onAutoSubmit]);

  // Prevent back navigation (both hardware and gesture)
  useEffect(() => {
    if (!enabled || !isSecurityActive) return;

    // Prevent hardware back button
    const handleHardwareBack = () => {
      return true; // Prevent default back behavior
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
  }, [enabled, isSecurityActive, addViolation, onViolation, onAutoSubmit, router]);

  // Handle app state changes (focus loss)
  useEffect(() => {
    if (!enabled || !isSecurityActive) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed:', appStateRef.current, '->', nextAppState);
      
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App lost focus - start countdown
        console.log('App lost focus, starting countdown:', focusLossTimeout);
        setFocusLossCountdown(focusLossTimeout);
        
        // Clear any existing timer first
        if (focusLossTimerRef.current) {
          clearInterval(focusLossTimerRef.current);
        }
        
        focusLossTimerRef.current = setInterval(() => {
          setFocusLossCountdown((prev) => {
            console.log('Countdown:', prev);
            if (prev <= 1) {
              // Auto-submit when countdown reaches 0
              if (focusLossTimerRef.current) {
                clearInterval(focusLossTimerRef.current);
                focusLossTimerRef.current = null;
              }
              const violation: SecurityViolation = {
                type: 'app_backgrounded',
                timestamp: Date.now(),
                message: 'App left for too long - exam auto-submitted',
              };
              addViolation(violation);
              onViolation?.(violation);
              onAutoSubmit?.();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App regained focus - clear countdown if still within time
        console.log('App regained focus, clearing countdown');
        if (focusLossTimerRef.current) {
          clearInterval(focusLossTimerRef.current);
          focusLossTimerRef.current = null;
        }
        setFocusLossCountdown(0);
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      console.log('Cleaning up app state listener');
      subscription?.remove();
      if (focusLossTimerRef.current) {
        clearInterval(focusLossTimerRef.current);
        focusLossTimerRef.current = null;
      }
    };
  }, [enabled, isSecurityActive, focusLossTimeout, addViolation, onViolation, onAutoSubmit, setFocusLossCountdown]);

  // Check DND status (platform-specific)
  const checkDndStatus = useCallback(async () => {
    if (!enabled || !isSecurityActive) return true;

    // DND checking is restricted on both platforms
    // We'll use a user-verification approach instead
    if (Platform.OS === 'android') {
      // For Android, we can't programmatically check DND without native modules
      // We'll assume it's enabled and show a warning to the user
      setIsDndEnabled(true);
      
      // Show a one-time warning when security starts
      Alert.alert(
        'Do Not Disturb Required',
        'Please enable Do Not Disturb mode in your device settings to ensure a distraction-free exam environment.',
        [{ text: 'OK', style: 'default' }]
      );
      
      return true;
    }
    
    // iOS DND check is restricted by Apple
    // We'll assume enabled and prompt user to manually enable it
    setIsDndEnabled(true);
    
    Alert.alert(
      'Do Not Disturb Required',
      'Please enable Focus/Do Not Disturb mode in your device settings to ensure a distraction-free exam environment.',
      [{ text: 'OK', style: 'default' }]
    );
    
    return true;
  }, [enabled, isSecurityActive]);

  // Enforce fullscreen (platform-specific)
  const enforceFullscreen = useCallback(async () => {
    if (!enabled || !isSecurityActive) return;

    // Note: Fullscreen enforcement requires platform-specific implementations
    // For Android, you can use react-native-fullscreen or similar
    // For iOS, you can use react-native-orientation-locker
    // This is a placeholder for the actual implementation
  }, [enabled, isSecurityActive]);

  const startSecurity = useCallback(() => {
    setSecurityActive(true);
    clearViolations();
    checkDndStatus();
    enforceFullscreen();
  }, [setSecurityActive, clearViolations, checkDndStatus, enforceFullscreen]);

  const stopSecurity = useCallback(() => {
    setSecurityActive(false);
    if (focusLossTimerRef.current) {
      clearInterval(focusLossTimerRef.current);
      focusLossTimerRef.current = null;
    }
    setFocusLossCountdown(0);
  }, [setSecurityActive, setFocusLossCountdown]);

  return {
    violations,
    isSecurityActive,
    focusLossCountdown,
    isScreenRecording,
    isDndEnabled,
    startSecurity,
    stopSecurity,
    clearViolations,
  };
}
