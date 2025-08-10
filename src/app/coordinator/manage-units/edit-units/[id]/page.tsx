// src/app/coordinator/manage-units/edit-units/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faEdit } from '@fortawesome/free-solid-svg-icons';
import { Course, Unit } from '../../../../../types';

export default function EditUnitsPage() {
  const router = useRouter();
  const params = useParams();
  const unitCode = params.id as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form state
  const [editedUnit, setEditedUnit] = useState({
    code: '',
    name: '',
    description: '',
    currentWeek: 1
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
          setEditedUnit({
            code: foundUnit.code,
            name: foundUnit.name,
            description: foundUnit.description,
            currentWeek: foundUnit.currentWeek
          });

          // Find the course this unit belongs to
          const foundCourse = data.courses.find((c: Course) => c.code === foundUnit.courseCode);
          setCourse(foundCourse || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load unit');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [unitCode]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/units/${unitCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editedUnit.code.trim(),
          name: editedUnit.name.trim(),
          description: editedUnit.description.trim(),
          currentWeek: editedUnit.currentWeek,
          courseCode: unit?.courseCode // Keep the same course
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update unit');
      }

      const result = await response.json();
      showSuccessMessage('Unit updated successfully!');
      
      // Emit event to notify other components about unit update
      window.dispatchEvent(new CustomEvent('courseUpdated'));
      
      // Redirect back to manage units after 2 seconds
      setTimeout(() => {
        router.push('/coordinator/manage-units');
      }, 2000);

    } catch (err) {
      alert(`Failed to update unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation (basic validation only - uniqueness handled by API)
  const validateForm = (): boolean => {
    if (!editedUnit.code.trim()) {
      alert('Unit code is required');
      return false;
    }
    
    if (!editedUnit.name.trim()) {
      alert('Unit name is required');
      return false;
    }
    
    if (editedUnit.currentWeek < 1 || editedUnit.currentWeek > 12) {
      alert('Current week must be between 1 and 12');
      return false;
    }
    
    return true;
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error || !unit || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error || 'Unit not found'}</p>
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
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
              Edit Unit
            </h1>
            <p className="text-lg text-gray-600">
              Edit <strong>{unit.name} ({unit.code})</strong> in <strong>{course.name} ({course.code})</strong>
            </p>
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
                placeholder="e.g., BM001, BA002"
                disabled={isSubmitting}
                required
              />
              {editedUnit.code !== unit.code && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Changing the unit code will affect all related assignments and student progress
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Name *
              </label>
              <input
                type="text"
                value={editedUnit.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="lms-input w-full"
                placeholder="e.g., Introduction to Programming"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Current Week */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <p className="text-xs text-gray-500 mt-1">
                What week is this unit currently on?
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Description
            </label>
            <textarea
              value={editedUnit.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="lms-input w-full"
              rows={4}
              placeholder="Enter a detailed description of this unit..."
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide a description for students and coordinators
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
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

      {/* Warning Section */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-amber-800">
          Important Notes
        </h3>
        <ul className="text-sm text-amber-700 space-y-2">
          <li>• <strong>Unit Code Changes:</strong> Changing the unit code will affect all assignments and student progress linked to this unit</li>
          <li>• <strong>Current Week:</strong> This affects what content students see as "current" in their unit view</li>
          <li>• <strong>Description:</strong> This helps students understand what the unit covers and learning objectives</li>
          <li>• <strong>Validation:</strong> Unit codes must be unique across all courses</li>
        </ul>
      </div>
    </div>
  );
}