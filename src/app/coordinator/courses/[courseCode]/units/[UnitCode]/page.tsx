'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import StatCard from '../../../../../components/statCard';
import ProgressBar from '../../././../../../components/progressBar';
import { calculateDashboardMetrics } from '../../../../../components/calculateData';
import { Course, Unit, Assignment, StudentSubmission, Teacher, StudentProgress, UnitMetrics, LoadingState } from '../../../../../../types';

export default function UnitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
  // Debug the params structure
  console.log('🔍 All unit params:', params);
  
  // Fix: Use the exact folder names [CourseCode] and [UnitCode]
  const courseCode = params.CourseCode as string;
  const unitCode = params.UnitCode as string;
  
  console.log('📊 Extracted courseCode:', courseCode);
  console.log('📊 Extracted unitCode:', unitCode);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [unitMetrics, setUnitMetrics] = useState<UnitMetrics | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    course: false,    // We don't need course loading for unit page
    metrics: true,
    units: true       // We'll use this for unit info loading
  });
  const [error, setError] = useState<string | null>(null);

  // Step 1: Load unit info (fastest)
  useEffect(() => {
    console.log('🔍 Unit effect triggered with:', { courseCode, unitCode });
    
    if (!courseCode || !unitCode) {
      console.warn('⚠️ Missing courseCode or unitCode, skipping load');
      return;
    }
    
    const loadUnitInfo = async () => {
      try {
        const response = await fetch('/api/academic-data');
        if (!response.ok) throw new Error('Failed to fetch unit info');
        
        const data = await response.json();
        const foundCourse = data.courses?.find((c: Course) => c.code === courseCode);
        const foundUnit = data.units?.find((u: Unit) => u.code === unitCode);
        
        if (!foundCourse) throw new Error('Course not found');
        if (!foundUnit) throw new Error('Unit not found');
        
        setCourse(foundCourse);
        setUnit(foundUnit);
        setLoading(prev => ({ ...prev, units: false }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load unit');
        setLoading(prev => ({ ...prev, units: false }));
      }
    };

    if (courseCode && unitCode) loadUnitInfo();
  }, [courseCode, unitCode]);

  // Step 2: Load assignments for this unit
  useEffect(() => {
    console.log('🔍 Loading assignments for unit:', unitCode);
    
    const loadAssignments = async () => {
      if (!unit) return;
      
      try {
        // Get all assignments and filter client-side for now
        const response = await fetch(`/api/assignments?includeSubmissions=true`);
        if (!response.ok) throw new Error('Failed to fetch assignments');
        
        const data = await response.json();
        const unitAssignments = (data.assignments || []).filter((a: Assignment) => a.unitCode === unitCode);
        setAssignments(unitAssignments);
        setLoading(prev => ({ ...prev, units: false })); // Using units for assignments loading too
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignments');
        setLoading(prev => ({ ...prev, units: false }));
      }
    };

    loadAssignments();
  }, [unit, unitCode]);

  // Step 3: Load metrics (heaviest)
  useEffect(() => {
    const loadMetrics = async () => {
      if (!unit) return;
      
      try {
        // Optimize API calls for this specific unit
        const [assignmentsResponse, studentsResponse, academicResponse] = await Promise.all([
          fetch(`/api/assignments?includeSubmissions=true`), // Get all assignments, filter client-side
          fetch(`/api/students?courseCode=${courseCode}&includeData=true`),
          fetch('/api/academic-data')
        ]);

        if (!assignmentsResponse.ok || !studentsResponse.ok || !academicResponse.ok) {
          throw new Error('Failed to fetch metrics data');
        }

        const assignmentsData = await assignmentsResponse.json();
        const studentsData = await studentsResponse.json();
        const academicData = await academicResponse.json();

        // Filter data for this specific unit
        const unitStudents = studentsData.students || [];
        const unitAssignments: Assignment[] = (assignmentsData.assignments || []).filter((a: Assignment) => 
          a.unitCode === unitCode
        );
        const unitSubmissions: StudentSubmission[] = (assignmentsData.submissions || []).filter((s: StudentSubmission) => 
          unitAssignments.some(a => a.id === s.assignmentId)
        );
        const unitProgressData: StudentProgress[] = studentsData.progress?.filter((p: StudentProgress) => 
          p.unitCode === unitCode
        ) || [];

        // Get teachers for this unit
        const unitTeachers: Teacher[] = academicData.teachers?.filter((t: Teacher) => 
          t.unitsTeached.includes(unitCode)
        ) || [];

        const metrics = calculateUnitMetrics({
          students: unitStudents,
          teachers: unitTeachers,
          assignments: unitAssignments,
          submissions: unitSubmissions,
          allProgressData: unitProgressData
        });

        setUnitMetrics(metrics);
        setLoading(prev => ({ ...prev, metrics: false }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
        setLoading(prev => ({ ...prev, metrics: false }));
      }
    };

    loadMetrics();
  }, [unit, courseCode, unitCode]);

  const calculateUnitMetrics = (data: {
    students: any[];
    teachers: Teacher[];
    assignments: Assignment[];
    submissions: StudentSubmission[];
    allProgressData: StudentProgress[];
  }): UnitMetrics => {
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
      {/* Unit Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {loading.units ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-80 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </div>
          ) : (
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-black)' }}>
                {unit?.name}
              </h1>
              <p className="text-lg text-gray-600">
                {unitCode} • {course?.name} • Week {unit?.currentWeek}
              </p>
            </div>
          )}
          <button 
            onClick={() => router.push(`/coordinator/courses/${courseCode}`)} 
            className="lms-button-secondary"
          >
            ← Back to Course
          </button>
        </div>
      </div>

      {/* Unit Description */}
      {!loading.units && unit && (
        <div className="lms-card mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
            Unit Description
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {unit.description}
          </p>
        </div>
      )}

      {/* Unit Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Students"
          value={unitMetrics?.studentCount || 0}
          icon="users"
          isLoading={loading.metrics}
        />
        <StatCard
          title="Teachers"
          value={unitMetrics?.teacherCount || 0}
          icon="teachers"
          isLoading={loading.metrics}
        />
        <StatCard
          title="Assignments"
          value={unitMetrics?.assignmentCount || 0}
          icon="courses"
          isLoading={loading.metrics}
        />
      </div>

      {/* Unit Performance Metrics */}
      <div className="lms-card mb-8">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Unit Performance
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
        ) : unitMetrics ? (
          <div className="space-y-8">
            <div>
              <ProgressBar
                progress={unitMetrics.avgProgress}
                variant="primary"
                label="Average Progress"
                size="lg"
                isSuccess={unitMetrics.avgProgress > 80}
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Based on weekly materials and assignment completion
              </p>
            </div>

            <div>
              <ProgressBar
                progress={unitMetrics.avgGrade}
                variant="primary"
                label="Average Grade from Submissions"
                size="lg"
                isSuccess={unitMetrics.avgGrade > 80}
                isWarning={unitMetrics.avgGrade < 50}
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Average score across all submitted assignments
              </p>
            </div>

            <div>
              <ProgressBar
                progress={unitMetrics.submissionRate}
                variant="primary"
                label="Submission Rate"
                size="lg"
                isSuccess={unitMetrics.submissionRate > 80}
                isWarning={unitMetrics.submissionRate < 50}
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Percentage of assignments submitted by students
              </p>
            </div>

            <div>
              <ProgressBar
                progress={100 - Math.min((unitMetrics.failedAssignments / Math.max(unitMetrics.assignmentCount * unitMetrics.studentCount, 1)) * 100, 100)}
                variant="primary"
                label="Assignment Success Rate"
                size="lg"
                isSuccess={unitMetrics.failedAssignments === 0}
                isWarning={unitMetrics.failedAssignments > (unitMetrics.assignmentCount * unitMetrics.studentCount * 0.2)}
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                {unitMetrics.failedAssignments} failed assignments (grade &lt;50% or unsubmitted)
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No metrics data available</p>
        )}
      </div>

      {/* Unit Assignments */}
      <div className="lms-card">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Unit Assignments
        </h2>
        
        {loading.units ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} 
                   className="flex justify-between items-center p-4 bg-white rounded border hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => router.push(`/coordinator/assignments/${assignment.id}`)}>
                <div>
                  <h3 className="text-lg font-medium" style={{ color: 'var(--text-black)' }}>
                    {assignment.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Due: {new Date(assignment.deadline).toLocaleDateString()} • {assignment.id}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    assignment.status === 'open' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {assignment.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                  <span className="text-blue-600">→</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No assignments found for this unit.</p>
        )}
      </div>
    </div>
  );
}