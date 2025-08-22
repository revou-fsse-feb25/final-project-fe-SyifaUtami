'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/authContext';
import { apiClient } from '@/src/lib/api';
import { Assignment, StudentSubmission, AssignmentWithSubmission, FilterOption } from '../../../types';
import SearchBar from '../../components/searchBar';
import AssignmentList from '../../components/assignmentList';

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const [allAssignments, setAllAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    if (!user) {
      setError('No user logged in');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching assignments for student:', user.id);

      // Use backend API to get assignments with submissions included
      const [openData, closedData] = await Promise.all([
        apiClient.getAssignments({
          status: 'open',
          studentId: user.id,
          includeSubmissions: true
        }),
        apiClient.getAssignments({
          status: 'closed',
          studentId: user.id,
          includeSubmissions: true
        })
      ]);

      console.log('Open assignments data:', openData);
      console.log('Closed assignments data:', closedData);

      // Backend returns assignments with submissions already combined
      const combined = [...(openData || []), ...(closedData || [])];
      setAllAssignments(combined);
      setFilteredAssignments(combined);

    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

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
        { value: 'OPEN', label: 'Open' },
        { value: 'CLOSED', label: 'Closed' }
      ]
    },
    {
      key: 'submissionStatus',
      label: 'Submission Status',
      options: [
        { value: 'SUBMITTED', label: 'Submitted' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'EMPTY', label: 'Not Started' },
        { value: 'UNSUBMITTED', label: 'Not Submitted' }
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
        item.assignment.title.toLowerCase().includes(searchLower) ||
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
      .filter(item => item.assignment.status === 'OPEN')
      .sort((a, b) => new Date(a.assignment.dueDate).getTime() - new Date(b.assignment.dueDate).getTime());
  }, [filteredAssignments]);

  const pastAssignments = useMemo(() => {
    return filteredAssignments
      .filter(item => item.assignment.status === 'CLOSED')
      .sort((a, b) => new Date(b.assignment.dueDate).getTime() - new Date(a.assignment.dueDate).getTime());
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
            onClick={fetchAssignments}
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

      {/* Search and Filter */}
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search assignments by name or unit..."
          filters={filterOptions}
          showFilters={true}
        />
      </div>

      {/* Assignment Lists */}
      <div className="space-y-12">
        {/* Upcoming Assignments */}
        <section>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-black)' }}>
            Upcoming Assignments ({upcomingAssignments.length})
          </h2>
          {upcomingAssignments.length > 0 ? (
            <AssignmentList 
              assignments={upcomingAssignments} 
              userType="student" 
            />
          ) : (
            <div className="lms-card text-center py-12">
              <p className="text-lg text-gray-600">No upcoming assignments found.</p>
            </div>
          )}
        </section>

        {/* Past Assignments */}
        <section>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-black)' }}>
            Past Assignments ({pastAssignments.length})
          </h2>
          {pastAssignments.length > 0 ? (
            <AssignmentList 
              assignments={pastAssignments} 
              userType="student" 
            />
          ) : (
            <div className="lms-card text-center py-12">
              <p className="text-lg text-gray-600">No past assignments found.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}