'use client';
import { useState, useMemo } from 'react';
import { useAuth } from '../../context/authContext';
import { useStudentAssignment } from '../../context/useStudentAssignment';
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
  const { 
    openAssignments, 
    closedAssignments, 
    isLoading, 
    error, 
    refetch
  } = useStudentAssignment();

  // Combine open and closed assignments
  const allAssignments = useMemo(() => {
    return [...openAssignments, ...closedAssignments];
  }, [openAssignments, closedAssignments]);

  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentWithSubmission[]>([]);

  // Update filtered assignments when allAssignments changes
  useMemo(() => {
    setFilteredAssignments(allAssignments);
  }, [allAssignments]);

  // Get unique unit codes for filter options
  const studentUnits = useMemo(() => {
    const units = Array.from(new Set(allAssignments.map(item => item.assignment.unitCode)));
    return units.sort();
  }, [allAssignments]);

  // Create filter options
  const filterOptions: FilterOption[] = useMemo(() => [
    {
      key: 'unitCode',
      label: 'Unit',
      options: studentUnits.map(unit => ({ value: unit, label: unit }))
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' }
      ]
    },
    {
      key: 'submissionStatus',
      label: 'Submission Status',
      options: [
        { value: 'submitted', label: 'Submitted' },
        { value: 'draft', label: 'Draft' },
        { value: 'empty', label: 'Not Started' },
        { value: 'unsubmitted', label: 'Not Submitted' }
      ]
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

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(item => item.assignment.status === filters.status);
    }

    // Apply submission status filter
    if (filters.submissionStatus) {
      filtered = filtered.filter(item => 
        item.submission?.submissionStatus === filters.submissionStatus
      );
    }

    setFilteredAssignments(filtered);
  };

  // Split and sort assignments from filtered results
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
          <button 
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
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
          showUnit={true}
        />

        {/* Past Assignments */}
        <AssignmentList
          title="Past Assignments"
          assignments={pastAssignments}
          emptyMessage="No past assignments found."
          showUnit={true}
        />
      </div>
    </div>
  );
}