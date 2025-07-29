'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import StatCard from '../../../components/statCard';
import ProgressBar from '../../../components/progressBar';
import { calculateDashboardMetrics } from '../../../components/calculateData';
import { Course, Unit, Assignment, StudentSubmission, Teacher, StudentProgress, CourseMetrics, LoadingState } from '../../../../types';
export default function CourseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  
  // Debug the params structure
  console.log('🔍 All params:', params);
  
  // Fix: Use the exact folder name [CourseCode]
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

  // Step 1: Load basic course info (fastest)
  useEffect(() => {
    console.log('🔍 Effect triggered with courseCode:', courseCode);
    
    if (!courseCode) {
      console.warn('⚠️ No courseCode available, skipping load');
      return;
    }
    
    const loadCourseInfo = async () => {
      try {
        const response = await fetch('/api/academic-data');
        if (!response.ok) throw new Error('Failed to fetch course info');
        
        const data = await response.json();
        const foundCourse = data.courses?.find((c: Course) => c.code === courseCode);
        const courseUnits = data.units?.filter((u: Unit) => u.courseCode === courseCode) || [];
        
        if (!foundCourse) throw new Error('Course not found');
        
        setCourse(foundCourse);
        setUnits(courseUnits);
        setLoading(prev => ({ ...prev, course: false, units: false }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
        setLoading(prev => ({ ...prev, course: false }));
      }
    };

    if (courseCode) loadCourseInfo();
  }, [courseCode]);

  // Step 2: Load metrics (heavier data)
  useEffect(() => {
    const loadMetrics = async () => {
      if (!course || !courseCode) return;
      
      try {
        // Fetch course-specific data
        const [assignmentsResponse, studentsResponse, academicResponse] = await Promise.all([
          fetch(`/api/assignments?includeSubmissions=true`), // Get all assignments, filter client-side
          fetch(`/api/students?courseCode=${courseCode}&includeData=true`), // Only THIS course students
          fetch('/api/academic-data')
        ]);

        if (!assignmentsResponse.ok || !studentsResponse.ok || !academicResponse.ok) {
          throw new Error('Failed to fetch metrics data');
        }

        const assignmentsData = await assignmentsResponse.json();
        const studentsData = await studentsResponse.json();
        const academicData = await academicResponse.json();

        // Filter data to ONLY this course
        const courseStudents = studentsData.students || [];
        const courseAssignments: Assignment[] = (assignmentsData.assignments || []).filter((a: Assignment) => 
          units.some((unit: Unit) => unit.code === a.unitCode)
        );
        const courseSubmissions: StudentSubmission[] = (assignmentsData.submissions || []).filter((s: StudentSubmission) => 
          courseAssignments.some(a => a.id === s.assignmentId)
        );
        const courseProgressData: StudentProgress[] = (studentsData.progress || []).filter((p: StudentProgress) => 
          units.some((unit: Unit) => unit.code === p.unitCode)
        );

        // Get teachers for ONLY this course
        const courseTeachers: Teacher[] = academicData.teachers?.filter((t: Teacher) => 
          units.some((unit: Unit) => t.unitsTeached.includes(unit.code))
        ) || [];

        console.log('=== COURSE-SPECIFIC DATA ===');
        console.log('Course Code:', courseCode);
        console.log('Course Students:', courseStudents.length);
        console.log('Course Assignments:', courseAssignments.length);
        console.log('Course Submissions:', courseSubmissions.length);
        console.log('Course Teachers:', courseTeachers.length);

        const metrics = calculateCourseMetrics({
          students: courseStudents,
          teachers: courseTeachers,
          assignments: courseAssignments,
          submissions: courseSubmissions,
          allProgressData: courseProgressData
        });

        setCourseMetrics(metrics);
        setLoading(prev => ({ ...prev, metrics: false }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
        setLoading(prev => ({ ...prev, metrics: false }));
      }
    };

    loadMetrics();
  }, [course, units, courseCode]);

  const calculateCourseMetrics = (data: {
    students: any[];
    teachers: Teacher[];
    assignments: Assignment[];
    submissions: StudentSubmission[];
    allProgressData: StudentProgress[];
  }): CourseMetrics => {
    const { students, teachers, assignments, submissions, allProgressData } = data;

    // Use your existing calculation logic
    const baseMetrics = calculateDashboardMetrics({
      students,
      teachers,
      courses: [], // Not needed for this calculation
      assignments,
      submissions,
      allProgressData
    });

    // Calculate failed assignments (grade < 50% OR unsubmitted)
    const failedSubmissions = submissions.filter((sub: StudentSubmission) => {
      const isFailingGrade = sub.grade !== null && sub.grade !== undefined && sub.grade < 50;
      const isUnsubmitted = sub.submissionStatus === 'unsubmitted';
      return isFailingGrade || isUnsubmitted;
    });

    return {
      studentCount: baseMetrics.studentCount,
      teacherCount: baseMetrics.teacherCount,
      assignmentCount: assignments.length,
      avgProgress: baseMetrics.avgProgress,
      avgGrade: baseMetrics.avgGrade,
      submissionRate: baseMetrics.submissionRate,
      failedAssignments: failedSubmissions.length
    };
  };

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
        />
        <StatCard
          title="Teachers"
          value={courseMetrics?.teacherCount || 0}
          icon="teachers"
          isLoading={loading.metrics}
        />
        <StatCard
          title="Assignments"
          value={courseMetrics?.assignmentCount || 0}
          icon="courses"
          isLoading={loading.metrics}
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
                variant="primary"
                label="Average Progress"
                size="lg"
                isSuccess={courseMetrics.avgProgress > 80}
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Based on weekly materials and assignment completion
              </p>
            </div>

            <div>
              <ProgressBar
                progress={courseMetrics.avgGrade}
                variant="primary"
                label="Average Grade from Submissions"
                size="lg"
                isSuccess={courseMetrics.avgGrade > 80}
                isWarning={courseMetrics.avgGrade < 50}
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Average score across all submitted assignments
              </p>
            </div>

            <div>
              <ProgressBar
                progress={courseMetrics.submissionRate}
                variant="primary"
                label="Submission Rate"
                size="lg"
                isSuccess={courseMetrics.submissionRate > 80}
                isWarning={courseMetrics.submissionRate < 50}
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Percentage of assignments submitted by students
              </p>
            </div>

            <div>
              <ProgressBar
                progress={100 - Math.min((courseMetrics.failedAssignments / Math.max(courseMetrics.assignmentCount * courseMetrics.studentCount, 1)) * 100, 100)}
                variant="primary"
                label="Assignment Success Rate"
                size="lg"
                isSuccess={courseMetrics.failedAssignments === 0}
                isWarning={courseMetrics.failedAssignments > (courseMetrics.assignmentCount * courseMetrics.studentCount * 0.2)}
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

      {/* Units List */}
      <div className="lms-card">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Course Units
        </h2>
        
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
              <div key={unit.code} className="lms-card bg-white hover:shadow-lg transition-all duration-200 cursor-pointer"
                   onClick={() => router.push(`/coordinator/courses/${courseCode}/units/${unit.code}`)}>
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
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {unit.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">View unit details</span>
                  <span className="text-blue-600">→</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No units found for this course.</p>
        )}
      </div>
    </div>
  );
}