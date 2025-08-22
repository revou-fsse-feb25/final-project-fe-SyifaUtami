// src/lib/api.ts
import type { 
  AcademicData, 
  StudentAnalytics, 
  CourseMetrics, 
  UnitMetrics, 
  DashboardMetrics,
  Assignment,
  AssignmentWithSubmission,
  StudentSubmission,
  StudentProgress,
  Unit,
  Teacher
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface LoginResponse {
  success: boolean;
  user: any;
  userType: 'student' | 'coordinator';
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
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
  async login(credentials: { email: string; password: string; userType: 'student' | 'coordinator' }) {
    return this.request<LoginResponse>('/auth/login', {
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
  async getStudents(params?: { 
    page?: number; 
    limit?: number; 
    courseCode?: string; 
    search?: string;
    includeData?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.courseCode) searchParams.append('courseCode', params.courseCode);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.includeData) searchParams.append('includeData', 'true');
    
    const queryString = searchParams.toString();
    return this.request<PaginatedResponse>(`/students${queryString ? `?${queryString}` : ''}`);
  }

  async getStudentsWithGrades(params?: { page?: number; limit?: number; courseCode?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.courseCode) searchParams.append('courseCode', params.courseCode);
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request<PaginatedResponse>(`/students/with-grades${queryString ? `?${queryString}` : ''}`);
  }

  async getStudentStats(courseCode?: string) {
    const queryString = courseCode ? `?courseCode=${courseCode}` : '';
    return this.request(`/students/stats${queryString}`);
  }

  async getStudent(id: string) {
    return this.request(`/students/${id}`);
  }

  async getStudentUnits(id: string) {
    return this.request(`/students/${id}/units`);
  }

  // Teachers methods
  async getTeachers(params?: { page?: number; limit?: number; search?: string; unitCode?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.unitCode) searchParams.append('unitCode', params.unitCode);
    
    const queryString = searchParams.toString();
    return this.request<PaginatedResponse<Teacher>>(`/teachers${queryString ? `?${queryString}` : ''}`);
  }

  async getTeacherStats() {
    return this.request('/teachers/stats');
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
  async getUnits(params?: { 
    page?: number; 
    limit?: number; 
    courseCode?: string; 
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.courseCode) searchParams.append('courseCode', params.courseCode);
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request<PaginatedResponse>(`/units${queryString ? `?${queryString}` : ''}`);
  }

  async getUnitStats(code?: string) {
    const queryString = code ? `?code=${code}` : '';
    return this.request(`/units/stats${queryString}`);
  }

  async getUnitsByCourse(courseCode: string): Promise<Unit[]> {
    return this.request<Unit[]>(`/units/course/${courseCode}`);
  }

  async getUnit(code: string): Promise<Unit> {
    return this.request<Unit>(`/units/${code}`);
  }

  async getUnitWithProgress(code: string) {
    return this.request(`/units/${code}/progress`);
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
    status?: 'open' | 'closed'; 
    includeSubmissions?: boolean;
  }): Promise<AssignmentWithSubmission[]> {
    const searchParams = new URLSearchParams();
    if (params?.unitCode) searchParams.append('unitCode', params.unitCode);
    if (params?.studentId) searchParams.append('studentId', params.studentId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.includeSubmissions) searchParams.append('includeSubmissions', 'true');
    
    const queryString = searchParams.toString();
    return this.request<AssignmentWithSubmission[]>(`/assignments${queryString ? `?${queryString}` : ''}`);
  }

  async getAssignment(id: string, includeSubmissions?: boolean): Promise<Assignment> {
    const queryString = includeSubmissions ? '?includeSubmissions=true' : '';
    return this.request<Assignment>(`/assignments/${id}${queryString}`);
  }

  // Submissions methods - WITH PROPER TYPES
  async getSubmission(submissionId: string): Promise<StudentSubmission> {
    return this.request<StudentSubmission>(`/submissions/${submissionId}`);
  }

  async getStudentSubmissions(studentId: string): Promise<StudentSubmission[]> {
    return this.request<StudentSubmission[]>(`/submissions/student/${studentId}`);
  }

  async updateSubmission(submissionId: string, data: any): Promise<StudentSubmission> {
    return this.request<StudentSubmission>(`/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async gradeSubmission(submissionId: string, gradeData: { grade: number; comment?: string }): Promise<StudentSubmission> {
    return this.request<StudentSubmission>(`/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(gradeData),
    });
  }

  async createSubmission(submissionData: any): Promise<StudentSubmission> {
    return this.request<StudentSubmission>('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  // Student Progress methods - WITH PROPER TYPES
  async getStudentProgress(studentId: string): Promise<StudentProgress[]> {
    return this.request<StudentProgress[]>(`/student-progress/student/${studentId}`);
  }

  async getStudentUnitProgress(studentId: string, unitCode: string): Promise<StudentProgress> {
    return this.request<StudentProgress>(`/student-progress/student/${studentId}/unit/${unitCode}`);
  }

  async getUnitProgressSummary(unitCode: string) {
    return this.request(`/student-progress/unit/${unitCode}`);
  }

  async getProgressPercentage(studentId: string, unitCode: string): Promise<{ percentage: number }> {
    return this.request<{ percentage: number }>(`/student-progress/student/${studentId}/unit/${unitCode}/percentage`);
  }

  async createProgress(progressData: any): Promise<StudentProgress> {
    return this.request<StudentProgress>('/student-progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  }

  async updateStudentProgress(studentId: string, unitCode: string, progressData: any): Promise<StudentProgress> {
    return this.request<StudentProgress>(`/student-progress/student/${studentId}/unit/${unitCode}`, {
      method: 'PUT',
      body: JSON.stringify(progressData),
    });
  }

  async initializeUnitProgress(unitCode: string) {
    return this.request(`/student-progress/unit/${unitCode}/initialize`, {
      method: 'POST',
    });
  }

  // Analytics methods
  async getAnalyticsOverview(): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>('/analytics/overview');
  }

  async getCourseAnalytics(courseCode: string, period?: 'week' | 'month' | 'quarter'): Promise<CourseMetrics> {
    const queryString = period ? `?period=${period}` : '';
    return this.request<CourseMetrics>(`/analytics/course/${courseCode}${queryString}`);
  }

  async getUnitAnalytics(unitCode: string, period?: 'week' | 'month' | 'quarter'): Promise<UnitMetrics> {
    const queryString = period ? `?period=${period}` : '';
    return this.request<UnitMetrics>(`/analytics/unit/${unitCode}${queryString}`);
  }

  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    return this.request<StudentAnalytics>(`/analytics/student/${studentId}`);
  }

  async getTrends(period?: 'week' | 'month' | 'quarter') {
    const queryString = period ? `?period=${period}` : '';
    return this.request(`/analytics/trends${queryString}`);
  }

  // Academic Data methods - WITH PROPER TYPES
  async getAcademicData(): Promise<AcademicData> {
    return this.request<AcademicData>('/academic-data');
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for use in components
export type { LoginResponse, PaginatedResponse, ApiResponse };