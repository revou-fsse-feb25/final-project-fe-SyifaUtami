'use client';
import { FC, useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { Course, Unit } from '../../../types';
import StudentUnitCard from '../../components/studentUnitCard';

interface CoursesData {
  courses: Course[];
  units: Unit[];
}

const CourseOverview: FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CoursesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/academic-data');
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const academicData = await response.json();
        setData({
          courses: academicData.courses,
          units: academicData.units
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Early return if no user
  if (!user || !user.courseCode) {
    return (
      <div className="p-6">
        <p>Please log in to view your course.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading course data...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Failed to load course data'}</p>
      </div>
    );
  }

  // Find the student's course
  const studentCourse = data.courses.find(course => course.code === user.courseCode);

  if (!studentCourse) {
    return (
      <div className="p-6">
        <p>Course not found.</p>
      </div>
    );
  }

  // Get units for this course
  const courseUnits = data.units.filter(unit => unit.courseCode === studentCourse.code);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Course Title */}
      <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--text-black)' }}>
        {studentCourse.name}
      </h1>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courseUnits.map((unit) => (
          <StudentUnitCard key={unit.code} unit={unit} />
        ))}
      </div>
    </div>
  );
};

export default CourseOverview;