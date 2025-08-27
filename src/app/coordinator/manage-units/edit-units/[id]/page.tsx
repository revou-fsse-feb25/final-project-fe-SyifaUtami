// src/app/coordinator/manage-units/edit-units/[id]/page.tsx
// Fixed version with correct token authentication
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faEdit, faUser } from '@fortawesome/free-solid-svg-icons';
import { apiClient } from '../../../../../lib/api';
import { Course, Unit, Teacher } from '../../../../../types';

export default function EditUnitsPage() {
  const router = useRouter();
  const params = useParams();
  const unitCode = params.id as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form state
  const [editedUnit, setEditedUnit] = useState({
    code: '',
    name: '',
    description: '',
    currentWeek: 1,
    teacherId: ''
  });

  // Helper function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Fetch unit and course information
  useEffect(() => {
    const fetchData = async () => {
      if (!unitCode) {
        setError('No unit specified');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🚀 EDIT UNITS: Fetching data for unit:', unitCode);

        // Use apiClient for consistent authentication
        const [unitData, coursesData, teachersData] = await Promise.all([
          apiClient.getUnit(unitCode),
          apiClient.getCourses(),
          apiClient.getTeachers()
        ]);

        console.log('📦 EDIT UNITS: Data received:', {
          unit: unitData,
          courses: coursesData,
          teachers: teachersData
        });

        // Handle different response formats
        const foundUnit = unitData.success ? unitData.data : unitData;
        const courses = coursesData.success ? coursesData.data : coursesData;
        const teachersResult = teachersData.success ? teachersData.data : teachersData;

        if (!foundUnit) {
          setError('Unit not found');
        } else {
          setUnit(foundUnit);
          
          // Find current teacher for this unit
          const unitTeacher = Array.isArray(teachersResult) 
            ? teachersResult.find((t: Teacher) => 
                t.unitsTeached && t.unitsTeached.includes(foundUnit.code)
              )
            : null;
          setCurrentTeacher(unitTeacher || null);
          
          setEditedUnit({
            code: foundUnit.code,
            name: foundUnit.name,
            description: foundUnit.description || '',
            currentWeek: foundUnit.currentWeek,
            teacherId: unitTeacher?.id || ''
          });

          // Find the course this unit belongs to
          const foundCourse = Array.isArray(courses)
            ? courses.find((c: Course) => c.code === foundUnit.courseCode)
            : null;
          setCourse(foundCourse || null);
          
          // Set available teachers
          setTeachers(Array.isArray(teachersResult) ? teachersResult : []);
        }
      } catch (err) {
        console.error('❌ EDIT UNITS: Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load unit');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [unitCode]);

  // Validation function
  const validateForm = (): boolean => {
    if (!editedUnit.code.trim()) {
      alert('Unit code is required');
      return false;
    }
    
    if (!editedUnit.name.trim()) {
      alert('Unit name is required');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      console.log('🔄 EDIT UNITS: Submitting unit update:', {
        code: editedUnit.code.trim(),
        name: editedUnit.name.trim(),
        description: editedUnit.description.trim(),
        currentWeek: editedUnit.currentWeek,
        courseCode: unit?.courseCode,
        oldTeacherId: currentTeacher?.id || null,
        newTeacherId: editedUnit.teacherId || null
      });

      // Update unit using apiClient for consistent authentication
      const updateData = {
        code: editedUnit.code.trim(),
        name: editedUnit.name.trim(),
        description: editedUnit.description.trim() || null,
        currentWeek: editedUnit.currentWeek,
        courseCode: unit?.courseCode,
        oldTeacherId: currentTeacher?.id || null,
        newTeacherId: editedUnit.teacherId || null
      };

      const result = await apiClient.updateUnit(unitCode, updateData);

      console.log('✅ EDIT UNITS: Unit updated successfully:', result);
      
      showSuccessMessage('Unit updated successfully!');
      
      // Emit event to notify other components about unit update
      window.dispatchEvent(new CustomEvent('courseUpdated'));
      
      // Redirect back to manage units after 2 seconds
      setTimeout(() => {
        router.push('/coordinator/manage-units');
      }, 2000);

    } catch (err) {
      console.error('❌ EDIT UNITS: Update error:', err);
      alert(`Failed to update unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string | number) => {
    setEditedUnit(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)] mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-black)' }}>Loading unit details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/coordinator/manage-units')}
            className="lms-button-primary"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Manage Units
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/coordinator/manage-units')}
            className="lms-button-secondary mr-4"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-black)' }}>
              <FontAwesomeIcon icon={faEdit} className="mr-3" />
              Edit Unit
            </h1>
            <p className="text-gray-600 mt-1">
              Modify unit details and teacher assignments
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Course Info */}
      {course && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-black)' }}>
            Course Information
          </h2>
          <p className="text-gray-700">
            <strong>Course:</strong> {course.name} ({course.code})
          </p>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Unit Code and Current Week */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Code *
              </label>
              <input
                type="text"
                value={editedUnit.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className="lms-input w-full"
                placeholder="e.g., BM001"
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
                value={editedUnit.currentWeek}
                onChange={(e) => handleInputChange('currentWeek', parseInt(e.target.value) || 1)}
                className="lms-input w-full"
                min="1"
                max="52"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Unit Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Name *
            </label>
            <input
              type="text"
              value={editedUnit.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="lms-input w-full"
              placeholder="Enter the unit name"
              maxLength={200}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editedUnit.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="lms-input w-full"
              rows={4}
              placeholder="Enter a detailed description of this unit..."
              disabled={isSubmitting}
            />
          </div>

          {/* Teacher Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              Assigned Teacher
            </label>
            <select
              value={editedUnit.teacherId}
              onChange={(e) => handleInputChange('teacherId', e.target.value)}
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
            
            {currentTeacher && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Current teacher:</strong> {currentTeacher.firstName} {currentTeacher.lastName}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/coordinator/manage-units')}
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
                  Updating Unit...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Update Unit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}