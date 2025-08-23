// lib/api.ts - Fixed API client
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

interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // FIXED: Look for the correct token key
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      // Log the response for debugging
      console.log(`API ${options.method || 'GET'} ${endpoint}:`, response.status);

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Couldn't parse error response, use default message
        }
        
        if (response.status === 401) {
          // Token expired or invalid - clear all auth data
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_type');
          throw new Error('Session expired. Please log in again.');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // FIXED: Changed method signature to match what AuthManager sends
  async login(credentials: { 
    email: string; 
    password: string; 
    userType: 'student' | 'coordinator' 
  }): Promise<LoginResponse> {
    console.log('API Client: Making login request with:', { 
      email: credentials.email, 
      userType: credentials.userType 
    });
    
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // FIXED: Add refresh token in body, not as URL parameter
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  // Users methods
  async getCurrentUser(): Promise<ApiResponse> {
    return this.request('/users/me');
  }

  async updateProfile(profileData: any): Promise<ApiResponse> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Students methods
  async getStudents(params?: { 
    page?: number; 
    limit?: number; 
    courseCode?: string; 
    search?: string;
  }): Promise<PaginatedResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.courseCode) queryParams.append('courseCode', params.courseCode);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/students?${queryString}` : '/students';
    
    return this.request(endpoint);
  }

  async getStudentsWithGrades(): Promise<PaginatedResponse> {
    return this.request('/students/with-grades');
  }

  async getStudentStats(): Promise<ApiResponse> {
    return this.request('/students/stats');
  }

  async getStudent(id: string): Promise<ApiResponse> {
    return this.request(`/students/${id}`);
  }

  async getStudentUnits(id: string): Promise<ApiResponse> {
    return this.request(`/students/${id}/units`);
  }

  // Teachers methods
  async getTeachers(): Promise<PaginatedResponse> {
    return this.request('/teachers');
  }

  async getTeacherStats(): Promise<ApiResponse> {
    return this.request('/teachers/stats');
  }

  async getTeacher(id: string): Promise<ApiResponse> {
    return this.request(`/teachers/${id}`);
  }

  // Courses methods
  async getCourses(): Promise<PaginatedResponse> {
    return this.request('/courses');
  }

  async getCourse(code: string): Promise<ApiResponse> {
    return this.request(`/courses/${code}`);
  }

  // Units methods
  async getUnits(params?: {
    page?: number;
    limit?: number;
    courseCode?: string;
    search?: string;
  }): Promise<PaginatedResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.courseCode) queryParams.append('courseCode', params.courseCode);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/units?${queryString}` : '/units';
    
    return this.request(endpoint);
  }

  async getUnitStats(): Promise<ApiResponse> {
    return this.request('/units/stats');
  }

  async getUnitsByCourse(courseCode: string): Promise<PaginatedResponse> {
    return this.request(`/units/course/${courseCode}`);
  }

  async getUnit(code: string): Promise<ApiResponse> {
    return this.request(`/units/${code}`);
  }

  async getUnitProgress(code: string): Promise<ApiResponse> {
    return this.request(`/units/${code}/progress`);
  }

  // Assignments methods
  async getAssignments(params?: {
    unitCode?: string;
    studentId?: string;
    status?: string;
    includeSubmissions?: boolean;
  }): Promise<PaginatedResponse> {
    const queryParams = new URLSearchParams();
    if (params?.unitCode) queryParams.append('unitCode', params.unitCode);
    if (params?.studentId) queryParams.append('studentId', params.studentId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.includeSubmissions) queryParams.append('includeSubmissions', 'true');
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/assignments?${queryString}` : '/assignments';
    
    return this.request(endpoint);
  }

  async getAssignment(id: string): Promise<ApiResponse> {
    return this.request(`/assignments/${id}`);
  }

  // Analytics methods
  async getAnalyticsOverview(): Promise<ApiResponse> {
    return this.request('/analytics/overview');
  }

  async getCourseAnalytics(courseCode: string): Promise<ApiResponse> {
    return this.request(`/analytics/course/${courseCode}`);
  }

  async getUnitAnalytics(unitCode: string): Promise<ApiResponse> {
    return this.request(`/analytics/unit/${unitCode}`);
  }

  async getStudentAnalytics(studentId: string): Promise<ApiResponse> {
    return this.request(`/analytics/student/${studentId}`);
  }

  async getTrends(params?: { period?: string }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/analytics/trends?${queryString}` : '/analytics/trends';
    
    return this.request(endpoint);
  }

  // Academic Data methods
  async getAcademicData(): Promise<ApiResponse> {
    return this.request('/academic-data');
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for use in other files
export type { LoginResponse, ApiResponse, PaginatedResponse };