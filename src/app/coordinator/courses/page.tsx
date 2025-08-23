'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '../../components/statCard';

import { Course, Student, Unit, ApiResponse } from '../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

interface CourseWithStats extends Course {
  studentCount: number;
  unitCount: number;
}

export default function CoordinatorCoursesPage() {
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, avgStudentsPerCourse: 0 });

  const router = useRouter();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [coursesResponse, studentsResponse, unitsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/courses`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/students`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/units`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
      ]);

      if (!coursesResponse.ok || !studentsResponse.ok || !unitsResponse.ok) {
        if (coursesResponse.status === 401 || studentsResponse.status === 401 || unitsResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to fetch data');
      }

      const coursesData = await coursesResponse.json();
      const studentsData = await studentsResponse.json();
      const unitsData = await unitsResponse.json();

      // Handle different response formats
      const coursesList = coursesData.success ? coursesData.data : (coursesData.courses || coursesData);
      const studentsList = studentsData.success ? studentsData.data : (studentsData.students || studentsData);
      const unitsList = unitsData.success ? unitsData.data : (unitsData.units || unitsData);

      // Calculate stats for each course
      const coursesWithStats: CourseWithStats[] = (coursesList || []).map((course: Course) => {
        const studentCount = (studentsList || []).filter((student: Student) => 
          student.courseCode === course.code
        ).length;

        const unitCount = (unitsList || []).filter((unit: any) => 
          unit.courseCode === course.code
        ).length;

        return {
          ...course,
          studentCount,
          unitCount
        };
      });

      setCourses(coursesWithStats);

      // Calculate overall stats
      const totalCourses = coursesWithStats.length;
      const totalStudents = coursesWithStats.reduce((sum, course) => sum + course.studentCount, 0);
      const avgStudentsPerCourse = totalCourses > 0 ? Math.round((totalStudents / totalCourses) * 10) / 10 : 0;

      setStats({ totalCourses, totalStudents, avgStudentsPerCourse });

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCourseClick = (courseCode: string) => {
    router.push(`/coordinator/courses/${courseCode}`);
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <button onClick={fetchData} className="lms-button-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
          Courses
        </h1>
        <p className="text-lg text-gray-600">
          Manage your courses and units
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon="courses"
          isLoading={isLoading}
          subtitle="Available programs"
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon="users"
          isLoading={isLoading}
          subtitle="Across all courses"
        />
        <StatCard
          title="Avg Students/Course"
          value={stats.avgStudentsPerCourse}
          icon="analytics"
          isLoading={isLoading}
          subtitle="Average enrollment"
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="lms-card animate-pulse">
              <div className="h-20 bg-gray-200 rounded-t-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.code}
                onClick={() => handleCourseClick(course.code)}
                className="lms-card hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                {/* Color Header */}
                <div 
                  className="h-20 rounded-t-lg mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--primary-red)' }}
                >
                  <span className="text-white text-2xl font-bold">{course.code}</span>
                </div>
                
                {/* Course Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-black)' }}>
                      {course.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Course Code: {course.code}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {course.studentCount} students
                    </span>
                    <span className="text-gray-600">
                      {course.unitCount} units
                    </span>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">View Details</span>
                      <span className="text-xs" style={{ color: 'var(--primary-red)' }}>
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {courses.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No courses found</h3>
              <p className="text-gray-500">Courses will appear here when they are available.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}