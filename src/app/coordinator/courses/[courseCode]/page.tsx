'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authManager } from '../../../../lib/auth';
import StatCard from '../../../components/statCard';
import ProgressBar from '../../../components/progressBar';
import { Course, Unit, CourseMetrics, LoadingState } from '../../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function CourseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  
  console.log('🔍 All params:', params);
  const courseCode = params.CourseCode as string;
  console.log('📊 Extracted courseCode:', courseCode);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [courseMetrics, setCourseMetrics] = useState<CourseMetrics | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    course: true,
    metrics: true,
    units: true
  });
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    if (!authManager.isCoordinator()) {
      setError('Access denied. Coordinator access required.');
      return;
    }
  }, [router]);

  // Load course info and units
  useEffect(() => {
    if (!courseCode) {
      console.warn('⚠️ No courseCode available, skipping load');
      return;
    }
    
    const loadCourseInfo = async () => {
      try {
        setLoading(prev => ({ ...prev, course: true, units: true }));
        
        const token = authManager.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch course and units data from Railway API
        const [courseResponse, unitsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/courses/${courseCode}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/units?courseCode=${courseCode}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!courseResponse.ok || !unitsResponse.ok) {
          if (courseResponse.status === 401 || unitsResponse.status === 401) {
            await authManager.logout();
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error('Failed to fetch course data');
        }

        const courseData = await courseResponse.json();
        const unitsData = await unitsResponse.json();

        // Handle response formats
        const foundCourse = courseData.success ? courseData.data : courseData;
        const courseUnits = unitsData.success ? unitsData.data : (unitsData.units || unitsData);

        if (!foundCourse) {
          throw new Error('Course not found');
        }
        
        setCourse(foundCourse);
        setUnits(Array.isArray(courseUnits) ? courseUnits : []);
        setLoading(prev => ({ ...prev, course: false, units: false }));
        
      } catch (err) {
        console.error('Course info fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course');
        setLoading(prev => ({ ...prev, course: false, units: false }));
      }
    };

    loadCourseInfo();
  }, [courseCode, router]);

  // Load course metrics/analytics
  useEffect(() => {
    if (!course || !courseCode) return;
    
    const loadMetrics = async () => {
      try {
        setLoading(prev => ({ ...prev, metrics: true }));
        
        const token = authManager.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Try to get course analytics from Railway API
        const response = await fetch(`${API_BASE_URL}/analytics/course/${courseCode}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const metrics = data.success ? data.data : data;
          setCourseMetrics(metrics);
        } else {
          // If analytics endpoint doesn't exist, create basic metrics
          const basicMetrics: CourseMetrics = {
            studentCount: 0,
            teacherCount: 0,
            assignmentCount: 0,
            avgProgress: 0,
            avgGrade: 0,
            submissionRate: 0,
            failedAssignments: 0
          };
          setCourseMetrics(basicMetrics);
        }

      } catch (err) {
        console.error('Metrics fetch error:', err);
        // Set default metrics on error
        setCourseMetrics({
          studentCount: 0,
          teacherCount: 0,
          assignmentCount: 0,
          avgProgress: 0,
          avgGrade: 0,
          submissionRate: 0,
          failedAssignments: 0
        });
      } finally {
        setLoading(prev => ({ ...prev, metrics: false }));
      }
    };

    loadMetrics();
  }, [course, courseCode]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <button onClick={() => router.back()} className="lms-button-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {loading.course ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
          ) : (
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-black)' }}>
                {course?.name}
              </h1>
              <p className="text-lg text-gray-600">Course Code: {courseCode}</p>
            </div>
          )}
          <button onClick={() => router.back()} className="lms-button-secondary">
            ← Back to Courses
          </button>
        </div>
      </div>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Students"
          value={courseMetrics?.studentCount || 0}
          icon="users"
          isLoading={loading.metrics}
          color="primary"
        />
        <StatCard
          title="Teachers"
          value={courseMetrics?.teacherCount || 0}
          icon="teachers"
          isLoading={loading.metrics}
          color="secondary"
        />
        <StatCard
          title="Assignments"
          value={courseMetrics?.assignmentCount || 0}
          icon="assignments"
          isLoading={loading.metrics}
          color="primary"
        />
      </div>

      {/* Course Progress Metrics */}
      <div className="lms-card mb-8">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Course Performance
        </h2>
        
        {loading.metrics ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
              </div>
            ))}
          </div>
        ) : courseMetrics ? (
          <div className="space-y-8">
            <div>
              <ProgressBar
                progress={courseMetrics.avgProgress}
                label="Average Progress"
                size="lg"
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Based on weekly materials and assignment completion
              </p>
            </div>

            <div>
              <ProgressBar
                progress={courseMetrics.avgGrade}
                label="Average Grade from Submissions"
                size="lg"
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Average score across all submitted assignments
              </p>
            </div>

            <div>
              <ProgressBar
                progress={courseMetrics.submissionRate}
                label="Submission Rate"
                size="lg"
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Percentage of assignments submitted by students
              </p>
            </div>

            <div>
              <ProgressBar
                progress={100 - Math.min((courseMetrics.failedAssignments / Math.max(courseMetrics.assignmentCount * courseMetrics.studentCount, 1)) * 100, 100)}
                label="Assignment Success Rate"
                size="lg"
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                {courseMetrics.failedAssignments} failed assignments (grade &lt;50% or unsubmitted)
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No metrics data available</p>
        )}
      </div>
    </div>
  );
}