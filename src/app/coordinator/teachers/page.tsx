'use client';
import { useState, useEffect, useCallback } from 'react';
import SearchBar from '../../components/searchBar';
import DataTable, { TableColumn } from '../../components/dataTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { Teacher, Unit } from '../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

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
    id: '',
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

        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch teachers and units separately using correct endpoints
        const [teachersResponse, unitsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/teachers`, { headers }),
          fetch(`${API_BASE_URL}/units`, { headers })
        ]);
        
        if (!teachersResponse.ok || !unitsResponse.ok) {
          if (teachersResponse.status === 401 || unitsResponse.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userType');
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error('Failed to fetch data');
        }

        const teachersData = await teachersResponse.json();
        const unitsData = await unitsResponse.json();
        
        console.log('Teachers API response:', teachersData);
        console.log('Units API response:', unitsData);
        
        // Handle different response formats
        const teachers = teachersData.success ? teachersData.data : (teachersData.teachers || teachersData);
        
        // Fix units extraction - API returns {data: [...], total, page, limit}
        let units;
        if (unitsData.data && Array.isArray(unitsData.data)) {
          units = unitsData.data;
        } else if (unitsData.success && Array.isArray(unitsData.data)) {
          units = unitsData.data;
        } else if (unitsData.units && Array.isArray(unitsData.units)) {
          units = unitsData.units;
        } else if (Array.isArray(unitsData)) {
          units = unitsData;
        } else {
          units = [];
        }
        
        // Ensure arrays
        const teachersList = Array.isArray(teachers) ? teachers : [];
        const unitsList = Array.isArray(units) ? units : [];
        
        console.log('Raw teachers:', teachers);
        console.log('Raw units:', units);
        console.log('Processed teachers list:', teachersList.length);
        console.log('Processed units list:', unitsList.length);
        
        const teachersPageData = {
          teachers: teachersList,
          units: unitsList.map(unit => ({ 
            code: unit.code || unit.id, 
            name: unit.name || unit.code || unit.id 
          }))
        };
        
        console.log('Final processed data:', teachersPageData);
        console.log('Units for dropdown:', teachersPageData.units);
        
        setData(teachersPageData);
        setFilteredTeachers(teachersPageData.teachers);
        
      } catch (err) {
        console.error('Fetch error:', err);
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
      if (!newTeacher.id.trim() || !newTeacher.firstName.trim() || !newTeacher.lastName.trim() || !newTeacher.email.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      // Check for duplicate teacher ID
      const existingTeacher = data?.teachers.find(t => t.id === newTeacher.id.trim());
      if (existingTeacher) {
        alert(`Teacher ID "${newTeacher.id.trim()}" already exists. Please use a different ID.`);
        return;
      }

      // Check for duplicate email
      const existingEmail = data?.teachers.find(t => t.email === newTeacher.email.trim());
      if (existingEmail) {
        alert(`Email "${newTeacher.email.trim()}" is already in use. Please use a different email.`);
        return;
      }

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const teacherToAdd = {
        id: newTeacher.id.trim(),
        firstName: newTeacher.firstName.trim(),
        lastName: newTeacher.lastName.trim(),
        email: newTeacher.email.trim(),
        unitsTeached: newTeacher.unitsTeached,
        title: 'Teacher'
      };

      const response = await fetch(`${API_BASE_URL}/teachers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teacherToAdd),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add teacher');
      }

      const result = await response.json();
      const createdTeacher = result.success ? result.data : result;

      // Ensure the created teacher has the expected structure
      const teacherWithUnits: Teacher = {
        id: createdTeacher.id || newTeacher.id.trim(),
        firstName: createdTeacher.firstName || newTeacher.firstName.trim(),
        lastName: createdTeacher.lastName || newTeacher.lastName.trim(),
        email: createdTeacher.email || newTeacher.email.trim(),
        title: createdTeacher.title || 'Teacher',
        accessLevel: createdTeacher.accessLevel || null,
        courseManaged: createdTeacher.courseManaged || [],
        unitsTeached: newTeacher.unitsTeached || []
      };

      // Update local state
      setData(prevData => {
        if (!prevData) return prevData;
        const updatedTeachers = [...prevData.teachers, teacherWithUnits];
        return { ...prevData, teachers: updatedTeachers };
      });
      setFilteredTeachers(prev => [...prev, teacherWithUnits]);
      
      // Reset form and close modal
      setNewTeacher({ id: '', firstName: '', lastName: '', email: '', unitsTeached: [] });
      setShowAddModal(false);
      showSuccessMessage('Teacher added successfully');
      
    } catch (err) {
      console.error('Add teacher error:', err);
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

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/teachers/${teacherToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
      console.error('Delete teacher error:', err);
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
      render: (teacher) => `${teacher.firstName} ${teacher.lastName || ''}`
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
          {(teacher.unitsTeached || []).map((unitCode) => (
            <span
              key={unitCode}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white"
              style={{ border: '1px solid #8D0B41', color: '#8D0B41' }}
              title={getUnitName(unitCode)}
            >
              {unitCode}
            </span>
          ))}
          {(!teacher.unitsTeached || teacher.unitsTeached.length === 0) && (
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
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
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
                  Teacher ID *
                </label>
                <input
                  type="text"
                  value={newTeacher.id}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, id: e.target.value }))}
                  className="lms-input w-full"
                  placeholder="e.g., t001"
                  disabled={isSubmitting}
                />
              </div>
              
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
                {data?.units && data.units.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                    {data.units.map((unit) => (
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
                ) : (
                  <div className="text-sm text-gray-500 p-2 border rounded">
                    {isLoading ? 'Loading units...' : 'No units available'}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Select which units this teacher will teach
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTeacher({ id: '', firstName: '', lastName: '', email: '', unitsTeached: [] });
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