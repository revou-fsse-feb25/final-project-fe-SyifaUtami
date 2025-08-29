'use client';
import { FC } from 'react';
import { StudentProgress, Assignment } from '../../types';

interface StudentProgressProps {
  progressData?: StudentProgress; // For single student
  allProgressData?: StudentProgress[]; // For coordinator average
  assignments: Assignment[];
  mode?: 'individual' | 'average'; // Determines calculation type
}

// Export the calculation function for reuse
export const calculateProgress = (
  progressData: StudentProgress, 
  assignments: Assignment[]
): { percentage: number; completed: number; total: number } => {
  // Count weekly materials
  const materialFields = Object.keys(progressData).filter(key => 
    key.includes('Material') && key.includes('week')
  );
  
  const completedMaterials = materialFields.reduce((count, field) => {
    return progressData[field as keyof StudentProgress] === 'done' ? count + 1 : count;
  }, 0);
  
  // Count assignments for this unit
  const unitAssignments = assignments.filter(assignment => 
    assignment.unitCode === progressData.unitCode
  );
  
  // Fix: Use 'CLOSED' instead of 'closed' to match the type definition
  const completedAssignments = unitAssignments.filter(assignment => 
    assignment.status === 'CLOSED'
  ).length;
  
  const totalMaterials = materialFields.length;
  const totalAssignments = unitAssignments.length;
  const totalItems = totalMaterials + totalAssignments;
  const completedItems = completedMaterials + completedAssignments;
  
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  return {
    percentage,
    completed: completedItems,
    total: totalItems
  };
};

// Component for displaying individual progress
const IndividualProgress: FC<{ progressData: StudentProgress; assignments: Assignment[] }> = ({ 
  progressData, 
  assignments 
}) => {
  const progress = calculateProgress(progressData, assignments);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="font-semibold text-lg mb-2">{progressData.unitCode}</h3>
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">
          {progress.percentage}%
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {progress.completed} of {progress.total} items completed
      </p>
    </div>
  );
};

// Component for displaying average progress
const AverageProgress: FC<{ allProgressData: StudentProgress[]; assignments: Assignment[] }> = ({ 
  allProgressData, 
  assignments 
}) => {
  // Calculate average progress across all students
  const averagePercentage = allProgressData.length > 0 
    ? Math.round(
        allProgressData.reduce((sum, progressData) => {
          const { percentage } = calculateProgress(progressData, assignments);
          return sum + percentage;
        }, 0) / allProgressData.length
      )
    : 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="font-semibold text-lg mb-2">Average Class Progress</h3>
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${averagePercentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">
          {averagePercentage}%
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Based on {allProgressData.length} students
      </p>
    </div>
  );
};

// Main component
const StudentProgressComponent: FC<StudentProgressProps> = ({ 
  progressData, 
  allProgressData, 
  assignments, 
  mode = 'individual' 
}) => {
  if (mode === 'average' && allProgressData) {
    return <AverageProgress allProgressData={allProgressData} assignments={assignments} />;
  }
  
  if (mode === 'individual' && progressData) {
    return <IndividualProgress progressData={progressData} assignments={assignments} />;
  }
  
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <p className="text-gray-500">No progress data available</p>
    </div>
  );
};

export default StudentProgressComponent;