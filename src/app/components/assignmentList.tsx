// src/app/components/assignmentList.tsx
'use client';
import { Assignment, StudentSubmission } from '../../types';
import AssignmentCard from './assignmentCard';

interface AssignmentWithSubmission {
  assignment: Assignment;
  submission?: StudentSubmission;
}

interface AssignmentListProps {
  title?: string;
  assignments: AssignmentWithSubmission[];
  emptyMessage?: string;
  onAssignmentClick?: (item: AssignmentWithSubmission) => void;
  showUnit?: boolean;
  className?: string;
  userType?: string; // Add userType prop to fix TypeScript error
}

export default function AssignmentList({
  title = "Assignments",
  assignments,
  emptyMessage = "No assignments found.",
  onAssignmentClick,
  showUnit = false,
  className = "",
  userType // Accept userType prop (even if not used for now)
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
          {assignments.map((item) => (
            <AssignmentCard
              key={item.assignment.id}
              assignment={item.assignment}
              submission={item.submission}
              showUnit={showUnit}
              userType={userType}
            />
          ))}
        </div>
      )}
    </div>
  );
}