import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faChalkboardTeacher, 
  faBook, 
  faBookOpen,
  faTasks, 
  faFileAlt, 
  faChartLine, 
  faStar, 
  faLayerGroup,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: 'users' | 'teachers' | 'courses' | 'assignments' | 'submissions' | 'progress' | 'grade' | 'units' | 'analytics';
  isLoading?: boolean;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  isLoading = false,
  subtitle,
  trend,
  color = 'primary',
  size = 'md',
  className = ''
}) => {
  const getIcon = () => {
    const iconSize = size === 'sm' ? 'lg' : size === 'lg' ? '2x' : 'xl';
    const iconColor = getIconColor();

    switch (icon) {
      case 'users':
        return <FontAwesomeIcon icon={faUsers} size={iconSize} style={{ color: iconColor }} />;
      case 'teachers':
        return <FontAwesomeIcon icon={faChalkboardTeacher} size={iconSize} style={{ color: iconColor }} />;
      case 'courses':
        return <FontAwesomeIcon icon={faBook} size={iconSize} style={{ color: iconColor }} />;
      case 'units':
        return <FontAwesomeIcon icon={faLayerGroup} size={iconSize} style={{ color: iconColor }} />;
      case 'assignments':
        return <FontAwesomeIcon icon={faTasks} size={iconSize} style={{ color: iconColor }} />;
      case 'submissions':
        return <FontAwesomeIcon icon={faFileAlt} size={iconSize} style={{ color: iconColor }} />;
      case 'progress':
        return <FontAwesomeIcon icon={faChartLine} size={iconSize} style={{ color: iconColor }} />;
      case 'grade':
        return <FontAwesomeIcon icon={faStar} size={iconSize} style={{ color: iconColor }} />;
      case 'analytics':
        return <FontAwesomeIcon icon={faChartBar} size={iconSize} style={{ color: iconColor }} />;
      default:
        return <FontAwesomeIcon icon={faChartBar} size={iconSize} style={{ color: iconColor }} />;
    }
  };

  const getIconColor = () => {
    switch (color) {
      case 'primary':
        return 'var(--primary-red)';
      case 'secondary':
        return 'var(--primary-dark)';
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return 'var(--primary-red)';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-4',
          value: 'text-2xl font-bold',
          title: 'text-xs font-medium',
          subtitle: 'text-xs'
        };
      case 'lg':
        return {
          container: 'p-8',
          value: 'text-4xl font-bold',
          title: 'text-base font-medium',
          subtitle: 'text-sm'
        };
      default: // md
        return {
          container: 'p-6',
          value: 'text-3xl font-bold',
          title: 'text-sm font-medium',
          subtitle: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div 
      className={`lms-card transition-all duration-200 ${sizeClasses.container} ${className}`}
    >
      <div className="flex items-center space-x-4">
        {icon && (
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`${sizeClasses.title} text-gray-600 truncate`}>{title}</p>
          {isLoading ? (
            <div className="animate-pulse">
              <div className={`h-8 bg-gray-200 rounded w-16 ${size === 'sm' ? 'h-6' : size === 'lg' ? 'h-10' : 'h-8'}`}></div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <p className={`${sizeClasses.value}`} style={{ color: 'var(--text-black)' }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <span className={`text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                  {trend.label && ` ${trend.label}`}
                </span>
              )}
            </div>
          )}
          {subtitle && !isLoading && (
            <p className={`${sizeClasses.subtitle} text-gray-500 mt-1 truncate`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

/* USAGE EXAMPLES:

// Basic usage
<StatCard title="Students" value={150} icon="users" />

// With loading state
<StatCard title="Teachers" value={25} icon="teachers" isLoading={isLoading} />

// With subtitle and trend
<StatCard 
  title="Course Progress" 
  value={78} 
  icon="progress"
  subtitle="Average across all courses"
  trend={{ value: 5, isPositive: true, label: "vs last month" }}
/>

// Different sizes and colors
<StatCard title="Assignments" value={45} icon="assignments" size="lg" color="success" />

// For API integration
<StatCard
  title="Students Enrolled"
  value={metrics?.studentCount || 0}
  icon="users"
  isLoading={isLoading}
  subtitle={isLoading ? undefined : `${metrics?.courseCount} courses`}
/>

// With FontAwesome icons
<StatCard title="Analytics" value="View Details" icon="analytics" color="info" />
*/