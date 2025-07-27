'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/authContext';
import { Assignment } from '../../../../../types';

export default function SubmitAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<any | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch assignment details and check for existing submission
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setError('Please log in to submit assignments');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch assignment details
        const assignmentResponse = await fetch(`/api/assignments/${id}`);
        if (!assignmentResponse.ok) throw new Error('Failed to fetch assignment');
        const assignmentData = await assignmentResponse.json();
        setAssignment(assignmentData);

        // Check for existing submission
        const submissionResponse = await fetch(`/api/submissions/check?studentId=${user.id}&assignmentId=${id}`);
        
        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json();
          
          if (submissionData.found && submissionData.submission) {
            setExistingSubmission(submissionData.submission);
          } else {
            setExistingSubmission(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignment');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id && user) {
      fetchData();
    }
  }, [id, user]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const generateSubmissionId = (studentId: string, assignmentId: string): string => {
    return `SUB_${studentId}_${assignmentId}_1`;
  };

  const createSubmissionData = (submissionStatus: 'draft' | 'submitted') => {
    if (!user?.id) {
      throw new Error('User not logged in');
    }
    
    const now = new Date().toISOString();
    
    return {
      submissionId: existingSubmission?.submissionId || generateSubmissionId(user.id, assignment!.id),
      studentId: user.id,
      assignmentId: assignment!.id,
      status: assignment!.status,
      submissionStatus: submissionStatus,
      submissionName: selectedFile ? selectedFile.name : existingSubmission?.submissionName,
      submittedAt: submissionStatus === 'submitted' ? now : (existingSubmission?.submittedAt || null),
      grade: existingSubmission?.grade || null,
      comment: existingSubmission?.comment || null,
      gradedBy: existingSubmission?.gradedBy || null
    };
  };

  const handleSubmit = async () => {
    if ((!selectedFile && !existingSubmission?.submissionName) || !assignment) {
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage(null);
    
    try {
      const submissionData = createSubmissionData('submitted');
      
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('Assignment submitted successfully!');
        setIsSuccess(true);
        // Refresh the existing submission data
        const submissionResponse = await fetch(`/api/submissions/check?studentId=${user?.id}&assignmentId=${id}`);
        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json();
          if (submissionData.found && submissionData.submission) {
            setExistingSubmission(submissionData.submission);
          }
        }
      } else {
        throw new Error(result.message || 'Failed to submit assignment');
      }
    } catch (error) {
      setSuccessMessage(error instanceof Error ? error.message : 'Submission failed. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if ((!selectedFile && !existingSubmission?.submissionName) || !assignment) {
      return;
    }
    
    setIsDrafting(true);
    setSuccessMessage(null);
    
    try {
      const submissionData = createSubmissionData('draft');
      
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('Draft saved successfully!');
        setIsSuccess(true);
        // Refresh the existing submission data
        const submissionResponse = await fetch(`/api/submissions/check?studentId=${user?.id}&assignmentId=${id}`);
        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json();
          if (submissionData.found && submissionData.submission) {
            setExistingSubmission(submissionData.submission);
          }
        }
      } else {
        throw new Error(result.message || 'Failed to save draft');
      }
    } catch (error) {
      setSuccessMessage(error instanceof Error ? error.message : 'Failed to save draft. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsDrafting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if user can submit/save
  const hasFileToSubmit = selectedFile || existingSubmission?.submissionName;
  const isDraftState = existingSubmission?.submissionStatus === 'draft';

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
          {assignment.id}: {assignment.name}
        </p>
      </div>

      {/* Assignment Info */}
      <div className="lms-card mb-6">
        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
          Assignment Details
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Unit:</span> {assignment.unitCode}
          </div>
          <div>
            <span className="font-medium">Deadline:</span> {formatDate(assignment.deadline)}
          </div>
        </div>
      </div>

      {/* Submit Form */}
      <div className="lms-card">
        <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Upload Your Work
        </h3>

        {/* Draft File Info */}
        {existingSubmission?.submissionName && isDraftState && (
          <div className="mb-4">
            <p className="text-black font-bold">
              Current draft: {existingSubmission.submissionName}
            </p>
          </div>
        )}
        
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-black)' }}>
              Select File (PDF, DOC, DOCX):
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

          {/* Selected File Info */}
          {selectedFile && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-800">
                  New file selected: {selectedFile.name}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {existingSubmission?.submissionName && (
                <p className="text-xs text-green-600 mt-1">
                  This will replace: {existingSubmission.submissionName}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleSubmit}
              disabled={!hasFileToSubmit || isSubmitting || isDrafting}
              className={`lms-button-secondary flex-1 ${
                !hasFileToSubmit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Assignment'
              )}
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={!hasFileToSubmit || isSubmitting || isDrafting}
              className={`lms-button-primary flex-1 ${
                !hasFileToSubmit ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isDrafting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Draft...
                </span>
              ) : (
                isDraftState ? 'Update Draft' : 'Save as Draft'
              )}
            </button>

            <button
              onClick={() => router.back()}
              className="lms-button-primary bg-gray-600 hover:bg-gray-700"
              disabled={isSubmitting || isDrafting}
            >
              Cancel
            </button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 pt-2 space-y-1">
            <p>• <strong>Submit:</strong> Final submission - cannot be changed after deadline</p>
            <p>• <strong>Save as Draft:</strong> Save your work - you can continue editing later</p>
            {existingSubmission?.submissionName && (
              <p>• You can submit with the current file or upload a new one to replace it</p>
            )}
          </div>

          {/* Success/Error Message */}
          {successMessage && (
            <div className={`mt-6 p-4 rounded-lg border ${
              isSuccess 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {isSuccess ? (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="font-medium">{successMessage}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}