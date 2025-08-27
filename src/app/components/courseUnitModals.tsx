// src/app/components/courseUnitModals.tsx
// Fixed version with course creation features removed
'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { apiClient } from '../../lib/api';
import { Course, Unit, Teacher } from '../../types';

type ModalType = 
  | 'addUnit' 
  | 'deleteUnit' 
  | 'none';

interface CourseUnitModalsProps {
  modalType: ModalType;
  onClose: () => void;
  coordinators: any[];
  teachers?: Teacher[];
  
  // Unit operations only
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
  selectedCourse,
  onUnitAdded,
  unitToDelete,
  onUnitDeleted,
  allCourses = [],
  allUnits = [],
  onSuccess
}: CourseUnitModalsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedTeachers, setLoadedTeachers] = useState<Teacher[]>([]);

  // Unit form state only
  const [newUnit, setNewUnit] = useState<NewUnit>({
    code: '',
    name: '',
    description: '',
    currentWeek: 1,
    courseCode: '',
    teacherId: ''
  });

  // Load teachers when unit modal opens
  useEffect(() => {
    const loadTeachers = async () => {
      if (modalType === 'addUnit') {
        if (teachers.length === 0) {
          try {
            console.log('Loading teachers for unit creation...');
            const teachersData = await apiClient.getTeachers();
            const teachersList = teachersData.success ? teachersData.data : teachersData;
            
            console.log('Found teachers:', Array.isArray(teachersList) ? teachersList.length : 'not array');
            setLoadedTeachers(Array.isArray(teachersList) ? teachersList : []);
          } catch (error) {
            console.error('Failed to load teachers:', error);
            setLoadedTeachers([]);
          }
        } else {
          setLoadedTeachers(teachers);
        }
      } else {
        // Clear loaded teachers when not in addUnit mode
        setLoadedTeachers([]);
      }
    };

    loadTeachers();
  }, [modalType]); // Remove teachers from dependency array

  // Use provided teachers or loaded teachers
  const availableTeachers = teachers.length > 0 ? teachers : loadedTeachers;

  // Reset unit form when modal opens
  useEffect(() => {
    if (modalType === 'addUnit' && selectedCourse) {
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

  // Validation function for unit code only
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

  // Input handler for unit form only
  const handleUnitInputChange = (field: keyof NewUnit, value: string | number) => {
    setNewUnit(prev => ({ ...prev, [field]: value }));
  };

  // Unit form handler
  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUnitCode(newUnit.code) || !newUnit.name.trim()) {
      if (!newUnit.name.trim()) alert('Unit name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Creating unit:', newUnit);

      const unitData = {
        code: newUnit.code.trim().toUpperCase(),
        name: newUnit.name.trim(),
        courseCode: newUnit.courseCode,
        description: newUnit.description.trim() || null,
        currentWeek: newUnit.currentWeek,
        teacherId: newUnit.teacherId || null
      };

      // Use apiClient for consistent authentication
      const result = await apiClient.createUnit(unitData);

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

  // Delete handler for units only
  const handleUnitDelete = async () => {
    if (!unitToDelete) return;

    try {
      setIsSubmitting(true);

      // Use apiClient for consistent authentication
      await apiClient.deleteUnit(unitToDelete.code);

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
                    maxLength={20}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Week
                  </label>
                  <input
                    type="number"
                    value={newUnit.currentWeek}
                    onChange={(e) => handleUnitInputChange('currentWeek', parseInt(e.target.value) || 1)}
                    className="lms-input w-full"
                    min="1"
                    max="52"
                    disabled={isSubmitting}
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
                  placeholder="Enter the unit name"
                  maxLength={200}
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
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} - {teacher.email}
                    </option>
                  ))}
                </select>
                {availableTeachers.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Loading teachers... ({teachers.length} provided)
                  </p>
                )}
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
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800">
                  {unitToDelete.name} ({unitToDelete.code})
                </h3>
                <p className="text-red-600 text-sm mt-1">
                  This action will delete all assignments and student progress for this unit and cannot be undone.
                </p>
              </div>
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
                type="button"
                onClick={handleUnitDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
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