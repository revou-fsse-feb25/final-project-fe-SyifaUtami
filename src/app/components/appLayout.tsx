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
  faChartLine,
  faUsers,
  faChalkboardTeacher,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { Course, Unit } from '../../types';

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
  const [coursesData, setCoursesData] = useState<{ courses: Course[]; units: Unit[] } | null>(null);
  
  // Don't show special layout on login page
  const isLoginPage = pathname === '/login';

  // Fetch courses data for navigation
  const fetchCoursesData = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 AppLayout: Fetching courses data for navigation...');
      
      // Add cache busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/academic-data?t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 AppLayout: Courses data received:', data.courses);
        
        setCoursesData({
          courses: data.courses,
          units: data.units
        });
      }
    } catch (error) {
      console.error('❌ AppLayout: Failed to fetch courses data for navigation:', error);
    }
  };

  useEffect(() => {
    fetchCoursesData();

    // Listen for course updates (when new courses are added)
    const handleCourseUpdate = () => {
      console.log('🔔 AppLayout: Course update event received, refreshing navigation...');
      fetchCoursesData();
    };

    // Listen for multiple event types to ensure we catch updates
    window.addEventListener('courseUpdated', handleCourseUpdate);
    window.addEventListener('storage', handleCourseUpdate); // In case localStorage changes
    
    // Also refresh every 15 seconds to catch any updates
    const interval = setInterval(() => {
      console.log('⏰ AppLayout: Auto-refresh navigation data...');
      fetchCoursesData();
    }, 15000);

    return () => {
      window.removeEventListener('courseUpdated', handleCourseUpdate);
      window.removeEventListener('storage', handleCourseUpdate);
      clearInterval(interval);
    };
  }, [user]);

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
    if (!user || !coursesData) {
      console.log('🚫 AppLayout: No user or courses data available for navigation');
      return [];
    }

    if (userType === 'student') {
      const student = user as Student;
      const course = coursesData.courses.find(c => c.code === student.courseCode);
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
      const managedCourses = coordinator.courseManaged?.map(courseCode => 
        coursesData.courses.find(course => course.code === courseCode)
      ).filter(Boolean) || [];

      console.log('🎯 AppLayout: Coordinator managed courses:', managedCourses);

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
            children: course?.units?.map(unitCode => {
              const unit = coursesData.units.find(u => u.code === unitCode);
              return {
                id: `unit-${unitCode}`,
                label: unit ? `${unit.name} (${unit.code})` : unitCode,
                href: `/coordinator/courses/${course.code}/units/${unitCode}`
                //coordinator/courses/BM/units/BM001
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
              {/* Debug info - remove in production */}
              
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

// 'use client';
// import { useAuth } from '../context/authContext';
// import { usePathname } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { 
//   faChevronDown, 
//   faChevronRight,
//   faGraduationCap, 
//   faBookOpen, 
//   faClipboardList, 
//   faHistory,
//   faChartLine,
//   faUsers,
//   faChalkboardTeacher,
//   faCog
// } from '@fortawesome/free-solid-svg-icons';
// import coursesData from '@/data/courses.json';

// interface NavigationItem {
//   id: string;
//   label: string;
//   href?: string;
//   icon?: any;
//   children?: NavigationItem[];
// }

// interface Student {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   courseCode: string;
//   year: number;
// }

// interface Coordinator {
//   id: string;
//   firstName: string;
//   lastName: string;
//   title: string;
//   email: string;
//   accessLevel: string;
//   courseManaged: string[];
// }

// interface AppLayoutProps {
//   children: React.ReactNode;
// }

// const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
//   const { user, userType } = useAuth();
//   const pathname = usePathname();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
//   // Don't show special layout on login page
//   const isLoginPage = pathname === '/login';

//   // Listen for menu toggle events
//   useEffect(() => {
//     const handleMenuToggle = (event: CustomEvent) => {
//       setIsMenuOpen(event.detail.isOpen);
//     };

//     window.addEventListener('menuToggle', handleMenuToggle as EventListener);
//     return () => {
//       window.removeEventListener('menuToggle', handleMenuToggle as EventListener);
//     };
//   }, []);

//   const toggleExpanded = (itemId: string) => {
//     setExpandedItems(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(itemId)) {
//         newSet.delete(itemId);
//       } else {
//         newSet.add(itemId);
//       }
//       return newSet;
//     });
//   };

//   // Generate navigation items based on user type
//   const getNavigationItems = (): NavigationItem[] => {
//     if (!user) return [];

//     if (userType === 'student') {
//       const student = user as Student;
//       const course = coursesData.courses.find(c => c.code === student.courseCode);
//       const units = course ? coursesData.units.filter(unit => course.units.includes(unit.code)) : [];

//       return [
//         {
//           id: 'course',
//           label: course ? `${course.name} (${course.code})` : 'My Course',
//           href: `/students/course`,
//           icon: faGraduationCap,
//           children: units.map(unit => ({
//             id: `unit-${unit.code}`,
//             label: `${unit.name} (${unit.code})`,
//             href: `/students/units/${unit.code}?studentId=${student.id}`,
//             icon: faBookOpen
//           }))
//         },
//         {
//           id: 'assignments',
//           label: 'Assignments',
//           href: `/students/assignments`,
//           icon: faClipboardList
//         }
//       ];
//     }

//     if (userType === 'coordinator') {
//       const coordinator = user as Coordinator;
//       const managedCourses = coordinator.courseManaged.map(courseCode => 
//         coursesData.courses.find(course => course.code === courseCode)
//       ).filter(Boolean);

//       return [
//         {
//           id: 'overview',
//           label: 'Overview',
//           href: '/coordinator/overview',
//           icon: faChartLine
//         },
//         {
//           id: 'courses',
//           label: 'Courses',
//           href: '/coordinator/courses',
//           icon: faGraduationCap,
//           children: managedCourses.map(course => ({
//             id: `course-${course?.code}`,
//             label: `${course?.name} (${course?.code})`,
//             href: `/coordinator/courses/${course?.code}`,
//             children: course?.units.map(unitCode => {
//               const unit = coursesData.units.find(u => u.code === unitCode);
//               return {
//                 id: `unit-${unitCode}`,
//                 label: unit ? `${unit.name} (${unit.code})` : unitCode,
//                 href: `/coordinator/courses/BM/units/${unitCode}`
//               };
//             })
//           }))
//         },
//         {
//           id: 'students',
//           label: 'Students',
//           href: '/coordinator/students',
//           icon: faUsers,
//         },
//         {
//           id: 'teachers',
//           label: 'Teachers',
//           href: '/coordinator/teachers',
//           icon: faChalkboardTeacher,
//         },
//         {
//           id: 'manage-units',
//           label: 'Unit Management',
//           href: '/coordinator/manage-units',
//           icon: faCog,
//         }
//       ];
//     }

//     return [];
//   };

//   const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
//     const isExpanded = expandedItems.has(item.id);
//     const hasChildren = item.children && item.children.length > 0;
//     const indentClass = level > 0 ? `ml-${level * 4}` : '';

//     return (
//       <div key={item.id} className="w-full">
//         <div className={`flex items-center justify-between p-3 hover:bg-gray-100 transition-colors ${indentClass}`}>
//           <div className="flex items-center flex-1">
//             {item.icon && (
//               <FontAwesomeIcon icon={item.icon} className="mr-3 text-gray-600" />
//             )}
            
//             {item.href ? (
//               <Link 
//                 href={item.href} 
//                 className="flex-1 text-black hover:text-gray-700 transition-colors"
//               >
//                 {item.label}
//               </Link>
//             ) : (
//               <span className="flex-1 text-black">{item.label}</span>
//             )}
//           </div>

//           {hasChildren && (
//             <button
//               onClick={() => toggleExpanded(item.id)}
//               className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
//             >
//               <FontAwesomeIcon
//                 icon={isExpanded ? faChevronDown : faChevronRight}
//                 className="text-gray-500 text-sm"
//               />
//             </button>
//           )}
//         </div>

//         {hasChildren && isExpanded && (
//           <div className="border-l-2 border-gray-200 ml-4">
//             {item.children!.map(child => renderNavigationItem(child, level + 1))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   if (isLoginPage) {
//     return (
//       <div className="min-h-screen" style={{ backgroundColor: 'var(--card-background)' }}>
//         {children}
//       </div>
//     );
//   }

//   const navigationItems = getNavigationItems();

//   return (
//     <div className="min-h-screen" style={{ backgroundColor: 'var(--card-background)' }}>
//       <div className="flex">
//         {/* Left Navigation Panel - Simple approach */}
//         {user && isMenuOpen && (
//           <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
//             <div className="pt-5 pb-4 px-3">
//               {navigationItems.map(item => renderNavigationItem(item))}
//             </div>
//           </div>
//         )}
        
//         {/* Main Content Area */}
//         <div className="flex-1">
//           <main className="p-6">
//             {children}
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AppLayout;