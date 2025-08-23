'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../context/authContext';
import { authManager } from '@/src/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'student' | 'coordinator'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { setUser, setUserType: setAuthUserType } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log(`Attempting ${userType} login for:`, email);
      
      // Use the auth manager to login
      const result = await authManager.login({
        email,
        password,
        userType
      });

      if (result.success) {
        // Get the authenticated user data
        const userData = authManager.getUser();
        const authenticatedUserType = authManager.getUserType();
        
        // Update auth context
        setUser(userData);
        setAuthUserType(authenticatedUserType);

        console.log('Login successful, redirecting...');
        
        // Redirect based on user type
        if (authenticatedUserType === 'coordinator') {
          router.push('/coordinator/overview');
        } else {
          router.push('/students/course');
        }
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/favicon.png"
              alt="University Logo"
              width={100}
              height={0}
              className="h-auto"
            />
          </div>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--primary-dark)' }}>
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your Learning Management System
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="lms-card space-y-4">

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-black)' }}>
                Login As
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="student"
                    checked={userType === 'student'}
                    onChange={(e) => setUserType(e.target.value as 'student')}
                    className="mr-2"
                  />
                  <span className="text-sm">Student</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="coordinator"
                    checked={userType === 'coordinator'}
                    onChange={(e) => setUserType(e.target.value as 'coordinator')}
                    className="mr-2"
                  />
                  <span className="text-sm">Coordinator</span>
                </label>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-black)' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="lms-input w-full"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-black)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="lms-input w-full"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm p-3 rounded" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="lms-button-primary w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

 
      </div>
    </div>
  );
}