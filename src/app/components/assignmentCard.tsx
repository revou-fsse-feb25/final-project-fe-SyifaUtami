// src/app/components/assignmentCard.tsx
'use client';
import { Assignment, StudentSubmission } from '../../types';
import { useRouter } from 'next/navigation';

interface AssignmentCardProps {
  assignment: Assignment;
  submission?: StudentSubmission;
  onClick?: () => void;
  showUnit?: boolean;
  userType?: string; 
}

export default function AssignmentCard({ 
  assignment, 
  submission, 
  onClick,
  showUnit = false,
  userType 
}: AssignmentCardProps) {
  const router = useRouter();
  const isOpen = assignment.status === 'OPEN';
  
  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    // Handle navigation based on assignment status and user type
    if (userType === 'coordinator') {
      // Coordinator navigation logic 
      if (submission?.submissionId) {
        router.push(`/coordinator/submissions/${submission.submissionId}`);
      } else {
        router.push(`/coordinator/assignments/${assignment.id}`);
      }
    } else {
      // Student navigation
      if (isOpen) {
        router.push(`/students/assignments/${assignment.id}`);
      } else {
        if (submission?.submissionId) {
          router.push(`/students/assignments/${submission.submissionId}`);
        } else {
          router.push(`/students/assignments/${assignment.id}`);
        }
      }
    }
  };
  
  const getStatusBadge = () => {
    if (isOpen) {
      return <span className="px-4 py-2 rounded text-base font-medium bg-green-100 text-green-800">Open</span>;
    } else {
      return <span className="px-4 py-2 rounded text-base font-medium bg-gray-100 text-gray-600">Closed</span>;
    }
  };

  const getSubmissionStatusDisplay = () => {
    if (!submission) {
      return isOpen ? 'Not started' : 'No submission';
    }
    
    switch (submission.submissionStatus) {
      case 'EMPTY':
        return 'Not started';
      case 'DRAFT':
        return 'Draft saved';
      case 'SUBMITTED':
        return 'Submitted';
      case 'UNSUBMITTED':
        return 'Not submitted';
      default:
        return 'Unknown status';
    }
  };

  const assignmentName = assignment.title || 'Untitled Assignment';
  const deadline = assignment.dueDate;

  return (
    <div 
      className="flex justify-between items-center p-5 bg-white rounded border-2 hover:shadow-md transition-all cursor-pointer hover:bg-gray-100"
      style={{
        borderColor: 'transparent',
        '--hover-border-color': '#CD3F3E'
      } as React.CSSProperties & { '--hover-border-color': string }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#CD3F3E';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent';
      }}
      onClick={handleCardClick}
    >
      <div className="flex-1">
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          {assignmentName}
        </h4>
        <div className="space-y-1">
          <p className="text-base text-gray-600">
            Due: {deadline ? new Date(deadline).toLocaleDateString() : 'No deadline'}
          </p>
          {showUnit && (
            <p className="text-sm text-gray-500">
              Unit: {assignment.unitCode}
            </p>
          )}
          
          {/* Submission Status */}
          <p className="text-sm text-gray-600">
            Status: {getSubmissionStatusDisplay()}
          </p>
        </div>
      </div>
      
      <div className="ml-4 flex flex-col items-end gap-2">
        {getStatusBadge()}
      </div>
    </div>
  );
}