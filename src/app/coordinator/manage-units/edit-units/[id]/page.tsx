// src/app/coordinator/manage-units/edit-units/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faEdit, faUser } from '@fortawesome/free-solid-svg-icons';
import { Course, Unit, Teacher } from '../../../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

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

        // Fetch data from Railway API
        const [unitData, coursesData, teachersData] = await Promise.all([
          makeAuthenticatedRequest(`/units/${unitCode}`),
          makeAuthenticatedRequest('/courses'),
          makeAuthenticatedRequest('/teachers')
        ]);

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
        console.error('Failed to fetch data:', err);
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

      // Update unit using Railway API
      const updateData = {
        code: editedUnit.code.trim(),
        name: editedUnit.name.trim(),
        description: editedUnit.description.trim() || null, // Handle empty string as null
        currentWeek: editedUnit.currentWeek,
        courseCode: unit?.courseCode, // Keep the same course
        oldTeacherId: currentTeacher?.id || null,
        newTeacherId: editedUnit.teacherId || null
      };

      const result = await makeAuthenticatedRequest(`/units/${unitCode}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-red)] mx-auto mb-4"></div>
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
              <p className="text-sm text-[var(--primary-red)] mt-1">
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
            {successMessage}
          </div>
        )}
      </div>

      {/* Unit Edit Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
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
          </div>

          {/* Description and Current Week */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={editedUnit.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="lms-input w-full"
                rows={3}
                placeholder="Enter unit description..."
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
                value={editedUnit.currentWeek}
                onChange={(e) => handleInputChange('currentWeek', parseInt(e.target.value))}
                className="lms-input w-full"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Current progress week (1-12)
              </p>
            </div>
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