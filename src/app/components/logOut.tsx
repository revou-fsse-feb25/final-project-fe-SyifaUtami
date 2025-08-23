'use client';
import { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { authManager } from '@/src/lib/auth';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const LogoutButton: FC<LogoutButtonProps> = ({ 
  variant = 'secondary', 
  size = 'md',
  showIcon = true,
  className = '',
  children 
}) => {
  const handleLogout = async (): Promise<void> => {
    try {
      // Use auth manager to handle logout
      await authManager.logout();
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Even if API logout fails, clear local data and redirect
      // The authManager.logout() should handle this, but as a fallback:
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_type');
      
      window.location.href = '/login';
    }
  };

  // Define base styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'lms-button-primary';
      case 'secondary':
        return 'lms-button-secondary';
      case 'text':
        return 'text-gray-600 hover:text-gray-800 bg-transparent border-none p-0';
      default:
        return 'lms-button-secondary';
    }
  };

  // Define size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm';
      case 'md':
        return 'px-4 py-2';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  const baseStyles = getVariantStyles();
  const sizeStyles = variant !== 'text' ? getSizeStyles() : '';

  return (
    <button
      onClick={handleLogout}
      className={`${baseStyles} ${sizeStyles} flex items-center justify-center transition-colors ${className}`}
    >
      {showIcon && <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />}
      {children || 'Logout'}
    </button>
  );
};

export default LogoutButton;