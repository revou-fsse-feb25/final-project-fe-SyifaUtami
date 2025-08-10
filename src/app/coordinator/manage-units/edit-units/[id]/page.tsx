// src/app/coordinator/manage-units/edit-units/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faEdit, faUser } from '@fortawesome/free-solid-svg-icons';
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
    teacherId: '' // Add teacher ID to form state
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
        const response = await fetch('/api/academic-data');
        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        const foundUnit = data.units.find((u: Unit) => u.code === unitCode);

        if (!foundUnit) {
          setError('Unit not found');
        } else {
          setUnit(foundUnit);
          
          // Find current teacher for this unit
          const unitTeacher = data.teachers.find((t: Teacher) => 
            t.unitsTeached && t.unitsTeached.includes(foundUnit.code)
          );
          setCurrentTeacher(unitTeacher || null);
          
          setEditedUnit({
            code: foundUnit.code,
            name: foundUnit.name,
            description: foundUnit.description,
            currentWeek: foundUnit.currentWeek,
            teacherId: unitTeacher?.id || '' // Set current teacher ID
          });

          // Find the course this unit belongs to
          const foundCourse = data.courses.find((c: Course) => c.code === foundUnit.courseCode);
          setCourse(foundCourse || null);
          
          // Set available teachers
          setTeachers(data.teachers || []);
        }
      } catch (err) {
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

      console.log('Submitting unit update:', {
        code: editedUnit.code.trim(),
        name: editedUnit.name.trim(),
        description: editedUnit.description.trim(),
        currentWeek: editedUnit.currentWeek,
        courseCode: unit?.courseCode,
        oldTeacherId: currentTeacher?.id || null,
        newTeacherId: editedUnit.teacherId || null
      });

      // Update unit basic information
      const unitResponse = await fetch(`/api/units/${unitCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editedUnit.code.trim(),
          name: editedUnit.name.trim(),
          description: editedUnit.description.trim(),
          currentWeek: editedUnit.currentWeek,
          courseCode: unit?.courseCode, // Keep the same course
          oldTeacherId: currentTeacher?.id || null,
          newTeacherId: editedUnit.teacherId || null
        }),
      });

      console.log('Update response status:', unitResponse.status);
      console.log('Update response ok:', unitResponse.ok);

      if (!unitResponse.ok) {
        const errorText = await unitResponse.text();
        console.log('Error response text:', errorText);
        
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.log('Could not parse error response as JSON');
        }
        
        throw new Error(errorData.error || errorData.details || errorText || 'Failed to update unit');
      }

      const result = await unitResponse.json();
      console.log('Unit updated successfully:', result);
      
      showSuccessMessage('Unit updated successfully!');
      
      // Emit event to notify other components about unit update
      window.dispatchEvent(new CustomEvent('courseUpdated'));
      
      // Redirect back to manage units after 2 seconds
      setTimeout(() => {
        router.push('/coordinator/manage-units');
      }, 2000);

    } catch (err) {
      console.error('Unit update error:', err);
      alert(`Failed to update unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string | number) => {
    setEditedUnit(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading unit information...</p>
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
            onClick={() => router.push('/coordinator/manage-units')}
            className="lms-button-secondary"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Manage Units
          </button>
        </div>
      </div>
    );
  }

  if (!unit || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-xl mb-4">Unit or course not found</p>
          <button 
            onClick={() => router.push('/coordinator/manage-units')}
            className="lms-button-secondary"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Manage Units
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
              Edit Unit
            </h1>
            <p className="text-lg text-gray-600">
              Edit <strong>{unit.name} ({unit.code})</strong> in <strong>{course.name} ({course.code})</strong>
            </p>
            {currentTeacher && (
              <p className="text-sm text-blue-600 mt-1">
                <FontAwesomeIcon icon={faUser} className="mr-1" />
                Currently taught by: {currentTeacher.firstName} {currentTeacher.lastName}
              </p>
            )}
          </div>
          
          <button 
            onClick={() => router.push('/coordinator/manage-units')}
            className="lms-button-secondary"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Manage Units
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            ✅ {successMessage}
          </div>
        )}
      </div>

      {/* Unit Edit Form */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          <FontAwesomeIcon icon={faEdit} className="mr-2" />
          Unit Information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Info (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <div className="lms-input bg-gray-100 cursor-not-allowed">
                {course.name} ({course.code})
              </div>
            </div>
          </div>

          {/* Unit Code and Name */}
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
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Week
              </label>
              <select
                value={editedUnit.currentWeek}
                onChange={(e) => handleInputChange('currentWeek', parseInt(e.target.value))}
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
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Unit Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Description
            </label>
            <textarea
              value={editedUnit.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="lms-input w-full"
              rows={4}
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
                  {teacher.unitsTeached && teacher.unitsTeached.length > 0 && 
                    ` - Currently teaching ${teacher.unitsTeached.length} unit(s)`
                  }
                </option>
              ))}
            </select>
            {editedUnit.teacherId && editedUnit.teacherId !== (currentTeacher?.id || '') && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Changing teacher assignment will update the teacher's unit list
              </p>
            )}
            {!editedUnit.teacherId && currentTeacher && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Removing teacher assignment will remove this unit from {currentTeacher.firstName} {currentTeacher.lastName}'s teaching list
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
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
        </form>
      </div>
    </div>
  );
}