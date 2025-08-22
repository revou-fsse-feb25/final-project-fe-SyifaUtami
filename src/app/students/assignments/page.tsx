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
      const [openResponse, closedResponse] = await Promise.all([
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

      console.log('Open assignments response:', openResponse);
      console.log('Closed assignments response:', closedResponse);

      const openData = Array.isArray(openResponse) ? openResponse : (openResponse as any)?.data || [];
      const closedData = Array.isArray(closedResponse) ? closedResponse : (closedResponse as any)?.data || [];

      // Combine both arrays
      const combined = [...openData, ...closedData];
      
      console.log('Combined assignments:', combined);
      
      setAllAssignments(combined);
      setFilteredAssignments(combined);

    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'not_submitted', label: 'Not Submitted' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'graded', label: 'Graded' }
      ]
    }
  ];

  const handleSearch = (query: string, filters: Record<string, string>) => {
    let filtered = allAssignments;

    // Apply text search
    if (query.trim()) {
      filtered = filtered.filter(item =>
        item.assignment.title.toLowerCase().includes(query.toLowerCase()) ||
        item.assignment.unitCode.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply filters
    const filterValue = filters.status || 'all';
    if (filterValue !== 'all') {
      filtered = filtered.filter(item => {
        const now = new Date();
        const dueDate = new Date(item.assignment.dueDate);
        const isOverdue = dueDate < now && item.assignment.status === 'OPEN';
        
        switch (filterValue) {
          case 'submitted':
            return item.submission?.submissionStatus === 'SUBMITTED';
          case 'not_submitted':
            return !item.submission || item.submission.submissionStatus === 'UNSUBMITTED' || item.submission.submissionStatus === 'EMPTY';
          case 'overdue':
            return isOverdue && (!item.submission || item.submission.submissionStatus === 'UNSUBMITTED' || item.submission.submissionStatus === 'EMPTY');
          case 'graded':
            return item.submission && item.submission.grade !== null;
          default:
            return true;
        }
      });
    }

    setFilteredAssignments(filtered);
  };

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