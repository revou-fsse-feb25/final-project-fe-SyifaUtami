'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import CoordinatorUnitCard from '../../components/coorUnitCard';
import CourseUnitModals from '../../components/courseUnitModals';
import { Course, Unit, StudentProgress, Assignment } from '../../../types';

type ModalType = 'addCourse' | 'deleteCourse' | 'deleteUnit' | null;

interface ManageUnitsData {
  courses: Course[];
  units: Unit[];
  allStudentProgress: StudentProgress[];
  assignments: Assignment[];
}

export default function ManageUnitsPage() {
  const [data, setData] = useState<ManageUnitsData | null>(null);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Unified modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [deleteMode, setDeleteMode] = useState<'none' | 'courses' | 'units'>('none');

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
          assignments: academicData.assignments || []
        });

        setCoordinators(academicData.faculty || []);

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
    setDeleteMode('none');
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
    setDeleteMode('none');
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalType(null);
    setCourseToDelete(null);
    setUnitToDelete(null);
  };

  // Handle delete course button click
  const handleDeleteCourseClick = (course: Course) => {
    setCourseToDelete(course);
    setModalType('deleteCourse');
  };

  // Handle delete unit button click
  const handleDeleteUnitClick = (unit: Unit) => {
    setUnitToDelete(unit);
    setModalType('deleteUnit');
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

        return { unit, progress: unitProgress, assignments: unitAssignments };
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
              Add and manage courses and their units
            </p>
          </div>

          {/* Delete Mode Controls */}
          <div className="flex gap-3">
            <button 
              onClick={() => setDeleteMode(deleteMode === 'units' ? 'none' : 'units')}
              className={`px-4 py-2 rounded transition-colors text-white hover:bg-opacity-90`}
              style={{ backgroundColor: 'var(--primary-red)' }}
            >
              {deleteMode === 'units' ? 'Cancel Delete Units' : 'Delete Units'}
            </button>
            
            <button 
              onClick={() => setDeleteMode(deleteMode === 'courses' ? 'none' : 'courses')}
              className={`px-4 py-2 rounded transition-colors text-white hover:bg-opacity-90`}
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
                      onClick={() => handleDeleteCourseClick(course)}
                      className="ml-3 w-8 h-8 bg-white rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                      style={{ color: 'var(--primary-red)' }}
                      title="Delete Course"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center">
                  <p className="text-gray-600 mr-4">{courseUnits.length} units</p>
                  <button 
                    onClick={() => {
                      window.location.href = `/coordinator/manage-units/new-unit?courseCode=${course.code}`;
                    }}
                    className="lms-button-primary"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Units
                  </button>
                </div>
              </div>

              {/* Units Grid */}
              {courseUnits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courseUnits.map(({ unit, progress, assignments }) => (
                    <div key={unit.code} className="relative">
                      <CoordinatorUnitCard
                        unit={unit}
                        allStudentProgress={progress}
                        assignments={assignments}
                      />
                      
                      {/* Delete Unit X Button */}
                      {deleteMode === 'units' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteUnitClick(unit);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center z-10"
                          style={{ color: 'var(--primary-red)' }}
                          title="Delete Unit"
                        >
                          <FontAwesomeIcon icon={faTimes} className="text-sm" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No units found for this course.</p>
                  <p className="text-gray-400">Click "Add Units" to get started.</p>
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

      {/* Unified Modal Component */}
      <CourseUnitModals
        modalType={modalType}
        onClose={handleModalClose}
        coordinators={coordinators}
        onCourseAdded={handleCourseAdded}
        courseToDelete={courseToDelete}
        onCourseDeleted={handleCourseDeleted}
        unitToDelete={unitToDelete}
        onUnitDeleted={handleUnitDeleted}
        onSuccess={showSuccessMessage}
      />
    </div>
  );
}