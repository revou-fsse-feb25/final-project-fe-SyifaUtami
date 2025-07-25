'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Assignment, StudentSubmission, Teacher } from '../../../../types';

export default function AssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSubmissionId = id?.startsWith('SUB_');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch academic data for teachers
        const academicResponse = await fetch('/api/academic-data');
        const academicData = await academicResponse.json();
        setTeachers(academicData.teachers || []);
        
        if (isSubmissionId) {
          // Fetch submission data
          const response = await fetch(`/api/submissions/${id}`);
          if (!response.ok) throw new Error('Failed to fetch submission');
          
          const data = await response.json();
          setSubmission(data.submission);
          setAssignment(data.assignment);
        } else {
          // Fetch assignment data
          const response = await fetch(`/api/assignments/${id}`);
          if (!response.ok) throw new Error('Failed to fetch assignment');
          
          const data = await response.json();
          setAssignment(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isSubmissionId]);

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
                  <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                    {submission.grade !== null ? submission.grade : 'Not graded yet'}
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
                  >
                    Submit Assignment
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