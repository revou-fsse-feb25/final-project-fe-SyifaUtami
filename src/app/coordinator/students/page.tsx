'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { TableColumn } from '../../components/dataTable';
import SearchBar from '../../components/searchBar';
import StatCard from '../../components/statCard';
import { FilterOption } from '../../../types';

import { Student, StudentWithGrade, Course, FilterOption, ApiResponse, PaginatedResponse } from '../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function CoordinatorStudentsPage() {
  const [students, setStudents] = useState<StudentWithGrade[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<Record<string, string>>({});
  const [sortOrder, setSortOrder] = useState<'name' | 'highest' | 'lowest'>('name');
  const [stats, setStats] = useState({ total: 0, coursesCount: 0, avgGrade: 0 });
  
  const router = useRouter();

  // Fetch data from Railway backend
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [studentsResponse, coursesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/students/with-grades`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/courses`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
      ]);

      if (!studentsResponse.ok || !coursesResponse.ok) {
        if (studentsResponse.status === 401 || coursesResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to fetch data');
      }

      const studentsData = await studentsResponse.json();
      const coursesData = await coursesResponse.json();

      // Handle different response formats
      const studentsList = studentsData.success ? studentsData.data : (studentsData.students || studentsData);
      const coursesList = coursesData.success ? coursesData.data : (coursesData.courses || coursesData);

      setStudents(studentsList || []);
      setCourses(coursesList || []);

      // Calculate stats
      const totalStudents = studentsList?.length || 0;
      const uniqueCourses = [...new Set((studentsList || []).map((s: Student) => s.courseCode))].length;
      const avgGrade = studentsList?.length > 0 
        ? Math.round(studentsList.reduce((sum: number, s: StudentWithGrade) => sum + (s.averageGrade || 0), 0) / studentsList.length)
        : 0;

      setStats({ total: totalStudents, coursesCount: uniqueCourses, avgGrade });

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get course name helper
  const getCourseName = useCallback((courseCode: string) => {
    const course = courses.find(c => c.code === courseCode);
    return course ? course.name : courseCode;
  }, [courses]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let filtered = students.filter(student => {
      // Text search
      const searchTerms = searchQuery.toLowerCase().split(' ');
      const searchableText = `${student.firstName} ${student.lastName} ${student.id} ${student.email}`.toLowerCase();
      const matchesSearch = searchTerms.every(term => searchableText.includes(term));

      // Filters
      const matchesFilters = Object.entries(searchFilters).every(([key, value]) => {
        if (!value || value === 'all') return true;
        
        switch (key) {
          case 'course':
            return student.courseCode === value;
          case 'year':
            return student.year.toString() === value;
          case 'performance':
            if (value === 'high') return student.averageGrade >= 80;
            if (value === 'medium') return student.averageGrade >= 60 && student.averageGrade < 80;
            if (value === 'low') return student.averageGrade < 60;
            return true;
          default:
            return true;
        }
      });

      return matchesSearch && matchesFilters;
    });

    // Sort students
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'highest':
          return b.averageGrade - a.averageGrade;
        case 'lowest':
          return a.averageGrade - b.averageGrade;
        case 'name':
        default:
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
    });

    return filtered;
  }, [students, searchQuery, searchFilters, sortOrder]);

  // Handle search
  const handleSearch = useCallback((query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setSearchFilters(filters);
  }, []);

  // Filter options for SearchBar
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'course',
      label: 'Course',
      options: [
        { value: 'all', label: 'All Courses' },
        ...courses.map(course => ({ value: course.code, label: `${course.name} (${course.code})` }))
      ]
    },
    {
      key: 'year',
      label: 'Year',
      options: [
        { value: 'all', label: 'All Years' },
        { value: '1', label: 'Year 1' },
        { value: '2', label: 'Year 2' },
        { value: '3', label: 'Year 3' },
        { value: '4', label: 'Year 4' }
      ]
    },
    {
      key: 'performance',
      label: 'Performance',
      options: [
        { value: 'all', label: 'All Performance' },
        { value: 'high', label: 'High (≥80%)' },
        { value: 'medium', label: 'Medium (60-79%)' },
        { value: 'low', label: 'Low (<60%)' }
      ]
    }
  ], [courses]);

  // Student table columns
  const studentColumns: TableColumn<StudentWithGrade>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Student Name',
      render: (student) => (
        <div>
          <div className="font-medium">{student.firstName} {student.lastName}</div>
          <div className="text-sm text-gray-600">{student.id}</div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (student) => (
        <div className="text-sm">{student.email}</div>
      )
    },
    {
      key: 'course',
      label: 'Course',
      render: (student) => (
        <div>
          <div className="font-medium">{getCourseName(student.courseCode)}</div>
          <div className="text-sm text-gray-600">Year {student.year}</div>
        </div>
      )
    },
    {
      key: 'grade',
      label: 'Average Grade',
      render: (student) => (
        <div className="text-center">
          <div className={`text-lg font-bold ${
            student.averageGrade >= 80 ? 'text-green-600' : 
            student.averageGrade >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {student.averageGrade ? `${student.averageGrade}%` : 'No grades'}
          </div>
        </div>
      )
    },
    {
      key: 'submissions',
      label: 'Submissions',
      render: (student) => (
        <div className="text-center">
          <div className="text-sm font-medium">
            {student.submittedCount || 0}/{student.totalSubmissions || 0}
          </div>
          <span className="text-xs text-gray-500">
            {student.totalSubmissions > 0 
              ? Math.round(((student.submittedCount || 0) / student.totalSubmissions) * 100)
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
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <button onClick={fetchData} className="lms-button-primary">
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
          Students
        </h1>
        <p className="text-lg text-gray-600">
          Search and manage student information
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={stats.total}
          icon="users"
          isLoading={isLoading}
          subtitle={!isLoading ? `${stats.coursesCount} courses` : undefined}
        />
        <StatCard
          title="Active Courses"
          value={stats.coursesCount}
          icon="courses"
          isLoading={isLoading}
          subtitle="Available programs"
        />
        <StatCard
          title="Average Grade"
          value={stats.avgGrade ? `${stats.avgGrade}%` : '0%'}
          icon="grade"
          isLoading={isLoading}
          subtitle="Overall performance"
        />
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
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="name">Name</option>
            <option value="highest">Highest Grade</option>
            <option value="lowest">Lowest Grade</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <DataTable
        data={filteredStudents}
        columns={studentColumns}
        isLoading={isLoading}
        emptyMessage="No students found. Try adjusting your search or filters."
        onRowClick={(student) => router.push(`/coordinator/students/${student.id}`)}
        loadingRows={6}
      />
    </div>
  );
}