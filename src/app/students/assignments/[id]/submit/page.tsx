'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/authContext';
import { Assignment, StudentSubmission } from '../../../../../types';
import { apiClient } from '@/src/lib/api';

// Extended assignment interface with additional properties
interface ExtendedAssignment extends Assignment {
  title?: string;
  dueDate?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function SubmitAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  // Safe ID extraction with type checking
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const [assignment, setAssignment] = useState<ExtendedAssignment | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<StudentSubmission | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Safe date formatting function
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'No deadline';
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString('en-US', {
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

  // Safe property access helpers
  const getAssignmentTitle = (assignment: ExtendedAssignment): string => {
    return assignment.name || assignment.title || 'Untitled Assignment';
  };

  const getAssignmentDeadline = (assignment: ExtendedAssignment): string | null => {
    return assignment.deadline || assignment.dueDate || null;
  };

  // Fetch assignment details and check for existing submission
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) {
        setError(!user ? 'Please log in to submit assignments' : 'No assignment ID provided');
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

        // Fetch assignment details using Railway API
        const assignmentResponse = await fetch(`${API_BASE_URL}/assignments/${id}`, { headers });
        if (!assignmentResponse.ok) {
          throw new Error('Failed to fetch assignment details');
        }

        const assignmentData = await assignmentResponse.json();
        const assignmentInfo = assignmentData.success ? assignmentData.data : assignmentData;
        setAssignment(assignmentInfo);

        // Check for existing submission
        try {
          const submissionResponse = await fetch(
            `${API_BASE_URL}/assignments?studentId=${user.id}&includeSubmissions=true`, 
            { headers }
          );
          
          if (submissionResponse.ok) {
            const submissionResult = await submissionResponse.json();
            const submissions = submissionResult.success ? submissionResult.data : submissionResult;
            
            // Find submission for this specific assignment
            const currentSubmission = Array.isArray(submissions) 
              ? submissions.find((item: any) => item.assignment?.id === id)?.submission
              : null;
            
            setExistingSubmission(currentSubmission || null);
          }
        } catch (submissionErr) {
          console.warn('Could not fetch existing submission:', submissionErr);
          setExistingSubmission(null);
        }
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assignment');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, user]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('Please select a PDF, DOC, or DOCX file.');
        return;
      }
      
      // Validate file size (e.g., 10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setError('File size must be less than 10MB.');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const generateSubmissionId = (studentId: string, assignmentId: string): string => {
    const timestamp = Date.now();
    return `SUB_${studentId}_${assignmentId}_${timestamp}`;
  };

  const createSubmissionData = (submissionStatus: 'DRAFT' | 'SUBMITTED') => {
    if (!user?.id || !assignment?.id) {
      throw new Error('Missing required data');
    }
    
    const now = new Date().toISOString();
    
    return {
      submissionId: existingSubmission?.submissionId || generateSubmissionId(user.id, assignment.id),
      studentId: user.id,
      assignmentId: assignment.id,
      submissionStatus: submissionStatus,
      submissionName: selectedFile ? selectedFile.name : existingSubmission?.submissionName || null,
      submittedAt: submissionStatus === 'SUBMITTED' ? now : (existingSubmission?.submittedAt || null),
      grade: existingSubmission?.grade || null,
      comment: existingSubmission?.comment || null,
      gradedBy: existingSubmission?.gradedBy || null,
      createdAt: existingSubmission?.createdAt || now,
      updatedAt: now
    };
  };

  const handleSubmit = async () => {
    if (!hasFileToSubmit || !assignment || !user) {
      setError('Please select a file to submit.');
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage(null);
    setError(null);
    
    try {
      const submissionData = createSubmissionData('SUBMITTED');
      
      // Use Railway API to create/update submission
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/submissions`, {
        method: existingSubmission ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit assignment');
      }
      
      const result = await response.json();
      
      if (result) {
        setSuccessMessage('Assignment submitted successfully!');
        setIsSuccess(true);
        
        // Update existing submission state
        setExistingSubmission(result.success ? result.data : result);
        setSelectedFile(null);
        
        // Redirect after successful submission
        setTimeout(() => {
          router.push('/students/assignments');
        }, 2000);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError(error instanceof Error ? error.message : 'Submission failed. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!hasFileToSubmit || !assignment || !user) {
      setError('Please select a file to save as draft.');
      return;
    }
    
    setIsDrafting(true);
    setSuccessMessage(null);
    setError(null);
    
    try {
      const submissionData = createSubmissionData('DRAFT');
      
      // Use Railway API to create/update submission
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/submissions`, {
        method: existingSubmission ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save draft');
      }
      
      const result = await response.json();
      
      if (result) {
        setSuccessMessage('Draft saved successfully!');
        setIsSuccess(true);
        
        // Update existing submission state
        setExistingSubmission(result.success ? result.data : result);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Draft save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save draft. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsDrafting(false);
    }
  };

  // Check if user can submit/save
  const hasFileToSubmit = selectedFile || existingSubmission?.submissionName;
  const isDraftState = existingSubmission?.submissionStatus === 'DRAFT';
  const isAlreadySubmitted = existingSubmission?.submissionStatus === 'SUBMITTED';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 lms-button-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Assignment Not Found</h1>
          <p className="text-lg text-gray-600 mb-4">The assignment you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 lms-button-primary"
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
          Submit Assignment
        </h1>
        <p className="text-lg text-gray-600">
          {assignment.id}: {getAssignmentTitle(assignment)}
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          isSuccess ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Assignment Info */}
      <div className="lms-card mb-6">
        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
          Assignment Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Unit:</span> {assignment.unitCode || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Deadline:</span> {formatDate(getAssignmentDeadline(assignment))}
          </div>
          <div>
            <span className="font-medium">Status:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
              assignment.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {assignment.status || 'Unknown'}
            </span>
          </div>
          {isAlreadySubmitted && (
            <div>
              <span className="font-medium">Submission Status:</span>
              <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Already Submitted
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Submit Form */}
      {!isAlreadySubmitted ? (
        <div className="lms-card">
          <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
            Upload Your Work
          </h3>

          {/* Draft File Info */}
          {existingSubmission?.submissionName && isDraftState && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 font-medium">
                Current draft: {existingSubmission.submissionName}
              </p>
            </div>
          )}
          
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-black)' }}>
                Select File (PDF, DOC, DOCX - Max 10MB):
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx"
                className="lms-input w-full"
              />
              {existingSubmission?.submissionName && !selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Select a new file to replace "{existingSubmission.submissionName}" or keep the current file.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {/* Save Draft Button */}
              <button
                onClick={handleSaveDraft}
                disabled={!hasFileToSubmit || isDrafting || assignment.status !== 'OPEN'}
                className="lms-button-secondary"
              >
                {isDrafting ? 'Saving...' : 'Save Draft'}
              </button>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!hasFileToSubmit || isSubmitting || assignment.status !== 'OPEN'}
                className="lms-button-primary"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
              </button>

              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="lms-button-secondary"
              >
                Cancel
              </button>
            </div>

            {/* Status Messages */}
            {assignment.status !== 'OPEN' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800">
                  This assignment is closed and no longer accepting submissions.
                </p>
              </div>
            )}

            {!hasFileToSubmit && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-gray-600">
                  Please select a file to submit or save as draft.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Already Submitted Message (in case) */
        <div className="lms-card">
          <div className="text-center py-8">
            <div className="text-6xl text-green-500 mb-4">✓</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-black)' }}>
              Assignment Already Submitted
            </h3>
            <p className="text-gray-600 mb-4">
              You have already submitted this assignment: {existingSubmission?.submissionName}
            </p>
            {existingSubmission?.submittedAt && (
              <p className="text-sm text-gray-500 mb-4">
                Submitted on: {formatDate(existingSubmission.submittedAt)}
              </p>
            )}
            <button
              onClick={() => router.push('/students/assignments')}
              className="lms-button-primary"
            >
              View All Assignments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}