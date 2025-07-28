'use client';
import { useAuth } from '../context/authContext';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
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
import coursesData from '@/data/courses.json';

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: any;
  children?: NavigationItem[];
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  courseCode: string;
  year: number;
}

interface Coordinator {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  accessLevel: string;
  courseManaged: string[];
}

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, userType } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Don't show special layout on login page
  const isLoginPage = pathname === '/login';

  // Listen for menu toggle events
  useEffect(() => {
    const handleMenuToggle = (event: CustomEvent) => {
      setIsMenuOpen(event.detail.isOpen);
    };

    window.addEventListener('menuToggle', handleMenuToggle as EventListener);
    return () => {
      window.removeEventListener('menuToggle', handleMenuToggle as EventListener);
    };
  }, []);

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
    if (!user) return [];

    if (userType === 'student') {
      const student = user as Student;
      const course = coursesData.courses.find(c => c.code === student.courseCode);
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
            href: `/students/units/${unit.code}?studentId=${student.id}`,
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
      const coordinator = user as Coordinator;
      const managedCourses = coordinator.courseManaged.map(courseCode => 
        coursesData.courses.find(course => course.code === courseCode)
      ).filter(Boolean);

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
                label: unit ? `${unit.name} (${unit.code})` : unitCode,
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
          href: '/coordinator/units',
          icon: faCog,
          children: [
            {
              id: 'unit-overview',
              label: 'All Units Overview',
              href: '/coordinator/units'
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--card-background)' }}>
      <div className="flex">
        {/* Left Navigation Panel - Simple approach */}
        {user && isMenuOpen && (
          <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="pt-5 pb-4 px-3">
              {navigationItems.map(item => renderNavigationItem(item))}
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
  );
};

export default AppLayout;