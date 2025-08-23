'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import DataTable, { TableColumn } from '../../components/dataTable';
import SearchBar from '../../components/searchBar';
import StatCard from '../../components/statCard';

import { Teacher, ApiResponse, PaginatedResponse } from '../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function CoordinatorTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [stats, setStats] = useState({ total: 0, avgUnitsPerTeacher: 0, activeTeachers: 0 });
  
  const router = useRouter();

  // Fetch teachers data from Railway backend
  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/teachers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeUser('userType');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to fetch teachers: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      const teachersList = data.success ? data.data : (data.teachers || data);
      setTeachers(teachersList || []);

      // Calculate stats
      const totalTeachers = teachersList?.length || 0;
      const activeTeachers = teachersList?.filter((t: Teacher) => t.unitsTeached?.length > 0).length || 0;
      const totalUnits = teachersList?.reduce((sum: number, t: Teacher) => sum + (t.unitsTeached?.length || 0), 0) || 0;
      const avgUnitsPerTeacher = totalTeachers > 0 ? Math.round((totalUnits / totalTeachers) * 10) / 10 : 0;

      setStats({ 
        total: totalTeachers, 
        avgUnitsPerTeacher, 
        activeTeachers 
      });

    } catch (err) {
      console.error('Teachers fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Delete teacher
  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!window.confirm(`Are you sure you want to remove ${teacher.firstName} ${teacher.lastName || ''}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/teachers/${teacher.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete teacher');
      }

      // Remove from local state
      setTeachers(prev => prev.filter(t => t.id !== teacher.id));
      showSuccessMessage('Teacher removed successfully');
      
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Failed to remove teacher: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Filter teachers based on search
  const filteredTeachers = useMemo(() => {
    if (!searchQuery) return teachers;
    
    const query = searchQuery.toLowerCase();
    return teachers.filter(teacher => {
      const searchableText = `${teacher.firstName} ${teacher.lastName || ''} ${teacher.email || ''} ${teacher.unitsTeached?.join(' ') || ''}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [teachers, searchQuery]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Teacher table columns
  const teacherColumns: TableColumn<Teacher>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      render: (teacher) => (
        <div>
          <div className="font-medium">
            {teacher.firstName} {teacher.lastName || ''}
          </div>
          {teacher.title && (
            <div className="text-sm text-gray-600">{teacher.title}</div>
          )}
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (teacher) => (
        <div className="text-sm">{teacher.email || 'No email'}</div>
      )
    },
    {
      key: 'accessLevel',
      label: 'Access Level',
      render: (teacher) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {teacher.accessLevel || 'Standard'}
        </span>
      )
    },
    {
      key: 'units',
      label: 'Units Teaching',
      render: (teacher) => (
        <div>
          <div className="text-sm font-medium">
            {teacher.unitsTeached?.length || 0} units
          </div>
          {teacher.unitsTeached && teacher.unitsTeached.length > 0 && (
            <div className="text-xs text-gray-600">
              {teacher.unitsTeached.slice(0, 3).join(', ')}
              {teacher.unitsTeached.length > 3 && ` +${teacher.unitsTeached.length - 3} more`}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'courses',
      label: 'Courses Managed',
      render: (teacher) => (
        <div>
          <div className="text-sm font-medium">
            {teacher.courseManaged?.length || 0} courses
          </div>
          {teacher.courseManaged && teacher.courseManaged.length > 0 && (
            <div className="text-xs text-gray-600">
              {teacher.courseManaged.join(', ')}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (teacher) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to edit teacher page (you can implement this)
              console.log('Edit teacher:', teacher.id);
            }}
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
          >
            <FontAwesomeIcon icon={faEdit} className="mr-1" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTeacher(teacher);
            }}
            className="text-red-600 hover:text-red-800 hover:underline text-sm"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-1" />
            Remove
          </button>
        </div>
      )
    }
  ], []);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <button onClick={fetchTeachers} className="lms-button-primary">
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
            onClick={() => {
              // Navigate to add teacher page (you can implement this)
              console.log('Add new teacher');
            }}
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Teachers"
          value={stats.total}
          icon="teachers"
          isLoading={isLoading}
          subtitle="All teaching staff"
        />
        <StatCard
          title="Active Teachers"
          value={stats.activeTeachers}
          icon="users"
          isLoading={isLoading}
          subtitle="Currently teaching units"
        />
        <StatCard
          title="Avg Units per Teacher"
          value={stats.avgUnitsPerTeacher}
          icon="units"
          isLoading={isLoading}
          subtitle="Average workload"
        />
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
          Showing {filteredTeachers.length} of {teachers.length} teachers
        </div>
      </div>

      {/* Teachers Table */}
      <DataTable
        data={filteredTeachers}
        columns={teacherColumns}
        isLoading={isLoading}
        emptyMessage="No teachers found. Add a teacher to get started."
        loadingRows={5}
      />
    </div>
  );
}