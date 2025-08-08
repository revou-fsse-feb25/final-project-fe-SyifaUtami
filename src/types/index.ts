export interface StudentProgress {
  studentId: string;
  unitCode: string;
  week1Material: "done" | "not done";
  week2Material: "done" | "not done";
  week3Material: "done" | "not done";
  week4Material: "done" | "not done";
}

export interface Assignment {
  id: string;
  name: string;
  unitCode: string;
  deadline: string;
  publishedAt: string;
  status: "open" | "closed";
}

export interface Unit {
  code: string;
  name: string;
  courseCode: string;
  description: string;
  currentWeek: number;
}

export interface Course {
  code: string;
  name: string;
  units: string[];
}

export interface StudentSubmission {
  submissionId?: string;
  studentId: string;
  assignmentId: string;
  status: 'open' | 'closed'; 
  submissionStatus: 'empty' | 'draft' | 'submitted' | 'unsubmitted';
  submissionName?: string | null;
  submittedAt?: string | null;
  grade?: number | null;
  comment?: string | null;
  gradedBy?: string | null;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string; 
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