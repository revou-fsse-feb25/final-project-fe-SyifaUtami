'use client';
import { useState, useEffect, useCallback } from 'react';
import SearchBar from '../../components/searchBar';
import DataTable, { TableColumn } from '../../components/dataTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { Teacher } from '../../../types';

interface TeachersPageData {
  teachers: Teacher[];
  units: Array<{ code: string; name: string }>;
}

export default function TeachersPage() {
  const [data, setData] = useState<TeachersPageData | null>(null);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  
  // Form states
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    unitsTeached: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Fetch teachers and units data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/academic-data');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const academicData = await response.json();
        
        const teachersData = {
          teachers: academicData.teachers || [],
          units: academicData.units || []
        };
        
        setData(teachersData);
        setFilteredTeachers(teachersData.teachers);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teachers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string, filters: Record<string, string>) => {
    if (!data) return;

    let filtered = [...data.teachers];

    // Text search (name, email, units)
    if (query && query.trim()) {
      const searchLower = query.toLowerCase().trim();
      filtered = filtered.filter(teacher => {
        const firstName = (teacher.firstName || '').toString().toLowerCase();
        const lastName = (teacher.lastName || '').toString().toLowerCase();
        const email = (teacher.email || '').toString().toLowerCase();
        const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.toLowerCase().trim();
        const units = teacher.unitsTeached.join(' ').toLowerCase();
        
        return firstName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               email.includes(searchLower) ||
               fullName.includes(searchLower) ||
               units.includes(searchLower);
      });
    }

    setFilteredTeachers(filtered);
  }, [data]);

  // Handle add teacher
  const handleAddTeacher = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate form
      if (!newTeacher.firstName.trim() || !newTeacher.lastName.trim() || !newTeacher.email.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      // Generate ID (simple implementation - in production, use proper UUID)
      const newId = `t${String(Date.now()).slice(-3)}`;
      
      const teacherToAdd = {
        id: newId,
        firstName: newTeacher.firstName.trim(),
        lastName: newTeacher.lastName.trim(),
        email: newTeacher.email.trim(),
        unitsTeached: newTeacher.unitsTeached
      };

      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherToAdd),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add teacher');
      }

      // Update local state
      setData(prevData => {
        if (!prevData) return prevData;
        const updatedTeachers = [...prevData.teachers, teacherToAdd];
        return { ...prevData, teachers: updatedTeachers };
      });
      setFilteredTeachers(prev => [...prev, teacherToAdd]);
      
      // Reset form and close modal
      setNewTeacher({ firstName: '', lastName: '', email: '', unitsTeached: [] });
      setShowAddModal(false);
      showSuccessMessage('Teacher added successfully');
      
    } catch (err) {
      alert(`Failed to add teacher: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete teacher
  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/teachers/${teacherToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete teacher');
      }

      // Update local state
      setData(prevData => {
        if (!prevData) return prevData;
        const updatedTeachers = prevData.teachers.filter(t => t.id !== teacherToDelete.id);
        return { ...prevData, teachers: updatedTeachers };
      });
      setFilteredTeachers(prev => prev.filter(t => t.id !== teacherToDelete.id));
      
      setShowDeleteModal(false);
      setTeacherToDelete(null);
      showSuccessMessage('Teacher removed successfully');
      
    } catch (err) {
      alert(`Failed to delete teacher: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle unit selection for new teacher
  const handleUnitToggle = (unitCode: string) => {
    setNewTeacher(prev => ({
      ...prev,
      unitsTeached: prev.unitsTeached.includes(unitCode)
        ? prev.unitsTeached.filter(u => u !== unitCode)
        : [...prev.unitsTeached, unitCode]
    }));
  };

  // Get unit name from code
  const getUnitName = (unitCode: string): string => {
    const unit = data?.units.find(u => u.code === unitCode);
    return unit ? unit.name : unitCode;
  };

  // Define table columns
  const teacherColumns: TableColumn<Teacher>[] = [
    {
      key: 'id',
      label: 'Teacher ID',
      className: 'font-medium'
    },
    {
      key: 'firstName',
      label: 'Name',
      render: (teacher) => `${teacher.firstName} ${teacher.lastName}`
    },
    {
      key: 'email',
      label: 'Email',
      className: 'text-gray-600'
    },
    {
      key: 'unitsTeached',
      label: 'Units Taught',
      render: (teacher) => (
        <div className="flex flex-wrap gap-1">
          {teacher.unitsTeached.map((unitCode) => (
            <span
              key={unitCode}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white"
              style={{ border: '1px solid #8D0B41', color: '#8D0B41' }}
              title={getUnitName(unitCode)}
            >
              {unitCode}
            </span>
          ))}
          {teacher.unitsTeached.length === 0 && (
            <span className="text-gray-500 text-sm">No units assigned</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (teacher) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setTeacherToDelete(teacher);
            setShowDeleteModal(true);
          }}
          className="text-red-600 hover:text-red-800 hover:underline"
        >
          <FontAwesomeIcon icon={faTrash} className="mr-1" />
          Remove
        </button>
      )
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
          <p className="text-lg text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
              Teachers Management
            </h1>
            <p className="text-lg text-gray-600">
              Manage teaching staff and their unit assignments
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="lms-button-primary"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Teacher
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            ✅ {successMessage}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <SearchBar
        placeholder="Search by name, email, or units taught..."
        onSearch={handleSearch}
        showFilters={false}
        className="mb-8"
      />

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          Showing {filteredTeachers.length} of {data?.teachers.length || 0} teachers
        </div>
      </div>

      {/* Teachers Table */}
      <DataTable
        data={filteredTeachers}
        columns={teacherColumns}
        isLoading={isLoading}
        emptyMessage="No teachers found. Add a teacher to get started."
        loadingRows={6}
      />

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Teacher</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={newTeacher.firstName}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, firstName: e.target.value }))}
                  className="lms-input w-full"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={newTeacher.lastName}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, lastName: e.target.value }))}
                  className="lms-input w-full"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
                  className="lms-input w-full"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units to Teach
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {data?.units.map((unit) => (
                    <label key={unit.code} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTeacher.unitsTeached.includes(unit.code)}
                        onChange={() => handleUnitToggle(unit.code)}
                        className="mr-2"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm">{unit.code} - {unit.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTeacher({ firstName: '', lastName: '', email: '', unitsTeached: [] });
                }}
                className="lms-button-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeacher}
                className="lms-button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && teacherToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirm Removal</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove <strong>{teacherToDelete.firstName} {teacherToDelete.lastName}</strong>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTeacherToDelete(null);
                }}
                className="lms-button-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeacher}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Removing...' : 'Remove Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}