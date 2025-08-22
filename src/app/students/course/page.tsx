'use client';
import { FC, useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { apiClient } from '../../../lib/api'
import StudentUnitCard from '../../components/studentUnitCard';

interface Course {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Unit {
  id: string;
  code: string;
  name: string;
  description: string | null;
  courseCode: string;
  currentWeek: number;
  createdAt: string;
  updatedAt: string;
}

const CourseOverview: FC = () => {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.courseCode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Use backend API instead of local files
        const academicData = await apiClient.getAcademicData();
        
        const foundCourse = academicData.courses.find((c: Course) => c.code === user.courseCode);
        setCourse(foundCourse || null);
        
        if (foundCourse) {
          const courseUnits = academicData.units.filter((unit: Unit) => 
            unit.courseCode === foundCourse.code
          );
          setUnits(courseUnits);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  if (error || !course) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Failed to load course data'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Course Title */}
      <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--text-black)' }}>
        {course.name}
      </h1>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => (
          <StudentUnitCard key={unit.code} unit={unit} />
        ))}
      </div>
    </div>
  );
};

export default CourseOverview;