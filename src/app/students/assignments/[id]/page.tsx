'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/authContext';
import { Assignment, StudentSubmission, Teacher } from '../../../../types';

// Extended Assignment interface to include description
interface ExtendedAssignment extends Assignment {
  title?: string;
  description?: string;
  dueDate?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function StudentAssignmentDetailPage() {
  const [assignment, setAssignment] = useState<ExtendedAssignment | null>(null);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  // Handle both assignment ID and submission ID
  const id = params?.id as string;
  const isSubmissionId = id?.startsWith('sub_') || false;

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

        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
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
          // Fetch assignment directly
          const assignmentResponse = await fetch(`${API_BASE_URL}/assignments/${id}`, { headers });
          
          if (!assignmentResponse.ok) {
            throw new Error('Failed to fetch assignment');
          }
          
          const assignmentResult = await assignmentResponse.json();
          assignmentData = assignmentResult.success ? assignmentResult.data : assignmentResult;

          // Try to fetch submission for this assignment and current user
          if (user?.id && assignmentData?.id) {
            try {
              const submissionResponse = await fetch(
                `${API_BASE_URL}/assignments?studentId=${user.id}&assignmentId=${assignmentData.id}&includeSubmissions=true`, 
                { headers }
              );
              
              if (submissionResponse.ok) {
                const submissionResult = await submissionResponse.json();
                const submissions = submissionResult.success ? submissionResult.data : submissionResult;
                submissionData = Array.isArray(submissions) ? submissions[0] : submissions;
              }
            } catch (err) {
              // Submission fetch failed, but continue without it
              console.warn('Could not fetch submission data:', err);
            }
          }
        }

        // Fetch teachers data for display
        try {
          const teachersResponse = await fetch(`${API_BASE_URL}/academic-data`, { headers });
          if (teachersResponse.ok) {
            const academicData = await teachersResponse.json();
            setTeachers(academicData.success ? academicData.data.teachers : academicData.teachers || []);
          }
        } catch (err) {
          console.warn('Could not fetch teachers data:', err);
        }

        if (!assignmentData) {
          throw new Error('Assignment not found');
        }

        setAssignment(assignmentData);
        setSubmission(submissionData);
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isSubmissionId, user?.id]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date provided';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTeacherName = (teacherCode: string): string => {
    const teacher = teachers.find((t: Teacher) => t.id === teacherCode);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : teacherCode;
  };

  const handleSubmitClick = () => {
    router.push(`/students/assignments/${id}/submit`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
          <p className="text-lg text-gray-600">{error || 'Assignment not found'}</p>
          <button 
            onClick={() => router.back()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
          {assignment.name || assignment.title || assignment.id}
        </h1>
        <p className="text-lg text-gray-600">
          {isSubmissionId ? 'Submission Details' : 'Assignment Details'}
        </p>
      </div>

      {/* Details Table */}
      <div className="lms-table">
        <table className="w-full">
          <tbody>
            <tr className="border-b border-[var(--border-color)]">
              <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)', width: '200px' }}>
                Name:
              </td>
              <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                {assignment.name || assignment.title || 'Untitled Assignment'}
              </td>
            </tr>
            
            <tr className="border-b border-[var(--border-color)]">
              <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                Unit:
              </td>
              <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                {assignment.unitCode}
              </td>
            </tr>
            
            <tr className="border-b border-[var(--border-color)]">
              <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                Deadline:
              </td>
              <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                {formatDate(assignment.deadline || assignment.dueDate)}
              </td>
            </tr>

            <tr className="border-b border-[var(--border-color)]">
              <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                Status:
              </td>
              <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  assignment.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {assignment.status}
                </span>
              </td>
            </tr>

            <tr className="border-b border-[var(--border-color)]">
              <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                Published:
              </td>
              <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                {formatDate(assignment.publishedAt)}
              </td>
            </tr>

            {/* Submission-specific fields */}
            {isSubmissionId && submission && (
              <>
                <tr className="border-b border-[var(--border-color)]">
                  <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                    Submission Status:
                  </td>
                  <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      submission.submissionStatus === 'SUBMITTED' ? 'bg-green-100 text-green-800' :
                      submission.submissionStatus === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {submission.submissionStatus}
                    </span>
                  </td>
                </tr>
                
                <tr className="border-b border-[var(--border-color)]">
                  <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                    Submitted at:
                  </td>
                  <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                    {submission.submittedAt ? formatDate(submission.submittedAt) : 'Not submitted'}
                  </td>
                </tr>
                
                <tr className="border-b border-[var(--border-color)]">
                  <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                    Submission name:
                  </td>
                  <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                    {submission.submissionName || 'No file submitted'}
                  </td>
                </tr>
                
                <tr className="border-b border-[var(--border-color)]">
                  <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                    Grade:
                  </td>
                  <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                    {submission.grade !== null && submission.grade !== undefined ? 
                      `${submission.grade}/100` : 'Not graded yet'}
                  </td>
                </tr>

                {submission.comment && (
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                      Comment:
                    </td>
                    <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                      {submission.comment}
                    </td>
                  </tr>
                )}

                {submission.gradedBy && (
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                      Graded by:
                    </td>
                    <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                      {getTeacherName(submission.gradedBy)}
                    </td>
                  </tr>
                )}

                {submission.gradedAt && (
                  <tr className="border-b border-[var(--border-color)]">
                    <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                      Graded at:
                    </td>
                    <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                      {formatDate(submission.gradedAt)}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Description */}
      {assignment.description && (
        <div className="lms-card mt-6">
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
            Description
          </h3>
          <div className="prose max-w-none">
            <p style={{ color: 'var(--text-black)' }}>
              {assignment.description}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isSubmissionId && assignment.status === 'OPEN' && (
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSubmitClick}
            className="lms-button-primary"
          >
            Submit Assignment
          </button>
          
          <button
            onClick={() => router.back()}
            className="lms-button-secondary"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Submission specific actions */}
      {isSubmissionId && (
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.back()}
            className="lms-button-primary"
          >
            ← Back to Assignments
          </button>
        </div>
      )}

      {/* Closed assignment notice */}
      {!isSubmissionId && assignment.status === 'CLOSED' && (
        <div className="mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">
              This assignment is closed and no longer accepting submissions.
            </p>
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => router.back()}
              className="lms-button-secondary"
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}