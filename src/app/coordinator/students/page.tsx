'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '../../components/searchBar';
import DataTable, { TableColumn } from '../../components/dataTable';
import StudentGrade from '../../components/studentGrade';
import { Student, StudentWithGrade, Course, FilterOption } from '../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function CoordinatorStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentWithGrade[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithGrade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'highest' | 'lowest' | 'name'>('name');

  // Memoized function to get course name from course code
  const getCourseName = useCallback((courseCode: string | null): string => {
    if (!courseCode) return 'No Course';
    const course = courses.find(c => c.code === courseCode);
    return course ? course.name : courseCode;
  }, [courses]);

  // Memoized filter options generation
  const filterOptions = useMemo(() => {
    if (!Array.isArray(students) || students.length === 0) return [];
    
    // Get unique courses from students and match with course data
    const uniqueCourseCodes = [...new Set(students.map(s => s.courseCode).filter(Boolean))].sort();
    const courseOptions = uniqueCourseCodes.map(code => ({
      value: code as string,
      label: getCourseName(code)
    }));

    // Get unique years
    const uniqueYears = [...new Set(students.map(s => s.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));
    const yearOptions = uniqueYears.map(year => ({
      value: year!.toString(),
      label: year!.toString()
    }));

    return [
      {
        key: 'course',
        label: 'Course',
        options: courseOptions
      },
      {
        key: 'year',
        label: 'Year', 
        options: yearOptions
      },
      {
        key: 'sort',
        label: 'Sort by Grade',
        options: [
          { value: 'highest', label: 'Highest Grade First' },
          { value: 'lowest', label: 'Lowest Grade First' },
          { value: 'name', label: 'Name (A-Z)' }
        ]
      }
    ];
  }, [students, courses, getCourseName]);

  // Fetch all students with grade data using Railway API
  useEffect(() => {
    const fetchStudents = async () => {
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

        // Fetch students with grades and courses in parallel
        const [studentsResponse, coursesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/students/with-grades`, { headers }),
          fetch(`${API_BASE_URL}/courses`, { headers })
        ]);

        if (!studentsResponse.ok || !coursesResponse.ok) {
          if (studentsResponse.status === 401 || coursesResponse.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userType');
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error('Failed to fetch data');
        }

        const studentsData = await studentsResponse.json();
        const coursesData = await coursesResponse.json();

        // Handle different response formats with safety checks
        let studentsList;
        if (studentsData.data && Array.isArray(studentsData.data)) {
          studentsList = studentsData.data;
        } else if (studentsData.success && Array.isArray(studentsData.data)) {
          studentsList = studentsData.data;
        } else if (studentsData.students && Array.isArray(studentsData.students)) {
          studentsList = studentsData.students;
        } else if (Array.isArray(studentsData)) {
          studentsList = studentsData;
        } else {
          studentsList = [];
        }

        let coursesList;
        if (Array.isArray(coursesData)) {
          coursesList = coursesData;
        } else if (coursesData.data && Array.isArray(coursesData.data)) {
          coursesList = coursesData.data;
        } else if (coursesData.success && Array.isArray(coursesData.data)) {
          coursesList = coursesData.data;
        } else if (coursesData.courses && Array.isArray(coursesData.courses)) {
          coursesList = coursesData.courses;
        } else {
          coursesList = [];
        }

        // Update all state
        setCourses(coursesList);
        setStudents(studentsList);
        setFilteredStudents(studentsList);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Memoized search handler
  const handleSearch = useCallback((query: string, filters: Record<string, string>) => {
    if (!Array.isArray(students) || students.length === 0) {
      setFilteredStudents([]);
      return;
    }

    let filtered = [...students];

    // Text search
    if (query && query.trim()) {
      const searchLower = query.toLowerCase().trim();
      filtered = filtered.filter(student => {
        if (!student) return false;
        
        const firstName = (student.firstName || '').toString().toLowerCase();
        const lastName = (student.lastName || '').toString().toLowerCase();
        const id = (student.id || '').toString().toLowerCase();
        const email = (student.email || '').toString().toLowerCase();
        const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().trim();
        
        return firstName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               id.includes(searchLower) ||
               email.includes(searchLower) ||
               fullName.includes(searchLower);
      });
    }

    // Course filter
    if (filters.course) {
      filtered = filtered.filter(student => student.courseCode === filters.course);
    }

    // Year filter
    if (filters.year) {
      filtered = filtered.filter(student => student.year?.toString() === filters.year);
    }

    // Sort
    const sortBy = filters.sort || sortOrder;
    setSortOrder(sortBy as 'highest' | 'lowest' | 'name');

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'highest':
          return (b.averageGrade || 0) - (a.averageGrade || 0);
        case 'lowest':
          return (a.averageGrade || 0) - (b.averageGrade || 0);
        case 'name':
        default:
          const fullNameA = `${a.firstName || ''} ${a.lastName || ''}`;
          const fullNameB = `${b.firstName || ''} ${b.lastName || ''}`;
          return fullNameA.localeCompare(fullNameB);
      }
    });

    setFilteredStudents(filtered);
  }, [students, sortOrder]);

  // Memoized table columns - removed submissions column
  const studentColumns: TableColumn<StudentWithGrade>[] = useMemo(() => [
    {
      key: 'id',
      label: 'Student ID',
      className: 'font-medium'
    },
    {
      key: 'firstName',
      label: 'Name',
      render: (student) => `${student.firstName || ''} ${student.lastName || ''}`
    },
    {
      key: 'email',
      label: 'Email',
      className: 'text-gray-600'
    },
    {
      key: 'courseCode',
      label: 'Course',
      render: (student) => (
        <span 
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white"
          style={{ 
            border: '1px solid #8D0B41',
            color: '#8D0B41'
          }}
        >
          {student.courseCode || 'No Course'}
        </span>
      )
    },
    {
      key: 'year',
      label: 'Year',
      render: (student) => student.year || 'N/A'
    },
    {
      key: 'averageGrade',
      label: 'Average Grade',
      render: (student) => (
        <StudentGrade 
          grade={student.averageGrade || 0}
          showPercentage={true}
          showNoGradesText={true}
          size="md"
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (student) => (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/coordinator/students/${student.id}`);
          }}
          className="hover:underline"
          style={{ color: '#8D0B41' }}
        >
          View Details
        </button>
      )
    }
  ], [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error Loading Students</h1>
          <p className="text-lg text-gray-600 mb-6">{error}</p>
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
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
          Student Search
        </h1>
        <p className="text-lg text-gray-600">
          Search and manage student information
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar
        placeholder="Search by name, student ID, or email..."
        onSearch={handleSearch}
        filters={filterOptions}
        showFilters={true}
        className="mb-8"
      />

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          Showing {filteredStudents.length} of {students.length} students
        </div>
        <div className="text-sm text-gray-600">
          Sorted by: {sortOrder === 'highest' ? 'Highest Grade' : sortOrder === 'lowest' ? 'Lowest Grade' : 'Name'}
        </div>
      </div>

      {/* Students Table */}
      <DataTable
        data={filteredStudents}
        columns={studentColumns}
        isLoading={isLoading}
        emptyMessage="Try adjusting your search or filters"
        onRowClick={(student) => router.push(`/coordinator/students/${student.id}`)}
        loadingRows={6}
      />
    </div>
  );
}