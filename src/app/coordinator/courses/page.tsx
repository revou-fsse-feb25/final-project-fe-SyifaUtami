'use client';
import { useState, useEffect } from 'react';
import CourseCard from '../../components/courseCard';

interface Course {
  code: string;
  name: string;
  units: string[];
}

interface Student {
  id: string;
  courseCode: string;
}

export default function CoordinatorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [academicResponse, studentsResponse] = await Promise.all([
          fetch('/api/academic-data'),
          fetch('/api/students')
        ]);

        if (!academicResponse.ok || !studentsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const academicData = await academicResponse.json();
        const studentsData = await studentsResponse.json();

        setCourses(academicData.courses || []);
        setStudents(studentsData || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStudentCount = (courseCode: string) => {
    return students.filter(student => student.courseCode === courseCode).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
          <p className="text-lg text-gray-600">{error}</p>
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

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.code}
            course={course}
            studentCount={getStudentCount(course.code)}
            unitCount={course.units.length}
          />
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No courses found.</p>
        </div>
      )}
    </div>
  );
}