'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DataTable, { TableColumn } from '../../../components/dataTable';
import SearchBar from '../../../components/searchBar';
import {
  Assignment,
  StudentSubmission,
  Student,
  EnrichedSubmission,
  AssignmentWithSubmissions
} from '../../../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faClock,
  faFile
} from '@fortawesome/free-solid-svg-icons';

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

type FilterType = 'all' | 'highest' | 'lowest' | 'unsubmitted' | 'submitted' | 'graded' | 'ungraded';

export default function CoordinatorAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<AssignmentData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const studentsResponse = await fetch('/api/students');
        if (!studentsResponse.ok) throw new Error('Failed to fetch students data');
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);

        const assignmentResponse = await fetch(`/api/assignments?id=${id}&includeSubmissions=true`);
        if (!assignmentResponse.ok) throw new Error(`HTTP error! status: ${assignmentResponse.status}`);
        const result = await assignmentResponse.json();

        const assignment = result.assignments?.[0];
        if (!assignment) throw new Error('Assignment not found');

        const enrichedSubmissions: SubmissionWithStudent[] = result.submissions.map((submission: StudentSubmission) => {
          const student = studentsData.find((s: Student) => s.id === submission.studentId);
          return {
            ...submission,
            studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
            studentEmail: student?.email || 'Unknown Email'
          };
        });

        setData({
          assignment,
          submissions: enrichedSubmissions,
          totalSubmissions: enrichedSubmissions.length,
          submittedCount: enrichedSubmissions.filter((s) => s.submissionStatus === 'submitted').length,
          gradedCount: enrichedSubmissions.filter((s) => s.grade !== null && s.grade !== undefined).length
        });
      } catch (err) {
        console.error('Error fetching assignment data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assignment data');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const filteredSubmissions = useMemo(() => {
    if (!data?.submissions) return [];

    let filtered = data.submissions;

    if (searchQuery) {
      filtered = filtered.filter((submission) =>
        submission.studentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (searchFilters.status) {
      filtered = filtered.filter((s) => s.submissionStatus === searchFilters.status);
    }

    if (searchFilters.gradeStatus) {
      switch (searchFilters.gradeStatus) {
        case 'graded':
          filtered = filtered.filter((s) => s.grade !== null);
          break;
        case 'ungraded':
          filtered = filtered.filter((s) => s.submissionStatus === 'submitted' && s.grade === null);
          break;
      }
    }

    if (searchFilters.sortBy) {
      switch (searchFilters.sortBy) {
        case 'highest':
          filtered = filtered.filter((s) => s.grade !== null).sort((a, b) => (b.grade || 0) - (a.grade || 0));
          break;
        case 'lowest':
          filtered = filtered.filter((s) => s.grade !== null).sort((a, b) => (a.grade || 0) - (b.grade || 0));
          break;
        case 'recent':
          filtered = filtered
            .filter((s) => s.submittedAt)
            .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());
          break;
        case 'oldest':
          filtered = filtered
            .filter((s) => s.submittedAt)
            .sort((a, b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime());
          break;
      }
    }

    return filtered;
  }, [data?.submissions, searchQuery, searchFilters]);

  const handleRowClick = (submission: SubmissionWithStudent) => {
    router.push(`/coordinator/assignments/submissions/${submission.submissionId}`);
  };

  const handleSearch = (query: string, filters: Record<string, string>) => {
    setSearchQuery(query);
    setSearchFilters(filters);
  };

  const getStatusBadge = (submission: EnrichedSubmission) => {
    switch (submission.submissionStatus) {
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 mr-1" />
            Submitted
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FontAwesomeIcon icon={faFile} className="w-3 h-3 mr-1" />
            Draft
          </span>
        );
      case 'empty':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FontAwesomeIcon icon={faTimesCircle} className="w-3 h-3 mr-1" />
            Not Started
          </span>
        );
      default:
        return submission.submissionStatus;
    }
  };

  const getGradeBadge = (grade: number | null | undefined) => {
    if (grade === null || grade === undefined) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1" />
          Not Graded
        </span>
      );
    }

    const percentage = grade;
    let colorClass = 'bg-green-100 text-green-800';

    if (percentage < 60) {
      colorClass = 'bg-red-100 text-red-800';
    } else if (percentage < 80) {
      colorClass = 'bg-yellow-100 text-yellow-800';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {grade}%
      </span>
    );
  };

  const columns: TableColumn<SubmissionWithStudent>[] = [
    {
      key: 'studentName',
      label: 'Student Name',
      className: 'font-medium'
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (submission) => getGradeBadge(submission.grade)
    },
    {
      key: 'submissionStatus',
      label: 'Status',
      render: (submission) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            submission.submissionStatus === 'submitted'
              ? 'bg-green-100 text-green-800'
              : submission.submissionStatus === 'draft'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {submission.submissionStatus === 'submitted'
            ? 'Submitted'
            : submission.submissionStatus === 'draft'
            ? 'Draft'
            : 'Not Started'}
        </span>
      )
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {isLoading ? 'Loading...' : data?.assignment.name}
              </h2>
              {data?.assignment && (
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>Due: {new Date(data.assignment.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>Unit: {data.assignment.unitCode}</span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>{data.submittedCount}/{data.totalSubmissions} Submitted</span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>{data.gradedCount} Graded</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <SearchBar
            placeholder="Search students..."
            onSearch={handleSearch}
            showFilters={true}
            filters={[
              {
                key: 'status',
                label: 'Submission Status',
                options: [
                  { value: 'submitted', label: 'Submitted' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'empty', label: 'Not Started' }
                ]
              },
              {
                key: 'gradeStatus',
                label: 'Grade Status',
                options: [
                  { value: 'graded', label: 'Graded' },
                  { value: 'ungraded', label: 'Ungraded' }
                ]
              },
              {
                key: 'sortBy',
                label: 'Sort By',
                options: [
                  { value: 'highest', label: 'Highest Grade' },
                  { value: 'lowest', label: 'Lowest Grade' },
                  { value: 'recent', label: 'Most Recent' },
                  { value: 'oldest', label: 'Oldest First' }
                ]
              }
            ]}
            className="w-full"
          />
        </div>

        {/* Data Table */}
        <div className="bg-white shadow rounded-lg">
          <DataTable
            data={filteredSubmissions}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No submissions found for this assignment"
            onRowClick={handleRowClick}
            loadingRows={8}
          />
        </div>
      </div>
    </div>
  );
}
