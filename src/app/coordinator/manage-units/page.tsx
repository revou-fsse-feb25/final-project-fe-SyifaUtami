// src/app/coordinator/manage-units/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faUsers } from '@fortawesome/free-solid-svg-icons';
import CoordinatorUnitCard from '../../components/coorUnitCard';
import CourseUnitModals from '../../components/courseUnitModals';
import StudentProgressComponent from '../../components/studentProgress';
import { Course, Unit, StudentProgress, Assignment, Teacher } from '../../../types';

interface ManageUnitsData {
  courses: Course[];
  units: Unit[];
  allStudentProgress: StudentProgress[];
  assignments: Assignment[];
  teachers: Teacher[]; // Add teachers
}

type ModalType = 'addCourse' | 'addUnit' | 'deleteCourse' | 'deleteUnit' | 'none';

export default function ManageUnitsPage() {
  const [data, setData] = useState<ManageUnitsData | null>(null);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]); // Add teachers state
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

  // Fetch all data needed for the page
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch academic data (courses, units, etc.)
        const [academicResponse, studentsResponse] = await Promise.all([
          fetch('/api/academic-data'),
          fetch('/api/students?includeData=true')
        ]);

        if (!academicResponse.ok || !studentsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const academicData = await academicResponse.json();
        const studentsData = await studentsResponse.json();

        setData({
          courses: academicData.courses || [],
          units: academicData.units || [],
          allStudentProgress: studentsData.progress || [],
          assignments: academicData.assignments || [],
          teachers: academicData.teachers || [] // Add teachers to data
        });

        // Set coordinators and teachers for the dropdowns
        setCoordinators(academicData.faculty || []);
        setTeachers(academicData.teachers || []); // Set teachers state

      } catch (err) {
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
  };

  // Reset delete mode
  const resetDeleteMode = () => {
    setDeleteMode('none');
  };

  // Get units for a specific course with progress data
  const getUnitsForCourse = (courseCode: string) => {
    if (!data) return [];
    
    return data.units
      .filter(unit => unit.courseCode === courseCode)
      .map(unit => {
        const unitProgress = data.allStudentProgress.filter(progress => 
          progress.unitCode === unit.code
        );
        
        const unitAssignments = data.assignments.filter(assignment => 
          assignment.unitCode === unit.code
        );

        return {
          unit,
          progress: unitProgress,
          assignments: unitAssignments
        };
      });
  };

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
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
          <p className="text-lg text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
              Manage Courses and Units
            </h1>
            <p className="text-lg text-gray-600">
              Add, edit, and manage courses and their units
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex gap-3">
            <button 
              onClick={() => setDeleteMode(deleteMode === 'units' ? 'none' : 'units')}
              className={`px-4 py-2 rounded transition-colors ${
                deleteMode === 'units' 
                  ? 'text-white' 
                  : 'text-white hover:bg-opacity-90'
              }`}
              style={{ backgroundColor: 'var(--primary-red)' }}
            >
              {deleteMode === 'units' ? 'Cancel Delete Units' : 'Delete Units'}
            </button>
            
            <button 
              onClick={() => setDeleteMode(deleteMode === 'courses' ? 'none' : 'courses')}
              className={`px-4 py-2 rounded transition-colors ${
                deleteMode === 'courses' 
                  ? 'text-white' 
                  : 'text-white hover:bg-opacity-90'
              }`}
              style={{ backgroundColor: 'var(--primary-red)' }}
            >
              {deleteMode === 'courses' ? 'Cancel Delete Courses' : 'Delete Courses'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            ✅ {successMessage}
          </div>
        )}
      </div>

      {/* Courses and Units */}
      <div className="space-y-8">
        {data?.courses.map((course) => {
          const courseUnits = getUnitsForCourse(course.code);
          
          return (
            <div key={course.code} className="bg-gray-50 p-6 rounded-lg">
              {/* Course Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-black)' }}>
                    {course.name} ({course.code})
                  </h2>
                  
                  {/* Delete Course X Button */}
                  {deleteMode === 'courses' && (
                    <button
                      onClick={() => {
                        setCourseToDelete(course);
                        setModalType('deleteCourse');
                      }}
                      className="ml-3 w-8 h-8 bg-white rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                      style={{ color: 'var(--primary-red)' }}
                      title="Delete Course"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <p className="text-gray-600">{courseUnits.length} units</p>
                  <button 
                    onClick={() => {
                      setSelectedCourse(course);
                      setModalType('addUnit');
                    }}
                    className="lms-button-primary"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Unit
                  </button>
                </div>
              </div>

              {/* Units Grid */}
              {courseUnits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courseUnits.map(({ unit, progress, assignments }) => (
                    <div key={unit.code} className="relative">
                      {deleteMode === 'units' ? (
                        // During delete mode, disable the link and show delete button
                        <div className="relative">
                          <div className="lms-card hover:shadow-lg transition-all duration-200 relative opacity-75 cursor-not-allowed">
                            {/* Color Header */}
                            <div 
                              className="h-20 rounded-t-lg mb-4 flex items-center justify-center"
                              style={{ backgroundColor: 'var(--primary-red)' }}
                            >
                              <FontAwesomeIcon icon={faUsers} className="text-white text-2xl" />
                            </div>
                            
                            {/* Unit Info */}
                            <div className="space-y-3">
                              <div>
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-black)' }}>
                                  {unit.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {unit.code} • {progress.length} students
                                </p>
                              </div>
                              
                              {/* Progress Section */}
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-700 mb-1">Average Progress</p>
                                <div className="text-xl font-bold" style={{ color: 'var(--primary-dark)' }}>
                                  <StudentProgressComponent 
                                    allProgressData={progress}
                                    assignments={assignments}
                                    mode="average"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Delete Unit X Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setUnitToDelete(unit);
                              setModalType('deleteUnit');
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center z-10 shadow-lg border-2 border-red-500"
                            style={{ color: 'var(--primary-red)' }}
                            title="Delete Unit"
                          >
                            <FontAwesomeIcon icon={faTimes} className="text-sm" />
                          </button>
                        </div>
                      ) : (
                        // Normal mode - clickable card
                        <CoordinatorUnitCard
                          unit={unit}
                          allStudentProgress={progress}
                          assignments={assignments}
                        />
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
        teachers={teachers} // Pass teachers prop
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