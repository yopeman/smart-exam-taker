import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';

export interface AttemptExam {
  id: string;
  title: string;
  code: string;
  questions: any;
}

export interface AttemptSchool {
  id: string;
  name: string;
  logo_url: string | null;
  location: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

export interface Attempt {
  id: string;
  exam_id: string;
  student_id: string | null;
  student_first_name: string;
  student_last_name: string;
  student_id_number: string;
  student_face_url: string | null;
  face_captured_at: string | null;
  department: string | null;
  year_of_study: number | null;
  semester: string | null;
  section: string | null;
  answers: any;
  grading_details: any;
  objective_score: number | null;
  ai_score: number | null;
  total_score: number | null;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  status: string;
  exam?: AttemptExam | null;
  school?: AttemptSchool | null;
  created_at: string;
  updated_at: string;
}

export interface StartAttemptRequest {
  exam_code: string;
  student_first_name: string;
  student_last_name: string;
  student_id_number: string;
  department?: string;
  year_of_study?: number;
  semester?: string;
  section?: string;
}

export interface SubmitAttemptRequest {
  answers: any;
}

export interface UpdateAttemptScoresRequest {
  scores: any;
}

export const attemptsApi = {
  async getMyAttempts(): Promise<Attempt[]> {
    const response = await apiClient.get<Attempt[]>(
      API_ENDPOINTS.ATTEMPTS.MY_ATTEMPTS
    );
    return response.data;
  },

  async getAttemptById(id: string): Promise<Attempt> {
    const response = await apiClient.get<Attempt>(API_ENDPOINTS.ATTEMPTS.GET(id));
    return response.data;
  },

  async startAttempt(
    data: StartAttemptRequest,
    faceImage?: { dataUrl: string; name: string }
  ): Promise<Attempt> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (faceImage) {
      const blob = await (await fetch(faceImage.dataUrl)).blob();
      formData.append('face', blob, faceImage.name);
    }

    const response = await apiClient.upload<Attempt>(
      API_ENDPOINTS.ATTEMPTS.START,
      formData
    );
    return response.data;
  },

  async submitAttempt(id: string, data: SubmitAttemptRequest): Promise<Attempt> {
    const response = await apiClient.post<Attempt>(
      API_ENDPOINTS.ATTEMPTS.SUBMIT(id),
      data
    );
    return response.data;
  },

  async updateAttemptScores(
    id: string,
    data: UpdateAttemptScoresRequest
  ): Promise<Attempt> {
    const response = await apiClient.patch<Attempt>(
      API_ENDPOINTS.ATTEMPTS.UPDATE_SCORES(id),
      data
    );
    return response.data;
  },
};