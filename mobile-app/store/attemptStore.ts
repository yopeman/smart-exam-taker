import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { attemptsApi, Attempt, StartAttemptRequest, SubmitAttemptRequest } from '../lib/api/attempts';
import { OfflineQueue } from '../lib/utils/offlineQueue';


interface AttemptState {
  myAttempts: Attempt[];
  currentAttempt: Attempt | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
}

interface AttemptActions {
  fetchMyAttempts: () => Promise<void>;
  fetchAttemptById: (id: string) => Promise<void>;
  startAttempt: (data: StartAttemptRequest, faceImage?: any) => Promise<void>;
  submitAttempt: (id: string, data: SubmitAttemptRequest) => Promise<void>;
  clearError: () => void;
  setCurrentAttempt: (attempt: Attempt | null) => void;
  updateCurrentAttemptAnswers: (answers: any) => void;
  syncOfflineData: () => Promise<void>;
  setOfflineStatus: (isOffline: boolean) => void;
}

export const useAttemptStore = create<AttemptState & AttemptActions>()(
  persist(
    (set, get) => ({
      myAttempts: [],
      currentAttempt: null,
      isLoading: false,
      error: null,
      isOffline: false,

      fetchMyAttempts: async () => {
        set({ isLoading: true, error: null });
        try {
          const attempts = await attemptsApi.getMyAttempts();
          set({ myAttempts: attempts, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch attempts', 
            isLoading: false 
          });
        }
      },

      fetchAttemptById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const attempt = await attemptsApi.getAttemptById(id);
          set({ currentAttempt: attempt, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch attempt', 
            isLoading: false 
          });
        }
      },

      startAttempt: async (data: StartAttemptRequest, faceImage?: any) => {
        set({ isLoading: true, error: null });
        try {
          const attempt = await attemptsApi.startAttempt(data, faceImage);
          set({ currentAttempt: attempt, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to start attempt', 
            isLoading: false 
          });
        }
      },

      submitAttempt: async (id: string, data: SubmitAttemptRequest) => {
        set({ isLoading: true, error: null });
        try {
          const attempt = await attemptsApi.submitAttempt(id, data);
          set({ currentAttempt: attempt, isLoading: false });
        } catch (error: any) {
          if (get().isOffline) {
            await OfflineQueue.addItem({
              type: 'submit_attempt',
              data: { id, answers: data.answers },
            });
            set({ isLoading: false });
          } else {
            set({ 
              error: error.message || 'Failed to submit attempt', 
              isLoading: false 
            });
          }
        }
      },

      clearError: () => set({ error: null }),
      setCurrentAttempt: (attempt) => set({ currentAttempt: attempt }),
      updateCurrentAttemptAnswers: (answers) => 
        set((state) => ({
          currentAttempt: state.currentAttempt 
            ? { ...state.currentAttempt, answers }
            : null
        })),
      
      syncOfflineData: async () => {
        if (get().isOffline) return;

        const result = await OfflineQueue.processQueue(async (item) => {
          try {
            if (item.type === 'submit_attempt') {
              await attemptsApi.submitAttempt(item.data.id, { answers: item.data.answers });
              return true;
            }
            return false;
          } catch (error) {
            return false;
          }
        });

        if (result.processed > 0) {
          await get().fetchMyAttempts();
        }
      },

      setOfflineStatus: (isOffline) => set({ isOffline }),
    }),
    {
      name: 'attempt-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        currentAttempt: state.currentAttempt 
      }),
    }
  )
);
