import { apiClient } from './api';

interface User {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string | null;
  role: 'STUDENT' | 'COORDINATOR';
  createdAt: string;
  updatedAt: string;
  
  // Student-specific fields
  courseCode?: string | null;
  year?: number | null;
  
  // Coordinator-specific fields
  title?: string | null;
  accessLevel?: string | null;
  courseManaged?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  userType: 'student' | 'coordinator' | null;
}

class AuthManager {
  private static instance: AuthManager;
  private authState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    userType: null,
  };

  private constructor() {
    // Initialize auth state from localStorage on client side
    if (typeof window !== 'undefined') {
      this.loadAuthFromStorage();
    }
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Notify components about auth state changes
  private notifyAuthStateChange() {
    if (typeof window !== 'undefined') {
      // Emit custom event for same-tab components
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: this.authState
      }));
    }
  }

  private loadAuthFromStorage() {
    try {
      const token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const userDataStr = localStorage.getItem('user_data');
      const userType = localStorage.getItem('user_type') as 'student' | 'coordinator' | null;

      if (token && userDataStr) {
        const userData = JSON.parse(userDataStr);
        this.authState = {
          user: userData,
          token,
          isAuthenticated: true,
          userType,
        };
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      this.clearAuth();
    }
  }

  private saveAuthToStorage(token: string, refreshToken: string, user: User, userType: 'student' | 'coordinator') {
    try {
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_data', JSON.stringify(user));
      localStorage.setItem('user_type', userType);
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  }

  private clearAuth() {
    this.authState = {
      user: null,
      token: null,
      isAuthenticated: false,
      userType: null,
    };

    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_type');
    }
  }

  async login(credentials: { 
    email: string; 
    password: string; 
    userType: 'student' | 'coordinator' 
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.login(credentials);
      
      // Backend returns { success: true, user, userType, access_token, refresh_token, expires_in }
      if (response.success) {
        this.authState = {
          user: response.user,
          token: response.access_token,
          isAuthenticated: true,
          userType: response.userType,
        };

        this.saveAuthToStorage(
          response.access_token, 
          response.refresh_token, 
          response.user, 
          response.userType
        );

        // Notify components about auth state change
        this.notifyAuthStateChange();

        return { success: true };
      } else {
        return { success: false, message: 'Login failed' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      this.clearAuth();
      // Notify components about auth state change
      this.notifyAuthStateChange();
    }
  }

  // FIXED: Use apiClient's public method instead of private method
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Make the refresh request directly using fetch (same as apiClient does internally)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://imajine-uni-api-production.up.railway.app'}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // FIXED: Check that data is not null and has the expected properties
      if (!data || !data.access_token) {
        throw new Error('Invalid refresh response');
      }

      // Update token in auth state
      this.authState.token = data.access_token;
      
      // Update tokens in storage
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // Notify components about auth state change
      this.notifyAuthStateChange();

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      this.notifyAuthStateChange();
      return false;
    }
  }

  // Method to manually trigger token refresh (useful for debugging)
  async forceRefreshToken(): Promise<boolean> {
    console.log('🔄 Manually refreshing token...');
    return this.refreshToken();
  }

  // Method to check if token needs refresh (expires in less than 5 minutes)
  shouldRefreshToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT payload
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Refresh if expires in less than 5 minutes (300 seconds)
      return timeUntilExpiry < 300 && timeUntilExpiry > 0;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return false;
    }
  }

  // Auto-refresh token if needed
  async autoRefreshIfNeeded(): Promise<void> {
    if (this.shouldRefreshToken()) {
      console.log('🔄 Auto-refreshing token (expires soon)');
      await this.refreshToken();
    }
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  getUser(): User | null {
    return this.authState.user;
  }

  getToken(): string | null {
    return this.authState.token;
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getUserType(): 'student' | 'coordinator' | null {
    return this.authState.userType;
  }

  isCoordinator(): boolean {
    return this.authState.userType === 'coordinator';
  }

  isStudent(): boolean {
    return this.authState.userType === 'student';
  }

  // Debug method to check token status
  debugTokens() {
    const token = this.getToken();
    const refreshToken = localStorage.getItem('refresh_token');
    
    console.log('🔍 Auth Debug Info:');
    console.log(`Access Token: ${token ? 'EXISTS' : 'MISSING'}`);
    console.log(`Refresh Token: ${refreshToken ? 'EXISTS' : 'MISSING'}`);
    console.log(`Authenticated: ${this.isAuthenticated()}`);
    console.log(`User Type: ${this.getUserType()}`);
    
    if (token) {
      try {
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        const expiresAt = new Date(payload.exp * 1000);
        const timeUntilExpiry = Math.round((payload.exp * 1000 - Date.now()) / 1000 / 60);
        
        console.log(`Token expires at: ${expiresAt.toLocaleString()}`);
        console.log(`Time until expiry: ${timeUntilExpiry} minutes`);
        console.log(`Should refresh: ${this.shouldRefreshToken()}`);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();

// Export types
export type { User, AuthState };

// Add to window for debugging (browser console)
if (typeof window !== 'undefined') {
  (window as any).authManager = authManager;
  (window as any).debugAuth = () => authManager.debugTokens();
}