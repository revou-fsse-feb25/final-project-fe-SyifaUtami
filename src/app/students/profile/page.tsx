'use client';
import { FC } from 'react';
import { useAuth } from '../../context/authContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faGraduationCap, faBookOpen, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import coursesData from '@/data/courses.json';
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
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const student = user as Student;
  const course = coursesData.courses.find(c => c.code === student.courseCode);
  const units = course ? coursesData.units.filter(unit => course.units.includes(unit.code)) : [];

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
        </div>

        {/* Units Information Card */}
        <div className="lms-card">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faBookOpen} className="mr-3" style={{ color: 'var(--primary-red)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-black)' }}>
              Enrolled Units
            </h2>
          </div>
          
          <div className="space-y-4">
            {units.map((unit) => (
              <div>
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
            
            {units.length === 0 && (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faBookOpen} className="text-4xl mb-4 text-gray-300" />
                <p className="text-gray-500">No units found for your course</p>
              </div>
            )}
          </div>
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