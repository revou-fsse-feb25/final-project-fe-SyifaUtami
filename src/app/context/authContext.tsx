//check who logs in
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Combined interface for all user types
interface User {
  // Common fields
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  
  // Student-specific fields
  courseCode?: string;
  year?: number;
  
  // Coordinator-specific fields
  title?: string;
  accessLevel?: string;
  courseManaged?: string[];
}

interface AuthContextType {
  user: User | null;
  userType: string | null;
  getUserRole: () => string | null;
  getDisplayName: () => string;
  setUser: (user: User | null) => void;
  setUserType: (type: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is stored in localStorage when app loads
    const storedUser = localStorage.getItem('user');
    const storedUserType = localStorage.getItem('userType');
    
    if (storedUser && storedUserType) {
      setUser(JSON.parse(storedUser));
      setUserType(storedUserType);
    }
  }, []);

  const getUserRole = (): string | null => userType;
  
  const getDisplayName = (): string => {
    if (!user) return 'User';
    
    // For coordinators, use title if available
    if (userType === 'coordinator' && user.title) {
      return user.title;
    }
    
    // For students or fallback, use first name
    return user.firstName;
  };

  return (
    <AuthContext.Provider value={{ user, userType, getUserRole, getDisplayName, setUser, setUserType }}>
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