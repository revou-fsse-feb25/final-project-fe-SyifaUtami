'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authManager, type User } from '@/src/lib/auth';
import { Assignment, StudentSubmission, AssignmentWithSubmission, Unit, StudentProgress } from '../../../../types';
import AssignmentList from '../../../components/assignmentList';
import ProgressBar from '../../../components/progressBar';

interface UnitWithProgress extends Unit {
  progressPercentage?: number;
}

export default function StudentUnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const unitCode = params?.unitCode as string;

  const [unit, setUnit] = useState<UnitWithProgress | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

  useEffect(() => {
    const fetchUnitDetails = async () => {
      if (!user || !unitCode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

        // Fetch unit details
        const unitResponse = await fetch(`${baseUrl}/units/${unitCode}`, { headers });
        if (!unitResponse.ok) {
          throw new Error('Unit not found');
        }

        const unitData = await unitResponse.json();
        const unitResult = unitData.success ? unitData.data : unitData;
        setUnit(unitResult);


        // Fetch assignments for this unit with submissions
        const assignmentsResponse = await fetch(
          `${baseUrl}/assignments?studentId=${user.id}&unitCode=${unitCode}&includeSubmissions=true`, 
          { headers }
        );

        if (assignmentsResponse.ok) {
          const assignmentsResult = await assignmentsResponse.json();
          
          let assignmentsData: any[] = [];
          let submissionsData: any[] = [];
          
          if (assignmentsResult.assignments && assignmentsResult.submissions) {
            assignmentsData = assignmentsResult.assignments;
            submissionsData = assignmentsResult.submissions;
          } else if (Array.isArray(assignmentsResult.data)) {
            assignmentsData = assignmentsResult.data;
          }

          // Convert to AssignmentWithSubmission format
          const processedAssignments: AssignmentWithSubmission[] = assignmentsData.map(assignmentItem => {
            const assignment: Assignment = {
              id: assignmentItem.id,
              name: assignmentItem.name,
              unitCode: assignmentItem.unitCode,
              deadline: assignmentItem.deadline,
              publishedAt: assignmentItem.publishedAt,
              status: assignmentItem.status.toUpperCase() as 'OPEN' | 'CLOSED',
              createdAt: assignmentItem.createdAt || '',
              updatedAt: assignmentItem.updatedAt || ''
            };

            // Find matching submission
            const matchingSubmission = submissionsData.find(sub => sub.assignmentId === assignmentItem.id);
            
            let submission: StudentSubmission | undefined = undefined;
            if (matchingSubmission) {
              submission = {
                id: matchingSubmission.id,
                submissionId: matchingSubmission.submissionId,
                studentId: matchingSubmission.studentId,
                assignmentId: matchingSubmission.assignmentId,
                submissionStatus: matchingSubmission.submissionStatus,
                submissionName: matchingSubmission.submissionName,
                submittedAt: matchingSubmission.submittedAt,
                grade: matchingSubmission.grade,
                comment: matchingSubmission.comment,
                gradedBy: matchingSubmission.gradedBy,
                gradedAt: matchingSubmission.gradedAt,
                createdAt: matchingSubmission.createdAt || '',
                updatedAt: matchingSubmission.updatedAt || ''
              };
            }

            return { assignment, submission };
          });

          setAssignments(processedAssignments);
        }

        // Fetch student's progress for this unit
        const progressResponse = await fetch(`${baseUrl}/student-progress/student/${user.id}/unit/${unitCode}`, { headers });
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          const progressResult = progressData.success ? progressData.data : progressData;
          setProgress(progressResult);
        }

        // Get progress percentage from API
        const progressPercentageResponse = await fetch(`${baseUrl}/student-progress/student/${user.id}/unit/${unitCode}/percentage`, { headers });
        if (progressPercentageResponse.ok) {
          const progressPercentageData = await progressPercentageResponse.json();
          const percentage = progressPercentageData.success ? progressPercentageData.data : progressPercentageData;
          
          setUnit(prevUnit => ({
            ...prevUnit!,
            progressPercentage: typeof percentage === 'number' ? percentage : percentage?.percentage || 0
          }));
        }

      } catch (err) {
        console.error('Unit details fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load unit details');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUnitDetails();
    }
  }, [user, unitCode]);



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
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-bold mb-3">{unit?.name || 'Unit Name'}</h1>
        <p className="text-2xl text-gray-600 mb-4">{unitCode}</p>
        
        <hr className="border-gray-300 mb-6" />
        
        <p className="text-base text-gray-700 mb-8 leading-relaxed">
          {unit?.description || 'Unit description will appear here.'}
        </p>
      </div>

      {/* Weekly Progress - Exact replica with custom progress bar */}
      <div className="lms-card mb-8">
        <h3 className="text-2xl font-semibold mb-6">Weekly Progress</h3>
        
        {/* Overall Progress - Using ProgressBar Component */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-medium">Overall Progress</span>
            <span className="text-xl font-bold">{unit?.progressPercentage || 0}%</span>
          </div>
          <ProgressBar 
            progress={unit?.progressPercentage || 0}
          />
        </div>

        {/* Weekly Checklist - Exact replica */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((week) => {
            const weekKey = `week${week}Material` as keyof StudentProgress;
            const status = progress?.[weekKey];
            const isDone = status === 'DONE';
            
            return (
              <div key={week} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded border-2 flex items-center justify-center ${
                  isDone 
                    ? 'bg-gray-500 border-gray-500' 
                    : 'border-gray-300'
                }`}>
                  {isDone && (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-base ${isDone ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                  Week {week}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assignments - Using your components but keeping clean look */}
      <AssignmentList 
        title="Assignments"
        assignments={assignments}
        emptyMessage="No assignments found for this unit."
        showUnit={false}
        userType="student"
      />
    </div>
  );
}