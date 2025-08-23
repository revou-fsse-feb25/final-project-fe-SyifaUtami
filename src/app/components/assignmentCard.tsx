'use client';
import { useRouter } from 'next/navigation';
import { Assignment, StudentSubmission } from '../../types';

interface AssignmentCardProps {
  assignment: Assignment;
  submission?: StudentSubmission;
  showUnit?: boolean;
  userType?: string;
  onClick?: () => void;
}

// Safe property access helpers
const getAssignmentTitle = (assignment: Assignment): string => {
  return assignment.name || assignment.title || 'Untitled Assignment';
};

const getAssignmentDeadline = (assignment: Assignment): string | null => {
  return assignment.deadline || assignment.dueDate || null;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'No deadline';
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

export default function AssignmentCard({ 
  assignment, 
  submission, 
  showUnit = false, 
  userType, 
  onClick 
}: AssignmentCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    // Navigate based on user type and submission status
    if (userType === 'student') {
      if (submission?.submissionId) {
        router.push(`/students/assignments/${submission.submissionId}`);
      } else {
        router.push(`/students/assignments/${assignment.id}`);
      }
    } else if (userType === 'coordinator') {
      router.push(`/coordinator/assignments/${assignment.id}`);
    }
  };

  const getStatusBadge = () => {
    if (!submission) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
          No submission
        </span>
      );
    }

    const status = submission.submissionStatus;
    const isGraded = submission.grade !== null && submission.grade !== undefined;

    if (isGraded && typeof submission.grade === 'number') {
      const grade = submission.grade;
      const badgeColor = grade >= 80 ? 'bg-green-100 text-green-800' :
                        grade >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800';
      
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${badgeColor}`}>
          Graded: {grade}%
        </span>
      );
    }

    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            Submitted
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            Draft
          </span>
        );
      case 'UNSUBMITTED':
      case 'EMPTY':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            Not submitted
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
            Unknown
          </span>
        );
    }
  };

  const getSubmissionStatusDisplay = (): string => {
    if (!submission) {
      return assignment.status === 'CLOSED' ? 'Not started' : 'No submission';
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

  // Check if assignment is overdue
  const isOverdue = () => {
    const deadline = getAssignmentDeadline(assignment);
    if (!deadline) return false;
    
    const now = new Date();
    const dueDate = new Date(deadline);
    
    return assignment.status === 'OPEN' && 
           !isNaN(dueDate.getTime()) && 
           dueDate < now && 
           (!submission || submission.submissionStatus === 'UNSUBMITTED' || submission.submissionStatus === 'EMPTY');
  };

  const assignmentTitle = getAssignmentTitle(assignment);
  const deadline = getAssignmentDeadline(assignment);
  const overdueStatus = isOverdue();

  return (
    <div 
      className={`flex justify-between items-center p-5 bg-white rounded border-2 hover:shadow-md transition-all cursor-pointer hover:bg-gray-100 ${
        overdueStatus ? 'border-red-200 bg-red-50' : ''
      }`}
      style={{
        borderColor: overdueStatus ? '#FCA5A5' : 'transparent',
        '--hover-border-color': overdueStatus ? '#EF4444' : '#CD3F3E'
      } as React.CSSProperties & { '--hover-border-color': string }}
      onMouseEnter={(e) => {
        const borderColor = overdueStatus ? '#EF4444' : '#CD3F3E';
        e.currentTarget.style.borderColor = borderColor;
      }}
      onMouseLeave={(e) => {
        const borderColor = overdueStatus ? '#FCA5A5' : 'transparent';
        e.currentTarget.style.borderColor = borderColor;
      }}
      onClick={handleCardClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className={`text-lg font-medium ${overdueStatus ? 'text-red-700' : 'text-gray-900'}`}>
            {assignmentTitle}
          </h4>
          {overdueStatus && (
            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
              OVERDUE
            </span>
          )}
        </div>
        
        <div className="space-y-1">
          <p className={`text-base ${overdueStatus ? 'text-red-600' : 'text-gray-600'}`}>
            Due: {formatDate(deadline)}
          </p>
          
          {showUnit && assignment.unitCode && (
            <p className="text-sm text-gray-500">
              Unit: {assignment.unitCode}
            </p>
          )}
          
          {/* Submission Status */}
          <p className="text-sm text-gray-600">
            Status: <span className={`font-medium ${
              submission?.submissionStatus === 'SUBMITTED' ? 'text-green-600' :
              submission?.submissionStatus === 'DRAFT' ? 'text-yellow-600' :
              overdueStatus ? 'text-red-600' : 'text-gray-600'
            }`}>
              {getSubmissionStatusDisplay()}
            </span>
          </p>

          {/* Assignment Status */}
          <p className="text-sm text-gray-500">
            Assignment: <span className={`font-medium ${
              assignment.status === 'OPEN' ? 'text-green-600' : 'text-red-600'
            }`}>
              {assignment.status}
            </span>
          </p>
        </div>
      </div>
      
      <div className="ml-4 flex flex-col items-end gap-2">
        {getStatusBadge()}
        {overdueStatus && (
          <div className="text-xs text-red-600 font-medium">
            Late submission
          </div>
        )}
      </div>
    </div>
  );
}