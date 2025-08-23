'use client';
import React, { useState, useEffect } from 'react';
import StatCard from '../../components/statCard';
import ProgressBar from '../../components/progressBar';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

interface DashboardMetrics {
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  avgProgress: number;
  avgGrade: number;
  submissionRate: number;
}

export default function CoordinatorOverview() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/analytics/overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      
      // The backend returns data in the format we need
      if (data.success && data.data) {
        setMetrics(data.data);
      } else {
        // Handle direct response format
        setMetrics(data);
      }

    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const refetch = () => {
    fetchAnalytics();
  };

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
          value={metrics?.studentCount || 0}
          icon="users"
          isLoading={isLoading}
          subtitle={!isLoading && metrics ? `Across ${metrics.courseCount} courses` : undefined}
          color="primary"
        />
        <StatCard
          title="Faculty Teachers"
          value={metrics?.teacherCount || 0}
          icon="teachers"
          isLoading={isLoading}
          subtitle={!isLoading ? "Active instructors" : undefined}
          color="secondary"
        />
        <StatCard
          title="Total Courses"
          value={metrics?.courseCount || 0}
          icon="courses"
          isLoading={isLoading}
          subtitle={!isLoading ? "Available programs" : undefined}
          color="info"
        />
      </div>

      {/* Progress Metrics */}
      <div className="lms-card">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Performance Metrics
        </h2>
        
        {isLoading ? (
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <ProgressBar
                progress={metrics?.avgProgress || 0}
                label="Average Student Progress"
                size="lg"
                isLoading={isLoading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Based on weekly materials and assignment completion
              </p>
            </div>

            <div>
              <ProgressBar
                progress={metrics?.avgGrade || 0}
                label="Average Grade from Assignments"
                size="lg"
                isLoading={isLoading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Average score across all submitted assignments
              </p>
            </div>

            <div>
              <ProgressBar
                progress={metrics?.submissionRate || 0}
                label="Assignment Submission Rate"
                size="lg"
                isLoading={isLoading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Percentage of assignments submitted by students
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Refresh Section */}
      <div className="mt-8 text-center">
        <button
          onClick={refetch}
          disabled={isLoading}
          className="lms-button-secondary"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Data is fetched from the backend analytics API
        </p>
      </div>
    </div>
  );
}