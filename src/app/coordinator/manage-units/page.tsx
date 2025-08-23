// src/app/coordinator/manage-units/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faUsers } from '@fortawesome/free-solid-svg-icons';
import CoordinatorUnitCard from '../../components/coorUnitCard';
import CourseUnitModals from '../../components/courseUnitModals';
import StudentProgressComponent from '../../components/studentProgress';
import { Course, Unit, StudentProgress, Assignment, Teacher } from '../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

interface ManageUnitsData {
  courses: Course[];
  units: Unit[];
  allStudentProgress: StudentProgress[];
  assignments: Assignment[];
  teachers: Teacher[];
}

type ModalType = 'addCourse' | 'addUnit' | 'deleteCourse' | 'deleteUnit' | 'none';

export default function ManageUnitsPage() {
  const [data, setData] = useState<ManageUnitsData | null>(null);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [modalType, setModalType] = useState<ModalType>('none');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Delete states
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [deleteMode, setDeleteMode] = useState<'none' | 'courses' | 'units'>('none');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Helper function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Get auth token
  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // API request helper with Railway integration
  const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        throw new Error('Session expired. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  };

  // Fetch all data from Railway API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch data from Railway API endpoints
        const [coursesData, unitsData, teachersData, studentsData] = await Promise.all([
          makeAuthenticatedRequest('/courses'),
          makeAuthenticatedRequest('/units'),
          makeAuthenticatedRequest('/teachers'),
          makeAuthenticatedRequest('/students')
        ]);

        // Handle different response formats from Railway API
        const courses = coursesData.success ? coursesData.data : coursesData;
        const units = unitsData.success ? unitsData.data : unitsData;
        const teachersResult = teachersData.success ? teachersData.data : teachersData;
        const students = studentsData.success ? studentsData.data : studentsData;

        setData({
          courses: courses || [],
          units: units || [],
          allStudentProgress: [], // Will be populated if needed
          assignments: [], // Will be populated if needed
          teachers: teachersResult || []
        });

        // Set coordinators (filter from teachers or fetch separately)
        const coordinatorsList = Array.isArray(teachersResult) 
          ? teachersResult.filter((t: any) => t.role === 'COORDINATOR' || t.title === 'Coordinator')
          : [];
        
        setCoordinators(coordinatorsList);
        setTeachers(teachersResult || []);

      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle course added
  const handleCourseAdded = (newCourse: Course) => {
    setData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        courses: [...prevData.courses, newCourse]
      };
    });
    window.dispatchEvent(new CustomEvent('courseUpdated'));
  };

  // Handle unit added
  const handleUnitAdded = (newUnit: Unit) => {
    setData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        units: [...prevData.units, newUnit]
      };
    });
    window.dispatchEvent(new CustomEvent('courseUpdated'));
  };

  // Handle course deleted
  const handleCourseDeleted = (deletedCourse: Course) => {
    setData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        courses: prevData.courses.filter(c => c.code !== deletedCourse.code),
        units: prevData.units.filter(u => u.courseCode !== deletedCourse.code)
      };
    });
    resetDeleteMode();
    window.dispatchEvent(new CustomEvent('courseUpdated'));
  };

  // Handle unit deleted
  const handleUnitDeleted = (deletedUnit: Unit) => {
    setData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        units: prevData.units.filter(u => u.code !== deletedUnit.code)
      };
    });
    resetDeleteMode();
    window.dispatchEvent(new CustomEvent('courseUpdated'));
  };

  // Unit card actions
  const handleEditUnit = (unit: Unit) => {
    window.location.href = `/coordinator/manage-units/edit-units/${unit.code}`;
  };

  const handleDeleteUnit = (unit: Unit) => {
    setUnitToDelete(unit);
    setModalType('deleteUnit');
  };

  // Course actions
  const handleAddUnit = (course: Course) => {
    setSelectedCourse(course);
    setModalType('addUnit');
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setModalType('deleteCourse');
  };

  // Reset delete mode
  const resetDeleteMode = () => {
    setDeleteMode('none');
    setCourseToDelete(null);
    setUnitToDelete(null);
  };

  // Toggle delete mode for courses
  const toggleCourseDeleteMode = () => {
    setDeleteMode(deleteMode === 'courses' ? 'none' : 'courses');
    setUnitToDelete(null);
  };

  // Toggle delete mode for units
  const toggleUnitDeleteMode = () => {
    setDeleteMode(deleteMode === 'units' ? 'none' : 'units');
    setCourseToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--primary-red)] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading manage units data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">❌ {error}</p>
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

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-xl">No data available</p>
        </div>
      </div>
    );
  }

  // Group units by course
  const coursesByCode = data.courses.reduce((acc, course) => {
    acc[course.code] = course;
    return acc;
  }, {} as Record<string, Course>);

  const unitsByCourse = data.units.reduce((acc, unit) => {
    if (!acc[unit.courseCode]) {
      acc[unit.courseCode] = [];
    }
    acc[unit.courseCode].push(unit);
    return acc;
  }, {} as Record<string, Unit[]>);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
              Manage Units & Courses
            </h1>
            <p className="text-lg text-gray-600">
              Create, edit, and organize your courses and units
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={toggleCourseDeleteMode}
              className={`lms-button-secondary ${
                deleteMode === 'courses' ? 'bg-red-100 text-red-700 border-red-300' : ''
              }`}
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              {deleteMode === 'courses' ? 'Cancel Delete' : 'Delete Courses'}
            </button>
            
            <button
              onClick={toggleUnitDeleteMode}
              className={`lms-button-secondary ${
                deleteMode === 'units' ? 'bg-red-100 text-red-700 border-red-300' : ''
              }`}
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              {deleteMode === 'units' ? 'Cancel Delete' : 'Delete Units'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
      </div>

      {/* Course and Units Content */}
      <div className="space-y-8">
        {Object.keys(coursesByCode).map(courseCode => {
          const course = coursesByCode[courseCode];
          const courseUnits = unitsByCourse[courseCode] || [];

          return (
            <div key={courseCode} className="bg-white rounded-lg shadow-md p-6">
              {/* Course Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-black)' }}>
                      {course.name}
                    </h2>
                    <p className="text-gray-600">Course Code: {course.code}</p>
                  </div>
                  
                  {deleteMode === 'courses' && (
                    <button
                      onClick={() => handleDeleteCourse(course)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <FontAwesomeIcon icon={faUsers} className="mr-1" />
                    {courseUnits.length} units
                  </span>
                  
                  {deleteMode === 'none' && (
                    <button
                      onClick={() => handleAddUnit(course)}
                      className="lms-button-primary"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add Unit
                    </button>
                  )}
                </div>
              </div>

              {/* Units Grid */}
              {courseUnits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseUnits.map(unit => (
                    <div key={unit.code} className="relative">
                      <CoordinatorUnitCard 
                        unit={unit}
                        onClick={() => handleEditUnit(unit)}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                      />
                      
                      {deleteMode === 'units' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUnit(unit);
                          }}
                          className="absolute top-2 right-2 bg-red-100 text-red-700 p-2 rounded-full hover:bg-red-200 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No units found for this course.</p>
                  <p className="text-gray-400">Click "Add Unit" to get started.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Course Section */}
      <div className="bg-gray-50 p-6 rounded-lg mt-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
            Add New Course
          </h3>
          <button 
            onClick={() => setModalType('addCourse')}
            className="lms-button-secondary"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add New Course
          </button>
        </div>
      </div>

      {/* Modals */}
      <CourseUnitModals
        modalType={modalType}
        onClose={() => setModalType('none')}
        coordinators={coordinators}
        teachers={teachers}
        onCourseAdded={handleCourseAdded}
        courseToDelete={courseToDelete}
        onCourseDeleted={handleCourseDeleted}
        selectedCourse={selectedCourse}
        onUnitAdded={handleUnitAdded}
        unitToDelete={unitToDelete}
        onUnitDeleted={handleUnitDeleted}
        allCourses={data?.courses || []}
        allUnits={data?.units || []}
        onSuccess={showSuccessMessage}
      />
    </div>
  );
}