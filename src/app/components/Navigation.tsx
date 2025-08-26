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
  faUser,
  faSignInAlt
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
  // Get auth state immediately
  const [user, setUser] = useState<User | null>(() => authManager.getUser());
  const [userType, setUserType] = useState<'student' | 'coordinator' | null>(() => authManager.getUserType());
  
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [coursesData, setCoursesData] = useState<{ courses: Course[]; units: Unit[] } | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Listen for auth changes (login/logout from other components)
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(authManager.getUser());
      setUserType(authManager.getUserType());
    };

    // Listen for both storage events (cross-tab) and custom auth events (same-tab)
    const handleAuthStateChange = () => {
      handleAuthChange();
    };

    window.addEventListener('storage', handleAuthStateChange);
    window.addEventListener('authStateChanged', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthStateChange);
      window.removeEventListener('authStateChanged', handleAuthStateChange);
    };
  }, []);

  // Fetch courses when user is available
  useEffect(() => {
    if (user) {
      fetchCoursesData();
    }
  }, [user]);

  const fetchCoursesData = async () => {
    if (isLoadingCourses) return;
    
    try {
      setIsLoadingCourses(true);
      const response = await apiClient.getAcademicData();
      
      if (response?.success) {
        setCoursesData({
          courses: response.data.courses || [],
          units: response.data.units || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setCoursesData({ courses: [], units: [] });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
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

  const getNavigationItems = (): NavigationItem[] => {
    if (!user || !coursesData) return [];

    if (userType === 'student') {
      const course = coursesData.courses.find(c => c.code === user.courseCode);
      let units: Unit[] = [];
      
      if (course) {
        units = course.units?.map(unitCode => 
          coursesData.units.find(unit => unit.code === unitCode)
        ).filter(Boolean) as Unit[] || 
        coursesData.units.filter(unit => unit.courseCode === course.code);
      }

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
            id: `course-${course.code}`,
            label: `${course.name} (${course.code})`,
            href: `/coordinator/courses/${course.code}`,
            children: (course.units?.map(unitCode => 
              coursesData.units.find(u => u.code === unitCode)
            ).filter(Boolean) as Unit[] || 
            coursesData.units.filter(unit => unit.courseCode === course.code))
            .map(unit => ({
              id: `unit-${unit.code}`,
              label: unit.name || unit.code,
              href: `/coordinator/units/${unit.code}`,
              icon: faBookOpen
            }))
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

  return (
    <>
      {/* Top Navigation Bar - ALWAYS VISIBLE */}
      <nav className="lms-nav px-4 py-4 flex items-center justify-between relative z-50">
        <div className="flex items-center">
          {/* Hamburger Menu - ALWAYS VISIBLE */}
          <button
            onClick={toggleMenu}
            className="mr-4 p-2 text-white hover:bg-white hover:text-black hover:bg-opacity-20 rounded transition-colors"
          >
            <FontAwesomeIcon icon={faBars} className="text-lg" />
          </button>
          
          <Image src="/logo.png" alt="University Logo" width={150} height={0} className="mr-3" />
          <div className="text-white">
            <p className="text-sm opacity-90">Learning Management System</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user && userType ? (
            <div className="text-white flex items-center space-x-3">
              <FontAwesomeIcon icon={faUser} className="text-lg" />
              <div className="text-left">
                <p className="text-sm font-medium leading-tight">{user.firstName} {user.lastName}</p>
                <p className="text-xs opacity-75 capitalize leading-tight">{userType}</p>
              </div>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="text-white flex items-center space-x-2 px-3 py-2 rounded"
            >
              <FontAwesomeIcon icon={faSignInAlt} className="text-lg" />
              <span className="text-sm">Login</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Main Layout */}
      <div className="min-h-screen" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="flex">
          {/* Left Navigation Panel - ALWAYS VISIBLE WHEN MENU IS OPEN */}
          {isMenuOpen && (
            <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
              <div className="flex-1 pt-5 pb-4 px-3">
                {!user ? (
                  /* Not logged in state */
                  <div className="p-4 text-center">
                    <div className="mb-4">
                      <FontAwesomeIcon icon={faSignInAlt} className="text-4xl text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-4">Please login to access navigation</p>
                    </div>
                  </div>
                ) : isLoadingCourses ? (
                  /* Loading courses */
                  <div className="p-3 text-gray-500 text-sm flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    Loading navigation...
                  </div>
                ) : (
                  /* Logged in navigation */
                  getNavigationItems().map(item => renderNavigationItem(item))
                )}
              </div>
              
              {/* User Profile and Logout - only show when logged in */}
              {user && (
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faUser} className="text-gray-600 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{userType}</p>
                    </div>
                  </div>
                  
                  <Link 
                    href={userType === 'coordinator' ? '/coordinator/profile' : '/students/profile'}
                    className="block w-full text-center py-2 px-3 mb-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    View Profile
                  </Link>
                  
                  <LogoutButton variant="secondary" size="sm" className="w-full text-center" />
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1">
            <main className="p-6">{children}</main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;