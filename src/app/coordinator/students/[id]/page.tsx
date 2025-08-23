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
  TabItem 
} from '../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

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

      const token = localStorage.getItem('token');
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
  const calculateStats = useCallback(() => {
    if (!data) return { averageGrade: 0, submittedCount: 0, totalAssignments: 0, completedWeeks: 0, totalWeeks: 0 };
    
    const gradedAssignments = data.assignments.filter(a => a.grade !== null && a.grade !== undefined);
    const averageGrade = gradedAssignments.length > 0
      ? Math.round(gradedAssignments.reduce((sum, a) => sum + (a.grade || 0), 0) / gradedAssignments.length)
      : 0;
    
    const submittedCount = data.assignments.filter(a => a.submissionStatus === 'SUBMITTED').length;
    
    let completedWeeks = 0;
    let totalWeeks = 0;
    
    data.progress.forEach(unit => {
      const weeks = ['week1Material', 'week2Material', 'week3Material', 'week4Material'] as const;
      weeks.forEach(week => {
        totalWeeks++;
        if (unit[week] === 'DONE') completedWeeks++;
      });
    });

    return {
      averageGrade,
      submittedCount,
      totalAssignments: data.assignments.length,
      completedWeeks,
      totalWeeks
    };
  }, [data]);

  // Handle grade update
  const handleGradeUpdate = async (submissionId: string, newGrade: number) => {
    try {
      setIsSaving(true);
      
      if (isNaN(newGrade) || newGrade < 0 || newGrade > 100) {
        alert('Please enter a valid grade between 0 and 100');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          grade: newGrade, 
          gradedBy: 'coordinator' 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update grade');
      }
      
      // Update local state
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          assignments: prevData.assignments.map(assignment =>
            assignment.submissionId === submissionId
              ? { ...assignment, grade: newGrade }
              : assignment
          )
        };
      });
      
      setEditingAssignment(null);
      setTempGrade('');
      showSuccessMessage('Grade updated successfully');
      
    } catch (err) {
      alert(`Failed to update grade: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle progress update
  const handleProgressUpdate = async (unitCode: string, weekNumber: number, completed: boolean) => {
    try {
      setIsSaving(true);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/student-progress/student/${studentId}/unit/${unitCode}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          [`week${weekNumber}Material`]: completed ? 'DONE' : 'NOT_DONE',
          updatedBy: 'coordinator'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update progress');
      }
      
      // Update local state
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          progress: prevData.progress.map(unit =>
            unit.unitCode === unitCode
              ? { 
                  ...unit, 
                  [`week${weekNumber}Material` as keyof StudentProgress]: completed ? 'DONE' : 'NOT_DONE'
                }
              : unit
          )
        };
      });
      
      setEditingProgress(null);
      showSuccessMessage(`${unitCode} Week ${weekNumber} marked as ${completed ? 'done' : 'not done'}`);
      
    } catch (err) {
      alert(`Failed to update progress: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error || 'Student not found'}</p>
          <button onClick={() => router.back()} className="lms-button-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { student, assignments, progress } = data;
  const stats = calculateStats();

  // Tab content components
  const OverviewContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="lms-card">
        <h3 className="text-lg font-semibold mb-4">Academic Performance</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Average Grade:</span>
            <span className={`text-lg font-bold ${
              stats.averageGrade >= 80 ? 'text-green-600' : 
              stats.averageGrade >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {stats.averageGrade ? `${stats.averageGrade}%` : 'No grades'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Assignments Submitted:</span>
            <span className="font-medium">{stats.submittedCount}/{stats.totalAssignments}</span>
          </div>
          <div className="flex justify-between">
            <span>Weekly Progress:</span>
            <span className="font-medium">
              {stats.completedWeeks}/{stats.totalWeeks} ({stats.totalWeeks > 0 ? Math.round((stats.completedWeeks / stats.totalWeeks) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      <div className="lms-card">
        <h3 className="text-lg font-semibold mb-4">Student Information</h3>
        <div className="space-y-2">
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Course:</strong> {student.courseCode}</div>
          <div><strong>Year:</strong> {student.year}</div>
          <div><strong>Student ID:</strong> {student.id}</div>
        </div>
      </div>
    </div>
  );

  const AssignmentsContent = () => (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No assignments found for this student.
        </div>
      ) : (
        assignments.map((assignment) => (
          <div key={assignment.submissionId} className="lms-card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{assignment.assignmentName}</h4>
                <p className="text-sm text-gray-600">Unit: {assignment.unitCode}</p>
                <p className="text-sm text-gray-600">
                  Status: <span className={`font-medium ${
                    assignment.submissionStatus === 'SUBMITTED' ? 'text-green-600' : 
                    assignment.submissionStatus === 'UNSUBMITTED' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {assignment.submissionStatus}
                  </span>
                </p>
                {assignment.submittedAt && (
                  <p className="text-sm text-gray-600">
                    Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div className="text-right">
                {editingAssignment === assignment.submissionId ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tempGrade}
                      onChange={(e) => setTempGrade(e.target.value)}
                      className="w-20 px-2 py-1 border rounded"
                      placeholder="0-100"
                    />
                    <button
                      onClick={() => handleGradeUpdate(assignment.submissionId, parseFloat(tempGrade))}
                      className="text-green-600 hover:text-green-800"
                      disabled={isSaving}
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
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      assignment.grade !== null && assignment.grade !== undefined ?
                        assignment.grade >= 80 ? 'text-green-600' : 
                        assignment.grade >= 60 ? 'text-yellow-600' : 'text-red-600'
                      : 'text-gray-400'
                    }`}>
                      {assignment.grade !== null && assignment.grade !== undefined ? 
                        `${assignment.grade}%` : 'Not graded'
                      }
                    </span>
                    {assignment.submissionStatus === 'SUBMITTED' && (
                      <button
                        onClick={() => {
                          setEditingAssignment(assignment.submissionId);
                          setTempGrade(assignment.grade?.toString() || '');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const ProgressContent = () => (
    <div className="space-y-6">
      {progress.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No progress data found for this student.
        </div>
      ) : (
        progress.map((unit) => (
          <div key={unit.unitCode} className="lms-card">
            <h4 className="font-semibold text-lg mb-4">
              {unit.unitName || unit.unitCode}
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((weekNumber) => {
                const weekKey = `week${weekNumber}Material` as keyof StudentProgress;
                const isCompleted = unit[weekKey] === 'DONE';
                const editingKey = `${unit.unitCode}-week${weekNumber}`;
                
                return (
                  <div key={weekNumber} className="text-center">
                    <div className="font-medium mb-2">Week {weekNumber}</div>
                    <div className="flex items-center justify-center">
                      {editingProgress === editingKey ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProgressUpdate(unit.unitCode, weekNumber, true)}
                            className="text-green-600 hover:text-green-800"
                            disabled={isSaving}
                          >
                            <FontAwesomeIcon icon={faCheckCircle} />
                          </button>
                          <button
                            onClick={() => handleProgressUpdate(unit.unitCode, weekNumber, false)}
                            className="text-red-600 hover:text-red-800"
                            disabled={isSaving}
                          >
                            <FontAwesomeIcon icon={faTimesCircle} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingProgress(editingKey)}
                          className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          <FontAwesomeIcon 
                            icon={isCompleted ? faCheckCircle : faTimesCircle}
                            className={isCompleted ? 'text-green-600' : 'text-red-600'}
                          />
                          <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-red-600'}`}>
                            {isCompleted ? 'Done' : 'Not Done'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Define tabs
  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: <OverviewContent />
    },
    {
      id: 'assignments',
      label: 'Assignments',
      badge: assignments.length,
      content: <AssignmentsContent />
    },
    {
      id: 'progress',
      label: 'Weekly Materials',
      badge: `${stats.completedWeeks}/${stats.totalWeeks}`,
      content: <ProgressContent />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="lms-button-secondary mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Students
        </button>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            ✅ {successMessage}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
              {student.firstName} {student.lastName}
            </h1>
            <div className="flex items-center gap-4 text-lg text-gray-600">
              <span>ID: {student.id}</span>
              <span>•</span>
              <span>{student.email}</span>
              <span>•</span>
              <span 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white"
                style={{ border: '1px solid #8D0B41', color: '#8D0B41' }}
              >
                {student.courseCode}
              </span>
              <span>•</span>
              <span>Year {student.year}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="mb-2">
              <span className={`text-3xl font-bold ${
                stats.averageGrade >= 80 ? 'text-green-600' : 
                stats.averageGrade >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats.averageGrade ? `${stats.averageGrade}%` : 'No grades'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Overall Grade</p>
          </div>
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