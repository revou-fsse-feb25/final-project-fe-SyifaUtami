'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Backend API User interface (from your Prisma schema and auth service)
interface User {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string | null;
  role: 'STUDENT' | 'COORDINATOR';
  createdAt: string;
  updatedAt: string;
  
  // Student-specific fields (when role is STUDENT)
  courseCode?: string | null;
  year?: number | null;
  
  // Coordinator-specific fields (when role is COORDINATOR)
  title?: string | null;
  accessLevel?: string | null;
  courseManaged?: string[]; // Array of course codes
}

interface AuthContextType {
  user: User | null;
  userType: 'student' | 'coordinator' | null;
  isAuthenticated: boolean;
  isStudent: boolean;
  isCoordinator: boolean;
  getUserRole: () => 'STUDENT' | 'COORDINATOR' | null;
  getDisplayName: () => string;
  setUser: (user: User | null) => void;
  setUserType: (type: 'student' | 'coordinator' | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'student' | 'coordinator' | null>(null);

  useEffect(() => {
    // Load auth state from localStorage on app initialization
    const storedUser = localStorage.getItem('user_data');
    const storedUserType = localStorage.getItem('user_type');
    
    if (storedUser && storedUserType) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setUserType(storedUserType as 'student' | 'coordinator');
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        // Clear corrupted data
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_type');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }, []);

  // Computed properties
  const isAuthenticated = !!user && !!userType;
  const isStudent = userType === 'student' && user?.role === 'STUDENT';
  const isCoordinator = userType === 'coordinator' && user?.role === 'COORDINATOR';

  const getUserRole = (): 'STUDENT' | 'COORDINATOR' | null => {
    return user?.role || null;
  };
  
  const getDisplayName = (): string => {
    if (!user) return 'User';
    
    // For coordinators, use title if available, otherwise firstName
    if (isCoordinator && user.title) {
      return user.title;
    }
    
    // For students or fallback, use firstName
    return user.firstName || 'User';
  };

  const logout = () => {
    // Clear all auth data
    setUser(null);
    setUserType(null);
    
    // Clear localStorage
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_type');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const contextValue: AuthContextType = {
    user,
    userType,
    isAuthenticated,
    isStudent,
    isCoordinator,
    getUserRole,
    getDisplayName,
    setUser,
    setUserType,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the User type for use in other components
export type { User };