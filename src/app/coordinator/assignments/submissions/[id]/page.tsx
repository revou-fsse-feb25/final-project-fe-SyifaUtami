'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SubmissionDetailsTable from '../../../../components/submissionDetails';
import { Assignment, StudentSubmission, Student } from '../../../../../types';

export default function CoordinatorSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editGrade, setEditGrade] = useState<number>(0);
  const [editComment, setEditComment] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Unwrap params Promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch submission data
        const submissionResponse = await fetch(`/api/submissions/${id}`);
        if (!submissionResponse.ok) {
          throw new Error('Failed to fetch submission data');
        }
        const submissionData = await submissionResponse.json();
        setSubmission(submissionData.submission);
        setAssignment(submissionData.assignment);
        
        // Set initial edit values
        setEditGrade(submissionData.submission.grade || 0);
        setEditComment(submissionData.submission.comment || '');
        
        // Fetch student data
        const studentsResponse = await fetch('/api/students');
        if (!studentsResponse.ok) {
          throw new Error('Failed to fetch students data');
        }
        const studentsData: Student[] = await studentsResponse.json();
        const studentInfo = studentsData.find((s: Student) => s.id === submissionData.submission.studentId);
        setStudent(studentInfo || null);
        
      } catch (err) {
        console.error('Error fetching submission data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load submission data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleEditGrade = () => {
    setIsEditing(true);
  };

  const handleSaveGrade = async () => {
    if (!submission) return;

    try {
      setIsSaving(true);
      setSuccessMessage('');
      setErrorMessage('');
      
      const response = await fetch(`/api/submissions/${submission.submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          grade: editGrade, 
          comment: editComment,
          gradedBy: 'coordinator' // You can get this from auth context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update grade');
      }

      const result = await response.json();
      setSubmission(result.submission);
      setIsEditing(false);
      setSuccessMessage('Grade and comment updated successfully!');
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      console.error('Error updating grade:', err);
      setErrorMessage('Failed to update grade. Please try again.');
      
      // Hide error message after 5 seconds
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setEditGrade(submission?.grade || 0);
    setEditComment(submission?.comment || '');
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error || !assignment || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600">{error || 'Submission not found'}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 lms-button-primary"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
            {assignment.id}: {assignment.name}
          </h1>
          <p className="text-lg text-gray-600">
            Submission Details - {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
          </p>
        </div>

        {/* Submission Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <SubmissionDetailsTable 
            assignment={assignment}
            submission={submission}
            studentName={student ? `${student.firstName} ${student.lastName}` : undefined}
            studentEmail={student?.email}
            showStudentInfo={true} // Show student info for coordinator view
          />
          
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
          
          {/* Grading Section - Only show for submitted assignments */}
          {submission.submissionStatus === 'submitted' && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Edit Grade & Comment</h3>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editGrade}
                      onChange={(e) => setEditGrade(Number(e.target.value))}
                      className="lms-input w-32"
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment
                    </label>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={4}
                      className="lms-input w-full"
                      placeholder="Enter feedback for the student..."
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveGrade}
                      disabled={isSaving}
                      className="lms-button-primary"
                    >
                      {isSaving ? 'Saving...' : 'Save Grade'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="lms-button-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={handleEditGrade}
                    className="lms-button-secondary"
                  >
                    Edit Grade & Comment
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-8 flex gap-4 border-t pt-6">
            <button 
              onClick={() => router.back()}
              className="lms-button-primary"
            >
              ← Back to Assignment Overview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}