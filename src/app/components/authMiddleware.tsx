'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authManager, type User } from '@/src/lib/auth';

interface AuthMiddlewareProps {
  children: React.ReactNode;
}

export default function AuthMiddleware({ children }: AuthMiddlewareProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'student' | 'coordinator' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial auth state
        const authState = authManager.getAuthState();
        setUser(authState.user);
        setUserType(authState.userType);

        // If we have a token but no user data, try to refresh
        if (authState.token && !authState.user) {
          console.log('Token found but no user data, attempting to refresh...');
          const refreshed = await authManager.refreshToken();
          if (refreshed) {
            const newAuthState = authManager.getAuthState();
            setUser(newAuthState.user);
            setUserType(newAuthState.userType);
          }
        }

        checkAuth(authState.user, authState.userType);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const checkAuth = (currentUser: User | null, currentUserType: 'student' | 'coordinator' | null) => {
    // If user is not authenticated and trying to access protected route
    if (!currentUser && !isPublicRoute) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
      setIsLoading(false);
      return;
    }

    // If user is authenticated and trying to access login page, redirect to dashboard
    if (currentUser && currentUserType && pathname === '/login') {
      console.log('User already authenticated, redirecting to dashboard');
      if (currentUserType === 'coordinator') {
        router.push('/coordinator/profile');
      } else {
        router.push('/students/profile');
      }
      setIsLoading(false);
      return;
    }

    // If user is authenticated but accessing root path, redirect to appropriate dashboard
    if (currentUser && currentUserType && pathname === '/') {
      console.log('User at root, redirecting to profile');
      if (currentUserType === 'coordinator') {
        router.push('/coordinator/profile');
      } else {
        router.push('/students/profile');
      }
      setIsLoading(false);
      return;
    }

    // If authenticated user tries to access wrong role's pages
    if (currentUser && currentUserType) {
      if (currentUserType === 'student' && pathname.startsWith('/coordinator')) {
        console.log('Student trying to access coordinator area, redirecting');
        router.push('/students/profile');
        setIsLoading(false);
        return;
      }
      
      if (currentUserType === 'coordinator' && pathname.startsWith('/students')) {
        console.log('Coordinator trying to access student area, redirecting');
        router.push('/coordinator/profile');
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
  };

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthStateChange = () => {
      const authState = authManager.getAuthState();
      setUser(authState.user);
      setUserType(authState.userType);
      checkAuth(authState.user, authState.userType);
    };

    // Listen for storage events (in case auth state changes in another tab)
    window.addEventListener('storage', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthStateChange);
    };
  }, [pathname, router, isPublicRoute]);

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