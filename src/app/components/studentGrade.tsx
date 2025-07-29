import { useMemo } from 'react';

interface StudentGradeProps {
  grade: number;
  showPercentage?: boolean;
  showNoGradesText?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StudentGrade({ 
  grade, 
  showPercentage = true, 
  showNoGradesText = true,
  className = '',
  size = 'md'
}: StudentGradeProps) {
  
  // Memoized grade color calculation
  const gradeStyle = useMemo(() => {
    if (grade >= 80) return 'text-green-600 bg-green-100';
    if (grade >= 60) return 'text-yellow-600 bg-yellow-100';
    if (grade >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  }, [grade]);

  // Size variants
  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-1 text-sm';
      case 'md':
      default:
        return 'px-2.5 py-0.5 text-xs';
    }
  }, [size]);

  // Display text logic
  const displayText = useMemo(() => {
    if (grade === 0 || grade === null || grade === undefined) {
      return showNoGradesText ? 'No grades' : '0%';
    }
    return showPercentage ? `${grade}%` : grade.toString();
  }, [grade, showPercentage, showNoGradesText]);

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${gradeStyle} ${sizeClasses} ${className}`}
    >
      {displayText}
    </span>
  );
}