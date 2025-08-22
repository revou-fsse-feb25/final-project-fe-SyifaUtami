
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Helper method to get auth headers
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(includeAuth),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: { email: string; password: string; userType: string }) {
    return this.request<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: any;
      userType: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, false);
  }

  async refreshToken(refreshToken: string) {
    return this.request<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }, false);
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request('/users/me');
  }

  // Students methods
  async getStudents(params?: { page?: number; limit?: number; courseCode?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.courseCode) searchParams.append('courseCode', params.courseCode);
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request<ApiResponse>(`/students${queryString ? `?${queryString}` : ''}`);
  }

  async getStudent(id: string) {
    return this.request(`/students/${id}`);
  }

  async getStudentUnits(id: string) {
    return this.request(`/students/${id}/units`);
  }

  // Teachers methods
  async getTeachers() {
    return this.request('/teachers');
  }

  async getTeacher(id: string) {
    return this.request(`/teachers/${id}`);
  }

  async createTeacher(teacherData: any) {
    return this.request('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  }

  async updateTeacher(id: string, teacherData: any) {
    return this.request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacherData),
    });
  }

  async deleteTeacher(id: string) {
    return this.request(`/teachers/${id}`, { method: 'DELETE' });
  }

  // Courses methods
  async getCourses() {
    return this.request('/courses');
  }

  async getCourse(code: string) {
    return this.request(`/courses/${code}`);
  }

  // Units methods
  async getUnits(params?: { page?: number; limit?: number; courseCode?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.courseCode) searchParams.append('courseCode', params.courseCode);
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request<ApiResponse>(`/units${queryString ? `?${queryString}` : ''}`);
  }

  async getUnit(code: string) {
    return this.request(`/units/${code}`);
  }

  async createUnit(unitData: any) {
    return this.request('/units', {
      method: 'POST',
      body: JSON.stringify(unitData),
    });
  }

  async updateUnit(code: string, unitData: any) {
    return this.request(`/units/${code}`, {
      method: 'PUT',
      body: JSON.stringify(unitData),
    });
  }

  async deleteUnit(code: string) {
    return this.request(`/units/${code}`, { method: 'DELETE' });
  }

  // Assignments methods
  async getAssignments(params?: { 
    unitCode?: string; 
    studentId?: string; 
    status?: string; 
    includeSubmissions?: boolean 
  }) {
    const searchParams = new URLSearchParams();
    if (params?.unitCode) searchParams.append('unitCode', params.unitCode);
    if (params?.studentId) searchParams.append('studentId', params.studentId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.includeSubmissions) searchParams.append('includeSubmissions', 'true');
    
    const queryString = searchParams.toString();
    return this.request<ApiResponse>(`/assignments${queryString ? `?${queryString}` : ''}`);
  }

  async getAssignment(id: string) {
    return this.request(`/assignments/${id}`);
  }

  // Submissions methods
  async getSubmission(submissionId: string) {
    return this.request(`/submissions/${submissionId}`);
  }

  async updateSubmission(submissionId: string, data: any) {
    return this.request(`/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async gradeSubmission(submissionId: string, gradeData: { grade: number; comment?: string }) {
    return this.request(`/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(gradeData),
    });
  }

  // Student Progress methods
  async getStudentProgress(studentId: string) {
    return this.request(`/student-progress/student/${studentId}`);
  }

  async getUnitProgress(unitCode: string) {
    return this.request(`/student-progress/unit/${unitCode}`);
  }

  async updateStudentProgress(studentId: string, unitCode: string, progressData: any) {
    return this.request(`/student-progress/student/${studentId}/unit/${unitCode}`, {
      method: 'PUT',
      body: JSON.stringify(progressData),
    });
  }

  // Analytics methods
  async getAnalyticsOverview() {
    return this.request('/analytics/overview');
  }

  async getCourseAnalytics(courseCode: string) {
    return this.request(`/analytics/course/${courseCode}`);
  }

  async getUnitAnalytics(unitCode: string) {
    return this.request(`/analytics/unit/${unitCode}`);
  }

  async getStudentAnalytics(studentId: string) {
    return this.request(`/analytics/student/${studentId}`);
  }

  // Academic Data methods
  async getAcademicData() {
    return this.request('/academic-data');
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for use in components
export type { ApiResponse };