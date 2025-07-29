'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '../../components/searchBar';
import DataTable, { TableColumn } from '../../components/dataTable';
import StudentGrade from '../../components/studentGrade';
import { Student, StudentSubmission, StudentWithGrade, Course } from '../../../types';

export default function StudentSearchPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentWithGrade[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithGrade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'highest' | 'lowest' | 'name'>('name');

  // Memoized function to get course name from course code
  const getCourseName = useCallback((courseCode: string): string => {
    const course = courses.find(c => c.code === courseCode);
    return course ? course.name : courseCode;
  }, [courses]);

  // Memoized filter options generation
  const filterOptions = useMemo(() => {
    if (students.length === 0 || courses.length === 0) return [];
    
    // Get unique courses from students and match with course data
    const uniqueCourseCodes = [...new Set(students.map(s => s.courseCode))].sort();
    const courseOptions = uniqueCourseCodes.map(code => ({
      value: code,
      label: getCourseName(code)
    }));

    // Get unique years
    const uniqueYears = [...new Set(students.map(s => s.year))].sort((a, b) => b - a);
    const yearOptions = uniqueYears.map(year => ({
      value: year.toString(),
      label: year.toString()
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

  // Calculate average grades for each student
  const calculateStudentGrades = useCallback((students: Student[], submissions: StudentSubmission[]): StudentWithGrade[] => {
    return students.map(student => {
      const studentSubmissions = submissions.filter(sub => sub.studentId === student.id);
      const gradedSubmissions = studentSubmissions.filter(sub => sub.grade !== null && sub.grade !== undefined);
      
      const averageGrade = gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) / gradedSubmissions.length)
        : 0;

      const submittedCount = studentSubmissions.filter(sub => sub.submissionStatus === 'submitted').length;

      return {
        ...student,
        averageGrade,
        totalSubmissions: studentSubmissions.length,
        submittedCount
      };
    });
  }, []);

  // Fetch all students with grade data - Fixed useEffect with proper dependencies
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch students data and academic data in parallel
        const [studentsResponse, academicResponse] = await Promise.all([
          fetch('/api/students?includeData=true'),
          fetch('/api/academic-data')
        ]);

        if (!studentsResponse.ok || !academicResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const studentsData = await studentsResponse.json();
        const academicData = await academicResponse.json();
        
        // Calculate students with grades
        const studentsWithGrades = calculateStudentGrades(
          studentsData.students || [], 
          studentsData.assignments || []
        );
        
        // Update all state in a single batch to avoid multiple re-renders
        setCourses(academicData.courses || []);
        setStudents(studentsWithGrades);
        setFilteredStudents(studentsWithGrades);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [calculateStudentGrades]); // Added proper dependency

  // Memoized search handler
  const handleSearch = useCallback((query: string, filters: Record<string, string>) => {
    // Safety check - ensure we have valid data
    if (!students || students.length === 0) {
      setFilteredStudents([]);
      return;
    }

    let filtered = [...students];

    // Text search (name, ID, email) - with comprehensive null/undefined checks
    if (query && query.trim()) {
      const searchLower = query.toLowerCase().trim();
      filtered = filtered.filter(student => {
        // Safety checks for all student properties
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
      filtered = filtered.filter(student => student.year.toString() === filters.year);
    }

    // Sort
    const sortBy = filters.sort || sortOrder;
    setSortOrder(sortBy as 'highest' | 'lowest' | 'name');

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'highest':
          return b.averageGrade - a.averageGrade;
        case 'lowest':
          return a.averageGrade - b.averageGrade;
        case 'name':
        default:
          const fullNameA = `${a.firstName || ''} ${a.lastName || ''}`;
          const fullNameB = `${b.firstName || ''} ${b.lastName || ''}`;
          return fullNameA.localeCompare(fullNameB);
      }
    });

    setFilteredStudents(filtered);
  }, [students, sortOrder]);

  // Memoized table columns
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
          {student.courseCode}
        </span>
      )
    },
    {
      key: 'year',
      label: 'Year'
    },
    {
      key: 'averageGrade',
      label: 'Average Grade',
      render: (student) => (
        <StudentGrade 
          grade={student.averageGrade} 
          showPercentage={true}
          showNoGradesText={true}
          size="md"
        />
      )
    },
    {
      key: 'submittedCount',
      label: 'Submissions',
      render: (student) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {student.submittedCount}/{student.totalSubmissions}
          </span>
          <span className="text-xs text-gray-500">
            {student.totalSubmissions > 0
              ? Math.round((student.submittedCount / student.totalSubmissions) * 100)
              : 0}% completed
          </span>
        </div>
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
  ], [getCourseName, router]);

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