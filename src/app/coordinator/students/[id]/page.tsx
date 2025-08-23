'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faCheckCircle, 
  faTimesCircle, 
  faEdit,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import Tabs from '../../../components/tabs';

import { 
  Student, 
  StudentAssignment, 
  StudentProgress, 
  ApiResponse, 
  UpdateGradeRequest,
  UpdateProgressRequest,
  TabItem,
  Unit
} from '../../../../types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

// Define the StudentData interface
interface StudentData {
  student: Student;
  assignments: StudentAssignment[];
  progress: StudentProgress[];
}

// Define statistics interface
interface StudentStats {
  averageGrade: number;
  submittedCount: number;
  totalAssignments: number;
  completedWeeks: number;
  totalWeeks: number;
}

export default function CoordinatorStudentDetailPage() {
  const [data, setData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [tempGrade, setTempGrade] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;

  // Fetch student data from Railway API
  const fetchStudentData = async () => {
    if (!studentId) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [studentResponse, assignmentsResponse, progressResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/students/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/assignments?studentId=${studentId}&includeSubmissions=true`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/student-progress/student/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
      ]);

      if (!studentResponse.ok || !assignmentsResponse.ok || !progressResponse.ok) {
        if (studentResponse.status === 401 || assignmentsResponse.status === 401 || progressResponse.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to fetch student data');
      }

      const studentData = await studentResponse.json();
      const assignmentsData = await assignmentsResponse.json();
      const progressData = await progressResponse.json();

      // Handle different response formats
      const student = studentData.success ? studentData.data : studentData;
      const assignments = assignmentsData.success ? assignmentsData.data : (assignmentsData.assignments || assignmentsData);
      const progress = progressData.success ? progressData.data : (progressData.progress || progressData);

      setData({
        student,
        assignments: assignments || [],
        progress: progress || []
      });

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  // Show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Calculate statistics
  const calculateStats = useCallback((): StudentStats => {
    if (!data) return { averageGrade: 0, submittedCount: 0, totalAssignments: 0, completedWeeks: 0, totalWeeks: 0 };
    
    const gradedAssignments = data.assignments.filter(a => a.grade !== null && a.grade !== undefined);
    const averageGrade = gradedAssignments.length > 0
      ? gradedAssignments.reduce((sum: number, a) => sum + (a.grade || 0), 0) / gradedAssignments.length
      : 0;

    const submittedCount = data.assignments.filter(a => a.submissionStatus === 'SUBMITTED').length;
    const totalAssignments = data.assignments.length;

    // Calculate progress completion
    const progressWeeks = data.progress.reduce((sum: number, prevData: StudentProgress) => {
      let completed = 0;
      if (prevData.week1Material === 'DONE') completed++;
      if (prevData.week2Material === 'DONE') completed++;
      if (prevData.week3Material === 'DONE') completed++;
      if (prevData.week4Material === 'DONE') completed++;
      return sum + completed;
    }, 0);

    const totalWeeks = data.progress.length * 4; // 4 weeks per unit

    return {
      averageGrade: Math.round(averageGrade * 100) / 100,
      submittedCount,
      totalAssignments,
      completedWeeks: progressWeeks,
      totalWeeks
    };
  }, [data]);

  // Grade an assignment
  const handleGradeAssignment = async (submissionId: string, grade: number, comment?: string) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          grade,
          comment,
          gradedBy: 'coordinator' // You can get this from user context
        } as UpdateGradeRequest)
      });

      if (!response.ok) {
        throw new Error('Failed to update grade');
      }

      // Refresh data
      await fetchStudentData();
      showSuccessMessage('Grade updated successfully');
      setEditingAssignment(null);
      setTempGrade('');
    } catch (err) {
      console.error('Grade update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update grade');
    } finally {
      setIsSaving(false);
    }
  };

  // Update progress
  const handleUpdateProgress = async (studentId: string, unitCode: string, progressData: Partial<StudentProgress>) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/student-progress/student/${studentId}/unit/${unitCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...progressData,
          updatedBy: 'coordinator' // You can get this from user context
        } as UpdateProgressRequest)
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      // Refresh data
      await fetchStudentData();
      showSuccessMessage('Progress updated successfully');
      setEditingProgress(null);
    } catch (err) {
      console.error('Progress update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    } finally {
      setIsSaving(false);
    }
  };

  // Get stats
  const stats = calculateStats();

  // Tab content
  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Student Information Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
              Student Information
            </h3>
            {data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-medium">
                    {data.student.firstName} {data.student.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium">{data.student.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Course</p>
                  <p className="font-medium">{data.student.courseCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Year</p>
                  <p className="font-medium">Year {data.student.year}</p>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-red)' }}>
                {stats.averageGrade}%
              </div>
              <p className="text-sm text-gray-600">Average Grade</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-red)' }}>
                {stats.submittedCount}/{stats.totalAssignments}
              </div>
              <p className="text-sm text-gray-600">Submissions</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-red)' }}>
                {stats.completedWeeks}/{stats.totalWeeks}
              </div>
              <p className="text-sm text-gray-600">Completed Weeks</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-red)' }}>
                {stats.totalWeeks > 0 ? Math.round((stats.completedWeeks / stats.totalWeeks) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-600">Progress</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'assignments',
      label: 'Assignments',
      badge: stats.totalAssignments.toString(),
      content: (
        <div className="space-y-4">
          {data?.assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold" style={{ color: 'var(--text-black)' }}>
                    {assignment.assignmentName || assignment.id}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Unit: {assignment.unitCode} • Due: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No deadline'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon
                    icon={assignment.submissionStatus === 'SUBMITTED' ? faCheckCircle : faTimesCircle}
                    className={assignment.submissionStatus === 'SUBMITTED' ? 'text-green-500' : 'text-red-500'}
                  />
                  <span className={`text-sm font-medium ${
                    assignment.submissionStatus === 'SUBMITTED' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {assignment.submissionStatus}
                  </span>
                </div>
              </div>

              {/* Grade Section */}
              <div className="flex items-center justify-between">
                <div>
                  {editingAssignment === assignment.submissionId ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tempGrade}
                        onChange={(e) => setTempGrade(e.target.value)}
                        className="w-20 px-2 py-1 border rounded"
                        placeholder="Grade"
                      />
                      <button
                        onClick={() => handleGradeAssignment(assignment.submissionId, parseFloat(tempGrade))}
                        disabled={isSaving || !tempGrade}
                        className="text-green-600 hover:text-green-800"
                      >
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingAssignment(null);
                          setTempGrade('');
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Grade: <span className="font-medium">{assignment.grade ? `${assignment.grade}%` : 'Not graded'}</span>
                      </span>
                      <button
                        onClick={() => {
                          setEditingAssignment(assignment.submissionId);
                          setTempGrade(assignment.grade?.toString() || '');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {!data?.assignments.length && (
            <div className="text-center py-8">
              <p className="text-gray-500">No assignments found for this student.</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'progress',
      label: 'Progress',
      content: (
        <div className="space-y-4">
          {data?.progress.map((unit: StudentProgress) => (
            <div key={unit.unitCode} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold" style={{ color: 'var(--text-black)' }}>
                  {unit.unitCode}
                </h4>
                <button
                  onClick={() => setEditingProgress(unit.unitCode)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {(['week1Material', 'week2Material', 'week3Material', 'week4Material'] as const).map((week, index) => (
                  <div key={week} className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Week {index + 1}</p>
                    {editingProgress === unit.unitCode ? (
                      <select
                        value={unit[week]}
                        onChange={(e) => {
                          const newValue = e.target.value as 'DONE' | 'NOT_DONE';
                          handleUpdateProgress(unit.studentId, unit.unitCode, {
                            [week]: newValue
                          });
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="NOT_DONE">Not Done</option>
                        <option value="DONE">Done</option>
                      </select>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={unit[week] === 'DONE' ? faCheckCircle : faTimesCircle}
                          className={unit[week] === 'DONE' ? 'text-green-500' : 'text-red-500'}
                        />
                        <span className={`ml-2 text-sm font-medium ${
                          unit[week] === 'DONE' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {unit[week] === 'DONE' ? 'Done' : 'Not Done'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {!data?.progress.length && (
            <div className="text-center py-8">
              <p className="text-gray-500">No progress data found for this student.</p>
            </div>
          )}
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error || 'Student not found'}</p>
          <button 
            onClick={() => router.back()} 
            className="lms-button-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Students
          </button>
          
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
            {data.student.firstName} {data.student.lastName}
          </h1>
          <p className="text-lg text-gray-600">Student Details</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-xl font-bold mb-1" style={{ color: 'var(--primary-red)' }}>
            {stats.submittedCount}/{stats.totalAssignments}
          </div>
          <p className="text-sm text-gray-600">Assignments</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-xl font-bold mb-1" style={{ color: 'var(--primary-red)' }}>
            <span className={`${
              stats.averageGrade >= 80 ? 'text-green-600' : 
              stats.averageGrade >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {stats.averageGrade ? `${stats.averageGrade}%` : 'No grades'}
            </span>
          </div>
          <p className="text-sm text-gray-600">Overall Grade</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-xl font-bold mb-1" style={{ color: 'var(--primary-red)' }}>
            {stats.completedWeeks}/{stats.totalWeeks}
          </div>
          <p className="text-sm text-gray-600">Progress</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-xl font-bold mb-1" style={{ color: 'var(--primary-red)' }}>
            {stats.totalWeeks > 0 ? Math.round((stats.completedWeeks / stats.totalWeeks) * 100) : 0}%
          </div>
          <p className="text-sm text-gray-600">Completion</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />
    </div>
  );
}