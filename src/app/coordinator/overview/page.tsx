'use client';
import React from 'react';
import StatCard from '../../components/statCard';
import ProgressBar from '../../components/progressBar';
import { useCoordinatorData } from '../../context/useCoordinatorData';

export default function CoordinatorOverview() {
  const {
    studentCount,
    teacherCount,
    courseCount,
    avgProgress,
    avgGrade,
    submissionRate,
    isLoading,
    error,
    refetch
  } = useCoordinatorData();

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Error</h1>
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <button onClick={refetch} className="lms-button-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
          Course Overview
        </h1>
        <p className="text-lg text-gray-600">
          Dashboard for course coordinators
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Students Enrolled"
          value={studentCount}
          icon="users"
          isLoading={isLoading}
        />
        <StatCard
          title="Faculty Teachers"
          value={teacherCount}
          icon="teachers"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Courses"
          value={courseCount}
          icon="courses"
          isLoading={isLoading}
        />
      </div>

      {/* Progress Metrics */}
      <div className="lms-card">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Performance Metrics
        </h2>
        
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Average Student Progress */}
            <div>
              <ProgressBar
                progress={avgProgress}
                variant="primary"
                label="Average Student Progress"
                size="lg"
                isSuccess={avgProgress > 80} // Glows when >80%
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Based on weekly materials and assignment completion
              </p>
            </div>

            {/* Average Grade */}
            <div>
              <ProgressBar
                progress={avgGrade}
                variant="primary"
                label="Average Grade from Assignments"
                size="lg"
                isSuccess={avgGrade > 80} // Glows when >80%
                isWarning={avgGrade < 50} // Warning when <50%
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Average score across all submitted assignments
              </p>
            </div>

            {/* Submission Rate */}
            <div>
              <ProgressBar
                progress={submissionRate}
                variant="primary"
                label="Assignment Submission Rate"
                size="lg"
                isSuccess={submissionRate > 80} // Glows when >80%
                isWarning={submissionRate < 50} // Warning when <50%
                className="mb-2"
              />
              <p className="text-sm text-gray-600">
                Percentage of assignments submitted by students
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Refresh Button */}
      <div className="mt-8 flex justify-end">
        <button 
          onClick={refetch}
          disabled={isLoading}
          className="lms-button-secondary disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        
      </div>
    </div>
  );
}