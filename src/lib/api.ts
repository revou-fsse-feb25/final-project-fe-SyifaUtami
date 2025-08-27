// src/lib/api.ts
// Complete API client with consistent authentication handling

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

interface LoginCredentials {
  email: string;
  password: string;
  userType: 'student' | 'coordinator';
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get authentication token with fallback logic
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Primary: access_token (used by authManager)
    // Fallback: token (legacy)
    return localStorage.getItem('access_token') || localStorage.getItem('token');
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    if (typeof window === 'undefined') return;
    
    const keysToRemove = [
      'access_token', 'refresh_token', 'user_data', 'user_type',
      'token', 'user', 'userType' // Legacy keys
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authentication header if required
    if (requireAuth) {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      console.log(`🚀 API ${options.method || 'GET'} ${endpoint}`);
      const response = await fetch(url, config);
      
      console.log(`📡 Response ${response.status} ${response.ok ? '✅' : '❌'}`);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthData();
          throw new Error('Session expired. Please log in again.');
        }
        
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Couldn't parse error response
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ API Error ${endpoint}:`, error);
      throw error;
    }
  }

  // ====== AUTHENTICATION ======
  
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, false);
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }, false);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getProfile(): Promise<any> {
    return this.request('/auth/profile');
  }

  // ====== USERS ======
  
  async getCurrentUser(): Promise<any> {
    return this.request('/users/me');
  }

  async updateProfile(data: any): Promise<any> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ====== STUDENTS ======
  
  async getStudents(params?: {
    page?: number;
    limit?: number;
    courseCode?: string;
    search?: string;
    includeData?: boolean;
  }): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return this.request(`/students${queryString}`);
  }

  async getStudentsWithGrades(): Promise<ApiResponse> {
    return this.request('/students/with-grades');
  }

  async getStudentStats(): Promise<any> {
    return this.request('/students/stats');
  }

  async getStudent(id: string): Promise<any> {
    return this.request(`/students/${id}`);
  }

  async getStudentUnits(id: string): Promise<any> {
    return this.request(`/students/${id}/units`);
  }

  // Add method to get all student progress data
  async getAllStudentProgress(): Promise<ApiResponse> {
    return this.request('/student-progress');
  }

  // ====== TEACHERS ======
  
  async getTeachers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return this.request(`/teachers${queryString}`);
  }

  async getTeacherStats(): Promise<any> {
    return this.request('/teachers/stats');
  }

  async getTeacher(id: string): Promise<any> {
    return this.request(`/teachers/${id}`);
  }

  async createTeacher(data: any): Promise<any> {
    return this.request('/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeacher(id: string, data: any): Promise<any> {
    return this.request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTeacher(id: string): Promise<any> {
    return this.request(`/teachers/${id}`, { method: 'DELETE' });
  }

  // ====== COURSES ======
  
  async getCourses(): Promise<ApiResponse> {
    return this.request('/courses');
  }

  async getCourse(code: string): Promise<any> {
    return this.request(`/courses/${code}`);
  }

  // ====== UNITS ======
  
  async getUnits(params?: {
    page?: number;
    limit?: number;
    courseCode?: string;
    search?: string;
  }): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return this.request(`/units${queryString}`);
  }

  async getUnitStats(): Promise<any> {
    return this.request('/units/stats');
  }

  async getUnitsByCourse(courseCode: string): Promise<ApiResponse> {
    return this.request(`/units/course/${courseCode}`);
  }

  async getUnit(code: string): Promise<any> {
    return this.request(`/units/${code}`);
  }

  async getUnitProgress(code: string): Promise<any> {
    return this.request(`/units/${code}/progress`);
  }

  async createUnit(data: any): Promise<any> {
    return this.request('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUnit(code: string, data: any): Promise<any> {
    return this.request(`/units/${code}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUnit(code: string): Promise<any> {
    return this.request(`/units/${code}`, { method: 'DELETE' });
  }

  // ====== ASSIGNMENTS ======
  
  async getAssignments(params?: {
    unitCode?: string;
    studentId?: string;
    status?: 'open' | 'closed';
    includeSubmissions?: boolean;
  }): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return this.request(`/assignments${queryString}`);
  }

  async getAssignment(id: string): Promise<any> {
    return this.request(`/assignments/${id}`);
  }

  // ====== SUBMISSIONS ======
  
  async getSubmission(submissionId: string): Promise<any> {
    return this.request(`/submissions/${submissionId}`);
  }

  async getStudentSubmissions(studentId: string): Promise<any> {
    return this.request(`/submissions/student/${studentId}`);
  }

  async updateSubmission(submissionId: string, data: any): Promise<any> {
    return this.request(`/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async gradeSubmission(submissionId: string, grade: any): Promise<any> {
    return this.request(`/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(grade),
    });
  }

  // ====== STUDENT PROGRESS ======
  
  async getStudentProgress(studentId: string): Promise<any> {
    return this.request(`/student-progress/student/${studentId}`);
  }

  async getStudentUnitProgress(studentId: string, unitCode: string): Promise<any> {
    return this.request(`/student-progress/student/${studentId}/unit/${unitCode}`);
  }

  async getUnitStudentProgress(unitCode: string): Promise<any> {
    return this.request(`/student-progress/unit/${unitCode}`);
  }

  async getProgressPercentage(studentId: string, unitCode: string): Promise<any> {
    return this.request(`/student-progress/student/${studentId}/unit/${unitCode}/percentage`);
  }

  async createProgress(data: any): Promise<any> {
    return this.request('/student-progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProgress(studentId: string, unitCode: string, data: any): Promise<any> {
    return this.request(`/student-progress/student/${studentId}/unit/${unitCode}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async initializeUnitProgress(unitCode: string): Promise<any> {
    return this.request(`/student-progress/unit/${unitCode}/initialize`, {
      method: 'POST',
    });
  }

  // ====== ANALYTICS ======
  
  async getAnalyticsOverview(): Promise<any> {
    return this.request('/analytics/overview');
  }

  async getCourseAnalytics(courseCode: string): Promise<any> {
    return this.request(`/analytics/course/${courseCode}`);
  }

  async getUnitAnalytics(unitCode: string): Promise<any> {
    return this.request(`/analytics/unit/${unitCode}`);
  }

  async getStudentAnalytics(studentId: string): Promise<any> {
    return this.request(`/analytics/student/${studentId}`);
  }

  async getAnalyticsTrends(params?: {
    period?: 'week' | 'month' | 'quarter';
  }): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return this.request(`/analytics/trends${queryString}`);
  }

  // ====== ACADEMIC DATA ======
  
  async getAcademicData(): Promise<any> {
    return this.request('/academic-data');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances if needed
export { ApiClient };

// Export types
export type { ApiResponse, LoginResponse, LoginCredentials };

