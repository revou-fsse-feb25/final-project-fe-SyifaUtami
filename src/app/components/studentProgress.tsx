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
  
  const completedAssignments = unitAssignments.filter(assignment => 
    assignment.status === 'closed'
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

const StudentProgressComponent: FC<StudentProgressProps> = ({ 
  progressData, 
  allProgressData, 
  assignments, 
  mode = 'individual' 
}) => {
  
  if (mode === 'individual') {
    // Handle missing progress data - create default with proper typing
    const safeProgressData: StudentProgress = progressData || {
      studentId: '',
      unitCode: assignments[0]?.unitCode || '',
      week1Material: "not done" as const,
      week2Material: "not done" as const,
      week3Material: "not done" as const,
      week4Material: "not done" as const
    };
    
    const progress = calculateProgress(safeProgressData, assignments);
    return (
      <div>
        <span>{progress.percentage}%</span>
        <span> ({progress.completed}/{progress.total})</span>
      </div>
    );
  }
  
  if (mode === 'average' && allProgressData) {
    // Coordinator average progress
    if (allProgressData.length === 0) {
      return <div>0% (0/0)</div>;
    }
    
    const progressResults = allProgressData.map(studentProgress => 
      calculateProgress(studentProgress, assignments).percentage
    );
    
    const averagePercentage = Math.round(
      progressResults.reduce((sum, percentage) => sum + percentage, 0) / progressResults.length
    );
    
    const studentsCompleted = progressResults.filter(p => p === 100).length;
    
    return (
      <div>
        <span>{averagePercentage}%</span>
        <span> ({studentsCompleted}/{allProgressData.length})</span>
      </div>
    );
  }
  
  return <div>0% (0/0)</div>;
};

export default StudentProgressComponent;