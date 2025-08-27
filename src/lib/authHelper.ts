// src/utils/authHelpers.ts
import { authManager } from '@/src/lib/auth';

/**  Simple utility functions for consistent authentication handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app';

/**
 * Get authentication token with fallback for backward compatibility
 */
export const getAuthToken = (): string | null => {
  // Use authManager first (primary method)
  const token = authManager.getToken();
  if (token) return token;

  // Fallback for any legacy code still using direct localStorage access
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token') || 
           localStorage.getItem('token') || 
           null;
  }
  
  return null;
};

/**
 * Make authenticated fetch request with proper error handling
 */
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired - use authManager to handle logout
      await authManager.logout();
      throw new Error('Session expired. Please log in again.');
    }
    
    throw new Error(`Request failed with status: ${response.status}`);
  }

  return response;
};

/**
 * Quick check if user is authenticated and has correct role
 */
export const isAuthorized = (requiredRole?: 'student' | 'coordinator'): boolean => {
  const authState = authManager.getAuthState();
  
  if (!authState.isAuthenticated) return false;
  if (requiredRole && authState.userType !== requiredRole) return false;
  
  return true;
};