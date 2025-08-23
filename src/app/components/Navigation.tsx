'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faBars,
  faChevronDown, 
  faChevronRight,
  faGraduationCap, 
  faBookOpen, 
  faClipboardList, 
  faChartLine,
  faUsers,
  faChalkboardTeacher,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { authManager, type User } from '@/src/lib/auth';
import { apiClient } from '@/src/lib/api';
import { Course, Unit } from '../../types';

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: any;
  children?: NavigationItem[];
}

// Remove these local interfaces - use the ones from types/index.ts

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'student' | 'coordinator' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [coursesData, setCoursesData] = useState<{ courses: Course[]; units: Unit[] } | null>(null);

  // Initialize auth state
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
    setUserType(authState.userType);
  }, []);

  // Fetch courses data for navigation
  useEffect(() => {
    const fetchCoursesData = async () => {
      if (!user) return;
      
      try {
        const response = await apiClient.getAcademicData();
        if (response.success) {
          setCoursesData({
            courses: response.data.courses || [],
            units: response.data.units || []
          });
        }
      } catch (error) {
        console.error('Failed to fetch courses data for navigation:', error);
      }
    };

    fetchCoursesData();

    // Listen for course updates (when new courses are added)
    const handleCourseUpdate = () => {
      fetchCoursesData();
    };

    window.addEventListener('courseUpdated', handleCourseUpdate);
    
    // Also refresh every 30 seconds to catch any updates
    const interval = setInterval(fetchCoursesData, 30000);

    return () => {
      window.removeEventListener('courseUpdated', handleCourseUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const toggleMenu = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);
    
    // Dispatch custom event to notify AppLayout
    window.dispatchEvent(new CustomEvent('menuToggle', { 
      detail: { isOpen: newMenuState } 
    }));
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getProfilePath = (): string => {
    if (userType === 'coordinator') {
      return '/coordinator/profile';
    }
    return '/students/profile';
  };

  const getDisplayName = (): string => {
    if (!user) return 'dreamer';
    return user.firstName || user.email?.split('@')[0] || 'dreamer';
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await authManager.logout();
      setUser(null);
      setUserType(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force local logout even if API fails
      setUser(null);
      setUserType(null);
      window.location.href = '/login';
    }
  };

  // Generate navigation items based on user type
  const getNavigationItems = (): NavigationItem[] => {
    if (!user || !coursesData) return [];

    if (userType === 'student') {
      const course = coursesData.courses.find(c => c.code === user.courseCode);
      const units = course ? coursesData.units.filter(unit => course.units?.includes(unit.code)) : [];

      return [
        {
          id: 'course',
          label: course ? `${course.name} (${course.code})` : 'My Course',
          href: `/students/course`,
          icon: faGraduationCap,
          children: units.map(unit => ({
            id: `unit-${unit.code}`,
            label: `${unit.name} (${unit.code})`,
            href: `/students/units/${unit.code}`,
            icon: faBookOpen
          }))
        },
        {
          id: 'assignments',
          label: 'Assignments',
          href: `/students/assignments`,
          icon: faClipboardList
        }
      ];
    }

    if (userType === 'coordinator') {
      const managedCourses = user.courseManaged?.map(courseCode => 
        coursesData.courses.find(course => course.code === courseCode)
      ).filter(Boolean) || [];

      return [
        {
          id: 'overview',
          label: 'Overview',
          href: '/coordinator/overview',
          icon: faChartLine
        },
        {
          id: 'courses',
          label: 'Courses',
          href: '/coordinator/courses',
          icon: faGraduationCap,
          children: managedCourses.map(course => ({
            id: `course-${course?.code}`,
            label: `${course?.name} (${course?.code})`,
            href: `/coordinator/courses/${course?.code}`,
            children: course?.units?.map((unitCode: string) => {
              const unit = coursesData.units.find(u => u.code === unitCode);
              return {
                id: `unit-${unitCode}`,
                label: unit?.name || unitCode,
                href: `/coordinator/units/${unitCode}`
              };
            })
          }))
        },
        {
          id: 'students',
          label: 'Students',
          href: '/coordinator/students',
          icon: faUsers,
        },
        {
          id: 'teachers',
          label: 'Teachers',
          href: '/coordinator/teachers',
          icon: faChalkboardTeacher,
        },
        {
          id: 'manage-units',
          label: 'Unit Management',
          href: '/coordinator/manage-units',
          icon: faCog,
        }
      ];
    }

    return [];
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const indentClass = level > 0 ? `ml-${level * 4}` : '';

    return (
      <div key={item.id} className="w-full">
        <div className={`flex items-center justify-between p-3 hover:bg-gray-100 transition-colors ${indentClass}`}>
          <div className="flex items-center flex-1">
            {item.icon && (
              <FontAwesomeIcon icon={item.icon} className="mr-3 text-gray-600" />
            )}
            
            {item.href ? (
              <Link 
                href={item.href} 
                className="flex-1 text-black hover:text-gray-700 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <span className="flex-1 text-black">{item.label}</span>
            )}
          </div>

          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.id)}
              className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <FontAwesomeIcon
                icon={isExpanded ? faChevronDown : faChevronRight}
                className="text-gray-500 text-sm"
              />
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l-2 border-gray-200 ml-4">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="lms-nav px-4 py-4 flex items-center justify-between relative z-50">
        {/* Left side - Hamburger + Logo */}
        <div className="flex items-center">
          {/* Hamburger Menu - only show when logged in */}
          {user && (
            <button
              onClick={toggleMenu}
              className="mr-4 p-2 text-white hover:bg-white hover:text-black hover:bg-opacity-20 rounded transition-colors"
            >
              <FontAwesomeIcon icon={faBars} className="text-lg" />
            </button>
          )}
          
          <Image
            src="/logo.png"
            alt="University Logo"
            width={150}
            height={0}
            className="mr-3"
          />
          <div className="text-white">
            <p className="text-sm opacity-90">Learning Management System</p>
          </div>
        </div>

        {/* Right side - User info */}
        <div className="flex items-center space-x-4">
          {user && userType ? (
            <div className="flex items-center space-x-4">
              <Link 
                href={getProfilePath()}
                className="flex items-center space-x-2 text-white hover:text-opacity-80 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faUser} />
                <span className="text-lg">
                  Hi, <span className="font-semibold">{getDisplayName()}</span>
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-white hover:text-opacity-80 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-white">
              <FontAwesomeIcon icon={faUser} />
              <span className="text-lg">
                Hi, <span className="font-semibold">dreamer</span>
              </span>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}