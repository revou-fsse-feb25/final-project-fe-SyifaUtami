'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import StudentGrade from '../../../components/studentGrade';
import Tabs, { TabItem } from '../../../components/tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit, faSave, faTimes, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

// Import your types
import { 
  Student, 
  StudentSubmission, 
  StudentProgress 
} from '../../../../types';

interface StudentDetailData {
  student: Student;
  assignments: StudentSubmission[];
  progress: StudentProgress[];
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [data, setData] = useState<StudentDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Editing states
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [tempGrade, setTempGrade] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Helper function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/students/${studentId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch student data: ${response.status}`);
        }

        const studentData = await response.json();
        setData(studentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  // Calculate statistics
  const calculateStats = useCallback(() => {
    if (!data) return { averageGrade: 0, submittedCount: 0, totalAssignments: 0, completedWeeks: 0, totalWeeks: 0 };
    
    const gradedAssignments = data.assignments.filter(a => a.grade !== null && a.grade !== undefined);
    const averageGrade = gradedAssignments.length > 0
      ? Math.round(gradedAssignments.reduce((sum, a) => sum + (a.grade || 0), 0) / gradedAssignments.length)
      : 0;
    
    const submittedCount = data.assignments.filter(a => a.submissionStatus === 'submitted').length;
    
    let completedWeeks = 0;
    let totalWeeks = 0;
    
    data.progress.forEach(unit => {
      const weeks = ['week1Material', 'week2Material', 'week3Material', 'week4Material'] as const;
      weeks.forEach(week => {
        totalWeeks++;
        if (unit[week] === 'done') completedWeeks++;
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
      
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: newGrade, gradedBy: 'coordinator' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update grade');
      }
      
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
      
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitCode,
          weekNumber,
          completed: completed ? 'done' : 'not done',
          updatedBy: 'coordinator'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update progress');
      }
      
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          progress: prevData.progress.map(unit =>
            unit.unitCode === unitCode
              ? { 
                  ...unit, 
                  [`week${weekNumber}Material` as keyof StudentProgress]: completed ? 'done' : 'not done'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-red)' }}>Error</h1>
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

  // Create tab content components
  const OverviewContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="lms-card">
        <h3 className="text-lg font-semibold mb-4">Academic Performance</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Average Grade:</span>
            <StudentGrade grade={stats.averageGrade} size="sm" />
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
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {assignments
            .filter(a => a.submittedAt)
            .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
            .slice(0, 5)
            .map((assignment) => (
              <div key={assignment.submissionId} className="flex justify-between items-center text-sm">
                <span>Assignment {assignment.assignmentId}</span>
                <span className="text-gray-500">
                  {new Date(assignment.submittedAt!).toLocaleDateString()}
                </span>
              </div>
            ))
          }
          {assignments.filter(a => a.submittedAt).length === 0 && (
            <p className="text-gray-500 text-sm">No recent submissions</p>
          )}
        </div>
      </div>
    </div>
  );

  const AssignmentsContent = () => (
    <div className="lms-card">
      <h3 className="text-lg font-semibold mb-4">Assignments</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Assignment</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Grade</th>
              <th className="text-left py-3 px-4">Submitted</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.submissionId} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Assignment {assignment.assignmentId}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    assignment.submissionStatus === 'submitted' 
                      ? 'bg-green-100 text-green-800'
                      : assignment.submissionStatus === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {assignment.submissionStatus}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {editingAssignment === assignment.submissionId ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tempGrade}
                        onChange={(e) => setTempGrade(e.target.value)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                        disabled={isSaving}
                      />
                      <button
                        onClick={() => handleGradeUpdate(assignment.submissionId!, parseInt(tempGrade))}
                        disabled={isSaving || !tempGrade}
                        className="text-green-600 hover:text-green-800"
                      >
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button
                        onClick={() => setEditingAssignment(null)}
                        disabled={isSaving}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {assignment.grade !== null && assignment.grade !== undefined ? (
                        <StudentGrade grade={assignment.grade} size="sm" />
                      ) : (
                        <span className="text-gray-500">Not graded</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {assignment.submittedAt 
                    ? new Date(assignment.submittedAt).toLocaleDateString()
                    : 'Not submitted'
                  }
                </td>
                <td className="py-3 px-4">
                  {editingAssignment !== assignment.submissionId && (
                    <button
                      onClick={() => {
                        setEditingAssignment(assignment.submissionId!);
                        setTempGrade(assignment.grade?.toString() || '');
                      }}
                      className="hover:underline"
                      style={{ color: '#8D0B41' }}
                    >
                      <FontAwesomeIcon icon={faEdit} className="mr-1" />
                      Edit Grade
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ProgressContent = () => (
    <div className="lms-card">
      <h3 className="text-lg font-semibold mb-4">Weekly Materials Progress</h3>
      {progress.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No weekly materials found for this student.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {progress.map((unit) => (
            <div key={unit.unitCode} className="border rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white mr-3"
                  style={{ border: '1px solid #8D0B41', color: '#8D0B41' }}
                >
                  {unit.unitCode}
                </span>
                Unit Progress
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((weekNum) => {
                  const weekKey = `week${weekNum}Material` as keyof StudentProgress;
                  const isCompleted = unit[weekKey] === 'done';
                  const editKey = `${unit.unitCode}-week${weekNum}`;
                  const isEditing = editingProgress === editKey;
                  
                  return (
                    <div key={weekNum} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Week {weekNum}</h5>
                        {!isEditing && (
                          <button
                            onClick={() => setEditingProgress(editKey)}
                            className="text-xs hover:underline"
                            style={{ color: '#8D0B41' }}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleProgressUpdate(unit.unitCode, weekNum, true)}
                              disabled={isSaving}
                              className={`p-1 rounded ${isCompleted ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                            >
                              <FontAwesomeIcon icon={faCheckCircle} />
                            </button>
                            <button
                              onClick={() => handleProgressUpdate(unit.unitCode, weekNum, false)}
                              disabled={isSaving}
                              className={`p-1 rounded ${!isCompleted ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                            >
                              <FontAwesomeIcon icon={faTimesCircle} />
                            </button>
                            <button
                              onClick={() => setEditingProgress(null)}
                              disabled={isSaving}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <FontAwesomeIcon 
                              icon={isCompleted ? faCheckCircle : faTimesCircle}
                              className={isCompleted ? 'text-green-600' : 'text-red-600'}
                            />
                            <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-red-600'}`}>
                              {isCompleted ? 'Done' : 'Not Done'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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
              <StudentGrade 
                grade={stats.averageGrade} 
                size="lg"
                showPercentage={true}
                showNoGradesText={true}
              />
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