'use client';
import { FC, useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import StudentUnitCard from '../../components/studentUnitCard';
import { apiClient } from '@/src/lib/api';

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

// Alternative version using Academic Data API
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
        
        console.log('Fetching academic data for student course:', user.courseCode);
        
        // Use academic data API (this might be what your backend expects)
        const academicDataResponse = await apiClient.getAcademicData();
        
        console.log('Academic data response:', academicDataResponse);
        
        // Handle the response structure
        let academicData;
        if (academicDataResponse.success && academicDataResponse.data) {
          academicData = academicDataResponse.data;
        } else {
          academicData = academicDataResponse;
        }
        
        console.log('Processed academic data:', academicData);
        
        // Extract courses and units from academic data
        const courses = academicData.courses || [];
        const units = academicData.units || [];
        
        console.log('Courses from academic data:', courses);
        console.log('Units from academic data:', units);
        
        // Find the user's course
        const foundCourse = courses.find((c: Course) => c.code === user.courseCode);
        console.log('Found course:', foundCourse);
        setCourse(foundCourse || null);
        
        if (foundCourse) {
          // Filter units for this course
          const courseUnits = units.filter((unit: Unit) => 
            unit.courseCode === foundCourse.code
          );
          console.log('Course units:', courseUnits);
          setUnits(courseUnits);
        }
        
      } catch (err) {
        console.error('Error fetching academic data:', err);
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
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your course.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <span className="text-gray-600">Loading course data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading course data</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Course not found</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Could not find course with code: {user.courseCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
              {course.name}
            </h1>
            <p className="text-gray-600 text-lg">
              Course Code: <span className="font-semibold">{course.code}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Units Section */}
      {units.length > 0 ? (
        <div>
          <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
            Course Units ({units.length})
          </h2>
          
          {/* Units Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit) => (
              <StudentUnitCard key={unit.code} unit={unit} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No units available</h3>
            <p className="mt-2 text-gray-600">
              There are currently no units assigned to this course.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseOverview;