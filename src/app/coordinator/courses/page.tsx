'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authManager } from '../../../lib/auth';
import CourseCard from '../../components/courseCard';
import { Course } from '../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function CoordinatorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication first
    if (!authManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    if (!authManager.isCoordinator()) {
      setError('Access denied. Coordinator access required.');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = authManager.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const coursesResponse = await fetch(`${API_BASE_URL}/courses`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!coursesResponse.ok) {
          if (coursesResponse.status === 401) {
            await authManager.logout();
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error('Failed to fetch courses');
        }

        const coursesData = await coursesResponse.json();
        console.log('🔍 Courses API response:', coursesData);

        // Handle response format
        const coursesList = coursesData.success ? coursesData.data : (coursesData.courses || coursesData);

        if (!Array.isArray(coursesList)) {
          throw new Error('Courses data is not in expected format');
        }

        setCourses(coursesList);

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
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

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.code}
            course={course}
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