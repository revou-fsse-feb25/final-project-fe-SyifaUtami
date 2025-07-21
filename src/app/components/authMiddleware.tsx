'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/authContext';

interface AuthMiddlewareProps {
  children: React.ReactNode;
}

export default function AuthMiddleware({ children }: AuthMiddlewareProps) {
  const { user, userType } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const checkAuth = () => {
      // If user is not authenticated and trying to access protected route
      if (!user && !isPublicRoute) {
        console.log('User not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      // If user is authenticated and trying to access login page, redirect to dashboard
      if (user && userType && pathname === '/login') {
        console.log('User already authenticated, redirecting to dashboard');
        if (userType === 'coordinator') {
          router.push('/coordinator/profile');
        } else {
          router.push('/students/profile');
        }
        return;
      }

      // If user is authenticated but accessing root path, redirect to appropriate dashboard
      if (user && userType && pathname === '/') {
        console.log('User at root, redirecting to profile');
        if (userType === 'coordinator') {
          router.push('/coordinator/profile');
        } else {
          router.push('/students/profile');
        }
        return;
      }

      // If authenticated user tries to access wrong role's pages
      if (user && userType) {
        if (userType === 'student' && pathname.startsWith('/coordinator')) {
          console.log('Student trying to access coordinator area, redirecting');
          router.push('/students/profile');
          return;
        }
        
        if (userType === 'coordinator' && pathname.startsWith('/students')) {
          console.log('Coordinator trying to access student area, redirecting');
          router.push('/coordinator/profile');
          return;
        }
      }

      setIsLoading(false);
    };

    // Small delay to ensure auth context has loaded
    const timer = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timer);
  }, [user, userType, pathname, router, isPublicRoute]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary-red)' }}></div>
          <p style={{ color: 'var(--text-black)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}