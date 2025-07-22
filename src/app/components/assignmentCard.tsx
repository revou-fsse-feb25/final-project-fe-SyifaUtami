'use client';
import { Assignment, StudentSubmission } from '../../types';

interface AssignmentCardProps {
  assignment: Assignment;
  submission?: StudentSubmission;
  onClick?: () => void;
  showUnit?: boolean; // For showing unit code when displaying across multiple units
}

export default function AssignmentCard({ 
  assignment, 
  submission, 
  onClick,
  showUnit = false 
}: AssignmentCardProps) {
  const isOpen = assignment.status === 'open';
  const isOverdue = new Date(assignment.deadline) < new Date() && isOpen;
  
  // Debug logging
  console.log('AssignmentCard Debug:', {
    assignmentId: assignment.id,
    assignmentName: assignment.name,
    submissionData: submission,
    submissionStatus: submission?.submissionStatus
  });
  
  const getStatusBadge = () => {
    if (isOpen) {
      return <span className="px-4 py-2 rounded text-base font-medium bg-green-100 text-green-800">Open</span>;
    } else {
      return <span className="px-4 py-2 rounded text-base font-medium bg-gray-100 text-gray-600">Closed</span>;
    }
  };

  return (
    <div 
      className={`flex justify-between items-center p-5 bg-white rounded border-2 hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex-1">
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          {assignment.name}
        </h4>
        <div className="space-y-1">
          <p className="text-base text-gray-600">
            Due: {new Date(assignment.deadline).toLocaleDateString()}
          </p>
          {showUnit && (
            <p className="text-sm text-gray-500">
              Unit: {assignment.unitCode}
            </p>
          )}
        </div>
      </div>
      
      <div className="ml-4">
        {getStatusBadge()}
      </div>
    </div>
  );
}