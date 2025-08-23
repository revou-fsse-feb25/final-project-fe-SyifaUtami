'use client';
import { FC, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faShieldAlt, faGraduationCap, faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { authManager, type User } from '@/src/lib/auth';
import { apiClient } from '@/src/lib/api';
import { Course } from '../../../types';
import LogoutButton from '../../components/logOut';

// Remove local interface - use the ones from types/index.ts

const CoordinatorProfile: FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [managedCourses, setManagedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user from auth manager
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

  // Fetch managed courses data
  const fetchData = async () => {
    if (!user || !user.courseManaged) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching course data for coordinator profile...');
      
      // Fetch academic data from API
      const response = await apiClient.getAcademicData();
      
      if (!response.success) {
        throw new Error('Failed to fetch academic data');
      }
      
      const academicData = response.data;
      console.log('📊 Academic data received:', academicData.courses);
      
      const coordinator = user as User;
      const courses = coordinator.courseManaged?.map(courseCode => 
        academicData.courses.find((course: Course) => course.code === courseCode)
      ).filter(Boolean) as Course[];
      
      console.log('🎯 Managed courses found:', courses);
      setManagedCourses(courses);
    } catch (err) {
      console.error('❌ Error fetching profile data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();

      // Listen for course updates (when new courses are added)
      const handleCourseUpdate = () => {
        console.log('🔔 Profile: Course update event received, refreshing...');
        fetchData();
      };

      window.addEventListener('courseUpdated', handleCourseUpdate);
      
      return () => {
        window.removeEventListener('courseUpdated', handleCourseUpdate);
      };
    }
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
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--text-black)' }}>Error loading profile</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="lms-button-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const coordinator = user as User;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--card-background)' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
            Coordinator Profile
          </h1>
          <p className="text-gray-600">Academic Coordinator Dashboard</p>
        </div>

        {/* Profile Information */}
        <div className="lms-card">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mr-6" style={{ backgroundColor: 'var(--primary-red)' }}>
              <FontAwesomeIcon icon={faUser} className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-black)' }}>
                {coordinator.firstName} {coordinator.lastName || ''}
              </h2>
              <p className="text-gray-600">{coordinator.email}</p>
              {coordinator.title && (
                <p className="text-sm text-gray-500">{coordinator.title}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--primary-dark)' }}>
                <FontAwesomeIcon icon={faIdCard} className="mr-2" />
                Personal Information
              </h3>
              <p><strong>Staff ID:</strong> {coordinator.id}</p>
              <p><strong>Email:</strong> {coordinator.email}</p>
              <p><strong>Position:</strong> {coordinator.title || 'Academic Coordinator'}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--primary-dark)' }}>
                <FontAwesomeIcon icon={faShieldAlt} className="mr-2" />
                Access & Permissions
              </h3>
              <p><strong>Access Level:</strong> {coordinator.accessLevel?.toUpperCase() || 'COORDINATOR'}</p>
              <p><strong>Managed Courses:</strong> {coordinator.courseManaged?.length || 0}</p>
              <p><strong>Role:</strong> Course Coordinator</p>
            </div>
          </div>
        </div>

        {/* Managed Courses */}
        <div className="lms-card">
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--primary-dark)' }}>
            <FontAwesomeIcon icon={faGraduationCap} className="mr-2" />
            Managed Courses ({managedCourses.length})
          </h3>
          
          {managedCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {managedCourses.map((course) => (
                <div 
                  key={course.id || course.code} 
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--primary-dark)' }}>
                    {course.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">Code: {course.code}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      Units: {course.units?.length || 0}
                    </span>
                    <span className="text-blue-600 font-medium">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faGraduationCap} className="text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500">No courses assigned yet</p>
              <p className="text-sm text-gray-400">Contact your administrator to assign courses</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {managedCourses.length}
            </div>
            <div className="text-sm text-gray-600">Courses</div>
          </div>
          
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {managedCourses.reduce((total, course) => total + (course.units?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Units</div>
          </div>
          
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {coordinator.accessLevel?.toUpperCase() || 'COORDINATOR'}
            </div>
            <div className="text-sm text-gray-600">Access Level</div>
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

export default CoordinatorProfile;