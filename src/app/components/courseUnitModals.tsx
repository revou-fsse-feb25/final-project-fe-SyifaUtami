// src/app/components/courseUnitModals.tsx
'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faPlus, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { Course, Unit, Teacher } from '../../types';

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
  teachers?: Teacher[]; // Add teachers array
  
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
  teacherId: string; // Add teacher ID
}

export default function CourseUnitModals({
  modalType,
  onClose,
  coordinators,
  teachers = [], // Default to empty array
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
    teacherId: '' // Add teacher ID to state
  });

  // Reset forms when modal opens or closes
  useEffect(() => {
    if (modalType === 'addCourse') {
      setNewCourse({ code: '', name: '', managedBy: '' });
    } else if (modalType === 'addUnit' && selectedCourse) {
      setNewUnit({
        code: `${selectedCourse.code}0`,
        name: '',
        description: '',
        currentWeek: 1,
        courseCode: selectedCourse.code,
        teacherId: '' // Reset teacher selection
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

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCourse.code.trim(),
          name: newCourse.name.trim(),
          managedBy: newCourse.managedBy,
          units: []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create course');
      }

      const result = await response.json();
      onCourseAdded(result.course);
      onSuccess('Course created successfully!');
      onClose();
      
    } catch (err) {
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

      console.log('Submitting unit data:', {
        code: newUnit.code.trim(),
        name: newUnit.name.trim(),
        description: newUnit.description.trim(),
        currentWeek: newUnit.currentWeek,
        courseCode: newUnit.courseCode,
        teacherId: newUnit.teacherId || null
      });

      // Create the unit with teacher assignment
      const unitResponse = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newUnit.code.trim(),
          name: newUnit.name.trim(),
          description: newUnit.description.trim(),
          currentWeek: newUnit.currentWeek,
          courseCode: newUnit.courseCode,
          teacherId: newUnit.teacherId || null // Include teacher assignment
        }),
      });

      console.log('Response status:', unitResponse.status);
      console.log('Response ok:', unitResponse.ok);

      if (!unitResponse.ok) {
        const errorText = await unitResponse.text();
        console.log('Error response text:', errorText);
        
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.log('Could not parse error response as JSON');
        }
        
        throw new Error(errorData.error || errorData.details || errorText || 'Failed to create unit');
      }

      const unitResult = await unitResponse.json();
      console.log('Unit created successfully:', unitResult);

      if (onUnitAdded) {
        onUnitAdded(unitResult.unit);
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

      const response = await fetch(`/api/courses?code=${courseToDelete.code}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete course');
      }

      if (onCourseDeleted) {
        onCourseDeleted(courseToDelete);
      }
      onSuccess('Course deleted successfully!');
      onClose();
      
    } catch (err) {
      alert(`Failed to delete course: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitDelete = async () => {
    if (!unitToDelete) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/units/${unitToDelete.code}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete unit');
      }

      if (onUnitDeleted) {
        onUnitDeleted(unitToDelete);
      }
      onSuccess('Unit deleted successfully!');
      onClose();
      
    } catch (err) {
      alert(`Failed to delete unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything if modal is closed
  if (modalType === 'none') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Add Course Modal */}
      {modalType === 'addCourse' && (
        <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                    Adding...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Course
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Unit Modal */}
      {modalType === 'addUnit' && selectedCourse && (
        <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add New Unit</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Adding unit to:</strong> {selectedCourse.name} ({selectedCourse.code})
            </p>
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
                  placeholder={`e.g., ${selectedCourse.code}001, ${selectedCourse.code}002`}
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be unique across all units
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Week
                </label>
                <select
                  value={newUnit.currentWeek}
                  onChange={(e) => handleUnitInputChange('currentWeek', parseInt(e.target.value))}
                  className="lms-input w-full"
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(week => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
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
                Unit Description
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

            {/* NEW: Teacher Selection */}
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
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="font-medium text-red-800">
                {courseToDelete.name} ({courseToDelete.code})
              </p>
            </div>
            <p className="text-red-600 text-sm mt-2 font-medium">
              ⚠️ This action cannot be undone. All units in this course will also be deleted.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="lms-button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleCourseDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
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
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="font-medium text-red-800">
                {unitToDelete.name} ({unitToDelete.code})
              </p>
            </div>
            <p className="text-red-600 text-sm mt-2 font-medium">
              ⚠️ This action cannot be undone. All student progress and assignments for this unit will be lost.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="lms-button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleUnitDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
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
  );
}