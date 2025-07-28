import React from 'react';

interface ProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Height of the progress bar. Options: 'md' (12px), 'lg' (16px) */
  size?: 'md' | 'lg';
  /** Color theme for the progress bar */
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  /** Custom label text (automatically shows percentage) */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Enable success glow effect */
  isSuccess?: boolean;
  /** Enable warning red color */
  isWarning?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  variant = 'primary',
  label,
  className = '',
  isSuccess = false,
  isWarning = false
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  // Size classes
  const sizeClasses = {
    md: 'h-3',
    lg: 'h-4'
  };

  // Color variants using CSS variables from your global.css
  const getProgressColor = () => {
    if (isWarning) return '#ef4444'; // Red for warnings
    
    switch (variant) {
      case 'primary':
        return 'var(--primary-dark)';
      case 'secondary':
        return 'var(--primary-red)';
      case 'warning':
        return '#f59e0b';
      default:
        return 'var(--primary-dark)';
    }
  };

  // Glow effect for success
  const getGlowStyle = () => {
    if (isSuccess) {
      return {
        boxShadow: '0 0 10px rgba(150, 234, 255, 0.88)',
        filter: 'brightness(1.1)'
      };
    }
    return {};
  };

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
            backgroundColor: getProgressColor(),
            ...getGlowStyle()
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

// Usage Examples:

/* 
// Basic usage
<ProgressBar progress={75} />

// With label (automatically shows percentage)
<ProgressBar 
  progress={85} 
  label="Course Progress"
/>

// Different sizes
<ProgressBar progress={60} size="lg" variant="secondary" />

// Success with glow effect (customize when to show)
<ProgressBar 
  progress={95}
  variant="success"
  label="Pass Rate"
  isSuccess={progress >= 95} // Custom condition
/>

// Warning with red color (customize when to show)
<ProgressBar 
  progress={55}
  variant="warning"
  label="Drop Out Rate"
  isWarning={progress > 50} // Custom condition: >50% is warning
/>

// Low satisfaction warning
<ProgressBar 
  progress={3}
  variant="warning"
  label="Satisfaction Rate"
  isWarning={progress < 5} // Custom condition: <5% is warning
/>
*/