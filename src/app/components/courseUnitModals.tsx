// src/app/components/courseUnitModals.tsx
'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Course, Unit } from '../../types';

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
}

export default function CourseUnitModals({
  modalType,
  onClose,
  coordinators,
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
    courseCode: ''
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
        courseCode: selectedCourse.code
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
      alert(`Course code "${code}" already exists. Please choose a different code.`);
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
      alert(`Unit code "${code}" already exists. Please choose a different code.`);
      return false;
    }

    return true;
  };

  // Course form handlers
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCourseForm()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCourse.code.trim().toUpperCase(),
          name: newCourse.name.trim(),
          managedBy: newCourse.managedBy
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add course');
      }

      const result = await response.json();
      onCourseAdded(result.course);
      onSuccess('Course added successfully!');
      onClose();

    } catch (err) {
      alert(`Failed to add course: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCourseForm = (): boolean => {
    if (!validateCourseCode(newCourse.code)) return false;
    
    if (!newCourse.name.trim()) {
      alert('Course name is required');
      return false;
    }
    
    if (!newCourse.managedBy) {
      alert('Please select a coordinator to manage this course');
      return false;
    }
    
    return true;
  };

  // Unit form handlers
  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUnitForm()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newUnit.code.trim().toUpperCase(),
          name: newUnit.name.trim(),
          courseCode: newUnit.courseCode,
          description: newUnit.description.trim() || 'Unit description will be added here.',
          currentWeek: newUnit.currentWeek
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create unit');
      }

      const result = await response.json();
      if (onUnitAdded) onUnitAdded(result.unit);
      onSuccess('Unit created successfully!');
      onClose();

    } catch (err) {
      alert(`Failed to create unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateUnitForm = (): boolean => {
    if (!validateUnitCode(newUnit.code)) return false;
    
    if (!newUnit.name.trim()) {
      alert('Unit name is required');
      return false;
    }
    
    if (newUnit.currentWeek < 1 || newUnit.currentWeek > 12) {
      alert('Current week must be between 1 and 12');
      return false;
    }
    
    return true;
  };

  // Delete course handler
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

      if (onCourseDeleted) onCourseDeleted(courseToDelete);
      onSuccess(`Course "${courseToDelete.name}" and all its units deleted successfully!`);
      onClose();

    } catch (err) {
      alert(`Failed to delete course: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete unit handler
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

      if (onUnitDeleted) onUnitDeleted(unitToDelete);
      onSuccess(`Unit "${unitToDelete.name}" deleted successfully!`);
      onClose();

    } catch (err) {
      alert(`Failed to delete unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleCourseInputChange = (field: keyof NewCourse, value: string) => {
    setNewCourse(prev => ({ ...prev, [field]: value }));
  };

  const handleUnitInputChange = (field: keyof NewUnit, value: string | number) => {
    setNewUnit(prev => ({ ...prev, [field]: value }));
  };

  if (modalType === 'none') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Add Course Modal */}
      {modalType === 'addCourse' && (
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                placeholder="e.g., CS, BM, BA"
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
                placeholder="e.g., Computer Science, Business Management"
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
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Create Unit
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Course Modal */}
      {modalType === 'deleteCourse' && courseToDelete && (
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
              onClick={onClose}
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

      {/* Delete Unit Modal */}
      {modalType === 'deleteUnit' && unitToDelete && (
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
              onClick={onClose}
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
  );
}