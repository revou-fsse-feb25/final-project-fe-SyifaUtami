'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faBars,
  faChevronDown, 
  faChevronRight,
  faGraduationCap, 
  faBookOpen, 
  faClipboardList, 
  faHistory,
  faChartLine,
  faUsers,
  faChalkboardTeacher,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/authContext';
import coursesData from '@/data/courses.json';

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: any;
  children?: NavigationItem[];
}

export default function Navigation() {
  const { user, userType, getDisplayName, setUser, setUserType } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const handleLogout = (): void => {
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setUser(null);
    setUserType(null);
    window.location.href = '/login';
  };

  // Generate navigation items based on user type
  const getNavigationItems = (): NavigationItem[] => {
    if (!user) return [];

    if (userType === 'student') {
      const course = coursesData.courses.find(c => c.code === user.courseCode);
      const units = course ? coursesData.units.filter(unit => course.units.includes(unit.code)) : [];

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
            children: course?.units.map(unitCode => {
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
          children: [
            {
              id: 'student-performance',
              label: 'Performance Overview',
              href: '/coordinator/students/performance'
            },
            {
              id: 'student-list',
              label: 'Student List',
              href: '/coordinator/students/list'
            }
          ]
        },
        {
          id: 'teachers',
          label: 'Teachers',
          href: '/coordinator/teachers',
          icon: faChalkboardTeacher,
          children: [
            {
              id: 'teacher-directory',
              label: 'Teacher Directory',
              href: '/coordinator/teachers/directory'
            },
            {
              id: 'teacher-assignments',
              label: 'Assignments',
              href: '/coordinator/teachers/assignments'
            }
          ]
        },
        {
          id: 'manage-units',
          label: 'Manage Units',
          href: '/coordinator/manage-units',
          icon: faCog,
          children: [
            {
              id: 'unit-content',
              label: 'Unit Content',
              href: '/coordinator/manage-units/content'
            },
            {
              id: 'unit-assessments',
              label: 'Assessments',
              href: '/coordinator/manage-units/assessments'
            }
          ]
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
              className="mr-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
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
            <Link 
              href={getProfilePath()}
              className="flex items-center space-x-2 text-white hover:text-opacity-80 transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faUser} />
              <span className="text-lg">
                Hi, <span className="font-semibold">{getDisplayName()}</span>
              </span>
            </Link>
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

      {/* Navigation items moved to AppLayout for better sticky behavior */}
    </>
  );
}