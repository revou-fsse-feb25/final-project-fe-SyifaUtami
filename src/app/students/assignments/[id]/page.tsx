'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authManager, type User } from '@/src/lib/auth';
import { Assignment, StudentSubmission, Teacher } from '../../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function AssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSubmissionId = id?.startsWith('SUB_');

  // Initialize user
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

  useEffect(() => {
    if (!id || !user) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Always fetch teachers first
        try {
          const teachersResponse = await fetch(`${API_BASE_URL}/teachers`, { headers });
          if (teachersResponse.ok) {
            const teachersResult = await teachersResponse.json();
            const teachersData = teachersResult.success ? teachersResult.data : teachersResult;
            setTeachers(Array.isArray(teachersData) ? teachersData : []);
          }
        } catch (teacherError) {
          console.warn('Could not fetch teachers:', teacherError);
        }

        if (isSubmissionId) {
          console.log('Fetching submission data for:', id);
          
          // For submission view, we need to get the submission from the combined assignments API
          // because direct submission endpoint gives 403
          const assignmentsResponse = await fetch(
            `${API_BASE_URL}/assignments?studentId=${user.id}&includeSubmissions=true`,
            { headers }
          );
          
          if (!assignmentsResponse.ok) {
            throw new Error(`Failed to fetch assignments: ${assignmentsResponse.status}`);
          }

          const assignmentsResult = await assignmentsResponse.json();
          
          // Handle response format
          let submissions: any[] = [];
          let assignments: any[] = [];
          
          if (assignmentsResult.assignments && assignmentsResult.submissions) {
            assignments = assignmentsResult.assignments;
            submissions = assignmentsResult.submissions;
          } else if (Array.isArray(assignmentsResult.data)) {
            // Handle other formats if needed
            assignments = assignmentsResult.data;
          }

          // Find the specific submission
          const foundSubmission = submissions.find((sub: any) => sub.submissionId === id);
          if (!foundSubmission) {
            throw new Error('Submission not found');
          }

          // Find the corresponding assignment
          const foundAssignment = assignments.find((assign: any) => assign.id === foundSubmission.assignmentId);
          if (!foundAssignment) {
            throw new Error('Assignment not found for this submission');
          }

          setSubmission({
            id: foundSubmission.id,
            submissionId: foundSubmission.submissionId,
            studentId: foundSubmission.studentId,
            assignmentId: foundSubmission.assignmentId,
            submissionStatus: foundSubmission.submissionStatus,
            submissionName: foundSubmission.submissionName,
            submittedAt: foundSubmission.submittedAt,
            grade: foundSubmission.grade,
            comment: foundSubmission.comment,
            gradedBy: foundSubmission.gradedBy,
            gradedAt: foundSubmission.gradedAt,
            createdAt: foundSubmission.createdAt || '',
            updatedAt: foundSubmission.updatedAt || ''
          });

          setAssignment({
            id: foundAssignment.id,
            name: foundAssignment.name,
            unitCode: foundAssignment.unitCode,
            deadline: foundAssignment.deadline,
            publishedAt: foundAssignment.publishedAt,
            status: foundAssignment.status.toUpperCase() as 'OPEN' | 'CLOSED',
            createdAt: foundAssignment.createdAt || '',
            updatedAt: foundAssignment.updatedAt || ''
          });

        } else {
          console.log('Fetching assignment data for:', id);
          
          // Fetch assignment directly
          const assignmentResponse = await fetch(`${API_BASE_URL}/assignments/${id}`, { headers });
          if (!assignmentResponse.ok) {
            throw new Error(`Failed to fetch assignment: ${assignmentResponse.status}`);
          }

          const assignmentResult = await assignmentResponse.json();
          const assignmentData = assignmentResult.success ? assignmentResult.data : assignmentResult;

          setAssignment({
            id: assignmentData.id,
            name: assignmentData.name,
            unitCode: assignmentData.unitCode,
            deadline: assignmentData.deadline,
            publishedAt: assignmentData.publishedAt,
            status: assignmentData.status.toUpperCase() as 'OPEN' | 'CLOSED',
            createdAt: assignmentData.createdAt || '',
            updatedAt: assignmentData.updatedAt || ''
          });

          // Try to find submission for this assignment
          try {
            const assignmentsResponse = await fetch(
              `${API_BASE_URL}/assignments?studentId=${user.id}&includeSubmissions=true`,
              { headers }
            );
            
            if (assignmentsResponse.ok) {
              const assignmentsResult = await assignmentsResponse.json();
              
              if (assignmentsResult.submissions) {
                const foundSubmission = assignmentsResult.submissions.find((sub: any) => sub.assignmentId === id);
                if (foundSubmission) {
                  setSubmission({
                    id: foundSubmission.id,
                    submissionId: foundSubmission.submissionId,
                    studentId: foundSubmission.studentId,
                    assignmentId: foundSubmission.assignmentId,
                    submissionStatus: foundSubmission.submissionStatus,
                    submissionName: foundSubmission.submissionName,
                    submittedAt: foundSubmission.submittedAt,
                    grade: foundSubmission.grade,
                    comment: foundSubmission.comment,
                    gradedBy: foundSubmission.gradedBy,
                    gradedAt: foundSubmission.gradedAt,
                    createdAt: foundSubmission.createdAt || '',
                    updatedAt: foundSubmission.updatedAt || ''
                  });
                }
              }
            }
          } catch (submissionError) {
            console.warn('Could not fetch submission data:', submissionError);
          }
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isSubmissionId, user]);

  const formatDate = (dateString: string) => {
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
    // Always use assignment ID for submit route
    const assignmentId = assignment?.id || id;
    router.push(`/students/assignments/${assignmentId}/submit`);
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
            className="lms-button-primary mt-4"
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
          {assignment.id}: {assignment.name}
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
                {assignment.name}
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
                {formatDate(assignment.deadline)}
              </td>
            </tr>

            <tr className="border-b border-[var(--border-color)]">
              <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                Status:
              </td>
              <td className="py-4 px-6 bg-white">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  assignment.status === 'OPEN' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {assignment.status}
                </span>
              </td>
            </tr>

            {/* Submission-specific fields */}
            {isSubmissionId && submission && (
              <>
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
                    Submission ID:
                  </td>
                  <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                    {submission.submissionId}
                  </td>
                </tr>
                
                <tr className="border-b border-[var(--border-color)]">
                  <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                    Grade:
                  </td>
                  <td className="py-4 px-6 bg-white">
                    <span style={{ 
                      color: submission.grade !== null && submission.grade !== undefined
                        ? submission.grade >= 80 ? 'var(--success-green)' :
                          submission.grade >= 60 ? 'var(--warning-yellow)' :
                          'var(--danger-red)'
                        : 'var(--text-black)'
                    }}>
                      {submission.grade !== null && submission.grade !== undefined ? `${submission.grade}/100` : 'Not graded yet'}
                    </span>
                  </td>
                </tr>
                
                <tr className="border-b border-[var(--border-color)]">
                  <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                    Comment:
                  </td>
                  <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                    {submission.comment || 'No comment provided'}
                  </td>
                </tr>
                
                <tr>
                  <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                    Graded by:
                  </td>
                  <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                    {submission.gradedBy ? getTeacherName(submission.gradedBy) : 'Not graded yet'}
                  </td>
                </tr>
              </>
            )}

            {/* Assignment-specific fields (Submit button for open assignments) */}
            {!isSubmissionId && (
              <tr>
                <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                  Submit:
                </td>
                <td className="py-4 px-6 bg-white">
                  <button 
                    onClick={handleSubmitClick}
                    className="lms-button-secondary"
                    disabled={assignment.status === 'CLOSED'}
                  >
                    {assignment.status === 'CLOSED' ? 'Assignment Closed' : 'Submit Assignment'}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Back Button */}
      <div className="mt-8">
        <button 
          onClick={() => router.back()}
          className="lms-button-primary"
        >
          ← Back to Assignments
        </button>
      </div>
    </div>
  );
}