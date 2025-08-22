
export interface StudentProgress {
  studentId: string;
  unitCode: string;
  week1Material: "DONE" | "NOT_DONE";  // Backend uses enum values
  week2Material: "DONE" | "NOT_DONE";
  week3Material: "DONE" | "NOT_DONE";
  week4Material: "DONE" | "NOT_DONE";
}

export interface Assignment {
  id: string;
  title: string;        // Backend uses 'title' not 'name'
  description: string;
  unitCode: string;
  dueDate: string;     // Backend uses 'dueDate' not 'deadline'
  status: "OPEN" | "CLOSED";  // Backend enum values
  maxPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  description: string | null;  // Backend can return null
  courseCode: string;
  currentWeek: number;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubmission {
  submissionId: string;  // Required, not optional
  studentId: string;
  assignmentId: string;
  submissionStatus: 'EMPTY' | 'DRAFT' | 'SUBMITTED' | 'UNSUBMITTED';  // Backend enum values
  submissionName?: string | null;
  submittedAt?: string | null;
  grade?: number | null;
  comment?: string | null;
  gradedBy?: string | null;
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

export interface Faculty {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  accessLevel: string;
  courseManaged: string[];
}

// Analytics interfaces (from backend)
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

export interface DashboardMetrics {
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  avgProgress: number;
  avgGrade: number;
  submissionRate: number;
}

export interface LoadingState {
  course: boolean;
  metrics: boolean;
  units: boolean;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  courseCode: string;
  year: number;
}

export interface StudentWithGrade extends Student {
  averageGrade: number;
  totalSubmissions: number;
  submittedCount: number;
}

// Extended submission interface with student information
export interface EnrichedSubmission extends StudentSubmission {
  studentName: string;
  studentEmail: string;
}

// Response structure for assignment API with submissions
export interface AssignmentWithSubmissions {
  assignment: Assignment;
  submissions: EnrichedSubmission[];
  totalSubmissions: number;
  submittedCount: number;
  gradedCount: number;
}

// Assignment with submission for student view
export interface AssignmentWithSubmission {
  assignment: Assignment;
  submission?: StudentSubmission;
}

// Request body for updating submission grades
export interface UpdateGradeRequest {
  grade: number;
  comment?: string;
  gradedBy?: string;
}

// Filter options for SearchBar component
export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

// Academic data response structure (from backend /academic-data endpoint)
export interface AcademicData {
  courses: Course[];
  units: Unit[];
  assignments: Assignment[];
  teachers: Teacher[];
  faculty: Teacher[];      // For backward compatibility
  coordinators: Teacher[]; // For coordinator-specific data
}

// Pagination interfaces
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentsWithDataResult {
  students: any[];
  assignments: any[];
  progress: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Trend data for analytics
export interface TrendData {
  date: string;
  submissions: number;
  averageGrade: number;
}