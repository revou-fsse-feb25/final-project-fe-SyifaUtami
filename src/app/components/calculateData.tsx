import { StudentProgress, Assignment } from '../../types';
import { calculateProgress } from '../components/studentProgress';

export interface DashboardMetrics {
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  avgProgress: number;
  avgGrade: number;
  submissionRate: number;
}

export const calculateDashboardMetrics = (data: {
  students: any[];
  teachers: any[];
  courses: any[];
  allProgressData: StudentProgress[];
  assignments: Assignment[];
  submissions: any[];
}): DashboardMetrics => {
  const { students, teachers, courses, allProgressData, assignments, submissions } = data;

  // Basic counts
  const studentCount = students.length;
  const teacherCount = teachers.length;
  const courseCount = courses.length;

  // Average student progress using your existing function
  const avgProgress = allProgressData.length > 0 
    ? Math.round(
        allProgressData
          .map(progressData => calculateProgress(progressData, assignments).percentage)
          .reduce((sum, percentage) => sum + percentage, 0) / allProgressData.length
      )
    : 0;

  // Average grade from assignments
  const gradesWithScores = submissions.filter(sub => sub.grade !== null && sub.grade !== undefined);
  const avgGrade = gradesWithScores.length > 0
    ? Math.round(
        gradesWithScores.reduce((sum, sub) => sum + sub.grade, 0) / gradesWithScores.length
      )
    : 0;

  // Assignment submission rate - ONLY for closed assignments and enrolled students
  const closedAssignments = assignments.filter(assignment => assignment.status === 'closed');
  
  // Calculate total possible submissions based on student enrollment
  let totalPossibleSubmissions = 0;
  students.forEach(student => {
    // Count closed assignments for this student's course
    const studentClosedAssignments = closedAssignments.filter(assignment => {
      // Extract course code from assignment unit code (e.g., "BM001" -> "BM")
      const assignmentCourse = assignment.unitCode.substring(0, 2);
      return assignmentCourse === student.courseCode;
    });
    totalPossibleSubmissions += studentClosedAssignments.length;
  });
  
  // Count actual submissions for closed assignments
  const closedAssignmentIds = closedAssignments.map(a => a.id);
  const actualSubmissions = submissions.filter(sub => 
    closedAssignmentIds.includes(sub.assignmentId) && 
    sub.submissionStatus === 'submitted'
  ).length;
  
  const submissionRate = totalPossibleSubmissions > 0 
    ? Math.round((actualSubmissions / totalPossibleSubmissions) * 100)
    : 0;

  return {
    studentCount,
    teacherCount,
    courseCount,
    avgProgress,
    avgGrade,
    submissionRate
  };
};