'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import CoordinatorUnitCard from '../../components/coorUnitCard';
import { Course, Unit, StudentProgress, Assignment } from '../../../types';

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
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
  const [showDeleteUnitModal, setShowDeleteUnitModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [deleteMode, setDeleteMode] = useState<'none' | 'courses' | 'units'>('none');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // New course form state
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    managedBy: '' // New field for coordinator selection
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          assignments: academicData.assignments || []
        });

        // Set coordinators for the dropdown
        setCoordinators(academicData.faculty || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle add new course
  const handleAddCourse = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate form
      if (!newCourse.code.trim() || !newCourse.name.trim()) {
        alert('Please fill in both course code and name');
        return;
      }

      if (!newCourse.managedBy) {
        alert('Please select a coordinator to manage this course');
        return;
      }

      // Make API call to add course
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCourse.code.trim(),
          name: newCourse.name.trim(),
          managedBy: newCourse.managedBy
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add course');
      }

      const result = await response.json();

      // Update local state with the new course
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          courses: [...prevData.courses, result.course]
        };
      });

      // Reset form and close modal
      setNewCourse({ code: '', name: '', managedBy: '' });
      setShowAddCourseModal(false);
      showSuccessMessage('Course added successfully!');
      
      // Emit event to notify other components
      window.dispatchEvent(new CustomEvent('courseUpdated'));
      
    } catch (err) {
      alert(`Failed to add course: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete course
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/courses?code=${courseToDelete.code}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete course');
      }

      // Update local state - remove course and its units
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          courses: prevData.courses.filter(c => c.code !== courseToDelete.code),
          units: prevData.units.filter(u => u.courseCode !== courseToDelete.code)
        };
      });

      setShowDeleteCourseModal(false);
      setCourseToDelete(null);
      resetDeleteMode();
      showSuccessMessage(`Course "${courseToDelete.name}" and all its units deleted successfully!`);
      
      // Emit event to notify other components
      window.dispatchEvent(new CustomEvent('courseUpdated'));

    } catch (err) {
      alert(`Failed to delete course: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete unit
  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/units?code=${unitToDelete.code}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete unit');
      }

      // Update local state - remove unit
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          units: prevData.units.filter(u => u.code !== unitToDelete.code)
        };
      });

      setShowDeleteUnitModal(false);
      setUnitToDelete(null);
      resetDeleteMode();
      showSuccessMessage(`Unit "${unitToDelete.name}" deleted successfully!`);

    } catch (err) {
      alert(`Failed to delete unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset delete mode after successful deletion
  const resetDeleteMode = () => {
    setDeleteMode('none');
  };

  // Get units for a specific course with progress data
  const getUnitsForCourse = (courseCode: string) => {
    if (!data) return [];
    
    return data.units
      .filter(unit => unit.courseCode === courseCode)
      .map(unit => {
        // Get progress data for this unit
        const unitProgress = data.allStudentProgress.filter(progress => 
          progress.unitCode === unit.code
        );
        
        // Get assignments for this unit
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
              Add and manage courses and their units
            </p>
          </div>

          {/* Delete Mode Controls */}
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
                        setShowDeleteCourseModal(true);
                      }}
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
                      // Navigate to add units page with course context
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
                            setUnitToDelete(unit);
                            setShowDeleteUnitModal(true);
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
            onClick={() => setShowAddCourseModal(true)}
            className="lms-button-secondary"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add New Course
          </button>
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Course</h2>
              <button
                onClick={() => {
                  setShowAddCourseModal(false);
                  setNewCourse({ code: '', name: '', managedBy: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, code: e.target.value }))}
                  className="lms-input w-full"
                  placeholder="e.g., CS, BM, BA"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                  className="lms-input w-full"
                  placeholder="e.g., Computer Science, Business Management"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Managed By *
                </label>
                <select
                  value={newCourse.managedBy}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, managedBy: e.target.value }))}
                  className="lms-input w-full"
                  disabled={isSubmitting}
                >
                  <option value="">Select a coordinator...</option>
                  {coordinators
                    .filter(coordinator => coordinator.title === 'Coordinator')
                    .map((coordinator) => (
                      <option key={coordinator.id} value={coordinator.id}>
                        {coordinator.firstName} {coordinator.lastName} ({coordinator.email})
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose which coordinator will manage this course
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddCourseModal(false);
                  setNewCourse({ code: '', name: '', managedBy: '' });
                }}
                className="lms-button-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCourse}
                className="lms-button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {showDeleteCourseModal && courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirm Course Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>"{courseToDelete.name}" ({courseToDelete.code})</strong>? 
              <br /><br />
              <span className="text-red-600 font-medium">
                This will also delete ALL units belonging to this course. This action cannot be undone.
              </span>
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteCourseModal(false);
                  setCourseToDelete(null);
                }}
                className="lms-button-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                className="text-white px-4 py-2 rounded hover:bg-opacity-90"
                style={{ backgroundColor: 'var(--primary-red)' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Unit Confirmation Modal */}
      {showDeleteUnitModal && unitToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirm Unit Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>"{unitToDelete.name}" ({unitToDelete.code})</strong>? 
              <br /><br />
              <span className="text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteUnitModal(false);
                  setUnitToDelete(null);
                }}
                className="lms-button-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUnit}
                className="text-white px-4 py-2 rounded hover:bg-opacity-90"
                style={{ backgroundColor: 'var(--primary-red)' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Unit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}