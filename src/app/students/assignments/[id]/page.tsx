'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authManager, type User } from '@/src/lib/auth';
import { Assignment, StudentSubmission, Teacher } from '../../../../types';

// Extended Assignment interface to include description
interface ExtendedAssignment extends Assignment {
  title?: string;
  description?: string;
  dueDate?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function StudentAssignmentDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [assignment, setAssignment] = useState<ExtendedAssignment | null>(null);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useParams();
  
  // Handle both assignment ID and submission ID
  const id = params?.id as string;
  const isSubmissionId = id?.startsWith('sub_') || false;

  // Initialize user from auth manager
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('No ID provided');
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

        let assignmentData: ExtendedAssignment | null = null;
        let submissionData: StudentSubmission | null = null;

        if (isSubmissionId) {
          // Fetch submission first, then get assignment from submission data
          const submissionResponse = await fetch(`${API_BASE_URL}/submissions/${id}`, { headers });
          
          if (!submissionResponse.ok) {
            throw new Error('Failed to fetch submission');
          }
          
          const submissionResult = await submissionResponse.json();
          submissionData = submissionResult.success ? submissionResult.data : submissionResult;
          
          // Get assignment from submission data
          if (submissionData?.assignmentId) {
            const assignmentResponse = await fetch(`${API_BASE_URL}/assignments/${submissionData.assignmentId}`, { headers });
            if (assignmentResponse.ok) {
              const assignmentResult = await assignmentResponse.json();
              assignmentData = assignmentResult.success ? assignmentResult.data : assignmentResult;
            }
          }
        } else {
          // Direct assignment fetch
          const assignmentResponse = await fetch(`${API_BASE_URL}/assignments/${id}`, { headers });
          
          if (!assignmentResponse.ok) {
            throw new Error('Failed to fetch assignment');
          }
          
          const assignmentResult = await assignmentResponse.json();
          assignmentData = assignmentResult.success ? assignmentResult.data : assignmentResult;
          
          // Try to get submission for this assignment and current user
          if (user && assignmentData) {
            try {
              const submissionsResponse = await fetch(`${API_BASE_URL}/assignments?studentId=${user.id}`, { headers });
              if (submissionsResponse.ok) {
                const submissionsResult = await submissionsResponse.json();
                const submissions = submissionsResult.success ? submissionsResult.data : submissionsResult;
                
                // Find submission for this specific assignment
                submissionData = Array.isArray(submissions) 
                  ? submissions.find((s: any) => s.assignmentId === id || s.assignment?.id === id) || null
                  : null;
              }
            } catch (submissionError) {
              console.warn('Could not fetch submission data:', submissionError);
            }
          }
        }

        if (!assignmentData) {
          throw new Error('Assignment not found');
        }

        setAssignment(assignmentData);
        setSubmission(submissionData);

        // Fetch teachers data if needed
        try {
          const teachersResponse = await fetch(`${API_BASE_URL}/teachers`, { headers });
          if (teachersResponse.ok) {
            const teachersResult = await teachersResponse.json();
            const teachersData = teachersResult.success ? teachersResult.data : teachersResult;
            setTeachers(Array.isArray(teachersData) ? teachersData : []);
          }
        } catch (teacherError) {
          console.warn('Could not fetch teachers data:', teacherError);
        }

      } catch (err) {
        console.error('Error fetching assignment data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assignment');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [id, isSubmissionId, user]);

  // Safe date formatting
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'No deadline set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Safe property access
  const getAssignmentTitle = (assignment: ExtendedAssignment): string => {
    return assignment.name || assignment.title || 'Untitled Assignment';
  };

  const getAssignmentDeadline = (assignment: ExtendedAssignment): string | null => {
    return assignment.deadline || assignment.dueDate || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary-red)' }}></div>
          <p style={{ color: 'var(--text-black)' }}>Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--text-black)' }}>
            {error || 'Assignment not found'}
          </p>
          <button
            onClick={() => router.back()}
            className="lms-button-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const deadline = getAssignmentDeadline(assignment);
  const isOverdue = deadline && new Date() > new Date(deadline);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--card-background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="lms-button-secondary mb-4"
          >
            ← Back to Assignments
          </button>
          
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary-dark)' }}>
            {getAssignmentTitle(assignment)}
          </h1>
        </div>

        {/* Assignment Details */}
        <div className="lms-card mb-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--primary-dark)' }}>
            Assignment Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <strong>Assignment ID:</strong> {assignment.id}
            </div>
            <div>
              <strong>Unit:</strong> {assignment.unitCode}
            </div>
            <div>
              <strong>Deadline:</strong> 
              <span className={isOverdue ? 'text-red-600 ml-2' : 'ml-2'}>
                {formatDate(deadline)}
              </span>
            </div>
            <div>
              <strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                assignment.status === 'OPEN' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {assignment.status}
              </span>
            </div>
          </div>

          {assignment.description && (
            <div className="mt-4">
              <strong>Description:</strong>
              <p className="mt-2 text-gray-700">{assignment.description}</p>
            </div>
          )}

          {isOverdue && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
              <p className="text-red-700">
                ⚠️ This assignment is overdue.
              </p>
            </div>
          )}
        </div>

        {/* Submission Status */}
        <div className="lms-card mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--primary-dark)' }}>
            Your Submission
          </h3>
          
          {submission ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  submission.submissionStatus === 'SUBMITTED'
                    ? 'bg-green-100 text-green-800'
                    : submission.submissionStatus === 'DRAFT'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {submission.submissionStatus}
                </span>
              </div>
              <div>
                <strong>File:</strong> {submission.submissionName || 'No file submitted'}
              </div>
              <div>
                <strong>Submitted:</strong> 
                {submission.submittedAt 
                  ? formatDate(submission.submittedAt)
                  : 'Not submitted yet'}
              </div>
              <div>
                <strong>Grade:</strong> 
                {submission.grade !== null 
                  ? `${submission.grade}/100`
                  : 'Not graded yet'}
              </div>
              {submission.comment && (
                <div className="md:col-span-2">
                  <strong>Teacher's Comment:</strong>
                  <p className="mt-1 text-gray-700">{submission.comment}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No submission found for this assignment.</p>
              <button
                onClick={() => router.push(`/students/assignments/${assignment.id}/submit`)}
                className="lms-button-primary"
                disabled={assignment.status === 'CLOSED'}
              >
                {assignment.status === 'CLOSED' ? 'Assignment Closed' : 'Submit Assignment'}
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {submission && submission.submissionStatus !== 'SUBMITTED' && assignment.status === 'OPEN' && (
            <button
              onClick={() => router.push(`/students/assignments/${assignment.id}/submit`)}
              className="lms-button-primary"
            >
              Complete Submission
            </button>
          )}
          
          {!submission && assignment.status === 'OPEN' && (
            <button
              onClick={() => router.push(`/students/assignments/${assignment.id}/submit`)}
              className="lms-button-primary"
            >
              Start Assignment
            </button>
          )}
          
          <button
            onClick={() => router.push('/students/assignments')}
            className="lms-button-secondary"
          >
            Back to All Assignments
          </button>
        </div>
      </div>
    </div>
  );
}