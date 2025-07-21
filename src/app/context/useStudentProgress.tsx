'use client';
import { useMemo } from 'react';
import { useAuth } from './authContext';
import { StudentProgress, Assignment } from '../../types';
import studentProgressData from '@/data/studentProgress.json';
import assignmentsData from '@/data/assignments.json';

export const useStudentProgress = (unitCode: string) => {
  const { user } = useAuth();

  const data = useMemo(() => {
    if (!user) {
      return {
        studentProgress: undefined,
        assignments: [],
        isLoading: false,
        error: 'No user logged in'
      };
    }

    // Find student's progress for this unit with proper typing
    const studentProgress = (studentProgressData as StudentProgress[]).find(progress => 
      progress.studentId === user.id && progress.unitCode === unitCode
    );
    
    // Find assignments for this unit with proper typing
    const assignments = (assignmentsData as Assignment[]).filter(assignment => 
      assignment.unitCode === unitCode
    );

    return {
      studentProgress,
      assignments,
      isLoading: false,
      error: null
    };
  }, [user, unitCode]);

  return data;
};