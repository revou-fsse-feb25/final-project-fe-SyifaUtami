'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { Course, Teacher } from '../../../../types';

export default function NewUnitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseCode = searchParams.get('courseCode');

  const [course, setCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form state
  const [newUnit, setNewUnit] = useState({
    code: '',
    name: '',
    description: '',
    currentWeek: 1,
    teacherId: '' // New field for teacher selection
  });

  // Helper function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Fetch course information and available teachers
  useEffect(() => {
    const fetchData = async () => {
      if (!courseCode) {
        setError('No course specified');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/academic-data');
        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        const foundCourse = data.courses.find((c: Course) => c.code === courseCode);

        if (!foundCourse) {
          setError('Course not found');
        } else {
          setCourse(foundCourse);
          // Pre-fill unit code with course prefix
          setNewUnit(prev => ({
            ...prev,
            code: `${courseCode}0`
          }));
        }

        // Set available teachers
        setTeachers(data.teachers || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseCode]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newUnit.code.trim(),
          name: newUnit.name.trim(),
          courseCode: courseCode,
          description: newUnit.description.trim() || 'Unit description will be added here.',
          currentWeek: newUnit.currentWeek,
          teacherId: newUnit.teacherId || null // Include teacher assignment
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create unit');
      }

      const result = await response.json();
      showSuccessMessage('Unit created successfully!');
      
      // Emit event to notify other components about unit update
      window.dispatchEvent(new CustomEvent('courseUpdated'));
      
      // Redirect back to manage units after 2 seconds
      setTimeout(() => {
        router.push('/coordinator/manage-units');
      }, 2000);

    } catch (err) {
      alert(`Failed to create unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!newUnit.code.trim()) {
      alert('Unit code is required');
      return false;
    }
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

  // Handle input changes
  const handleInputChange = (field: string, value: string | number) => {
    setNewUnit(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get teacher display name
  const getTeacherDisplayName = (teacher: Teacher): string => {
    return `${teacher.firstName} ${teacher.lastName} (${teacher.email})`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error || 'Course not found'}</p>
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
              Create New Unit
            </h1>
            <p className="text-lg text-gray-600">
              Add a new unit to <strong>{course.name} ({course.code})</strong>
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
            {successMessage}
          </div>
        )}
      </div>

      {/* Unit Creation Form */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
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
                value={newUnit.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className="lms-input w-full"
                placeholder={`e.g., ${courseCode}001, ${courseCode}002`}
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Suggested format: {courseCode}001, {courseCode}002, etc.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Name *
              </label>
              <input
                type="text"
                value={newUnit.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="lms-input w-full"
                placeholder="e.g., Introduction to Programming"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Current Week and Teacher Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Week
              </label>
              <select
                value={newUnit.currentWeek}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Teacher
              </label>
              <select
                value={newUnit.teacherId}
                onChange={(e) => handleInputChange('teacherId', e.target.value)}
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
              <p className="text-xs text-gray-500 mt-1">
                Optional: Assign a teacher to be responsible for this unit
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Description
            </label>
            <textarea
              value={newUnit.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="lms-input w-full"
              rows={4}
              placeholder="Enter a detailed description of this unit..."
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Provide a description for students and coordinators
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
                  Creating Unit...
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

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">
          Creating Units - Guidelines
        </h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• <strong>Unit Code:</strong> Use course prefix + sequential number (e.g., {courseCode}001, {courseCode}002)</li>
          <li>• <strong>Unit Name:</strong> Clear, descriptive title that explains what students will learn</li>
          <li>• <strong>Current Week:</strong> Set to week 1 for new units, or current progress for ongoing units</li>
          <li>• <strong>Teacher Assignment:</strong> Optionally assign a teacher who will be responsible for this unit</li>
          <li>• <strong>Description:</strong> Help students understand what this unit covers and its learning objectives</li>
        </ul>
      </div>
    </div>
  );
}