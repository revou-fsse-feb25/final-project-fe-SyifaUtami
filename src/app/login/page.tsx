// app/login/page.tsx - Updated to use new auth system
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authManager } from '@/src/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'student' | 'coordinator'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  
  const router = useRouter();

  // Quick fill function for testing
  const quickFill = (type: 'coordinator' | 'student') => {
    if (type === 'coordinator') {
      setEmail('coordinator@imajine.ac.id');
      setPassword('coordinator123');
      setUserType('coordinator');
    } else {
      setEmail('TomHolland@imajine.ac.id');
      setPassword('student123');
      setUserType('student');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo('');

    try {
      console.log(`Attempting ${userType} login for:`, email);
      setDebugInfo(`Attempting ${userType} login for: ${email}...`);
      
      // Use the auth manager for login
      const result = await authManager.login({
        email,
        password,
        userType
      });

      setDebugInfo(prev => prev + `\nLogin result: ${JSON.stringify(result, null, 2)}`);

      if (result.success) {
        // Get the authenticated user data and type
        const userData = authManager.getUser();
        const authenticatedUserType = authManager.getUserType();
        
        console.log('Login successful, user data:', userData);
        console.log('User type:', authenticatedUserType);
        
        setDebugInfo(prev => prev + `\nLogin successful! User: ${userData?.firstName}, Type: ${authenticatedUserType}`);
        
        // Small delay to ensure auth state is fully updated
        setTimeout(() => {
          // Redirect based on user type
          if (authenticatedUserType === 'coordinator') {
            router.push('/coordinator/overview');
          } else {
            router.push('/students/course');
          }
        }, 100);
        
      } else {
        setError(result.message || 'Invalid email or password');
        setDebugInfo(prev => prev + `\nLogin failed: ${result.message}`);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError('An error occurred during login. Please try again.');
      setDebugInfo(prev => prev + `\nException occurred: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="University Logo"
            width={200}
            height={0}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to access your learning dashboard</p>
        </div>

        {/* Login Form */}
        <div className="lms-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative">
                  <input
                    type="radio"
                    value="student"
                    checked={userType === 'student'}
                    onChange={(e) => setUserType(e.target.value as 'student')}
                    className="sr-only"
                  />
                  <div className={`p-3 border rounded-lg cursor-pointer text-center transition-colors ${
                    userType === 'student' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    Student
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    value="coordinator"
                    checked={userType === 'coordinator'}
                    onChange={(e) => setUserType(e.target.value as 'coordinator')}
                    className="sr-only"
                  />
                  <div className={`p-3 border rounded-lg cursor-pointer text-center transition-colors ${
                    userType === 'coordinator' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    Coordinator
                  </div>
                </label>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lms-input w-full"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="lms-input w-full"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="lms-button-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Test Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">Quick test login:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => quickFill('student')}
                className="text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Fill Student
              </button>
              <button
                type="button"
                onClick={() => quickFill('coordinator')}
                className="text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Fill Coordinator
              </button>
            </div>
          </div>

          {/* Debug Information */}
          {debugInfo && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <details>
                <summary className="text-sm text-gray-600 cursor-pointer">Debug Info</summary>
                <pre className="text-xs bg-gray-100 p-3 mt-2 rounded overflow-auto">
                  {debugInfo}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}