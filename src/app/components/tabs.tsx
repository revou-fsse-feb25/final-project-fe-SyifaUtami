import { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  badge?: string | number; // Optional badge (e.g., count)
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export default function Tabs({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = '',
  variant = 'underline'
}: TabsProps) {
  
  const getTabClasses = (tabId: string, isActive: boolean) => {
    const baseClasses = "font-medium text-sm transition-colors duration-200";
    
    switch (variant) {
      case 'pills':
        return `${baseClasses} px-4 py-2 rounded-full ${
          isActive 
            ? 'bg-white text-white shadow-sm' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`;
      
      case 'underline':
        return `${baseClasses} py-2 px-1 border-b-2 ${
          isActive
            ? 'border-red-500 text-red-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;
      
      default:
        return `${baseClasses} px-4 py-2 ${
          isActive 
            ? 'bg-gray-100 text-gray-900' 
            : 'text-gray-500 hover:text-gray-700'
        }`;
    }
  };

  const getActiveTabStyle = (isActive: boolean) => {
    if (variant === 'underline' && isActive) {
      return { 
        borderColor: '#8D0B41', 
        color: '#8D0B41' 
      };
    }
    return {};
  };

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className={`
        ${variant === 'underline' ? 'border-b border-gray-200' : ''}
        ${variant === 'pills' ? 'bg-gray-100 p-1 rounded-lg inline-flex' : ''}
        mb-6
      `}>
        <nav className={`
          ${variant === 'underline' ? '-mb-px flex space-x-8' : ''}
          ${variant === 'pills' ? 'flex space-x-1' : ''}
          ${variant === 'default' ? 'flex space-x-2' : ''}
        `}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={getTabClasses(tab.id, isActive)}
                style={getActiveTabStyle(isActive)}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    isActive 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}