import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { examsApi, Exam, StudentExam } from '../lib/api/exams';

interface ExamState {
  availableExams: StudentExam[];
  myExams: Exam[];
  currentExam: Exam | null;
  isLoading: boolean;
  error: string | null;
}

interface ExamActions {
  fetchAvailableExams: () => Promise<void>;
  fetchMyExams: () => Promise<void>;
  fetchExamById: (id: string) => Promise<void>;
  startExam: (id: string) => Promise<void>;
  completeExam: (id: string) => Promise<void>;
  clearError: () => void;
  setCurrentExam: (exam: Exam | null) => void;
}

export const useExamStore = create<ExamState & ExamActions>()(
  persist(
    (set, get) => ({
      availableExams: [],
      myExams: [],
      currentExam: null,
      isLoading: false,
      error: null,

      fetchAvailableExams: async () => {
        set({ isLoading: true, error: null });
        try {
          const exams = await examsApi.getAvailableExams();
          set({ availableExams: exams, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch exams', 
            isLoading: false 
          });
        }
      },

      fetchMyExams: async () => {
        set({ isLoading: true, error: null });
        try {
          const exams = await examsApi.getMyExams();
          set({ myExams: exams, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch exams', 
            isLoading: false 
          });
        }
      },

      fetchExamById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const exam = await examsApi.getExamById(id);
          set({ currentExam: exam, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch exam', 
            isLoading: false 
          });
        }
      },

      startExam: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const exam = await examsApi.startExam(id);
          set({ currentExam: exam, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to start exam', 
            isLoading: false 
          });
        }
      },

      completeExam: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const exam = await examsApi.completeExam(id);
          set({ currentExam: exam, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to complete exam', 
            isLoading: false 
          });
        }
      },

      clearError: () => set({ error: null }),
      setCurrentExam: (exam) => set({ currentExam: exam }),
    }),
    {
      name: 'exam-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        currentExam: state.currentExam 
      }),
    }
  )
);
