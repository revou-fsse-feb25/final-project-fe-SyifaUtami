'use client';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/authContext';
import { Course, Unit, Teacher } from '../../types';

type ModalType = 'addCourse' | 'deleteCourse' | 'deleteUnit' | 'editUnit' | null;

interface CourseUnitModalsProps {
  // Modal state
  modalType: ModalType;
  onClose: () => void;
  
  // Add course props
  coordinators?: any[];
  onCourseAdded?: (course: Course) => void;
  
  // Delete course props
  courseToDelete?: Course | null;
  onCourseDeleted?: (course: Course) => void;
  
  // Delete unit props
  unitToDelete?: Unit | null;
  onUnitDeleted?: (unit: Unit) => void;
  
  // Edit unit props
  unitToEdit?: Unit | null;
  teachers?: Teacher[];
  assignedTeacher?: Teacher | null;
  onUnitUpdated?: (unit: Unit) => void;
  
  // Success callback
  onSuccess: (message: string) => void;
}

export default function CourseUnitModals({
  modalType,
  onClose,
  coordinators = [],
  onCourseAdded,
  courseToDelete,
  onCourseDeleted,
  unitToDelete,
  onUnitDeleted,
  unitToEdit,
  teachers = [],
  assignedTeacher,
  onUnitUpdated,
  onSuccess
}: CourseUnitModalsProps) {
  const { user, setUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add course form state
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    managedBy: ''
  });

  // Edit unit form state
  const [editUnit, setEditUnit] = useState({
    code: unitToEdit?.code || '',
    name: unitToEdit?.name || '',
    description: unitToEdit?.description || '',
    currentWeek: unitToEdit?.currentWeek || 1,
    teacherId: assignedTeacher?.id || ''
  });

  // Update edit form when unitToEdit changes
  useState(() => {
    if (unitToEdit) {
      setEditUnit({
        code: unitToEdit.code,
        name: unitToEdit.name,
        description: unitToEdit.description || '',
        currentWeek: unitToEdit.currentWeek,
        teacherId: assignedTeacher?.id || ''
      });
    }
  });

  // Handle add course
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

      // Make API call
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

      // Update auth context
      if (user && user.courseManaged) {
        const updatedUser = {
          ...user,
          courseManaged: [...user.courseManaged, newCourse.code.trim()]
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Notify parent and close
      onCourseAdded?.(result.course);
      onSuccess('Course added successfully!');
      handleClose();
      
      // Emit event
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

      // Update auth context
      if (user && user.courseManaged) {
        const updatedUser = {
          ...user,
          courseManaged: user.courseManaged.filter(code => code !== courseToDelete.code)
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Notify parent and close
      onCourseDeleted?.(courseToDelete);
      onSuccess(`Course "${courseToDelete.name}" and all its units deleted successfully!`);
      handleClose();
      
      // Emit event
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

      // Notify parent and close
      onUnitDeleted?.(unitToDelete);
      onSuccess(`Unit "${unitToDelete.name}" deleted successfully!`);
      handleClose();

    } catch (err) {
      alert(`Failed to delete unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit unit
  const handleEditUnit = async () => {
    if (!unitToEdit) return;

    try {
      setIsSubmitting(true);

      // Validate form
      if (!editUnit.code.trim() || !editUnit.name.trim()) {
        alert('Unit code and name are required');
        return;
      }

      if (editUnit.currentWeek < 1 || editUnit.currentWeek > 12) {
        alert('Current week must be between 1 and 12');
        return;
      }

      const response = await fetch(`/api/units/${unitToEdit.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editUnit.code.trim(),
          name: editUnit.name.trim(),
          description: editUnit.description.trim(),
          currentWeek: editUnit.currentWeek,
          oldTeacherId: assignedTeacher?.id || null,
          newTeacherId: editUnit.teacherId || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update unit');
      }

      const result = await response.json();

      // Notify parent and close
      onUnitUpdated?.(result.unit);
      onSuccess('Unit updated successfully!');
      handleClose();
      
      // Emit event
      window.dispatchEvent(new CustomEvent('courseUpdated'));

    } catch (err) {
      alert(`Failed to update unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close modal
  const handleClose = () => {
    if (modalType === 'addCourse') {
      setNewCourse({ code: '', name: '', managedBy: '' });
    }
    if (modalType === 'editUnit' && unitToEdit) {
      setEditUnit({
        code: unitToEdit.code,
        name: unitToEdit.name,
        description: unitToEdit.description || '',
        currentWeek: unitToEdit.currentWeek,
        teacherId: assignedTeacher?.id || ''
      });
    }
    onClose();
  };

  // Get teacher display name
  const getTeacherDisplayName = (teacher: Teacher): string => {
    return `${teacher.firstName} ${teacher.lastName} (${teacher.email})`;
  };

  // Don't render if no modal type
  if (!modalType) return null;

  // Render Add Course Modal
  if (modalType === 'addCourse') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add New Course</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
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
              onClick={handleClose}
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
    );
  }

  // Render Edit Unit Modal
  if (modalType === 'editUnit' && unitToEdit) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Unit</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Code *
                </label>
                <input
                  type="text"
                  value={editUnit.code}
                  onChange={(e) => setEditUnit(prev => ({ ...prev, code: e.target.value }))}
                  className="lms-input w-full"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Name *
                </label>
                <input
                  type="text"
                  value={editUnit.name}
                  onChange={(e) => setEditUnit(prev => ({ ...prev, name: e.target.value }))}
                  className="lms-input w-full"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Week
                </label>
                <select
                  value={editUnit.currentWeek}
                  onChange={(e) => setEditUnit(prev => ({ ...prev, currentWeek: parseInt(e.target.value) }))}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Teacher
                </label>
                <select
                  value={editUnit.teacherId}
                  onChange={(e) => setEditUnit(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="lms-input w-full"
                  disabled={isSubmitting}
                >
                  <option value="">No teacher assigned</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {getTeacherDisplayName(teacher)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Description
              </label>
              <textarea
                value={editUnit.description}
                onChange={(e) => setEditUnit(prev => ({ ...prev, description: e.target.value }))}
                className="lms-input w-full"
                rows={4}
                placeholder="Enter a detailed description of this unit..."
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              className="lms-button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleEditUnit}
              className="lms-button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Updating...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Update Unit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Delete Course Modal
  if (modalType === 'deleteCourse' && courseToDelete) {
    return (
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
              onClick={handleClose}
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
    );
  }

  // Render Delete Unit Modal
  if (modalType === 'deleteUnit' && unitToDelete) {
    return (
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
              onClick={handleClose}
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
    );
  }

  return null;
}