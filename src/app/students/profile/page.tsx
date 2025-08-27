'use client';
import { FC, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faGraduationCap, faBookOpen, faCalendarAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { authManager, type User } from '@/src/lib/auth';
import { api } from '@/src/lib/api';
import { Course, Unit } from '../../../types';
import LogoutButton from '../../components/logOut';

// Remove local interfaces - use the ones from types/index.ts

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
        const profileResponse = await api.getCurrentUser();
        
        if (profileResponse.success) {
          console.log('👤 Profile data received:', profileResponse.data);
          setProfile(profileResponse.data);
        } else {
          throw new Error('Failed to fetch profile data');
        }

        // Fetch academic data for course and units
        const academicResponse = await api.getAcademicData();
        
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
          }
        } else {
          console.warn('Failed to fetch academic data');
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
          <p className="text-gray-600">Welcome to your academic dashboard</p>
        </div>

        {/* Profile Information */}
        <div className="lms-card">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mr-6" style={{ backgroundColor: 'var(--primary-red)' }}>
              <FontAwesomeIcon icon={faUser} className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-black)' }}>
                {student.firstName} {student.lastName || ''}
              </h2>
              <p className="text-gray-600">{student.email}</p>
              <p className="text-sm text-gray-500">Student ID: {student.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--primary-dark)' }}>
                <FontAwesomeIcon icon={faGraduationCap} className="mr-2" />
                Course Information
              </h3>
              {course ? (
                <div>
                  <p><strong>Course:</strong> {course.name}</p>
                  <p><strong>Course Code:</strong> {course.code}</p>
                  {student.year && <p><strong>Year:</strong> {student.year}</p>}
                </div>
              ) : (
                <p className="text-gray-500">Course information not available</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--primary-dark)' }}>
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Account Details
              </h3>
              <p><strong>Role:</strong> {student.role || 'Student'}</p>
              <p><strong>Member since:</strong> {new Date(student.createdAt || '').toLocaleDateString() || 'Unknown'}</p>
            </div>
          </div>
        </div>

        {/* Enrolled Units */}
        <div className="lms-card">
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--primary-dark)' }}>
            <FontAwesomeIcon icon={faBookOpen} className="mr-2" />
            Enrolled Units ({units.length})
          </h3>
          
          {units.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => (
                <div 
                  key={unit.id} 
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--primary-dark)' }}>
                    {unit.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">{unit.code}</p>
                  {unit.description && (
                    <p className="text-sm text-gray-500 mb-2">{unit.description}</p>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      Week: {unit.currentWeek || 1}
                    </span>
                    {unit.progressPercentage !== undefined && (
                      <span className="text-green-600 font-medium">
                        {unit.progressPercentage}% Complete
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faBookOpen} className="text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500">No units enrolled yet</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {units.length}
            </div>
            <div className="text-sm text-gray-600">Enrolled Units</div>
          </div>
          
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {student.year || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Academic Year</div>
          </div>
          
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {course?.code || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Course Code</div>
          </div>
          
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              ACTIVE
            </div>
            <div className="text-sm text-gray-600">Status</div>
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