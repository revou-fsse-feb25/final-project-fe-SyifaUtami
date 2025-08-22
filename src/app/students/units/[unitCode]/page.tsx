const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  total?: number;
  page?: number;
  totalPages?: number;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: any;
  userType: 'student' | 'coordinator';
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

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string, userType: 'student' | 'coordinator'): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, userType }),
    });
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/refresh', {
      method: 'POST',
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
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.courseCode) searchParams.append('courseCode', params.courseCode);
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request<PaginatedResponse>(`/students${queryString ? `?${queryString}` : ''}`);
  }

  async getStudentsWithGrades(params?: { 
    page?: number; 
    limit?: number; 
    courseCode?: string; 
    search?: string;
  }): Promise<PaginatedResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.courseCode) searchParams.append('courseCode', params.courseCode);
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request<PaginatedResponse>(`/students/with-grades${queryString ? `?${queryString}` : ''}`);
  }

  async getStudentStats(courseCode?: string): Promise<ApiResponse> {
    const queryString = courseCode ? `?courseCode=${courseCode}` : '';
    return this.request(`/students/stats${queryString}`);
  }

  async getStudent(id: string): Promise<ApiResponse> {
    return this.request(`/students/${id}`);
  }

  async getStudentUnits(id: string): Promise<ApiResponse> {
    return this.request(`/students/${id}/units`);
  }

  // Teachers methods
  async getTeachers(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
  }): Promise<PaginatedResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request<PaginatedResponse>(`/teachers${queryString ? `?${queryString}` : ''}`);
  }

  async getTeacherStats(): Promise<ApiResponse> {
    return this.request('/teachers/stats');
  }

  async getTeacher(id: string): Promise<ApiResponse> {
    return this.request(`/teachers/${id}`);
  }

  async createTeacher(teacherData: any): Promise<ApiResponse> {
    return this.request('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  }

  async updateTeacher(id: string, teacherData: any): Promise<ApiResponse> {
    return this.request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacherData),
    });
  }

  async deleteTeacher(id: string): Promise<ApiResponse> {
    return this.request(`/teachers/${id}`, { method: 'DELETE' });
  }

  // Courses methods
  async getCourses(): Promise<ApiResponse> {
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
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.courseCode) searchParams.append('courseCode', params.courseCode);
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request<PaginatedResponse>(`/units${queryString ? `?${queryString}` : ''}`);
  }

  async getUnitStats(courseCode?: string): Promise<ApiResponse> {
    const queryString = courseCode ? `?courseCode=${courseCode}` : '';
    return this.request(`/units/stats${queryString}`);
  }

  async getUnitsByCourse(courseCode: string): Promise<ApiResponse> {
    return this.request(`/units/course/${courseCode}`);
  }

  async getUnit(code: string): Promise<ApiResponse> {
    return this.request(`/units/${code}`);
  }

  async getUnitWithProgress(code: string): Promise<ApiResponse> {
    return this.request(`/units/${code}/progress`);
  }

  async createUnit(unitData: any): Promise<ApiResponse> {
    return this.request('/units', {
      method: 'POST',
      body: JSON.stringify(unitData),
    });
  }

  async updateUnit(code: string, unitData: any): Promise<ApiResponse> {
    return this.request(`/units/${code}`, {
      method: 'PUT',
      body: JSON.stringify(unitData),
    });
  }

  async deleteUnit(code: string): Promise<ApiResponse> {
    return this.request(`/units/${code}`, { method: 'DELETE' });
  }

  // Assignments methods
  async getAssignments(params?: { 
    unitCode?: string; 
    studentId?: string; 
    status?: string;
    includeSubmissions?: boolean;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.unitCode) searchParams.append('unitCode', params.unitCode);
    if (params?.studentId) searchParams.append('studentId', params.studentId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.includeSubmissions) searchParams.append('includeSubmissions', 'true');
    
    const queryString = searchParams.toString();
    return this.request(`/assignments${queryString ? `?${queryString}` : ''}`);
  }

  async getAssignment(id: string): Promise<ApiResponse> {
    return this.request(`/assignments/${id}`);
  }

  // Submissions methods
  async getSubmission(submissionId: string): Promise<ApiResponse> {
    return this.request(`/submissions/${submissionId}`);
  }

  async getStudentSubmissions(studentId: string): Promise<ApiResponse> {
    return this.request(`/submissions/student/${studentId}`);
  }

  async updateSubmission(submissionId: string, submissionData: any): Promise<ApiResponse> {
    return this.request(`/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(submissionData),
    });
  }

  async gradeSubmission(submissionId: string, gradeData: any): Promise<ApiResponse> {
    return this.request(`/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(gradeData),
    });
  }

  // Student Progress methods
  async getStudentProgress(studentId: string): Promise<ApiResponse> {
    return this.request(`/student-progress/student/${studentId}`);
  }

  async getStudentUnitProgress(studentId: string, unitCode: string): Promise<ApiResponse> {
    return this.request(`/student-progress/student/${studentId}/unit/${unitCode}`);
  }

  async getUnitProgress(unitCode: string): Promise<ApiResponse> {
    return this.request(`/student-progress/unit/${unitCode}`);
  }

  async getStudentProgressPercentage(studentId: string, unitCode: string): Promise<ApiResponse> {
    return this.request(`/student-progress/student/${studentId}/unit/${unitCode}/percentage`);
  }

  async createStudentProgress(progressData: any): Promise<ApiResponse> {
    return this.request('/student-progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  }

  async updateStudentProgress(studentId: string, unitCode: string, progressData: any): Promise<ApiResponse> {
    return this.request(`/student-progress/student/${studentId}/unit/${unitCode}`, {
      method: 'PUT',
      body: JSON.stringify(progressData),
    });
  }

  async initializeUnitProgress(unitCode: string): Promise<ApiResponse> {
    return this.request(`/student-progress/unit/${unitCode}/initialize`, {
      method: 'POST',
    });
  }

  // Analytics methods
  async getAnalyticsOverview(): Promise<ApiResponse> {
    return this.request('/analytics/overview');
  }

  async getCourseAnalytics(courseCode: string, period?: 'week' | 'month' | 'quarter'): Promise<ApiResponse> {
    const queryString = period ? `?period=${period}` : '';
    return this.request(`/analytics/course/${courseCode}${queryString}`);
  }

  async getUnitAnalytics(unitCode: string, period?: 'week' | 'month' | 'quarter'): Promise<ApiResponse> {
    const queryString = period ? `?period=${period}` : '';
    return this.request(`/analytics/unit/${unitCode}${queryString}`);
  }

  async getStudentAnalytics(studentId: string): Promise<ApiResponse> {
    return this.request(`/analytics/student/${studentId}`);
  }

  async getTrends(period?: 'week' | 'month' | 'quarter'): Promise<ApiResponse> {
    const queryString = period ? `?period=${period}` : '';
    return this.request(`/analytics/trends${queryString}`);
  }

  async getAcademicData(): Promise<ApiResponse> {
    return this.request('/academic-data');
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for use in components
export type { LoginResponse, PaginatedResponse, ApiResponse };