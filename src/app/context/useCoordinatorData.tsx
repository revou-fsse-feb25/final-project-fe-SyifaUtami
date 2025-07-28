import { useState, useEffect } from 'react';
import { calculateDashboardMetrics, DashboardMetrics } from '../components/calculateData';

export const useCoordinatorData = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    studentCount: 0,
    teacherCount: 0,
    courseCount: 0,
    avgProgress: 0,
    avgGrade: 0,
    submissionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all required data using your existing APIs
      const [academicResponse, assignmentsResponse, studentsResponse] = await Promise.all([
        fetch('/api/academic-data'),
        fetch('/api/assignments?includeSubmissions=true'),
        fetch('/api/students?includeData=true') // This gets students + progress data
      ]);

      if (!academicResponse.ok || !assignmentsResponse.ok || !studentsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const academicData = await academicResponse.json();
      const assignmentsData = await assignmentsResponse.json();
      const studentsData = await studentsResponse.json();

      // Debug logging
      console.log('=== DEBUG COORDINATOR DATA ===');
      console.log('Academic Data:', academicData);
      console.log('Assignments Data:', assignmentsData);
      console.log('Students Data:', studentsData);

      // Calculate metrics using your existing logic
      const calculatedMetrics = calculateDashboardMetrics({
        students: studentsData.students || [],
        teachers: academicData.teachers || [],
        courses: academicData.courses || [],
        allProgressData: studentsData.progress || [], // Student progress data
        assignments: assignmentsData.assignments || [],
        submissions: assignmentsData.submissions || []
      });

      setMetrics(calculatedMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => {
    fetchData();
  };

  return {
    ...metrics,
    isLoading,
    error,
    refetch
  };
};