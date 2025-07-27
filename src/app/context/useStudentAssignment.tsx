'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './authContext';
import { Assignment } from '../../types';

interface StudentSubmission {
  submissionId: string;
  studentId: string;
  assignmentId: string;
  status: 'open' | 'closed';
  submissionStatus: 'empty' | 'draft' | 'submitted' | 'unsubmitted';
  submissionName?: string | null;
  submittedAt?: string | null;
  grade?: number | null;
  comment?: string | null;
  gradedBy?: string | null;
}

interface AssignmentWithSubmission {
  assignment: Assignment;
  submission?: StudentSubmission;
}

interface UseStudentAssignmentReturn {
  openAssignments: AssignmentWithSubmission[];
  closedAssignments: AssignmentWithSubmission[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Export the hook with singular name to match your file name
export const useStudentAssignment = (): UseStudentAssignmentReturn => {
  const { user } = useAuth();
  const [openAssignments, setOpenAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [closedAssignments, setClosedAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    if (!user) {
      setError('No user logged in');
      setIsLoading(false);
      return;
    }

    // Use student ID from auth context, fallback to test ID if needed
    const studentId = user.id || 's001';

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching assignments for student:', studentId);

      // Fetch open and closed assignments
      const openUrl = `/api/assignments?status=open&studentId=${studentId}&includeSubmissions=true`;
      const closedUrl = `/api/assignments?status=closed&studentId=${studentId}&includeSubmissions=true`;

      console.log('Open URL:', openUrl);
      console.log('Closed URL:', closedUrl);

      const [openResponse, closedResponse] = await Promise.all([
        fetch(openUrl),
        fetch(closedUrl)
      ]);

      if (!openResponse.ok || !closedResponse.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const [openData, closedData] = await Promise.all([
        openResponse.json(),
        closedResponse.json()
      ]);

      console.log('Open assignments data:', openData);
      console.log('Closed assignments data:', closedData);

      // Combine assignments with their submissions
      const combineAssignmentsWithSubmissions = (data: any): AssignmentWithSubmission[] => {
        if (!data.assignments) {
          console.log('No assignments found in data:', data);
          return [];
        }
        
        return data.assignments.map((assignment: Assignment) => {
          const submission = data.submissions?.find(
            (sub: StudentSubmission) => sub.assignmentId === assignment.id
          );
          
          console.log(`Assignment ${assignment.id} submission:`, submission);
          
          return {
            assignment,
            submission
          };
        });
      };

      const openAssignmentsWithSubmissions = combineAssignmentsWithSubmissions(openData);
      const closedAssignmentsWithSubmissions = combineAssignmentsWithSubmissions(closedData);

      console.log('Final open assignments:', openAssignmentsWithSubmissions);
      console.log('Final closed assignments:', closedAssignmentsWithSubmissions);

      setOpenAssignments(openAssignmentsWithSubmissions);
      setClosedAssignments(closedAssignmentsWithSubmissions);

    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when user changes
  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const refetch = () => {
    fetchAssignments();
  };

  return {
    openAssignments,
    closedAssignments,
    isLoading,
    error,
    refetch
  };
};