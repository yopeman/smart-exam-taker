import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_CONFIG } from '../../constants/api';
import { secureStorage } from '../storage/secure-storage';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await secureStorage.clear();
          // Navigate to login would be handled by the auth store
        }
        
        // Extract real error message from response
        const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           error.message || 
                           'An error occurred. Please try again.';
        
        const apiError = {
          message: errorMessage,
          status: error.response?.status || 500,
        };
        
        return Promise.reject(apiError);
      }
    );
  }

  public get<T = any>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  public patch<T = any>(url: string, data?: any, config?: any) {
    return this.client.patch<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }

  public upload<T = any>(url: string, formData: FormData, config?: any) {
    return this.client.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  }
}

export const apiClient = new ApiClient();
