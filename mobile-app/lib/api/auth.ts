import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'student';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageResponse {
  message: string;
}

export const authApi = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );
    return response.data;
  },

  async register(data: RegisterRequest): Promise<UserResponse> {
    const response = await apiClient.post<UserResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      { ...data, role: data.role || 'student' }
    );
    return response.data;
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.get(`${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${token}`);
  },

  async resendVerification(email: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(
      API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
      { email }
    );
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
    );
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );
    return response.data;
  },

  async getProfile(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  async updateProfile(data: Partial<UserResponse>): Promise<UserResponse> {
    const response = await apiClient.patch<UserResponse>(
      API_ENDPOINTS.AUTH.PROFILE,
      data
    );
    return response.data;
  },

  async deleteAccount(): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(
      API_ENDPOINTS.AUTH.DELETE_ACCOUNT
    );
    return response.data;
  },
};
