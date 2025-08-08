'use client';
import { Assignment, StudentSubmission } from '../../types';

interface SubmissionDetailsTableProps {
  assignment: Assignment;
  submission: StudentSubmission;
  studentName?: string;
  studentEmail?: string;
  showStudentInfo?: boolean; // For coordinator view
  className?: string;
}

export default function SubmissionDetailsTable({
  assignment,
  submission,
  studentName,
  studentEmail,
  showStudentInfo = false,
  className = ""
}: SubmissionDetailsTableProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTeacherName = (teacherId: string) => {
    // You can implement this based on your teachers data structure
    return teacherId; // For now, just return the ID
  };

  return (
    <div className={`lms-table ${className}`}>
      <table className="w-full">
        <tbody>
          {/* Assignment Details */}
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

          {/* Student Info (for coordinator view) */}
          {showStudentInfo && studentName && (
            <>
              <tr className="border-b border-[var(--border-color)]">
                <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                  Student:
                </td>
                <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                  {studentName}
                </td>
              </tr>
              
              {studentEmail && (
                <tr className="border-b border-[var(--border-color)]">
                  <td className="py-4 px-6 font-semibold bg-white" style={{ color: 'var(--text-black)' }}>
                    Email:
                  </td>
                  <td className="py-4 px-6 bg-white" style={{ color: 'var(--text-black)' }}>
                    {studentEmail}
                  </td>
                </tr>
              )}
            </>
          )}

          {/* Submission Details */}
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
              {submission.grade !== null && submission.grade !== undefined ? submission.grade : 'Not graded yet'}
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
        </tbody>
      </table>
    </div>
  );
}