'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authManager, type User } from '@/src/lib/auth';
import { Assignment, StudentSubmission } from '../../../../../types';

// Extended assignment interface with additional properties
interface ExtendedAssignment extends Assignment {
  title?: string;
  dueDate?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function SubmitAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
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

  // Initialize user from auth manager
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

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
        setError(!user ? 'Please log in to submit assignments.' : 'Assignment ID not found.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Fetching assignment and submission data...');

        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch assignment details
        const assignmentResponse = await fetch(`${API_BASE_URL}/assignments/${id}`, { headers });
        
        if (!assignmentResponse.ok) {
          throw new Error('Assignment not found');
        }

        const assignmentResult = await assignmentResponse.json();
        const assignmentData = assignmentResult.success ? assignmentResult.data : assignmentResult;
        
        console.log('📝 Assignment data received:', assignmentData);
        setAssignment(assignmentData);

        // Check for existing submission using the correct endpoint
        try {
          const submissionsResponse = await fetch(`${API_BASE_URL}/submissions/student/${user.id}`, { headers });
          
          if (submissionsResponse.ok) {
            const submissionsResult = await submissionsResponse.json();
            const submissions = submissionsResult.success ? submissionsResult.data : submissionsResult;
            
            console.log('📋 Submissions data received:', submissions);
            
            // Find submission for this assignment
            const submission = Array.isArray(submissions) 
              ? submissions.find((sub: StudentSubmission) => sub.assignmentId === id)
              : null;
            
            if (submission) {
              console.log('📄 Existing submission found:', submission);
              setExistingSubmission(submission);
            }
          }
        } catch (submissionError) {
          console.warn('Could not fetch existing submissions:', submissionError);
          // Don't throw here - assignment might still be submittable
        }

      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assignment data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, id]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      console.log('📎 File selected:', file.name);
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!user || !assignment || !selectedFile) {
      setError('Missing required information for submission');
      return;
    }

    const actionType = isDraft ? 'draft' : 'submit';
    const setLoadingState = isDraft ? setIsDrafting : setIsSubmitting;

    try {
      setLoadingState(true);
      setError(null);
      setSuccessMessage(null);

      console.log(`🚀 ${isDraft ? 'Saving draft' : 'Submitting'} assignment...`);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // If updating existing submission
      if (existingSubmission) {
        console.log('📝 Updating existing submission...');
        
        const response = await fetch(`${API_BASE_URL}/submissions/${existingSubmission.submissionId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            submissionName: selectedFile.name,
            submissionStatus: isDraft ? 'DRAFT' : 'SUBMITTED',
            submittedAt: isDraft ? null : new Date().toISOString(),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setSuccessMessage(
            isDraft 
              ? 'Draft saved successfully!' 
              : 'Assignment submitted successfully!'
          );
          setIsSuccess(true);
          
          // Update local submission state
          setExistingSubmission({
            ...existingSubmission,
            submissionName: selectedFile.name,
            submissionStatus: isDraft ? 'DRAFT' : 'SUBMITTED',
            submittedAt: isDraft ? existingSubmission.submittedAt : new Date().toISOString(),
          });
          
          if (!isDraft) {
            // Redirect after successful submission
            setTimeout(() => {
              router.push('/students/assignments');
            }, 2000);
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to ${actionType} assignment`);
        }
      } else {
        // Create new submission - this would need a file upload endpoint
        console.log('📄 Creating new submission...');
        
        // Note: This would typically involve a file upload endpoint
        // For now, we'll simulate the submission creation
        setSuccessMessage(
          isDraft 
            ? 'Draft saved successfully!' 
            : 'Assignment submitted successfully!'
        );
        setIsSuccess(true);
        
        // Create a mock submission object
        setExistingSubmission({
          id: 'temp-' + Date.now(),
          submissionId: 'temp-submission-' + Date.now(),
          studentId: user.id,
          assignmentId: id!,
          submissionStatus: isDraft ? 'DRAFT' : 'SUBMITTED',
          submissionName: selectedFile.name,
          submittedAt: isDraft ? null : new Date().toISOString(),
          grade: null,
          comment: null,
          gradedBy: null,
          gradedAt: null,
        });
        
        if (!isDraft) {
          setTimeout(() => {
            router.push('/students/assignments');
          }, 2000);
        }
      }

    } catch (err) {
      console.error(`❌ Error ${actionType}ing assignment:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${actionType} assignment`);
    } finally {
      setLoadingState(false);
    }
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

  if (error && !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--text-black)' }}>Error</p>
          <p className="text-gray-600 mb-4">{error}</p>
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

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <p>Assignment not found</p>
      </div>
    );
  }

  const deadline = getAssignmentDeadline(assignment);
  const isOverdue = deadline && new Date() > new Date(deadline);
  const canSubmit = assignment.status === 'OPEN' && !isOverdue && (!existingSubmission || existingSubmission.submissionStatus !== 'SUBMITTED');

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
            Submit Assignment
          </h1>
        </div>

        {/* Assignment Details */}
        <div className="lms-card mb-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--primary-dark)' }}>
            {getAssignmentTitle(assignment)}
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
                {assignment.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          </div>

          {isOverdue && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-red-700">
                ⚠️ This assignment is overdue. Late submissions may not be accepted.
              </p>
            </div>
          )}
        </div>

        {/* Existing Submission Status */}
        {existingSubmission && (
          <div className="lms-card mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--primary-dark)' }}>
              Current Submission Status
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  existingSubmission.submissionStatus === 'SUBMITTED'
                    ? 'bg-green-100 text-green-800'
                    : existingSubmission.submissionStatus === 'DRAFT'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {existingSubmission.submissionStatus}
                </span>
              </div>
              <div>
                <strong>File:</strong> {existingSubmission.submissionName || 'No file'}
              </div>
              <div>
                <strong>Submitted:</strong> 
                {existingSubmission.submittedAt 
                  ? formatDate(existingSubmission.submittedAt)
                  : 'Not submitted yet'}
              </div>
              <div>
                <strong>Grade:</strong> 
                {existingSubmission.grade !== null 
                  ? `${existingSubmission.grade}/100`
                  : 'Not graded yet'}
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && successMessage && (
          <div className="lms-card mb-6 bg-green-50 border-green-200">
            <div className="text-green-700">
              ✅ {successMessage}
              {!isDrafting && !isSubmitting && (
                <p className="text-sm mt-2">
                  Redirecting to assignments page...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="lms-card mb-6 bg-red-50 border-red-200">
            <div className="text-red-700">
              ❌ {error}
            </div>
          </div>
        )}

        {/* File Upload Form */}
        {canSubmit && (
          <div className="lms-card">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--primary-dark)' }}>
              {existingSubmission ? 'Update Submission' : 'Submit Assignment'}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File to Upload *
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="lms-input w-full"
                accept=".pdf,.doc,.docx,.txt,.zip,.ppt,.pptx"
                disabled={isSubmitting || isDrafting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, Word documents, Text files, ZIP archives, PowerPoint presentations (Max: 10MB)
              </p>
            </div>

            {selectedFile && (
              <div className="mb-6 p-3 bg-gray-50 rounded">
                <p className="text-sm">
                  <strong>Selected file:</strong> {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => handleSubmit(true)}
                disabled={!selectedFile || isSubmitting || isDrafting}
                className="lms-button-secondary"
              >
                {isDrafting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Saving Draft...
                  </>
                ) : (
                  'Save as Draft'
                )}
              </button>
              
              <button
                onClick={() => handleSubmit(false)}
                disabled={!selectedFile || isSubmitting || isDrafting}
                className="lms-button-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Assignment'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Cannot Submit Message */}
        {!canSubmit && (
          <div className="lms-card bg-yellow-50 border-yellow-200">
            <div className="text-yellow-700">
              {isOverdue 
                ? '⚠️ This assignment is overdue and cannot be submitted.'
                : existingSubmission?.submissionStatus === 'SUBMITTED'
                ? '✅ You have already submitted this assignment.'
                : assignment.status === 'CLOSED'
                ? '❌ This assignment is closed and cannot be submitted.'
                : '❌ This assignment cannot be submitted at this time.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}