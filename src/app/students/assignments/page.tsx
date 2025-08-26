'use client';
import { useState, useMemo, useEffect } from 'react';
import { authManager, type User } from '@/src/lib/auth';
import { Assignment, StudentSubmission } from '../../../types';
import SearchBar from '../../components/searchBar';
import AssignmentList from '../../components/assignmentList';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

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
  const [user, setUser] = useState<User | null>(null);
  const [allAssignments, setAllAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

  // Simple single API call
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Single API call - just like your original
        console.log('🚀 Fetching assignments for user:', user.id);
        console.log('🔗 API URL:', `${API_BASE_URL}/assignments?studentId=${user.id}&includeSubmissions=true`);
        
        const response = await fetch(
          `${API_BASE_URL}/assignments?studentId=${user.id}&includeSubmissions=true`,
          { headers }
        );

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userType');
            throw new Error('Session expired. Please log in again.');
          }
          
          // Try to get error details
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            console.warn('Could not parse error response');
          }
          
          throw new Error(`Failed to fetch assignments: ${errorMessage}`);
        }

        const result = await response.json();
        console.log('📡 Full API Response:', result);
        console.log('📡 Response type:', typeof result);
        console.log('📡 Response keys:', Object.keys(result || {}));
        
        // Handle response - be more flexible
        let data: any[] = [];
        
        if (result && typeof result === 'object') {
          if (result.success && Array.isArray(result.data)) {
            data = result.data;
            console.log('✅ Using result.data (array of', data.length, 'items)');
          } else if (Array.isArray(result)) {
            data = result;
            console.log('✅ Using direct array (', data.length, 'items)');
          } else if (result.data && Array.isArray(result.data)) {
            data = result.data;
            console.log('✅ Using result.data without success flag (', data.length, 'items)');
          } else if (Array.isArray(result.assignments)) {
            data = result.assignments;
            console.log('✅ Using result.assignments (', data.length, 'items)');
          } else {
            // Check if it's an empty result but valid
            if (result.success === true && (!result.data || result.data.length === 0)) {
              data = [];
              console.log('✅ Empty result - no assignments found');
            } else if (result.success === false) {
              console.log('❌ API returned success: false');
              throw new Error(result.message || result.error || 'API request failed');
            } else {
              console.error('❌ Unknown response format:', result);
              console.error('❌ Available keys:', Object.keys(result));
              throw new Error('Unable to parse API response format');
            }
          }
        } else {
          console.error('❌ Invalid response type:', typeof result);
          throw new Error('Invalid response from API');
        }

        console.log('📊 Processing', data.length, 'assignments');

        // Get submissions array from the response
        const submissions = result.submissions || [];
        console.log('📋 Found', submissions.length, 'submissions');

        // Process assignments and match with submissions
        const processedAssignments: AssignmentWithSubmission[] = data.map((assignmentItem: any) => {
          // Assignment info
          const assignment: Assignment = {
            id: assignmentItem.id,
            name: assignmentItem.name || `Assignment ${assignmentItem.id}`,
            unitCode: assignmentItem.unitCode || 'Unknown Unit',
            deadline: assignmentItem.deadline || '',
            publishedAt: assignmentItem.publishedAt || '',
            status: (assignmentItem.status || 'OPEN').toUpperCase() as 'OPEN' | 'CLOSED',
            createdAt: assignmentItem.createdAt || '',
            updatedAt: assignmentItem.updatedAt || ''
          };

          // Find matching submission
          const matchingSubmission = submissions.find((sub: any) => 
            sub.assignmentId === assignmentItem.id
          );

          // Submission info
          let submission: StudentSubmission | undefined = undefined;
          
          if (matchingSubmission) {
            submission = {
              id: matchingSubmission.id,
              submissionId: matchingSubmission.submissionId,
              studentId: matchingSubmission.studentId,
              assignmentId: matchingSubmission.assignmentId,
              submissionStatus: matchingSubmission.submissionStatus || 'EMPTY',
              submissionName: matchingSubmission.submissionName,
              submittedAt: matchingSubmission.submittedAt,
              grade: matchingSubmission.grade,
              comment: matchingSubmission.comment,
              gradedBy: matchingSubmission.gradedBy,
              gradedAt: matchingSubmission.gradedAt,
              createdAt: matchingSubmission.createdAt || '',
              updatedAt: matchingSubmission.updatedAt || ''
            };
            
            console.log('🔗 Matched assignment', assignment.id, 'with submission', submission.submissionId, '- Status:', submission.submissionStatus);
          } else {
            console.log('📝 No submission found for assignment', assignment.id);
          }

          return { assignment, submission };
        });

        console.log('✅ Processed', processedAssignments.length, 'assignments');
        setAllAssignments(processedAssignments);
        setFilteredAssignments(processedAssignments);

      } catch (err) {
        console.error('💥 Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assignments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  // Update filtered assignments when allAssignments changes
  useMemo(() => {
    setFilteredAssignments(allAssignments);
  }, [allAssignments]);

  // Get unique unit codes for filter options
  const studentUnits = useMemo(() => {
    const units = Array.from(new Set(allAssignments.map(item => item.assignment.unitCode)));
    return units.filter(unit => unit !== 'Unknown Unit').sort();
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

    // Text search
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(item =>
        item.assignment.name.toLowerCase().includes(searchLower) ||
        item.assignment.unitCode.toLowerCase().includes(searchLower)
      );
    }

    // Unit filter
    if (filters.unitCode) {
      filtered = filtered.filter(item => item.assignment.unitCode === filters.unitCode);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(item => item.assignment.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Submission status filter
    if (filters.submissionStatus) {
      filtered = filtered.filter(item => {
        if (!item.submission) {
          return filters.submissionStatus.toLowerCase() === 'empty';
        }
        return item.submission.submissionStatus.toLowerCase() === filters.submissionStatus.toLowerCase();
      });
    }

    setFilteredAssignments(filtered);
  };

  // Split assignments
  const upcomingAssignments = useMemo(() => {
    return filteredAssignments
      .filter(item => item.assignment.status === 'OPEN')
      .sort((a, b) => {
        const dateA = new Date(a.assignment.deadline || '').getTime();
        const dateB = new Date(b.assignment.deadline || '').getTime();
        return dateA - dateB;
      });
  }, [filteredAssignments]);

  const pastAssignments = useMemo(() => {
    return filteredAssignments
      .filter(item => item.assignment.status === 'CLOSED')
      .sort((a, b) => {
        const dateA = new Date(a.assignment.deadline || '').getTime();
        const dateB = new Date(b.assignment.deadline || '').getTime();
        return dateB - dateA;
      });
  }, [filteredAssignments]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
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
        <h1 className="text-4xl font-bold mb-2">My Assignments</h1>
        <p className="text-lg text-gray-600">
          Welcome back, {user?.firstName}! Here are your assignments.
        </p>
        {allAssignments.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            <span>{allAssignments.length} assignments found</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <SearchBar
        placeholder="Search assignments..."
        onSearch={handleSearch}
        showFilters={true}
        filters={filterOptions}
        className="mb-8"
      />

      {/* Assignment Lists */}
      <div className="space-y-8">
        <AssignmentList
          title="Upcoming Assignments"
          assignments={upcomingAssignments}
          emptyMessage="No upcoming assignments found."
          showUnit={true}
          userType="student"
        />

        <AssignmentList
          title="Past Assignments"
          assignments={pastAssignments}
          emptyMessage="No past assignments found."
          showUnit={true}
          userType="student"
        />
      </div>
    </div>
  );
}