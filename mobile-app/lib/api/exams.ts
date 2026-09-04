import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';

export interface Exam {
  id: string;
  school_id: string;
  instructor_id: string;
  code: string;
  title: string;
  description: string | null;
  department: string | null;
  year_of_study: number | null;
  semester: string | null;
  section: string | null;
  document_content: string | null;
  questions: any;
  duration_minutes: number;
  max_students: number | null;
  max_reserved_students: number | null;
  started_by: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StudentExam extends Exam {
  is_available: boolean;
  has_attempted: boolean;
}

export interface ScheduleRequest {
  scheduled_at: string;
}

export interface ExamUpdateRequest {
  title?: string;
  description?: string;
  department?: string;
  year_of_study?: number;
  semester?: string;
  section?: string;
  duration_minutes?: number;
  max_students?: number;
  max_reserved_students?: number;
  questions?: any;
}

export const examsApi = {
  async getAvailableExams(): Promise<StudentExam[]> {
    const response = await apiClient.get<StudentExam[]>(
      API_ENDPOINTS.EXAMS.AVAILABLE
    );
    return response.data;
  },

  async getMyExams(): Promise<Exam[]> {
    const response = await apiClient.get<Exam[]>(API_ENDPOINTS.EXAMS.MY_EXAMS);
    return response.data;
  },

  async getExamById(id: string): Promise<Exam> {
    const response = await apiClient.get<Exam>(API_ENDPOINTS.EXAMS.GET(id));
    return response.data;
  },

  async getExamByCode(code: string): Promise<StudentExam> {
    const response = await apiClient.get<StudentExam>(
      API_ENDPOINTS.EXAMS.BY_CODE(code)
    );
    return response.data;
  },

  async getSchoolExams(schoolId: string): Promise<Exam[]> {
    const response = await apiClient.get<Exam[]>(
      API_ENDPOINTS.EXAMS.LIST_SCHOOL(schoolId)
    );
    return response.data;
  },

  async startExam(id: string): Promise<Exam> {
    const response = await apiClient.post<Exam>(API_ENDPOINTS.EXAMS.START(id));
    return response.data;
  },

  async completeExam(id: string): Promise<Exam> {
    const response = await apiClient.post<Exam>(
      API_ENDPOINTS.EXAMS.COMPLETE(id)
    );
    return response.data;
  },

  async scheduleExam(id: string, data: ScheduleRequest): Promise<Exam> {
    const response = await apiClient.post<Exam>(
      API_ENDPOINTS.EXAMS.SCHEDULE(id),
      data
    );
    return response.data;
  },

  async cancelExam(id: string): Promise<Exam> {
    const response = await apiClient.post<Exam>(API_ENDPOINTS.EXAMS.CANCEL(id));
    return response.data;
  },
};
