'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { TableColumn } from '../../components/dataTable';
import SearchBar from '../../components/searchBar';
import StatCard from '../../components/statCard';
import { 
  Student, 
  StudentWithGrade, 
  Course, 
  FilterOption, 
} from '../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

export default function CoordinatorStudentsPage() {
  const [students, setStudents] = useState<StudentWithGrade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<Record<string, string>>({});
  const [sortOrder, setSortOrder] = useState<'name' | 'highest' | 'lowest'>('name');
  const [stats, setStats] = useState({ total: 0, coursesCount: 0, avgGrade: 0 });
  
  const router = useRouter();

  // Helper function to safely get course name
  const getCourseName = useCallback((courseCode: string | null): string => {
    if (!courseCode) return 'No Course';
    const course = courses.find(c => c.code === courseCode);
    return course ? course.name : courseCode;
  }, [courses]);

  // Fetch data from Railway backend
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
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

      // Handle different response formats
      const studentsList = studentsData.success ? studentsData.data : (studentsData.students || studentsData);
      const coursesList = coursesData.success ? coursesData.data : (coursesData.courses || coursesData);

      setStudents(studentsList || []);
      setCourses(coursesList || []);

      // Calculate stats
      const totalStudents = studentsList?.length || 0;
      const uniqueCourses = [...new Set((studentsList || []).map((s: Student) => s.courseCode).filter(Boolean))].length;
      const gradesArray = (studentsList || [])
        .map((s: StudentWithGrade) => s.averageGrade)
        .filter((grade: number) => grade != null && grade > 0);
      
      const avgGrade = gradesArray.length > 0 
        ? Math.round(gradesArray.reduce((sum: number, grade: number) => sum + grade, 0) / gradesArray.length)
        : 0;

      setStats({
        total: totalStudents,
        coursesCount: uniqueCourses,
        avgGrade
      });

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

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(student => {
        const fullName = `${student.firstName} ${student.lastName || ''}`.toLowerCase();
        const email = (student.email || '').toLowerCase();
        const courseCode = (student.courseCode || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query) || 
               email.includes(query) || 
               courseCode.includes(query);
      });
    }

    // Apply filters
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        switch (key) {
          case 'course':
            filtered = filtered.filter(student => student.courseCode === value);
            break;
          case 'year':
            filtered = filtered.filter(student => student.year?.toString() === value);
            break;
          case 'performance':
            filtered = filtered.filter(student => {
              const grade = student.averageGrade || 0;
              switch (value) {
                case 'excellent': return grade >= 90;
                case 'good': return grade >= 70 && grade < 90;
                case 'average': return grade >= 50 && grade < 70;
                case 'poor': return grade < 50;
                default: return true;
              }
            });
            break;
        }
      }
    });

    // Apply sorting
    switch (sortOrder) {
      case 'highest':
        return filtered.sort((a, b) => (b.averageGrade || 0) - (a.averageGrade || 0));
      case 'lowest':
        return filtered.sort((a, b) => (a.averageGrade || 0) - (b.averageGrade || 0));
      case 'name':
      default:
        return filtered.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName || ''}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName || ''}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
    }
  }, [students, searchQuery, searchFilters, sortOrder]);

  // Filter options for search bar
  const filterOptions: FilterOption[] = [
    {
      key: 'course',
      label: 'Course',
      options: [
        { value: 'all', label: 'All Courses' },
        ...Array.from(new Set(students.map(s => s.courseCode).filter(Boolean)))
          .map(courseCode => ({
            value: courseCode as string,
            label: getCourseName(courseCode as string)
          }))
      ]
    },
    {
      key: 'year',
      label: 'Year',
      options: [
        { value: 'all', label: 'All Years' },
        ...Array.from(new Set(students.map(s => s.year).filter(Boolean)))
          .map(year => ({ value: year!.toString(), label: `Year ${year}` }))
      ]
    },
    {
      key: 'performance',
      label: 'Performance',
      options: [
        { value: 'all', label: 'All Performance' },
        { value: 'excellent', label: 'Excellent (90%+)' },
        { value: 'good', label: 'Good (70-89%)' },
        { value: 'average', label: 'Average (50-69%)' },
        { value: 'poor', label: 'Poor (<50%)' }
      ]
    }
  ];

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setSearchFilters(filters);
  };

  // Table columns
  const columns: TableColumn<StudentWithGrade>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (student: StudentWithGrade) => (
        <div>
          <div className="font-medium" style={{ color: 'var(--text-black)' }}>
            {student.firstName} {student.lastName || ''}
          </div>
          <div className="text-sm text-gray-500">{student.email || 'No email'}</div>
        </div>
      )
    },
    {
      key: 'course',
      label: 'Course',
      render: (student: StudentWithGrade) => (
        <div>
          <div className="font-medium" style={{ color: 'var(--text-black)' }}>
            {getCourseName(student.courseCode)}
          </div>
          <div className="text-sm text-gray-500">
            Year {student.year || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'performance',
      label: 'Performance',
      render: (student: StudentWithGrade) => (
        <div className="text-center">
          <div className={`text-lg font-bold ${
            (student.averageGrade || 0) >= 80 ? 'text-green-600' : 
            (student.averageGrade || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {student.averageGrade ? `${student.averageGrade}%` : 'No grades'}
          </div>
        </div>
      )
    },
    {
      key: 'submissions',
      label: 'Submissions',
      render: (student: StudentWithGrade) => (
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
      render: (student: StudentWithGrade) => (
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
  ];

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
          value={stats.avgGrade ? `${stats.avgGrade}%` : 'N/A'}
          icon="grade"
          isLoading={isLoading}
          subtitle="Overall performance"
        />
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search students by name, email, or course..."
          filters={filterOptions}
          showFilters={true}
        />
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'name' | 'highest' | 'lowest')}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Name (A-Z)</option>
            <option value="highest">Highest Grade</option>
            <option value="lowest">Lowest Grade</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedStudents.length} of {students.length} students
        </div>
      </div>

      {/* Students Table */}
      <DataTable
        data={filteredAndSortedStudents}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No students found matching your search criteria."
        onRowClick={(student: StudentWithGrade) => router.push(`/coordinator/students/${student.id}`)}
      />
    </div>
  );
}