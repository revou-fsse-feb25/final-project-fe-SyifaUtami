
export interface Assignment {
  id: string;
  name: string;
  title?: string;          
  description?: string;   
  unitCode: string;
  deadline: string;
  dueDate?: string;      
  publishedAt: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}
export interface Student {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  courseCode: string | null;
  year: number | null;
  enrollmentDate?: string;
  studentNumber?: string | null;
  status?: string;
  gpa?: number | null;
  totalCredits?: number;
}

export interface StudentWithGrade extends Student {
  averageGrade: number;
  totalSubmissions: number;
  submittedCount: number;
}

export interface Teacher {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string | null;
  title: string | null;
  accessLevel: string | null;
  courseManaged: string[];
  unitsTeached: string[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  description: string | null;
  courseCode: string;
  currentWeek: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProgress {
  id?: string;
  studentId: string;
  unitCode: string;
  week1Material: 'DONE' | 'NOT_DONE';
  week2Material: 'DONE' | 'NOT_DONE';
  week3Material: 'DONE' | 'NOT_DONE';
  week4Material: 'DONE' | 'NOT_DONE';
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentSubmission {
  id?: string;
  submissionId: string;
  studentId: string;
  assignmentId: string;
  status?: 'OPEN' | 'CLOSED' | null;
  submissionStatus: 'EMPTY' | 'DRAFT' | 'SUBMITTED' | 'UNSUBMITTED';
  submissionName?: string | null;
  submittedAt?: string | null;
  grade?: number | null;
  comment?: string | null;
  gradedBy?: string | null;
  gradedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAssignment extends StudentSubmission {
  assignmentName?: string;
  unitCode?: string;
  unitName?: string;
  deadline?: string;
}

export interface EnrichedSubmission extends StudentSubmission {
  studentName: string;
  studentEmail: string;
}

export interface DashboardMetrics {
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  avgProgress: number;
  avgGrade: number;
  submissionRate: number;
}

export interface CourseMetrics {
  studentCount: number;
  teacherCount: number;
  assignmentCount: number;
  avgProgress: number;
  avgGrade: number;
  submissionRate: number;
  failedAssignments: number;
}

export interface UnitMetrics {
  studentCount: number;
  teacherCount: number;
  assignmentCount: number;
  avgProgress: number;
  avgGrade: number;
  submissionRate: number;
  failedAssignments: number;
}

export interface StudentMetrics {
  totalAssignments: number;
  submittedAssignments: number;
  submissionRate: number;
  averageGrade: number;
  overallProgress: number;
  gradedAssignments: number;
}

export interface StudentAnalytics {
  student: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    courseCode: string | null;
    year: number | null;
  };
  metrics: StudentMetrics;
  submissions: any[];
  progress: any[];
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  total?: number;
  page?: number;
  totalPages?: number;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Specialized response types
export interface StudentsWithDataResult {
  students: StudentWithGrade[];
  assignments?: any[];
  progress?: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssignmentWithSubmissions {
  assignment: Assignment;
  submissions: EnrichedSubmission[];
  totalSubmissions: number;
  submittedCount: number;
  gradedCount: number;
}

export interface AssignmentWithSubmission {
  assignment: Assignment;
  submission?: StudentSubmission;
}

// Academic data structure (from /academic-data endpoint)
export interface AcademicData {
  courses: Course[];
  units: Unit[];
  assignments: Assignment[];
  teachers: Teacher[];
  faculty?: Teacher[];
  coordinators?: Teacher[];
}

// Request/Update interfaces
export interface UpdateGradeRequest {
  grade: number;
  comment?: string;
  gradedBy?: string;
}

export interface UpdateProgressRequest {
  week1Material?: 'DONE' | 'NOT_DONE';
  week2Material?: 'DONE' | 'NOT_DONE';
  week3Material?: 'DONE' | 'NOT_DONE';
  week4Material?: 'DONE' | 'NOT_DONE';
  updatedBy?: string;
}

// UI-specific interfaces
export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface LoadingState {
  course: boolean;
  metrics: boolean;
  units: boolean;
}

export interface TrendData {
  date: string;
  submissions: number;
  averageGrade: number;
}

// Legacy interfaces for backward compatibility
export interface Faculty extends Teacher {}

// Tab interface for UI components
export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  content: React.ReactNode;
}