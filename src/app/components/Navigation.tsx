
'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronDown, 
  faChevronRight,
  faGraduationCap, 
  faBookOpen, 
  faClipboardList, 
  faChartLine,
  faUsers,
  faChalkboardTeacher,
  faCog,
  faBars,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { authManager, type User } from '@/src/lib/auth';
import { apiClient } from '@/src/lib/api';
import { Course, Unit } from '../../types';
import LogoutButton from './logOut';

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: any;
  children?: NavigationItem[];
}

interface NavigationProps {
  children: React.ReactNode;
}

const Navigation: React.FC<NavigationProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'student' | 'coordinator' | null>(null);
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [coursesData, setCoursesData] = useState<{ courses: Course[]; units: Unit[] } | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  
  // Don't show special layout on login page
  const isLoginPage = pathname === '/login';

  // Initialize auth state with delay
  useEffect(() => {
    console.log('🔄 Navigation: Initializing auth state...');
    
    const initializeAuth = () => {
      setTimeout(() => {
        const authState = authManager.getAuthState();
        console.log('👤 Navigation: Auth state after delay:', {
          hasUser: !!authState.user,
          userType: authState.userType,
          isAuthenticated: authState.isAuthenticated,
          userId: authState.user?.id,
          userCourseCode: authState.user?.courseCode,
          userCourseManaged: authState.user?.courseManaged
        });
        
        setUser(authState.user);
        setUserType(authState.userType);
      }, 200);
    };
    
    initializeAuth();
  }, []);

  // Fetch courses data for navigation
  const fetchCoursesData = async () => {
    if (!user || isLoadingCourses) {
      console.log('⏸️ Navigation: Skipping fetch - no user or already loading');
      return;
    }
    
    try {
      setIsLoadingCourses(true);
      console.log('🔄 Navigation: Fetching courses data for navigation...');
      
      const response = await apiClient.getAcademicData();
      
      console.log('📡 Navigation: API Response:', {
        success: response?.success,
        hasCourses: !!response?.data?.courses,
        coursesCount: response?.data?.courses?.length,
        hasUnits: !!response?.data?.units,
        unitsCount: response?.data?.units?.length
      });
      
      if (response && response.success && response.data) {
        console.log('✅ Navigation: Setting courses data');
        
        setCoursesData({
          courses: response.data.courses || [],
          units: response.data.units || []
        });
      } else {
        console.error('❌ Navigation: Invalid response structure:', response);
        setCoursesData({
          courses: [],
          units: []
        });
      }
    } catch (error) {
      console.error('❌ Navigation: Failed to fetch courses data:', error);
      setCoursesData({
        courses: [],
        units: []
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // Fetch courses when user is available
  useEffect(() => {
    if (user && !isLoginPage) {
      console.log('👤 Navigation: User available, fetching courses data...');
      fetchCoursesData();

      // Listen for course updates
      const handleCourseUpdate = () => {
        console.log('🔔 Navigation: Course update event received, refreshing navigation...');
        fetchCoursesData();
      };

      window.addEventListener('courseUpdated', handleCourseUpdate);
      window.addEventListener('storage', handleCourseUpdate);
      
      return () => {
        window.removeEventListener('courseUpdated', handleCourseUpdate);
        window.removeEventListener('storage', handleCourseUpdate);
      };
    } else {
      console.log('⏸️ Navigation: Waiting for user - hasUser:', !!user, 'isLoginPage:', isLoginPage);
    }
  }, [user, isLoginPage]);

  // Toggle hamburger menu
  const toggleMenu = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);
    console.log('🍔 Menu toggled:', newMenuState);
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

  // Generate navigation items based on user type
  const getNavigationItems = (): NavigationItem[] => {
    if (!user) {
      console.log('🚫 Navigation: No user available for navigation');
      return [];
    }

    if (!coursesData) {
      console.log('🚫 Navigation: No courses data available for navigation');
      return [];
    }

    console.log('🎯 Navigation: Generating navigation for:', {
      userType,
      userCourseCode: user.courseCode,
      userCourseManaged: user.courseManaged,
      availableCourses: coursesData.courses.map(c => c.code),
      availableUnits: coursesData.units.map(u => u.code)
    });

    if (userType === 'student') {
      const course = coursesData.courses.find(c => c.code === user.courseCode);
      
      // Handle units - try course.units first, fallback to courseCode matching
      let units: Unit[] = [];
      if (course) {
        if (course.units && course.units.length > 0) {
          units = course.units.map(unitCode => 
            coursesData.units.find(unit => unit.code === unitCode)
          ).filter(Boolean) as Unit[];
        } else {
          units = coursesData.units.filter(unit => 
            unit.courseCode === course.code
          );
        }
      }

      console.log('👨‍🎓 Student navigation:', { course, units });

      return [
        {
          id: 'course',
          label: course ? `${course.name} (${course.code})` : 'My Course',
          href: '/students/course',
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
          href: '/students/assignments',
          icon: faClipboardList
        }
      ];
    }

    if (userType === 'coordinator') {
      const managedCourses = user.courseManaged?.map(courseCode => 
        coursesData.courses.find(course => course.code === courseCode)
      ).filter(Boolean) as Course[] || [];

      console.log('👨‍🏫 Coordinator navigation:', { managedCourses });

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
          children: managedCourses.map(course => {
            let courseUnits: Unit[] = [];
            if (course.units && course.units.length > 0) {
              courseUnits = course.units.map(unitCode => 
                coursesData.units.find(u => u.code === unitCode)
              ).filter(Boolean) as Unit[];
            } else {
              courseUnits = coursesData.units.filter(unit => 
                unit.courseCode === course.code
              );
            }

            return {
              id: `course-${course.code}`,
              label: `${course.name} (${course.code})`,
              href: `/coordinator/courses/${course.code}`,
              children: courseUnits.map(unit => ({
                id: `unit-${unit.code}`,
                label: unit.name || unit.code,
                href: `/coordinator/units/${unit.code}`,
                icon: faBookOpen
              }))
            };
          })
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

    console.log('❓ Navigation: Unknown user type');
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

  if (isLoginPage) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--card-background)' }}>
        {children}
      </div>
    );
  }

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

        {/* Right side - User info + Logout */}
        <div className="flex items-center space-x-4">
          {user && userType && (
            <>
              <div className="text-white flex items-center space-x-3">
                <FontAwesomeIcon icon={faUser} className="text-lg" />
                <div className="text-right">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs opacity-75 capitalize">{userType}</p>
                </div>
              </div>
              <LogoutButton />
            </>
          )}
        </div>
      </nav>

      {/* Main Layout */}
      <div className="min-h-screen" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="flex">
          {/* Left Navigation Panel */}
          {user && isMenuOpen && (
            <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
              <div className="pt-5 pb-4 px-3">
                {/* Debug info panel */}
                <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                  <div>User: {user.firstName} {user.lastName}</div>
                  <div>Type: {userType}</div>
                  <div>Course: {user.courseCode}</div>
                  <div>Managed: {user.courseManaged?.join(', ') || 'None'}</div>
                  <div>Courses Data: {coursesData ? `${coursesData.courses.length} courses, ${coursesData.units.length} units` : 'None'}</div>
                  <div>Nav Items: {navigationItems.length}</div>
                </div>

                {/* Loading state */}
                {isLoadingCourses && (
                  <div className="p-3 text-gray-500 text-sm flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    Loading navigation...
                  </div>
                )}
                
                {/* No data state */}
                {!isLoadingCourses && (!coursesData || navigationItems.length === 0) && (
                  <div className="p-3 text-red-500 text-sm">
                    ⚠️ No navigation data available
                    <div className="text-xs mt-1">
                      Check console for debugging info
                    </div>
                  </div>
                )}
                
                {/* Navigation items */}
                {!isLoadingCourses && navigationItems.length > 0 && (
                  <>
                    <div className="mb-2 text-xs text-gray-400 uppercase font-semibold">
                      Navigation
                    </div>
                    {navigationItems.map(item => renderNavigationItem(item))}
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Main Content Area */}
          <div className="flex-1">
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;

/* 'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBars } from '@fortawesome/free-solid-svg-icons';
import { authManager, type User } from '@/src/lib/auth';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'student' | 'coordinator' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
    setUserType(authState.userType);
  }, []);

  const toggleMenu = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);
    
    // Dispatch custom event to notify AppLayout
    window.dispatchEvent(new CustomEvent('menuToggle', { 
      detail: { isOpen: newMenuState } 
    }));
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

  return (
    <>
      {/* Top Navigation Bar - Fixed position */}
      <nav className="lms-nav px-4 py-4 flex items-center justify-between relative z-50 fixed top-0 left-0 right-0">
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

      {/* Spacer div to push content below fixed nav */}
      <div className="h-20"></div>
    </>
  );
} */