'use client';
import { FC } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { useStudentProgress } from '../context/useStudentProgress';
import { Unit, StudentProgress } from '../../types';
import StudentProgressComponent from './studentProgress';

interface StudentUnitCardProps {
  unit: Unit;
  className?: string;
}

const StudentUnitCard: FC<StudentUnitCardProps> = ({ 
  unit, 
  className = '' 
}) => {
  // Use the hook to get progress data
  const { studentProgress, assignments } = useStudentProgress(unit.code);

  return (
    <Link href={`/students/units/${unit.code}`}>
      <div className={`lms-card hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
        {/* Color Header */}
        <div 
          className="h-20 rounded-t-lg mb-4 flex items-center justify-center"
          style={{ backgroundColor: 'var(--border-color)' }}
        >
          <FontAwesomeIcon icon={faBookOpen} className="text-white text-2xl" />
        </div>
        
        {/* Unit Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-black)' }}>
              {unit.name}
            </h3>
            <p className="text-sm text-gray-600">
              {unit.code} • Week {unit.currentWeek}
            </p>
          </div>
          
          {/* Progress Section */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">Your Progress</p>
            <div className="text-xl font-bold" style={{ color: 'var(--primary-red)' }}>
              <StudentProgressComponent 
                progressData={studentProgress} 
                assignments={assignments} 
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StudentUnitCard;