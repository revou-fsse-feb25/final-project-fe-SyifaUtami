'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/authContext';
import { Assignment, StudentSubmission } from '../../../types';
import SearchBar from '../../components/searchBar';
import AssignmentList from '../../components/assignmentList';


interface AssignmentWithSubmission {
  assignment: Assignment;
  submission?: StudentSubmission;
}

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const [allAssignments, setAllAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [studentUnits, setStudentUnits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all student's assignments
  useEffect(() => {
    const fetchStudentAssignments = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // First, get student's enrolled units from their course
        const academicResponse = await fetch('/api/academic-data');
        if (!academicResponse.ok) throw new Error('Failed to fetch academic data');
        
        const academicData = await academicResponse.json();
        
        // Find student's course and get their units
        const studentCourse = academicData.courses.find((course: any) => 
          course.code === user.courseCode
        );
        
        if (!studentCourse) {
          throw new Error('Student course not found');
        }
        
        const studentUnits = studentCourse.units; // Array of unit codes
        setStudentUnits(studentUnits);
        
        // Then fetch assignments for those units only
        const unitCodesParam = studentUnits.join(',');
        const response = await fetch(
          `/api/assignments?unitCode=${unitCodesParam}&studentId=${user.id}&includeSubmissions=true`
        );
        
        if (!response.ok) throw new Error('Failed to fetch assignments');
        
        const data = await response.json();
        
        // Combine assignments with their submissions
        const combined: AssignmentWithSubmission[] = data.assignments.map((assignment: Assignment) => {
          const submission = data.submissions?.find(
            (sub: StudentSubmission) => sub.assignmentId === assignment.id
          );
          
          return { assignment, submission };
        });

        setAllAssignments(combined);
        setFilteredAssignments(combined);

      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentAssignments();
  }, [user]);

  // Create filter options
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'unitCode',
      label: 'Unit',
      options: studentUnits.map(unit => ({ value: unit, label: unit }))
    }
  ], [studentUnits]);

  // Handle search
  const handleSearch = (query: string, filters: Record<string, string>) => {
    let filtered = [...allAssignments];

    // Apply text search filter
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(item =>
        item.assignment.name.toLowerCase().includes(searchLower) ||
        item.assignment.unitCode.toLowerCase().includes(searchLower)
      );
    }

    // Apply unit filter
    if (filters.unitCode) {
      filtered = filtered.filter(item => item.assignment.unitCode === filters.unitCode);
    }

    setFilteredAssignments(filtered);
  };

  // Split and sort assignments
  const upcomingAssignments = useMemo(() => {
    return filteredAssignments
      .filter(item => item.assignment.status === 'open')
      .sort((a, b) => new Date(a.assignment.deadline).getTime() - new Date(b.assignment.deadline).getTime());
  }, [filteredAssignments]);

  const pastAssignments = useMemo(() => {
    return filteredAssignments
      .filter(item => item.assignment.status === 'closed')
      .sort((a, b) => new Date(b.assignment.deadline).getTime() - new Date(a.assignment.deadline).getTime());
  }, [filteredAssignments]);

  // Handle assignment click
  const handleAssignmentClick = (item: AssignmentWithSubmission) => {
    if (item.assignment.status === 'closed' && item.submission) {
      // Navigate to submission view for closed assignments
      window.location.href = `/assignments/${item.assignment.id}/submission`;
    } else if (item.assignment.status === 'open') {
      // Navigate to assignment page for open assignments
      window.location.href = `/assignments/${item.assignment.id}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
          <p className="text-lg text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Assignments</h1>
        <p className="text-lg text-gray-600">
          Welcome back, {user?.firstName}! Here are your assignments across all units.
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar
        placeholder="Search assignments by name or unit..."
        onSearch={handleSearch}
        showFilters={true}
        filters={filterOptions}
        className="mb-8"
      />

      {/* Assignment Lists */}
      <div className="space-y-8">
        {/* Upcoming Assignments */}
        <AssignmentList
          title="Upcoming Assignments"
          assignments={upcomingAssignments}
          emptyMessage="No upcoming assignments found."
          onAssignmentClick={handleAssignmentClick}
          showUnit={true}
        />

        {/* Past Assignments */}
        <AssignmentList
          title="Past Assignments"
          assignments={pastAssignments}
          emptyMessage="No past assignments found."
          onAssignmentClick={handleAssignmentClick}
          showUnit={true}
        />
      </div>
    </div>
  );
}