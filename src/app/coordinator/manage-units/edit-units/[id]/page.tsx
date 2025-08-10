'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Unit, Teacher, Course } from '../../../../../types';
import CourseUnitModals from '../../../../components/courseUnitModals';

type ModalType = 'editUnit' | 'deleteUnit' | null;

export default function EditUnitPage() {
  const router = useRouter();
  const params = useParams();
  const unitId = params.id as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignedTeacher, setAssignedTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [modalType, setModalType] = useState<ModalType>(null);

  // Helper function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Fetch unit data and related information
  useEffect(() => {
    const fetchData = async () => {
      if (!unitId) {
        setError('No unit specified');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching data for unit:', unitId);
        
        const response = await fetch('/api/academic-data');
        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        
        // Find the unit by ID (using code as ID)
        const foundUnit = data.units.find((u: Unit) => u.code === unitId);
        if (!foundUnit) {
          setError('Unit not found');
          setIsLoading(false);
          return;
        }

        // Find the course
        const foundCourse = data.courses.find((c: Course) => c.code === foundUnit.courseCode);
        
        // Set unit and course data
        setUnit(foundUnit);
        setCourse(foundCourse || null);
        setTeachers(data.teachers || []);

        // Find assigned teacher
        const unitTeacher = data.teachers.find((t: Teacher) => 
          t.unitsTeached && t.unitsTeached.includes(foundUnit.code)
        );
        
        setAssignedTeacher(unitTeacher || null);

      } catch (err) {
        console.error('Error fetching unit data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load unit data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [unitId]);

  // Handle unit updated
  const handleUnitUpdated = (updatedUnit: Unit) => {
    setUnit(updatedUnit);
    
    // Update assigned teacher if changed
    const newTeacher = teachers.find(t => t.unitsTeached?.includes(updatedUnit.code));
    setAssignedTeacher(newTeacher || null);

    // If unit code changed, redirect to new URL
    if (updatedUnit.code !== unitId) {
      setTimeout(() => {
        router.push(`/coordinator/manage-units/edit-units/${updatedUnit.code}`);
      }, 1500);
    }
  };

  // Handle unit deleted
  const handleUnitDeleted = () => {
    // Redirect back to manage units after a short delay
    setTimeout(() => {
      router.push('/coordinator/manage-units');
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error || !unit) {
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
              Unit Management
            </h1>
            <p className="text-lg text-gray-600">
              Managing <strong>{unit.name} ({unit.code})</strong> in {course?.name || 'Unknown Course'}
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

      {/* Unit Information Card */}
      <div className="lms-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-black)' }}>
            Unit Information
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={() => setModalType('editUnit')}
              className="lms-button-primary"
            >
              <FontAwesomeIcon icon={faEdit} className="mr-2" />
              Edit Unit
            </button>
            <button 
              onClick={() => setModalType('deleteUnit')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
              Delete Unit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Code
            </label>
            <div className="p-3 bg-gray-50 rounded border">
              {unit.code}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Name
            </label>
            <div className="p-3 bg-gray-50 rounded border">
              {unit.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <div className="p-3 bg-gray-50 rounded border">
              {course?.name} ({course?.code})
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Week
            </label>
            <div className="p-3 bg-gray-50 rounded border">
              Week {unit.currentWeek}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <div className="p-3 bg-gray-50 rounded border min-h-[100px]">
              {unit.description || 'No description provided'}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Assignment Card */}
      <div className="lms-card">
        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
          Teacher Assignment
        </h3>
        
        {assignedTeacher ? (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold ">
                  Currently Assigned Teacher
                </h4>
                <p className="text-[var(--primary-red)]">
                  <strong>{assignedTeacher.firstName} {assignedTeacher.lastName}</strong>
                </p>
                <p>
                  {assignedTeacher.email}
                </p>
              </div>
              <div className="text-sm">
                Total Units: {assignedTeacher.unitsTeached?.length || 0}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-yellow-700">
                <h4 className="text-lg font-semibold">
                  No Teacher Assigned
                </h4>
                <p className="text-yellow-600">
                  This unit currently has no teacher assigned. Click "Edit Unit" to assign a teacher.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Unit Modals */}
      <CourseUnitModals
        modalType={modalType}
        onClose={() => setModalType(null)}
        unitToEdit={unit}
        unitToDelete={modalType === 'deleteUnit' ? unit : null}
        teachers={teachers}
        assignedTeacher={assignedTeacher}
        onUnitUpdated={handleUnitUpdated}
        onUnitDeleted={handleUnitDeleted}
        onSuccess={showSuccessMessage}
      />

      {/* Help Section */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-yellow-800">
          Unit Management - Quick Guide
        </h3>
        <ul className="text-sm text-yellow-700 space-y-2">
          <li>• <strong>Edit Unit:</strong> Update unit details, assign teachers, or change the current week</li>
          <li>• <strong>Teacher Assignment:</strong> Each unit can have one assigned teacher who will manage course content</li>
          <li>• <strong>Current Week:</strong> This affects what content students see as "current" in the unit</li>
          <li>• <strong>Unit Code Changes:</strong> Changing the code will update all references including student progress</li>
          <li>• <strong>Delete Unit:</strong> This will remove the unit from all teachers and may affect student progress</li>
        </ul>
      </div>
    </div>
  );
}