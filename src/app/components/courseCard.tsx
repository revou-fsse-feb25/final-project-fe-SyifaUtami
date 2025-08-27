'use client';
import { FC } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { Course } from '../../types'; // Use the main Course type

interface CoordinatorCourseCardProps {
  course: Course; // Now uses your actual Course type from types/index.ts
  className?: string;
}

const CoordinatorCourseCard: FC<CoordinatorCourseCardProps> = ({ 
  course, 
  className = '' 
}) => {
  return (
    <Link href={`/coordinator/courses/${course.code}`}>
      <div className={`lms-card hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
        {/* Color Header */}
        <div 
          className="h-20 rounded-t-lg mb-4 flex items-center justify-center"
          style={{ backgroundColor: 'var(--border-color)' }}
        >
          <FontAwesomeIcon icon={faGraduationCap} className="text-white text-2xl" />
        </div>
        
        {/* Course Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-black)' }}>
              {course.name}
            </h3>
            <p className="text-sm text-gray-600">
              {course.code}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CoordinatorCourseCard;