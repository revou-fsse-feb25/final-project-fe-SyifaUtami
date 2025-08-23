// src/app/coordinator/manage-units/new-unit/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faUser } from '@fortawesome/free-solid-svg-icons';
import { Course, Teacher } from '../../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

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
    teacherId: ''
  });

  // Helper function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

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

  // Fetch course information and available teachers
  useEffect(() => {
    const fetchData = async () => {
      if (!courseCode) {
        setError('No course specified');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch data from Railway API
        const [courseData, teachersData] = await Promise.all([
          makeAuthenticatedRequest(`/courses/${courseCode}`),
          makeAuthenticatedRequest('/teachers')
        ]);

        // Handle different response formats
        const foundCourse = courseData.success ? courseData.data : courseData;
        const teachersResult = teachersData.success ? teachersData.data : teachersData;

        if (!foundCourse) {
          setError('Course not found');
        } else {
          setCourse(foundCourse);
          // Pre-fill unit code with course prefix
          setNewUnit(prev => ({
            ...prev,
            code: `${courseCode}001` // Start with 001
          }));
        }

        // Set available teachers
        setTeachers(Array.isArray(teachersResult) ? teachersResult : []);

      } catch (err) {
        console.error('Failed to fetch data:', err);
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

      const unitData = {
        code: newUnit.code.trim(),
        name: newUnit.name.trim(),
        courseCode: courseCode,
        description: newUnit.description.trim() || null, // Handle empty string as null
        currentWeek: newUnit.currentWeek,
        teacherId: newUnit.teacherId || null
      };

      console.log('Creating unit with data:', unitData);

      const result = await makeAuthenticatedRequest('/units', {
        method: 'POST',
        body: JSON.stringify(unitData)
      });

      console.log('Unit created successfully:', result);
      
      showSuccessMessage('Unit created successfully!');
      
      // Emit event to notify other components about unit update
      window.dispatchEvent(new CustomEvent('courseUpdated'));
      
      // Redirect back to manage units after 2 seconds
      setTimeout(() => {
        router.push('/coordinator/manage-units');
      }, 2000);

    } catch (err) {
      console.error('Unit creation error:', err);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-red)] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course information...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="bg-white p-6 rounded-lg shadow-md">
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

          {/* Description and Current Week */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newUnit.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="lms-input w-full"
                rows={3}
                placeholder="Enter a detailed description of this unit..."
                disabled={isSubmitting}
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
                onChange={(e) => handleInputChange('currentWeek', parseInt(e.target.value))}
                className="lms-input w-full"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Set to week 1 for new units (1-12)
              </p>
            </div>
          </div>

          {/* Teacher Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              Assign Teacher (Optional)
            </label>
            <select
              value={newUnit.teacherId}
              onChange={(e) => handleInputChange('teacherId', e.target.value)}
              className="lms-input w-full"
              disabled={isSubmitting}
            >
              <option value="">No teacher assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {getTeacherDisplayName(teacher)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              You can assign a teacher now or later from the unit management page
            </p>
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