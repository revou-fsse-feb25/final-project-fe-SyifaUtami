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
  faChartBar,
  faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: 'users' | 'teachers' | 'courses' | 'assignments' | 'submissions' | 'progress' | 'grade' | 'units' | 'analytics' | 'clipboard-check';
  isLoading?: boolean;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'primary' | 'secondary' | 'dark' | 'border';
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
      case 'clipboard-check':
        return <FontAwesomeIcon icon={faClipboardCheck} size={iconSize} style={{ color: iconColor }} />;
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
      case 'dark':
        return 'var(--primary-dark)';
      case 'border':
        return 'var(--border-color)';
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

/* USAGE EXAMPLES with Brand Colors:

// Primary (Red) - Main metrics
<StatCard title="Students" value={150} icon="users" color="primary" />

// Secondary/Dark - Secondary metrics  
<StatCard title="Teachers" value={25} icon="teachers" color="secondary" />

// Border color - Special emphasis
<StatCard title="Course Progress" value={78} icon="progress" color="border" />

// With loading state
<StatCard title="Teachers" value={25} icon="teachers" isLoading={isLoading} color="dark" />

// With subtitle and trend (brand colors only)
<StatCard 
  title="Course Progress" 
  value={78} 
  icon="progress"
  subtitle="Average across all courses"
  trend={{ value: 5, isPositive: true, label: "vs last month" }}
  color="primary"
/>

// Different sizes with brand colors
<StatCard title="Assignments" value={45} icon="assignments" size="lg" color="border" />

// For your coordinator overview with proper brand colors:
<StatCard
  title="Total Students"
  value={metrics?.studentCount?.toString() || '0'}
  icon="users"
  color="primary"
/>
<StatCard
  title="Total Teachers"
  value={metrics?.teacherCount?.toString() || '0'}
  icon="teachers"  
  color="secondary"
/>
<StatCard
  title="Total Courses"
  value={metrics?.courseCount?.toString() || '0'}
  icon="courses"
  color="dark"
/>
<StatCard
  title="Avg Progress"
  value={`${Math.round(metrics?.avgProgress || 0)}%`}
  icon="progress"
  color="border"
/>
<StatCard
  title="Avg Grade"
  value={metrics?.avgGrade?.toFixed(1) || '0.0'}
  icon="grade"
  color="primary"
/>
<StatCard
  title="Submission Rate"
  value={`${Math.round(metrics?.submissionRate || 0)}%`}
  icon="clipboard-check"
  color="secondary"
/>
*/