'use client';
import { FC, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faGraduationCap, faBookOpen, faCalendarAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { authManager, type User } from '@/src/lib/auth';
import { apiClient } from '@/src/lib/api';
import { Course, Unit } from '../../../types';
import LogoutButton from '../../components/logOut';

const StudentProfile: FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user from auth manager
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Fetching student profile data...');

        // Fetch user profile from API
        const profileResponse = await apiClient.getCurrentUser();
        
        console.log('👤 Raw profile response:', profileResponse);
        
        // Handle different response formats
        if (profileResponse.success && profileResponse.data) {
          console.log('👤 Profile data received (success format):', profileResponse.data);
          setProfile(profileResponse.data);
        } else if (profileResponse.user) {
          console.log('👤 Profile data received (direct format):', profileResponse.user);
          setProfile(profileResponse.user);
        } else {
          console.log('Profile response:', profileResponse);
          throw new Error('Failed to fetch profile data - unexpected response format');
        }

        // Fetch academic data for course and units
        const academicResponse = await apiClient.getAcademicData();
        
        if (academicResponse.success) {
          console.log('📚 Academic data received:', academicResponse.data);
          
          const courses = academicResponse.data.courses || [];
          const allUnits = academicResponse.data.units || [];
          
          // Find student's course
          const studentCourse = courses.find((c: Course) => c.code === user.courseCode);
          setCourse(studentCourse || null);
          
          if (studentCourse) {
            // Filter units for this course
            const courseUnits = allUnits.filter((unit: Unit) => 
              unit.courseCode === studentCourse.code
            );
            setUnits(courseUnits);
            console.log('📖 Found units for course:', courseUnits);
          }
        } else {
          console.warn('Failed to fetch academic data:', academicResponse);
          // Don't throw error here, just log warning
        }

      } catch (err) {
        console.error('❌ Error fetching profile data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary-red)' }}></div>
          <p style={{ color: 'var(--text-black)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="text-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-6xl mb-4 text-yellow-500" />
          <p className="text-xl mb-4" style={{ color: 'var(--text-black)' }}>Please log in to view your profile.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="lms-button-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="text-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-6xl mb-4 text-red-500" />
          <p className="text-xl mb-4" style={{ color: 'var(--text-black)' }}>Error loading profile</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="lms-button-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const student = profile || user;

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
                {student.lastName || 'N/A'}
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
                  Year {student.year || 'N/A'}
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
                      Week {unit.currentWeek || 1}
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
              Year {student.year || 'N/A'}
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