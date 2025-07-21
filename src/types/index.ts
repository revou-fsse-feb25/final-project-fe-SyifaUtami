

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