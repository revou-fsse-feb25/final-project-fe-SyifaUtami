'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../context/authContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { setUser, setUserType: setAuthUserType } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting student login...');
      // Try student login first
      let response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userType: 'student',
        }),
      });

      console.log('Student response status:', response.status);
      console.log('Student response headers:', response.headers.get('content-type'));

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      let data = await response.json();
      console.log('Student login result:', data);

      // If student login fails, try faculty login
      if (!data.success) {
        console.log('Student login failed, trying faculty...');
        response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            userType: 'faculty',
          }),
        });

        console.log('Faculty response status:', response.status);
        
        // Check if response is JSON
        const facultyContentType = response.headers.get('content-type');
        if (!facultyContentType || !facultyContentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server returned non-JSON response');
        }

        data = await response.json();
        console.log('Faculty login result:', data);
      }

      if (data.success) {
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userType', data.userType);
        
        // Update auth context
        setUser(data.user);
        setAuthUserType(data.userType);

        // Redirect based on user type
        if (data.userType === 'coordinator') {
          router.push('/coordinator/dashboard');
        } else {
          router.push('/students/courses');
        }
      } else {
        setError('Invalid email or password');
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



        {/* Demo Credentials */}
        <div className="mt-4 text-center">
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-semibold">Demo Credentials:</p>
            <p>Student: TomHolland@imajine.ac.id / student123</p>
            <p>Coordinator: coordinator@imajine.ac.id / coordinator123</p>
          </div>
        </div>
      </div>
    </div>
  );
}