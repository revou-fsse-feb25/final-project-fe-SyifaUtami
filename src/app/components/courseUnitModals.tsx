// src/app/components/courseUnitModals.tsx
'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faPlus, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { Course, Unit, Teacher } from '../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

type ModalType = 
  | 'addCourse' 
  | 'addUnit' 
  | 'deleteCourse' 
  | 'deleteUnit' 
  | 'none';

interface CourseUnitModalsProps {
  modalType: ModalType;
  onClose: () => void;
  coordinators: any[];
  teachers?: Teacher[];
  
  // Course operations
  onCourseAdded: (newCourse: Course) => void;
  courseToDelete?: Course | null;
  onCourseDeleted?: (deletedCourse: Course) => void;
  
  // Unit operations
  selectedCourse?: Course | null;
  onUnitAdded?: (newUnit: Unit) => void;
  unitToDelete?: Unit | null;
  onUnitDeleted?: (deletedUnit: Unit) => void;
  
  // Validation data
  allCourses?: Course[];
  allUnits?: Unit[];
  
  // Success handling
  onSuccess: (message: string) => void;
}

interface NewCourse {
  code: string;
  name: string;
  managedBy: string;
}

interface NewUnit {
  code: string;
  name: string;
  description: string;
  currentWeek: number;
  courseCode: string;
  teacherId: string;
}

export default function CourseUnitModals({
  modalType,
  onClose,
  coordinators,
  teachers = [],
  onCourseAdded,
  courseToDelete,
  onCourseDeleted,
  selectedCourse,
  onUnitAdded,
  unitToDelete,
  onUnitDeleted,
  allCourses = [],
  allUnits = [],
  onSuccess
}: CourseUnitModalsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Course form state
  const [newCourse, setNewCourse] = useState<NewCourse>({
    code: '',
    name: '',
    managedBy: ''
  });

  // Unit form state
  const [newUnit, setNewUnit] = useState<NewUnit>({
    code: '',
    name: '',
    description: '',
    currentWeek: 1,
    courseCode: '',
    teacherId: ''
  });

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

  // Reset forms when modal opens or closes
  useEffect(() => {
    if (modalType === 'addCourse') {
      setNewCourse({ code: '', name: '', managedBy: '' });
    } else if (modalType === 'addUnit' && selectedCourse) {
      setNewUnit({
        code: `${selectedCourse.code}001`,
        name: '',
        description: '',
        currentWeek: 1,
        courseCode: selectedCourse.code,
        teacherId: ''
      });
    }
  }, [modalType, selectedCourse]);

  // Validation functions
  const validateCourseCode = (code: string): boolean => {
    if (!code.trim()) {
      alert('Course code is required');
      return false;
    }

    const trimmedCode = code.trim().toUpperCase();
    const existingCourse = allCourses.find(c => c.code.toUpperCase() === trimmedCode);
    
    if (existingCourse) {
      alert(`Course code "${code}" already exists. Please use a different code.`);
      return false;
    }

    return true;
  };

  const validateUnitCode = (code: string): boolean => {
    if (!code.trim()) {
      alert('Unit code is required');
      return false;
    }

    const trimmedCode = code.trim().toUpperCase();
    const existingUnit = allUnits.find(u => u.code.toUpperCase() === trimmedCode);
    
    if (existingUnit) {
      alert(`Unit code "${code}" already exists. Please use a different code.`);
      return false;
    }

    return true;
  };

  // Input change handlers
  const handleCourseInputChange = (field: keyof NewCourse, value: string) => {
    setNewCourse(prev => ({ ...prev, [field]: value }));
  };

  const handleUnitInputChange = (field: keyof NewUnit, value: string | number) => {
    setNewUnit(prev => ({ ...prev, [field]: value }));
  };

  // Form submission handlers
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCourseCode(newCourse.code)) return;
    
    if (!newCourse.name.trim()) {
      alert('Course name is required');
      return;
    }
    
    if (!newCourse.managedBy) {
      alert('Please select a coordinator');
      return;
    }

    try {
      setIsSubmitting(true);

      const courseData = {
        code: newCourse.code.trim(),
        name: newCourse.name.trim(),
        managedBy: newCourse.managedBy,
        units: []
      };

      // Create course using Railway API
      const result = await makeAuthenticatedRequest('/courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
      });

      // Handle response
      const course = result.success ? result.data : result;
      onCourseAdded(course);
      onSuccess('Course created successfully!');
      onClose();
      
    } catch (err) {
      console.error('Course creation error:', err);
      alert(`Failed to create course: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUnitCode(newUnit.code)) return;
    
    if (!newUnit.name.trim()) {
      alert('Unit name is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const unitData = {
        code: newUnit.code.trim(),
        name: newUnit.name.trim(),
        description: newUnit.description.trim() || null, // Handle empty string as null
        currentWeek: newUnit.currentWeek,
        courseCode: newUnit.courseCode,
        teacherId: newUnit.teacherId || null
      };

      console.log('Submitting unit data:', unitData);

      // Create unit using Railway API
      const result = await makeAuthenticatedRequest('/units', {
        method: 'POST',
        body: JSON.stringify(unitData)
      });

      console.log('Unit created successfully:', result);

      // Handle response
      const unit = result.success ? result.data : result;
      if (onUnitAdded) {
        onUnitAdded(unit);
      }
      onSuccess(`Unit created successfully${newUnit.teacherId ? ' with teacher assignment' : ''}!`);
      onClose();
      
    } catch (err) {
      console.error('Unit creation error:', err);
      alert(`Failed to create unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handlers
  const handleCourseDelete = async () => {
    if (!courseToDelete) return;

    try {
      setIsSubmitting(true);

      // Delete course using Railway API
      await makeAuthenticatedRequest(`/courses/${courseToDelete.code}`, {
        method: 'DELETE'
      });

      if (onCourseDeleted) {
        onCourseDeleted(courseToDelete);
      }
      onSuccess('Course deleted successfully!');
      onClose();
      
    } catch (err) {
      console.error('Course deletion error:', err);
      alert(`Failed to delete course: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitDelete = async () => {
    if (!unitToDelete) return;

    try {
      setIsSubmitting(true);

      // Delete unit using Railway API
      await makeAuthenticatedRequest(`/units/${unitToDelete.code}`, {
        method: 'DELETE'
      });

      if (onUnitDeleted) {
        onUnitDeleted(unitToDelete);
      }
      onSuccess('Unit deleted successfully!');
      onClose();
      
    } catch (err) {
      console.error('Unit deletion error:', err);
      alert(`Failed to delete unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (modalType === 'none') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Add Course Modal */}
        {modalType === 'addCourse' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Course</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  value={newCourse.code}
                  onChange={(e) => handleCourseInputChange('code', e.target.value)}
                  className="lms-input w-full"
                  placeholder="e.g., CS101, MATH201"
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be unique across all courses
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => handleCourseInputChange('name', e.target.value)}
                  className="lms-input w-full"
                  placeholder="e.g., Introduction to Computer Science"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Managed By *
                </label>
                <select
                  value={newCourse.managedBy}
                  onChange={(e) => handleCourseInputChange('managedBy', e.target.value)}
                  className="lms-input w-full"
                  disabled={isSubmitting}
                  required
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
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="lms-button-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lms-button-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Create Course
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Unit Modal */}
        {modalType === 'addUnit' && selectedCourse && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Add Unit to {selectedCourse.name}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <form onSubmit={handleUnitSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Code *
                  </label>
                  <input
                    type="text"
                    value={newUnit.code}
                    onChange={(e) => handleUnitInputChange('code', e.target.value)}
                    className="lms-input w-full"
                    placeholder={`e.g., ${selectedCourse.code}001`}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Week *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newUnit.currentWeek}
                    onChange={(e) => handleUnitInputChange('currentWeek', parseInt(e.target.value))}
                    className="lms-input w-full"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Name *
                </label>
                <input
                  type="text"
                  value={newUnit.name}
                  onChange={(e) => handleUnitInputChange('name', e.target.value)}
                  className="lms-input w-full"
                  placeholder="e.g., Introduction to Programming"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newUnit.description}
                  onChange={(e) => handleUnitInputChange('description', e.target.value)}
                  className="lms-input w-full"
                  rows={3}
                  placeholder="Enter a detailed description of this unit..."
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  Assign Teacher (Optional)
                </label>
                <select
                  value={newUnit.teacherId}
                  onChange={(e) => handleUnitInputChange('teacherId', e.target.value)}
                  className="lms-input w-full"
                  disabled={isSubmitting}
                >
                  <option value="">No teacher assigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  You can assign a teacher now or later from the unit management page
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="lms-button-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lms-button-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add Unit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Course Confirmation Modal */}
        {modalType === 'deleteCourse' && courseToDelete && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-red-600">Delete Course</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the following course?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800">{courseToDelete.name}</h3>
                <p className="text-red-600">Code: {courseToDelete.code}</p>
              </div>
              <p className="text-red-600 text-sm mt-2">
                ⚠️ This action cannot be undone. All units associated with this course will also be deleted.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="lms-button-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCourseDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Delete Course
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Delete Unit Confirmation Modal */}
        {modalType === 'deleteUnit' && unitToDelete && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-red-600">Delete Unit</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the following unit?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800">{unitToDelete.name}</h3>
                <p className="text-red-600">Code: {unitToDelete.code}</p>
                <p className="text-red-600">Course: {unitToDelete.courseCode}</p>
              </div>
              <p className="text-red-600 text-sm mt-2">
                ⚠️ This action cannot be undone. All student progress and assignments for this unit will also be deleted.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="lms-button-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUnitDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Delete Unit
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}