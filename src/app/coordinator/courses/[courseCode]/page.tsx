'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import StatCard from '../../../components/statCard';
import ProgressBar from '../../../components/progressBar';
import { Course, Unit, CourseMetrics, LoadingState } from '../../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function CourseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  
  // Debug the params structure
  console.log('🔍 All params:', params);
  
  // Fix: Use the exact folder name [courseCode]
  const courseCode = params.courseCode as string;
  
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

  // Fetch course analytics from API
  const fetchCourseAnalytics = async () => {
    try {
      setLoading(prev => ({ ...prev, metrics: true }));
      setError(null);

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/analytics/course/${courseCode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to fetch course analytics: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle response format
      if (data.success && data.data) {
        setCourseMetrics(data.data);
      } else {
        // Handle direct response format
        setCourseMetrics(data);
      }

    } catch (err) {
      console.error('Course analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course analytics');
    } finally {
      setLoading(prev => ({ ...prev, metrics: false }));
    }
  };

  // Load basic course info from academic data
  const loadCourseInfo = async () => {
    try {
      setLoading(prev => ({ ...prev, course: true, units: true }));
      
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/academic-data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch course info');
      
      const data = await response.json();
      const academicData = data.success ? data.data : data;
      
      const foundCourse = academicData.courses?.find((c: Course) => c.code === courseCode);
      const courseUnits = academicData.units?.filter((u: Unit) => u.courseCode === courseCode) || [];
      
      if (!foundCourse) throw new Error('Course not found');
      
      setCourse(foundCourse);
      setUnits(courseUnits);
      setLoading(prev => ({ ...prev, course: false, units: false }));
      
    } catch (err) {
      console.error('Course info fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course info');
      setLoading(prev => ({ ...prev, course: false, units: false }));
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log('🔍 Effect triggered with courseCode:', courseCode);
    
    if (!courseCode) {
      console.warn('⚠️ No courseCode available, skipping load');
      return;
    }
    
    // Load course info first, then analytics
    loadCourseInfo();
  }, [courseCode]);

  // Load analytics after course is loaded
  useEffect(() => {
    if (course && courseCode) {
      fetchCourseAnalytics();
    }
  }, [course, courseCode]);

  const refetch = () => {
    loadCourseInfo();
    if (courseCode) {
      fetchCourseAnalytics();
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <button onClick={refetch} className="lms-button-primary">
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
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Courses
        </button>
        
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
          {loading.course ? 'Loading...' : course?.name || 'Course Overview'}
        </h1>
        <p className="text-lg text-gray-600">
          {loading.course ? 'Loading course information...' : `${course?.code} - Performance metrics and unit overview`}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Students Enrolled"
          value={courseMetrics?.studentCount || 0}
          icon="users"
          isLoading={loading.metrics}
          subtitle={!loading.metrics && courseMetrics ? `Active students` : undefined}
          color="primary"
        />
        <StatCard
          title="Total Assignments"
          value={courseMetrics?.assignmentCount || 0}
          icon="assignments"
          isLoading={loading.metrics}
          subtitle={!loading.metrics ? "Course assignments" : undefined}
          color="secondary"
        />
        <StatCard
          title="Course Units"
          value={units.length}
          icon="courses"
          isLoading={loading.units}
          subtitle={!loading.units ? "Available units" : undefined}
          color="info"
        />
      </div>

      {/* Performance Metrics */}
      <div className="lms-card mb-8">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Course Performance Metrics
        </h2>
        
        {loading.metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : courseMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <ProgressBar
                progress={courseMetrics.avgProgress}
                label="Average Progress"
                size="lg"
              />
            </div>
            <div>
              <ProgressBar
                progress={courseMetrics.avgGrade}
                label="Average Grade"
                size="lg"
              />
            </div>
            <div>
              <ProgressBar
                progress={courseMetrics.submissionRate}
                label="Submission Rate"
                size="lg"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No performance data available for this course.</p>
          </div>
        )}

        {/* Additional Metrics */}
        {courseMetrics && !loading.metrics && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--primary-red)' }}>
                  {courseMetrics.teacherCount}
                </div>
                <div className="text-sm text-gray-600">Teachers</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--primary-red)' }}>
                  {courseMetrics.failedAssignments || 0}
                </div>
                <div className="text-sm text-gray-600">Failed Assignments</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--primary-red)' }}>
                  {Math.round(courseMetrics.submissionRate)}%
                </div>
                <div className="text-sm text-gray-600">Submission Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--primary-red)' }}>
                  {Math.round(courseMetrics.avgGrade)}%
                </div>
                <div className="text-sm text-gray-600">Average Grade</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Units */}
      <div className="lms-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-black)' }}>
            Course Units
          </h2>
          <span className="text-sm text-gray-600">
            {units.length} {units.length === 1 ? 'unit' : 'units'}
          </span>
        </div>
        
        {loading.units ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : units.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {units.map((unit) => (
              <div key={unit.code} className="lms-card bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-black)' }}>
                      {unit.name}
                    </h3>
                    <p className="text-sm text-gray-600">{unit.code}</p>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Week {unit.currentWeek}
                  </span>
                </div>
                
                {unit.description && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {unit.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Unit Overview</span>
                  <div className="text-xs text-gray-400">
                    Non-clickable display
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No units found for this course.</p>
          </div>
        )}
      </div>
    </div>
  );
}