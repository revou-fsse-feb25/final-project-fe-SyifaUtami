'use client';
import { FC, useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faGraduationCap, faBookOpen, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { Course, Unit } from '../../../types';
import LogoutButton from '../../components/logOut';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  courseCode: string;
  year: number;
}

const StudentProfile: FC = () => {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course and units data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.courseCode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/academic-data');
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const academicData = await response.json();
        
        const foundCourse = academicData.courses.find((c: Course) => c.code === user.courseCode);
        setCourse(foundCourse || null);
        
        if (foundCourse) {
          const courseUnits = academicData.units.filter((unit: Unit) => 
            unit.courseCode === foundCourse.code
          );
          setUnits(courseUnits);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const student = user as Student;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--card-background)' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
            Student Profile
          </h1>
        </div>

        {/* Personal Information Card */}
        <div className="lms-card" style={{ backgroundColor: '#8D0B41', color: 'white' }}>
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faUser} className="mr-3" style={{ color: 'white' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'white' }}>
              Personal Information
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
                First Name
              </label>
              <div className="p-2 text-2xl font-bold" style={{ color: 'white' }}>
                {student.firstName}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
                Last Name
              </label>
              <div className="p-2 text-2xl font-bold" style={{ color: 'white' }}>
                {student.lastName}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
                Email
              </label>
              <div className="p-2" style={{ color: 'white' }}>
                {student.email}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information Card */}
        <div className="lms-card">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faGraduationCap} className="mr-3" style={{ color: 'var(--primary-red)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-black)' }}>
              Academic Information
            </h2>
          </div>
          
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
              <span>Loading course information...</span>
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-black)' }}>
                  Course
                </label>
                <div className="p-2 text-2xl font-bold" style={{ color: 'var(--text-black)' }}>
                  {course ? `${course.name} (${course.code})` : 'Course not found'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-black)' }}>
                  Year
                </label>
                <div className="p-2 flex items-center" style={{ color: 'var(--text-black)' }}>
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-500" />
                  Year {student.year}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Units Information Card */}
        <div className="lms-card">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faBookOpen} className="mr-3" style={{ color: 'var(--primary-red)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-black)' }}>
              Enrolled Units
            </h2>
          </div>
          
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
              <span>Loading units...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {units.map((unit) => (
                <div key={unit.code}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg" style={{ color: 'var(--text-black)' }}>
                      {unit.name} ({unit.code})
                    </h3>
                    <div className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--primary-dark)', color: 'white' }}>
                      Week {unit.currentWeek}
                    </div>
                  </div>
                </div>
              ))}
              
              {units.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faBookOpen} className="text-4xl mb-4 text-gray-300" />
                  <p className="text-gray-500">No units found for your course</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {units.length}
            </div>
            <div className="text-sm text-gray-600">Enrolled Units</div>
          </div>
          
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              Year {student.year}
            </div>
            <div className="text-sm text-gray-600">Current Year</div>
          </div>
          
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {course?.code || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Course Code</div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="text-center mt-8">
          <LogoutButton size="lg" />
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;