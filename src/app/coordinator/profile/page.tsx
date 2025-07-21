'use client';
import { FC } from 'react';
import { useAuth } from '../../context/authContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faShieldAlt, faGraduationCap, faBookOpen } from '@fortawesome/free-solid-svg-icons';
import coursesData from '@/data/courses.json';
import LogoutButton from '../../components/logOut';

interface Coordinator {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  accessLevel: string;
  courseManaged: string[];
}

const CoordinatorProfile: FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const coordinator = user as Coordinator;
  
  // Get full course details for managed courses
  const managedCourses = coordinator.courseManaged.map(courseCode => 
    coursesData.courses.find(course => course.code === courseCode)
  ).filter(Boolean);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--card-background)' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
            Coordinator Profile
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
                First Name
              </label>
              <div className="p-2 text-2xl font-bold" style={{ color: 'white' }}>
                {coordinator.firstName}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
                Last Name
              </label>
              <div className="p-2 text-2xl font-bold" style={{ color: 'white' }}>
                {coordinator.lastName}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
                ID
              </label>
              <div className="p-2" style={{ color: 'white' }}>
                {coordinator.id}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
                Title
              </label>
              <div className="p-2" style={{ color: 'white' }}>
                {coordinator.title}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'white' }}>
                Email
              </label>
              <div className="p-2" style={{ color: 'white' }}>
                {coordinator.email}
              </div>
            </div>
          </div>
        </div>

        {/* Access Information Card */}
        <div className="lms-card">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faShieldAlt} className="mr-3" style={{ color: 'var(--primary-red)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-black)' }}>
              Access Information
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-black)' }}>
                Access Level
              </label>
              <div className="p-2 flex items-center" style={{ color: 'var(--text-black)' }}>
                <FontAwesomeIcon icon={faIdCard} className="mr-2 text-gray-500" />
                <span className="capitalize font-semibold">{coordinator.accessLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Managed Card */}
        <div className="lms-card">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faGraduationCap} className="mr-3" style={{ color: 'var(--primary-red)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-black)' }}>
              Courses Managed
            </h2>
          </div>
          
          <div className="space-y-4">
            {managedCourses.map((course) => (
              <div key={course?.code} className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text-black)' }}>
                    {course?.name}
                  </h3>
                  <p className="text-sm text-gray-600">Course Code: {course?.code}</p>
                </div>
                <div className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--primary-dark)', color: 'white' }}>
                  {course?.units.length} Units
                </div>

              </div>
            ))}
            
            {managedCourses.length === 0 && (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faBookOpen} className="text-4xl mb-4 text-gray-300" />
                <p className="text-gray-500">No courses assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {managedCourses.length}
            </div>
            <div className="text-sm text-gray-600">Courses Managed</div>
          </div>
          
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {managedCourses.reduce((total, course) => total + (course?.units.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Units</div>
          </div>
          
          <div className="lms-card text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
              {coordinator.accessLevel.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">Access Level</div>
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