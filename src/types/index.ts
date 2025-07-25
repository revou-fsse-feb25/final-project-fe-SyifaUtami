

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