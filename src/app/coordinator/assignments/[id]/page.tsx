'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DataTable, { TableColumn } from '../../../components/dataTable';
import SearchBar from '../../../components/searchBar';
import {
  Assignment,
  StudentSubmission,
  Student,
  FilterOption
} from '../../../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faClock,
  faFile,
  faArrowLeft,
  faEye
} from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

interface SubmissionWithStudent extends StudentSubmission {
  studentName: string;
  studentEmail: string;
}

interface AssignmentData {
  assignment: Assignment;
  submissions: SubmissionWithStudent[];
  totalSubmissions: number;
  submittedCount: number;
  gradedCount: number;
}

export default function CoordinatorAssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<AssignmentData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch assignment details
        const assignmentResponse = await fetch(`${API_BASE_URL}/assignments/${id}`, { headers });
        if (!assignmentResponse.ok) {
          throw new Error('Failed to fetch assignment details');
        }

        const assignmentData = await assignmentResponse.json();
        const assignment = assignmentData.success ? assignmentData.data : assignmentData;

        if (!assignment) {
          throw new Error('Assignment not found');
        }

        // Fetch students data
        const studentsResponse = await fetch(`${API_BASE_URL}/students`, { headers });
        if (!studentsResponse.ok) {
          throw new Error('Failed to fetch students data');
        }

        const studentsResult = await studentsResponse.json();
        const studentsData = studentsResult.success ? studentsResult.data : studentsResult;
        setStudents(studentsData || []);

        // Fetch submissions for this assignment
        const submissionsResponse = await fetch(
          `${API_BASE_URL}/assignments?includeSubmissions=true`, 
          { headers }
        );
        
        if (!submissionsResponse.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const submissionsResult = await submissionsResponse.json();
        const allSubmissions = submissionsResult.success ? submissionsResult.data : submissionsResult;
        
        // Filter submissions for this specific assignment
        const assignmentSubmissions = Array.isArray(allSubmissions) 
          ? allSubmissions.filter((item: any) => item.assignment?.id === id || item.assignmentId === id)
          : [];

        // Enrich submissions with student information
        const enrichedSubmissions: SubmissionWithStudent[] = assignmentSubmissions.map((submission: StudentSubmission) => {
          const student = studentsData.find((s: Student) => s.id === submission.studentId);
          return {
            ...submission,
            studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown Student',
            studentEmail: student?.email || 'No email'
          };
        });

        // Create missing submissions for students who haven't submitted
        const submittedStudentIds = enrichedSubmissions.map(sub => sub.studentId);
        const nonSubmittedStudents = studentsData.filter((student: Student) => 
          !submittedStudentIds.includes(student.id)
        );

        const missingSubmissions: SubmissionWithStudent[] = nonSubmittedStudents.map((student: Student) => ({
          id: `missing_${student.id}`,
          submissionId: `missing_${student.id}_${assignment.id}`,
          studentId: student.id,
          assignmentId: assignment.id,
          submissionStatus: 'EMPTY' as const,
          submissionName: null,
          submittedAt: null,
          grade: null,
          comment: null,
          gradedBy: null,
          gradedAt: null,
          studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
          studentEmail: student.email || 'No email'
        }));

        const allSubmissionsWithStudents = [...enrichedSubmissions, ...missingSubmissions];

        const submittedCount = enrichedSubmissions.filter(sub => 
          sub.submissionStatus === 'SUBMITTED'
        ).length;

        const gradedCount = enrichedSubmissions.filter(sub => 
          sub.grade !== null && sub.grade !== undefined
        ).length;

        setData({
          assignment,
          submissions: allSubmissionsWithStudents,
          totalSubmissions: allSubmissionsWithStudents.length,
          submittedCount,
          gradedCount
        });

        setFilteredSubmissions(allSubmissionsWithStudents);

      } catch (err) {
        console.error('Assignment detail fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assignment details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Filter options for submissions
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'SUBMITTED', label: 'Submitted' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'EMPTY', label: 'Not Started' }
      ]
    },
    {
      key: 'graded',
      label: 'Grading',
      options: [
        { value: 'all', label: 'All' },
        { value: 'graded', label: 'Graded' },
        { value: 'ungraded', label: 'Ungraded' }
      ]
    },
    {
      key: 'performance',
      label: 'Performance',
      options: [
        { value: 'all', label: 'All Grades' },
        { value: 'excellent', label: 'Excellent (90%+)' },
        { value: 'good', label: 'Good (80-89%)' },
        { value: 'satisfactory', label: 'Satisfactory (70-79%)' },
        { value: 'needs_improvement', label: 'Needs Improvement (<70%)' }
      ]
    }
  ];

  const handleSearch = (query: string, filters: Record<string, string>) => {
    if (!data) return;

    let filtered = data.submissions;

    // Apply text search
    if (query.trim()) {
      filtered = filtered.filter(submission =>
        submission.studentName.toLowerCase().includes(query.toLowerCase()) ||
        submission.studentEmail.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        switch (key) {
          case 'status':
            filtered = filtered.filter(submission => submission.submissionStatus === value);
            break;
          case 'graded':
            if (value === 'graded') {
              filtered = filtered.filter(submission => submission.grade !== null && submission.grade !== undefined);
            } else if (value === 'ungraded') {
              filtered = filtered.filter(submission => submission.grade === null || submission.grade === undefined);
            }
            break;
          case 'performance':
            filtered = filtered.filter(submission => {
              const grade = submission.grade || 0;
              switch (value) {
                case 'excellent': return grade >= 90;
                case 'good': return grade >= 80 && grade < 90;
                case 'satisfactory': return grade >= 70 && grade < 80;
                case 'needs_improvement': return grade < 70;
                default: return true;
              }
            });
            break;
        }
      }
    });

    setFilteredSubmissions(filtered);
  };

  // Table columns
  const columns: TableColumn<SubmissionWithStudent>[] = [
    {
      key: 'student',
      label: 'Student',
      render: (submission: SubmissionWithStudent) => (
        <div>
          <div className="font-medium" style={{ color: 'var(--text-black)' }}>
            {submission.studentName}
          </div>
          <div className="text-sm text-gray-500">{submission.studentEmail}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (submission: SubmissionWithStudent) => (
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon
            icon={
              submission.submissionStatus === 'SUBMITTED' ? faCheckCircle :
              submission.submissionStatus === 'DRAFT' ? faClock :
              faTimesCircle
            }
            className={`text-sm ${
              submission.submissionStatus === 'SUBMITTED' ? 'text-green-500' :
              submission.submissionStatus === 'DRAFT' ? 'text-yellow-500' :
              'text-red-500'
            }`}
          />
          <span className={`text-sm font-medium ${
            submission.submissionStatus === 'SUBMITTED' ? 'text-green-600' :
            submission.submissionStatus === 'DRAFT' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {submission.submissionStatus === 'SUBMITTED' ? 'Submitted' :
             submission.submissionStatus === 'DRAFT' ? 'Draft' :
             'Not Started'}
          </span>
        </div>
      )
    },
    {
      key: 'submitted',
      label: 'Submitted',
      render: (submission: SubmissionWithStudent) => (
        <div className="text-sm text-gray-600">
          {submission.submittedAt 
            ? new Date(submission.submittedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : '-'
          }
        </div>
      )
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (submission: SubmissionWithStudent) => (
        <div className="text-center">
          {submission.grade !== null && submission.grade !== undefined ? (
            <span className={`font-medium ${
              submission.grade >= 80 ? 'text-green-600' :
              submission.grade >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {submission.grade}%
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (submission: SubmissionWithStudent) => (
        <div className="flex space-x-2">
          {submission.submissionStatus !== 'EMPTY' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/coordinator/assignments/submissions/${submission.submissionId}`);
              }}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              <FontAwesomeIcon icon={faEye} className="text-xs" />
              <span className="text-sm">View</span>
            </button>
          )}
        </div>
      )
    }
  ];

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <button onClick={() => router.back()} className="lms-button-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Assignments
        </button>
        
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
          {data?.assignment?.name || 'Assignment Details'}
        </h1>
        <p className="text-lg text-gray-600">
          {data?.assignment?.unitCode} - Monitor and manage submissions
        </p>
      </div>

      {/* Assignment Info */}
      {data && (
        <div className="lms-card mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-black)' }}>
            Assignment Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                data.assignment.status === 'OPEN' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {data.assignment.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Deadline</p>
              <p className="font-medium">
                {new Date(data.assignment.deadline).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Submissions</p>
              <p className="font-medium">
                {data.submittedCount}/{data.totalSubmissions} 
                <span className="text-sm text-gray-500 ml-1">
                  ({Math.round((data.submittedCount / data.totalSubmissions) * 100)}%)
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Graded</p>
              <p className="font-medium">
                {data.gradedCount}/{data.submittedCount}
                {data.submittedCount > 0 && (
                  <span className="text-sm text-gray-500 ml-1">
                    ({Math.round((data.gradedCount / data.submittedCount) * 100)}%)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search students by name or email..."
          filters={filterOptions}
          showFilters={true}
        />
      </div>

      {/* Submissions Table */}
      <DataTable
        data={filteredSubmissions}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No submissions found matching your search criteria."
        onRowClick={(submission: SubmissionWithStudent) => {
          if (submission.submissionStatus !== 'EMPTY') {
            router.push(`/coordinator/assignments/submissions/${submission.submissionId}`);
          }
        }}
      />
    </div>
  );
}