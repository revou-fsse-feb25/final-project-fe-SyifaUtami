'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './authContext';
import { Assignment } from '../../types';

interface StudentSubmission {
  submissionId?: string;
  studentId: string;
  assignmentId: string;
  status: 'open' | 'closed'; // assignment status when this submission was made
  submissionStatus: 'empty' | 'draft' | 'submitted';
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

interface UseStudentAssignmentsReturn {
  openAssignments: AssignmentWithSubmission[];
  closedAssignments: AssignmentWithSubmission[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useStudentAssignments = (): UseStudentAssignmentsReturn => {
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

    console.log('Current user ID:', user.id); // DEBUG: Check user ID

    try {
      setIsLoading(true);
      setError(null);

      // Fetch open assignments
      const openResponse = await fetch(
        `/api/assignments?status=open&studentId=${user.id}&includeSubmissions=true`
      );
      
      // Fetch closed assignments
      const closedResponse = await fetch(
        `/api/assignments?status=closed&studentId=${user.id}&includeSubmissions=true`
      );

      if (!openResponse.ok || !closedResponse.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const openData = await openResponse.json();
      const closedData = await closedResponse.json();

      // Debug the raw API responses
      console.log('Raw Open Data:', openData);
      console.log('Raw Closed Data:', closedData);
      console.log('Open assignments array:', openData.assignments);
      console.log('Open submissions array:', openData.submissions);
      console.log('Closed assignments array:', closedData.assignments);  
      console.log('Closed submissions array:', closedData.submissions);

      // Combine assignments with their submissions
      const combineAssignmentsWithSubmissions = (data: any): AssignmentWithSubmission[] => {
        console.log('Combining data:', data);
        console.log('Assignments:', data.assignments);
        console.log('Submissions:', data.submissions);
        
        return data.assignments.map((assignment: Assignment) => {
          const submission = data.submissions?.find(
            (sub: StudentSubmission) => sub.assignmentId === assignment.id
          );
          
          console.log(`Assignment ${assignment.id}:`, assignment);
          console.log(`Found submission for ${assignment.id}:`, submission);
          
          return {
            assignment,
            submission
          };
        });
      };

      setOpenAssignments(combineAssignmentsWithSubmissions(openData));
      setClosedAssignments(combineAssignmentsWithSubmissions(closedData));

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