'use client';
import { FC } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import StudentProgressComponent from './studentProgress';

interface Unit {
  code: string;
  name: string;
  courseCode: string;
  description: string;
  currentWeek: number;
}

interface StudentProgress {
  studentId: string;
  unitCode: string;
  week1Material: "done" | "not done";
  week2Material: "done" | "not done";
  week3Material: "done" | "not done";
  week4Material: "done" | "not done";
}

interface Assignment {
  id: string;
  name: string;
  unitCode: string;
  deadline: string;
  publishedAt: string;
  status: "open" | "closed";
}

interface CoordinatorUnitCardProps {
  unit: Unit;
  allStudentProgress: StudentProgress[];
  assignments: Assignment[];
  className?: string;
}

const CoordinatorUnitCard: FC<CoordinatorUnitCardProps> = ({ 
  unit, 
  allStudentProgress, 
  assignments, 
  className = '' 
}) => {
  return (
    <Link href={`/coordinator/units/${unit.code}/edit`}>
      <div className={`lms-card hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
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
              {unit.code} • {allStudentProgress.length} students
            </p>
          </div>
          
          {/* Progress Section */}
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
        </div>
      </div>
    </Link>
  );
};

export default CoordinatorUnitCard;