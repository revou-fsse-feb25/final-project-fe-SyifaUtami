'use client';
import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { authManager, type User } from '@/src/lib/auth';
import { Unit, StudentProgress, Assignment } from '../../types';

interface StudentUnitCardProps {
  unit: Unit;
  className?: string;
}

const StudentUnitCard: FC<StudentUnitCardProps> = ({ 
  unit, 
  className = '' 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from auth manager
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

  // Fetch student progress from backend API
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.warn('No auth token found');
          setProgressPercentage(0);
          setIsLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

        // Fetch student progress for this unit
        const progressResponse = await fetch(
          `${API_BASE_URL}/student-progress/student/${user.id}/unit/${unit.code}/percentage`, 
          { headers }
        );

        if (progressResponse.ok) {
          const progressResult = await progressResponse.json();
          const percentage = progressResult.success ? progressResult.data : progressResult;
          
          // Handle different response formats
          if (typeof percentage === 'number') {
            setProgressPercentage(percentage);
          } else if (percentage && typeof percentage.progressPercentage === 'number') {
            setProgressPercentage(percentage.progressPercentage);
          } else if (percentage && typeof percentage.percentage === 'number') {
            setProgressPercentage(percentage.percentage);
          } else {
            console.log('Progress data received:', percentage);
            setProgressPercentage(0);
          }
        } else {
          console.warn('Failed to fetch progress, using default value');
          setProgressPercentage(0);
        }

      } catch (error) {
        console.warn('Error fetching progress:', error);
        setProgressPercentage(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProgress();
    }
  }, [user, unit.code]);

  // Fallback calculation if API doesn't work
  const calculateFallbackProgress = (): number => {
    // Use unit.progressPercentage if available from the unit data
    if (unit.progressPercentage !== undefined) {
      return unit.progressPercentage;
    }
    
    // Default progress based on current week (simple fallback)
    const maxWeeks = 12;
    const currentWeek = unit.currentWeek || 1;
    return Math.min(Math.round((currentWeek / maxWeeks) * 100), 100);
  };

  const displayProgress = isLoading ? 0 : (progressPercentage > 0 ? progressPercentage : calculateFallbackProgress());

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
            {unit.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {unit.description}
              </p>
            )}
          </div>
          
          {/* Progress Section */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-2">Your Progress</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${displayProgress}%`,
                  backgroundColor: displayProgress > 0 ? '#1C2938' : '#e5e7eb'
                }}
              />
            </div>
            
            {/* Percentage Text */}
            <p className="text-xs text-gray-600">
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${displayProgress}%`
              )}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StudentUnitCard;