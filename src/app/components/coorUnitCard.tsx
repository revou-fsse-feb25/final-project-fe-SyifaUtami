// src/app/components/coorUnitCard.tsx
'use client';
import { FC } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faEdit } from '@fortawesome/free-solid-svg-icons';
import StudentProgressComponent from './studentProgress';
import { Unit, StudentProgress, Assignment } from '../../types'; // Use main types

interface CoordinatorUnitCardProps {
  unit: Unit; // Use the main Unit type
  allStudentProgress?: StudentProgress[];
  assignments?: Assignment[];
  className?: string;
  onClick?: () => void;
}

const CoordinatorUnitCard: FC<CoordinatorUnitCardProps> = ({ 
  unit, 
  allStudentProgress = [], 
  assignments = [], 
  className = '',
  onClick
}) => {
  const content = (
    <div className={`lms-card hover:shadow-lg transition-all duration-200 cursor-pointer relative ${className}`}>
      {/* Color Header */}
      <div 
        className="h-20 rounded-t-lg mb-4 flex items-center justify-center"
        style={{ backgroundColor: 'var(--primary-red)' }}
      >
        <FontAwesomeIcon icon={faUsers} className="text-white text-2xl" />
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
          {unit.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {unit.description}
            </p>
          )}
        </div>
        
        {/* Progress Section - if data is available */}
        {allStudentProgress.length > 0 && (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">Average Progress</p>
            <div className="text-xl font-bold" style={{ color: 'var(--primary-dark)' }}>
              <StudentProgressComponent 
                allProgressData={allStudentProgress}
                assignments={assignments}
                mode="average"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // If onClick is provided, render as button, otherwise as Link
  if (onClick) {
    return (
      <div onClick={onClick}>
        {content}
      </div>
    );
  }

  return (
    <Link href={`/coordinator/manage-units/edit-units/${unit.code}`}>
      {content}
    </Link>
  );
};

export default CoordinatorUnitCard;