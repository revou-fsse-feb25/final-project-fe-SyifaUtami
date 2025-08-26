// src/app/components/assignmentList.tsx
'use client';
import { Assignment, StudentSubmission, AssignmentWithSubmission } from '../../types';
import AssignmentCard from './assignmentCard';

interface AssignmentListProps {
  title?: string;
  assignments: AssignmentWithSubmission[];  // Only use AssignmentWithSubmission
  emptyMessage?: string;
  onAssignmentClick?: (item: AssignmentWithSubmission) => void;
  showUnit?: boolean;
  className?: string;
  userType?: string;
}

export default function AssignmentList({
  title = "Assignments",
  assignments,
  emptyMessage = "No assignments found.",
  onAssignmentClick,
  showUnit = false,
  className = "",
  userType
}: AssignmentListProps) {
  
  return (
    <div className={`lms-card ${className}`}>
      <h3 className="text-2xl font-semibold mb-6">{title}</h3>
      
      {assignments.length === 0 ? (
        <p className="text-base text-gray-600 text-center py-12">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-4">
          {assignments.map((item, index) => (
            <AssignmentCard
              key={item.submission?.submissionId || `assignment-${item.assignment.id}-${index}`}
              assignment={item.assignment}
              submission={item.submission}
              showUnit={showUnit}
              userType={userType}
              onClick={onAssignmentClick ? () => onAssignmentClick(item) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}