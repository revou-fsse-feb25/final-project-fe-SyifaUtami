'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SubmissionDetailsTable from '../../../../components/submissionDetails';
import { Assignment, StudentSubmission, Student } from '../../../../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function CoordinatorSubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editGrade, setEditGrade] = useState<string>('');
  const [editComment, setEditComment] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!id) return;

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
          'Content-Type': 'application/json',
        };

        // Fetch submission data
        const submissionResponse = await fetch(`${API_BASE_URL}/submissions/${id}`, { headers });
        if (!submissionResponse.ok) {
          throw new Error('Failed to fetch submission data');
        }

        const submissionResult = await submissionResponse.json();
        const submissionData = submissionResult.success ? submissionResult.data : submissionResult;
        setSubmission(submissionData);

        // Set initial edit values
        setEditGrade(submissionData.grade?.toString() || '');
        setEditComment(submissionData.comment || '');

        // Fetch assignment data
        if (submissionData.assignmentId) {
          const assignmentResponse = await fetch(`${API_BASE_URL}/assignments/${submissionData.assignmentId}`, { headers });
          if (assignmentResponse.ok) {
            const assignmentResult = await assignmentResponse.json();
            const assignmentData = assignmentResult.success ? assignmentResult.data : assignmentResult;
            setAssignment(assignmentData);
          }
        }
        
        // Fetch student data
        if (submissionData.studentId) {
          const studentsResponse = await fetch(`${API_BASE_URL}/students`, { headers });
          if (studentsResponse.ok) {
            const studentsResult = await studentsResponse.json();
            const studentsData = studentsResult.success ? studentsResult.data : studentsResult;
            const studentInfo = Array.isArray(studentsData) 
              ? studentsData.find((s: Student) => s.id === submissionData.studentId)
              : null;
            setStudent(studentInfo || null);
          }
        }
        
      } catch (err) {
        console.error('Error fetching submission data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load submission data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSaveGrade = async () => {
    if (!submission || !editGrade) return;

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const grade = parseFloat(editGrade);

      if (isNaN(grade) || grade < 0 || grade > 100) {
        setErrorMessage('Please enter a valid grade between 0 and 100');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/submissions/${submission.submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          grade: grade,
          comment: editComment.trim() || null,
          gradedBy: 'coordinator' // You might want to get this from user context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update grade');
      }

      const result = await response.json();
      const updatedSubmission = result.success ? result.data : result;

      // Update local state
      setSubmission(updatedSubmission);
      setIsEditing(false);
      setSuccessMessage('Grade updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Error updating grade:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update grade');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditGrade(submission?.grade?.toString() || '');
    setEditComment(submission?.comment || '');
    setErrorMessage('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>
            Error
          </h1>
          <p className="text-lg text-gray-600 mb-4">{error || 'Submission not found'}</p>
          <button onClick={() => router.back()} className="lms-button-primary">
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
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Assignment
        </button>
        
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
          Submission Details
        </h1>
        <p className="text-lg text-gray-600">
          {student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Student Submission'}
        </p>
      </div>

      {/* Submission Details */}
      <div className="bg-white shadow rounded-lg p-6">
        {assignment && (
          <SubmissionDetailsTable 
            assignment={assignment}
            submission={submission}
            studentName={student ? `${student.firstName} ${student.lastName || ''}`.trim() : undefined}
            studentEmail={student?.email || undefined}
            showStudentInfo={true}
          />
        )}
        
        {/* Success/Error Messages */}
        {(successMessage || errorMessage) && (
          <div className="mt-6">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Grading Section */}
        {submission.submissionStatus === 'SUBMITTED' && (
          <div className="mt-8 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-black)' }}>
                Grade & Comment
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <FontAwesomeIcon icon={faEdit} className="text-sm" />
                  <span>Edit Grade</span>
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-black)' }}>
                      Grade (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editGrade}
                      onChange={(e) => setEditGrade(e.target.value)}
                      className="lms-input"
                      placeholder="Enter grade..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-black)' }}>
                    Comment (Optional)
                  </label>
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    rows={4}
                    className="lms-input"
                    placeholder="Enter feedback for the student..."
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveGrade}
                    disabled={isSaving || !editGrade.trim()}
                    className="flex items-center space-x-2 lms-button-primary disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faSave} className="text-sm" />
                    <span>{isSaving ? 'Saving...' : 'Save Grade'}</span>
                  </button>
                  
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex items-center space-x-2 lms-button-secondary"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Grade</p>
                  <p className="text-2xl font-bold" style={{ 
                    color: submission.grade && submission.grade >= 70 ? '#10B981' : 
                           submission.grade && submission.grade >= 50 ? '#F59E0B' : '#EF4444'
                  }}>
                    {submission.grade !== null && submission.grade !== undefined 
                      ? `${submission.grade}%` 
                      : 'Not graded'
                    }
                  </p>
                </div>
                
                {submission.comment && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Feedback</p>
                    <p className="text-sm" style={{ color: 'var(--text-black)' }}>
                      {submission.comment}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Grading History */}
            {submission.gradedAt && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Graded on {new Date(submission.gradedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {submission.gradedBy && ` by ${submission.gradedBy}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Not Submitted Message */}
        {submission.submissionStatus !== 'SUBMITTED' && (
          <div className="mt-8 border-t pt-6">
            <div className="text-center py-8">
              <div className="text-4xl text-yellow-500 mb-4">⏳</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-black)' }}>
                Submission Pending
              </h3>
              <p className="text-gray-600">
                This student hasn't submitted their work yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}