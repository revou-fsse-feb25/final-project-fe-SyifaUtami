'use client';
import { FC } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';

interface Course {
  code: string;
  name: string;
  units: string[];
}

interface CoordinatorCourseCardProps {
  course: Course;
  studentCount?: number;
  unitCount?: number;
  className?: string;
}

const CoordinatorCourseCard: FC<CoordinatorCourseCardProps> = ({ 
  course, 
  studentCount = 0,
  unitCount = 0,
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
          
          {/* Course Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: 'var(--primary-red)' }}>
                {studentCount}
              </p>
              <p className="text-xs text-gray-600">Students</p>
            </div>
            
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: 'var(--primary-red)' }}>
                {unitCount}
              </p>
              <p className="text-xs text-gray-600">Units</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CoordinatorCourseCard;