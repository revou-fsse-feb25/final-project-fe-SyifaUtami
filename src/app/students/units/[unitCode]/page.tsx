'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authManager, type User } from '@/src/lib/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faBookOpen,
  faClipboard,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faCalendarAlt,
  faUser,
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons';

interface Unit {
  id: string;
  code: string;
  name: string;
  description: string | null;
  courseCode: string;
  currentWeek: number;
  course: {
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  id: string;
  name: string;
  deadline: string;
  status: string;
}

interface StudentProgress {
  week1Material: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  week2Material: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  week3Material: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  week4Material: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  progressPercentage: number;
}

interface Submission {
  id: string;
  assignmentId: string;
  submissionStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED';
  grade: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
}

interface UnitWithProgress extends Unit {
  progressPercentage?: number;
  progress?: StudentProgress;
  assignments?: Assignment[];
}

export default function StudentUnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const unitCode = params?.unitCode as string;

  const [unit, setUnit] = useState<UnitWithProgress | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user from auth manager
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

  useEffect(() => {
    const fetchUnitDetails = async () => {
      if (!user || !unitCode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

        // Fetch unit details
        const unitResponse = await fetch(`${baseUrl}/units/${unitCode}`, { headers });
        if (!unitResponse.ok) {
          if (unitResponse.status === 401) {
            // Token expired, try to refresh or logout
            const refreshed = await authManager.refreshToken();
            if (!refreshed) {
              throw new Error('Session expired. Please log in again.');
            }
            // Retry with new token
            const newToken = localStorage.getItem('access_token');
            const newHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
            const retryResponse = await fetch(`${baseUrl}/units/${unitCode}`, { headers: newHeaders });
            if (!retryResponse.ok) {
              throw new Error('Unit not found');
            }
            const retryData = await retryResponse.json();
            setUnit(retryData.success ? retryData.data : retryData);
          } else {
            throw new Error('Unit not found');
          }
        } else {
          const unitData = await unitResponse.json();
          setUnit(unitData.success ? unitData.data : unitData);
        }

        // Fetch assignments for this unit
        const assignmentsResponse = await fetch(`${baseUrl}/assignments?unitCode=${unitCode}`, { headers });
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          const assignments = assignmentsData.success ? assignmentsData.data : assignmentsData;
          setAssignments(Array.isArray(assignments) ? assignments : []);
        }

        // Fetch student's submissions for this unit
        const submissionsResponse = await fetch(`${baseUrl}/submissions/student/${user.id}`, { headers });
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          const allSubmissions = submissionsData.success ? submissionsData.data : submissionsData;
          
          // Filter submissions for this unit's assignments
          const unitAssignmentIds = assignments?.map((a: Assignment) => a.id) || [];
          const unitSubmissions = Array.isArray(allSubmissions) 
            ? allSubmissions.filter((s: Submission) => unitAssignmentIds.includes(s.assignmentId))
            : [];
          setSubmissions(unitSubmissions);
        }

        // Fetch student's progress for this unit
        const progressResponse = await fetch(`${baseUrl}/student-progress/student/${user.id}/unit/${unitCode}`, { headers });
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          const progressResult = progressData.success ? progressData.data : progressData;
          setProgress(progressResult);
        }

        // Get progress percentage
        const progressPercentageResponse = await fetch(`${baseUrl}/student-progress/student/${user.id}/unit/${unitCode}/percentage`, { headers });
        if (progressPercentageResponse.ok) {
          const progressPercentageData = await progressPercentageResponse.json();
          const percentage = progressPercentageData.success ? progressPercentageData.data : progressPercentageData;
          
          setUnit(prevUnit => ({
            ...prevUnit!,
            progressPercentage: typeof percentage === 'number' ? percentage : percentage?.percentage || 0
          }));
        }

      } catch (err) {
        console.error('Unit details fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load unit details');
        
        // If authentication error, handle logout
        if (err instanceof Error && err.message.includes('Session expired')) {
          try {
            await authManager.logout();
          } catch (logoutError) {
            console.error('Logout failed:', logoutError);
          }
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUnitDetails();
    }
  }, [user, unitCode]);

  const getStatusIcon = (status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE') => {
    switch (status) {
      case 'DONE':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      default:
        return <FontAwesomeIcon icon={faTimesCircle} className="text-gray-400" />;
    }
  };

  const getStatusText = (status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE') => {
    switch (status) {
      case 'DONE':
        return 'Completed';
      case 'IN_PROGRESS':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = submissions.find(s => s.assignmentId === assignmentId);
    if (!submission) return { status: 'NOT_SUBMITTED', grade: null, submittedAt: null };
    
    return {
      status: submission.submissionStatus,
      grade: submission.grade,
      submittedAt: submission.submittedAt,
      gradedAt: submission.gradedAt
    };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading unit details...</p>
        </div>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <FontAwesomeIcon 
            icon={faExclamationTriangle} 
            className="text-6xl mb-4" 
            style={{ color: 'var(--primary-red)' }} 
          />
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>
            {error || 'Unit Not Found'}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {error || 'The requested unit could not be found.'}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.back()}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-[var(--primary-red)] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 text-gray-600 hover:text-[var(--primary-red)] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
          </button>
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
              {unit.name}
            </h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <span className="flex items-center">
                <FontAwesomeIcon icon={faBookOpen} className="mr-2" />
                {unit.code}
              </span>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faGraduationCap} className="mr-2" />
                {unit.course?.name || unit.courseCode}
              </span>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Week {unit.currentWeek}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Unit Description */}
          {unit.description && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
                About This Unit
              </h2>
              <p className="text-gray-700 leading-relaxed">{unit.description}</p>
            </div>
          )}

          {/* Weekly Progress */}
          {progress && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
                Weekly Progress
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((week) => {
                  const weekKey = `week${week}Material` as keyof StudentProgress;
                  const status = progress[weekKey] as 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
                  
                  return (
                    <div key={week} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        {getStatusIcon(status)}
                        <span className="ml-3 font-medium">Week {week} Material</span>
                      </div>
                      <span className="text-sm text-gray-600">{getStatusText(status)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assignments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
              Assignments
            </h2>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faClipboard} className="text-6xl text-gray-300 mb-4" />
                <p className="text-lg text-gray-500">No assignments available yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const submissionInfo = getSubmissionStatus(assignment.id);
                  const isOverdue = new Date(assignment.deadline) < new Date() && submissionInfo.status === 'NOT_SUBMITTED';
                  
                  return (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-black)' }}>
                            {assignment.name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <FontAwesomeIcon icon={faClock} className="mr-2" />
                            Due: {new Date(assignment.deadline).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          {submissionInfo.status === 'GRADED' && submissionInfo.grade !== null ? (
                            <div className="text-center">
                              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                Graded
                              </div>
                              <div className="text-lg font-bold mt-1">
                                {submissionInfo.grade}/100
                              </div>
                            </div>
                          ) : submissionInfo.status === 'SUBMITTED' ? (
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              Submitted
                            </div>
                          ) : isOverdue ? (
                            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                              Overdue
                            </div>
                          ) : (
                            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                              Pending
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {submissionInfo.submittedAt && (
                        <div className="text-sm text-gray-500 mt-2">
                          Submitted on: {new Date(submissionInfo.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Overall Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
              Overall Progress
            </h3>
            {typeof unit.progressPercentage === 'number' ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Completion</span>
                  <span className="text-2xl font-bold">{unit.progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(unit.progressPercentage)}`}
                    style={{ width: `${unit.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>Progress data not available</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Assignments</span>
                <span className="font-semibold">{assignments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Submitted</span>
                <span className="font-semibold text-green-600">
                  {submissions.filter(s => s.submissionStatus !== 'NOT_SUBMITTED').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Graded</span>
                <span className="font-semibold text-blue-600">
                  {submissions.filter(s => s.submissionStatus === 'GRADED').length}
                </span>
              </div>
              {submissions.filter(s => s.grade !== null).length > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Average Grade</span>
                  <span className="font-semibold">
                    {Math.round(
                      submissions
                        .filter(s => s.grade !== null)
                        .reduce((sum, s) => sum + (s.grade || 0), 0) /
                      submissions.filter(s => s.grade !== null).length
                    )}/100
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Unit Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
              Unit Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Unit Code</p>
                <p className="font-medium">{unit.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Course</p>
                <p className="font-medium">{unit.course?.name || unit.courseCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Week</p>
                <p className="font-medium">Week {unit.currentWeek}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">
                  {new Date(unit.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}