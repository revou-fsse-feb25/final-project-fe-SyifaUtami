import React from 'react';

interface ProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Height of the progress bar. Options: 'md' (12px), 'lg' (16px) */
  size?: 'md' | 'lg';
  /** Custom label text (automatically shows percentage) */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  label,
  className = '',
  isLoading = false
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  // Size classes
  const sizeClasses = {
    md: 'h-3',
    lg: 'h-4'
  };

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <div className="flex justify-between items-center mb-2">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        )}
        <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
          <div className="h-full bg-gray-300 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Label and Percentage Row */}
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-black)' }}>
            {label}
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-black)' }}>
            {normalizedProgress}%
          </span>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        {/* Progress Bar Fill */}
        <div 
          className={`${sizeClasses[size]} rounded-full`}
          style={{ 
            width: `${normalizedProgress}%`,
            backgroundColor: 'var(--primary-dark)'
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

/* USAGE EXAMPLES:

// Basic usage
<ProgressBar progress={75} />

// With label (automatically shows percentage)
<ProgressBar 
  progress={85} 
  label="Course Progress"
/>

// Different sizes
<ProgressBar progress={60} size="lg" />

// With loading state
<ProgressBar
  progress={metrics?.avgProgress || 0}
  label="Average Student Progress"
  isLoading={isLoading}
  size="lg"
/>
*/