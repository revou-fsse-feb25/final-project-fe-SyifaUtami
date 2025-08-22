'use client';
import { FC, useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faGraduationCap, faBookOpen, faCalendarAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import LogoutButton from '../../components/logOut';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  courseCode: string;
  year: number;
  role: string;
}

interface Course {
  code: string;
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface Unit {
  id: string;
  code: string;
  name: string;
  description: string | null;
  courseCode: string;
  currentWeek: number;
  progressPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

const StudentProfile: FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch user profile from new API
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app'}/users/me`, {
          headers
        });
        
        if (!profileResponse.ok) {
          if (profileResponse.status === 401) {
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error('Failed to fetch profile');
        }
        
        const profileData = await profileResponse.json();
        setProfile(profileData.data);

        // Fetch student's course info
        if (profileData.data.courseCode) {
          const courseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app'}/courses/${profileData.data.courseCode}`, {
            headers
          });
          
          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            setCourse(courseData.data);
          }
        }

        // Fetch student's units with progress
        const unitsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app'}/students/${profileData.data.id}/units`, {
          headers
        });
        
        if (unitsResponse.ok) {
          const unitsData = await unitsResponse.json();
          setUnits(unitsData.data || []);
        }

      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
        
        // If authentication error, redirect to login
        if (err instanceof Error && err.message.includes('Session expired')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <FontAwesomeIcon 
            icon={faExclamationTriangle} 
            className="text-6xl mb-4" 
            style={{ color: 'var(--primary-red)' }} 
          />
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>
            Error Loading Profile
          </h1>
          <p className="text-lg text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[var(--primary-red)] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
            Student Profile
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back, {profile.firstName}!
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div 
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4"
                style={{ backgroundColor: 'var(--primary-red)' }}
              >
                <FontAwesomeIcon icon={faUser} />
              </div>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-black)' }}>
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faGraduationCap} className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Student ID</p>
                  <p className="font-medium">{profile.id}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Academic Year</p>
                  <p className="font-medium">Year {profile.year}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FontAwesomeIcon icon={faBookOpen} className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-medium">
                    {course ? `${course.name} (${course.code})` : profile.courseCode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Units */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
              Your Units
            </h3>

            {units.length === 0 ? (
              <div className="text-center py-8">
                <FontAwesomeIcon 
                  icon={faBookOpen} 
                  className="text-6xl text-gray-300 mb-4" 
                />
                <p className="text-lg text-gray-500 mb-2">No units enrolled</p>
                <p className="text-gray-400">Contact your coordinator for assistance</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {units.map((unit) => (
                  <div
                    key={unit.code}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.location.href = `/students/units/${unit.code}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg" style={{ color: 'var(--text-black)' }}>
                          {unit.name}
                        </h4>
                        <p className="text-sm text-gray-500">{unit.code}</p>
                      </div>
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        Week {unit.currentWeek}
                      </span>
                    </div>

                    {unit.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {unit.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    {typeof unit.progressPercentage === 'number' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{unit.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${unit.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">View unit details</span>
                      <span className="text-blue-600">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;