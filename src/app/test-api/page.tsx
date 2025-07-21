// app/test-api/page.tsx
'use client';
import React, { useState } from 'react';

interface APIResult {
  status: number | string;
  success: boolean;
  data: any;
  error: string | null;
}

interface Results {
  [key: string]: APIResult;
}

interface LoginCredentials {
  email: string;
  password: string;
  userType: string;
}

export default function APITestPage() {
  const [results, setResults] = useState<Results>({});
  const [loading, setLoading] = useState<string>('');

  const testAPI = async (name: string, url: string, options: RequestInit = {}): Promise<void> => {
    setLoading(name);
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          success: response.ok,
          data: data,
          error: null
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'Error',
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
    setLoading('');
  };

  const testAllAPIs = async (): Promise<void> => {
    await testAPI('Academic Data', '/api/academic-data');
    await testAPI('All Students', '/api/students');
    await testAPI('BM Students', '/api/students?courseCode=BM');
    await testAPI('BM Students with Data', '/api/students?courseCode=BM&includeData=true');
    await testAPI('Student s001', '/api/students/s001');
    await testAPI('All Assignments', '/api/assignments');
    await testAPI('BM0011 Assignment', '/api/assignments?id=BM0011');
    await testAPI('BM0011 with Submissions', '/api/assignments?id=BM0011&includeSubmissions=true');
    await testAPI('BM001 Assignments', '/api/assignments?unitCode=BM001');
    await testAPI('Tom\'s BM001 Assignments', '/api/assignments?unitCode=BM001&studentId=s001&includeSubmissions=true');
  };

  const testLogin = async (email: string, password: string, userType: string): Promise<void> => {
    await testAPI(`Login ${userType}`, '/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userType } as LoginCredentials)
    });
  };

  const renderResult = (name: string, result: APIResult) => {
    if (!result) return null;

    return (
      <div key={name} className="lms-card mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold text-lg">{name}</h3>
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            result.success 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {result.status}
          </span>
        </div>
        
        {result.error && (
          <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 mb-3">
            <strong>Error:</strong> {result.error}
          </div>
        )}
        
        {result.data && (
          <div className="bg-white p-3 rounded border border-gray-200">
            <details>
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-black">
                View Data ({typeof result.data === 'object' ? Object.keys(result.data).length : 'primitive'} items)
              </summary>
              <pre className="mt-3 text-sm overflow-auto max-h-40 bg-gray-50 p-2 rounded border">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="lms-nav p-4 mb-6">
        <h1 className="text-2xl font-bold text-white">LMS API Test Center</h1>
      </nav>

      <div className="p-6 max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Tests */}
          <div className="lms-card">
            <h2 className="text-xl font-semibold mb-4">Quick Tests</h2>
            <div className="space-y-3">
              <button 
                onClick={() => testAPI('Academic Data', '/api/academic-data')}
                disabled={!!loading}
                className="lms-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'Academic Data' ? 'Testing...' : 'Test Academic Data'}
              </button>
              
              <button 
                onClick={() => testAPI('Student s001', '/api/students/s001')}
                disabled={!!loading}
                className="lms-button-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'Student s001' ? 'Testing...' : 'Test Tom Holland Data'}
              </button>
              
              <button 
                onClick={() => testAPI('BM0011 with Submissions', '/api/assignments?id=BM0011&includeSubmissions=true')}
                disabled={!!loading}
                className="lms-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'BM0011 with Submissions' ? 'Testing...' : 'Test Assignment + Submissions'}
              </button>
            </div>
          </div>

          {/* Login Tests */}
          <div className="lms-card">
            <h2 className="text-xl font-semibold mb-4">Authentication Tests</h2>
            <div className="space-y-3">
              <button 
                onClick={() => testLogin('TomHolland@imajine.ac.id', 'student123', 'student')}
                disabled={!!loading}
                className="lms-button-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'Login student' ? 'Testing...' : 'Test Student Login'}
              </button>
              
              <button 
                onClick={() => testLogin('coordinator@imajine.ac.id', 'coordinator123', 'faculty')}
                disabled={!!loading}
                className="lms-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'Login faculty' ? 'Testing...' : 'Test Coordinator Login'}
              </button>
              
              <button 
                onClick={() => testLogin('wrong@email.com', 'wrongpass', 'student')}
                disabled={!!loading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded w-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === 'Login student' ? 'Testing...' : 'Test Invalid Login'}
              </button>
            </div>
          </div>
        </div>

        {/* Test All Button */}
        <div className="lms-card mb-8">
          <button 
            onClick={testAllAPIs}
            disabled={!!loading}
            className="lms-button-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? `Testing ${loading}...` : 'Run All API Tests'}
          </button>
        </div>

        {/* Results */}
        <div className="lms-card">
          <h2 className="text-2xl font-semibold mb-6">Test Results</h2>
          {Object.keys(results).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No tests run yet.</p>
              <p className="text-gray-400">Click a button above to test the APIs.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(results).map(([name, result]) => renderResult(name, result))}
            </div>
          )}
        </div>

        {/* API Reference */}
        <div className="lms-card mt-8">
          <h3 className="text-lg font-semibold mb-4">Available API Endpoints Reference:</h3>
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono text-gray-700">
              <div>GET /api/academic-data</div>
              <div>GET /api/students</div>
              <div>GET /api/students?courseCode=BM</div>
              <div>GET /api/students?includeData=true</div>
              <div>GET /api/students/s001</div>
              <div>GET /api/assignments</div>
              <div>GET /api/assignments?id=BM0011</div>
              <div>GET /api/assignments?includeSubmissions=true</div>
              <div>GET /api/assignments?unitCode=BM001</div>
              <div>POST /api/auth</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}