// lib/api.ts - Fixed API client with automatic token refresh
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  total?: number;
  page?: number;
  totalPages?: number;
}

interface LoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: any;
  userType: 'student' | 'coordinator';
  expires_in: number;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Check if token is expired or about to expire
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      // Consider token expired if it expires within 5 minutes
      return payload.exp < (now + 300);
    } catch {
      return true;
    }
  }

  // Refresh the access token
  private async refreshToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      this.isRefreshing = false;
      this.refreshPromise = null;
      return newToken;
    } catch (refreshError) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      throw refreshError;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Store new tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      return data.access_token;
    } catch (error) {
      // Refresh failed - clear all auth data and redirect to login
      this.clearAuthData();
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      throw new Error('Session expired. Please log in again.');
    }
  }

  private clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_type');
    // Also clear the old token key if it exists
    localStorage.removeItem('token');
  }

  private async getValidToken(): Promise<string> {
    let token = localStorage.getItem('access_token');
    
    // Fallback to old token key for backward compatibility
    if (!token) {
      token = localStorage.getItem('token');
      if (token) {
        // Migrate to new key
        localStorage.setItem('access_token', token);
        localStorage.removeItem('token');
      }
    }

    if (!token) {
      throw new Error('No authentication token found');
    }

    // Check if token needs refresh
    if (this.isTokenExpired(token)) {
      console.log('🔄 Token expired, refreshing...');
      token = await this.refreshToken();
    }

    return token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const token = await this.getValidToken();
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      };

      console.log(`📡 API ${options.method || 'GET'} ${endpoint}`);

      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401 && retryCount === 0) {
          console.log('🔒 Got 401, attempting token refresh...');
          try {
            await this.refreshToken();
            // Retry the request once with new token
            return this.request<T>(endpoint, options, retryCount + 1);
          } catch (refreshError) {
            this.clearAuthData();
            throw new Error('Session expired. Please log in again.');
          }
        }

        // Handle other errors
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Couldn't parse error response
        }
        
        if (response.status === 500) {
          throw new Error('Internal server error');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ API ${options.method || 'GET'} ${endpoint}: Success`);
      return data;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ API ${options.method || 'GET'} ${endpoint}:`, errorMessage);
      throw error;
    }
  }

  // Auth methods
  async login(credentials: {
    email: string;
    password: string;
    userType: 'student' | 'coordinator';
  }): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use status text
          errorMessage = `Login failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Store tokens and user data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      localStorage.setItem('user_type', data.userType);
      
      console.log('✅ Login successful for:', data.user?.email);
      return data;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ Login failed:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      console.error('Logout API call failed:', errorMessage);
      // Continue with cleanup even if API call fails
    } finally {
      this.clearAuthData();
    }
  }

  // User methods
  async getCurrentUser(): Promise<any> {
    return this.request<any>('/users/me');
  }

  async updateUserProfile(profileData: any): Promise<any> {
    return this.request<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Data fetching methods
  async getAcademicData(): Promise<any> {
    try {
      return await this.request<any>('/academic-data');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch academic data';
      console.error('❌ API: getAcademicData failed:', errorMessage);
      throw error;
    }
  }

  async getAnalyticsOverview(): Promise<any> {
    return this.request<any>('/analytics/overview');
  }

  async getStudents(params?: {
    page?: number;
    limit?: number;
    courseCode?: string;
    search?: string;
  }): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    
    return this.request<any>(`/students${queryString}`);
  }

  async getTeachers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    
    return this.request<any>(`/teachers${queryString}`);
  }

  async getUnits(params?: {
    page?: number;
    limit?: number;
    courseCode?: string;
    search?: string;
  }): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    
    return this.request<any>(`/units${queryString}`);
  }

  async getCourseAnalytics(courseCode: string): Promise<any> {
    return this.request<any>(`/analytics/course/${courseCode}`);
  }

  async getStudentProgress(studentId: string): Promise<any> {
    return this.request<any>(`/student-progress/student/${studentId}`);
  }

  async getAssignments(params?: {
    unitCode?: string;
    studentId?: string;
    status?: string;
    includeSubmissions?: boolean;
  }): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString() : '';
    
    return this.request<any>(`/assignments${queryString}`);
  }

  async getSubmissions(studentId?: string): Promise<any> {
    if (studentId) {
      return this.request<any>(`/submissions/student/${studentId}`);
    }
    return this.request<any>('/submissions');
  }

  async updateSubmission(submissionId: string, data: any): Promise<any> {
    return this.request<any>(`/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async gradeSubmission(submissionId: string, gradeData: any): Promise<any> {
    return this.request<any>(`/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(gradeData),
    });
  }

  async createTeacher(teacherData: any): Promise<any> {
    return this.request<any>('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  }

  async updateTeacher(teacherId: string, teacherData: any): Promise<any> {
    return this.request<any>(`/teachers/${teacherId}`, {
      method: 'PUT',
      body: JSON.stringify(teacherData),
    });
  }

  async deleteTeacher(teacherId: string): Promise<any> {
    return this.request<any>(`/teachers/${teacherId}`, {
      method: 'DELETE',
    });
  }

  async createUnit(unitData: any): Promise<any> {
    return this.request<any>('/units', {
      method: 'POST',
      body: JSON.stringify(unitData),
    });
  }

  async updateUnit(unitCode: string, unitData: any): Promise<any> {
    return this.request<any>(`/units/${unitCode}`, {
      method: 'PUT',
      body: JSON.stringify(unitData),
    });
  }

  async deleteUnit(unitCode: string): Promise<any> {
    return this.request<any>(`/units/${unitCode}`, {
      method: 'DELETE',
    });
  }

  // Add other API methods as needed...
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export const api = apiClient; // For backward compatibility
export default apiClient;