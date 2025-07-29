'use client';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string, filters: Record<string, string>) => void;
  filters?: FilterOption[];
  showFilters?: boolean;
  defaultFilters?: Record<string, string>;
  className?: string;
}

export default function SearchBar({
  placeholder = "Search...",
  onSearch,
  filters = [],
  showFilters = false,
  defaultFilters = {},
  className = ""
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(defaultFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const handleSearch = () => {
    onSearch(searchQuery, activeFilters);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setActiveFilters(newFilters);
    
    // Auto-search when filter changes
    onSearch(searchQuery, newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onSearch(searchQuery, {});
  };

  // Handle Enter key press - fixed to prevent errors
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      handleSearch();
    }
  };

  // Handle input change - added safety check
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || ''; // Ensure we always have a string
    setSearchQuery(value);
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className={`${className}`}>
      {/* Main Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            className="lms-input w-full pr-10"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          {/* Search Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="w-5 h-5 text-gray-400"
            />
          </div>
        </div>
        
        <button 
          onClick={handleSearch}
          className="lms-button-primary px-6"
        >
          Search
        </button>

        {showFilters && (
          <button 
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`lms-button-secondary px-4 relative ${hasActiveFilters ? 'ring-2 ring-yellow-400' : ''}`}
          >
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="lms-card mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Filters</h3>
            {hasActiveFilters && (
              <button 
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-red-600 underline"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {filter.label}
                </label>
                <select
                  className="lms-input w-full"
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                >
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([key, value]) => {
                  const filter = filters.find(f => f.key === key);
                  const option = filter?.options.find(o => o.value === value);
                  
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: 'var(--card-background)', border: '1px solid var(--border-color)' }}
                    >
                      {filter?.label}: {option?.label || value}
                      <button
                        onClick={() => handleFilterChange(key, '')}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// 'use client';
// import { useState } from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faSearch, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';

// interface FilterOption {
//   key: string;
//   label: string;
//   options: { value: string; label: string }[];
// }

// interface SearchBarProps {
//   placeholder?: string;
//   onSearch: (query: string, filters: Record<string, string>) => void;
//   filters?: FilterOption[];
//   showFilters?: boolean;
//   defaultFilters?: Record<string, string>;
//   className?: string;
// }

// export default function SearchBar({
//   placeholder = "Search...",
//   onSearch,
//   filters = [],
//   showFilters = false,
//   defaultFilters = {},
//   className = ""
// }: SearchBarProps) {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [activeFilters, setActiveFilters] = useState<Record<string, string>>(defaultFilters);
//   const [showFilterPanel, setShowFilterPanel] = useState(false);

//   const handleSearch = () => {
//     onSearch(searchQuery, activeFilters);
//   };

//   const handleFilterChange = (key: string, value: string) => {
//     const newFilters = { ...activeFilters };
//     if (value === '') {
//       delete newFilters[key];
//     } else {
//       newFilters[key] = value;
//     }
//     setActiveFilters(newFilters);
    
//     // Auto-search when filter changes
//     onSearch(searchQuery, newFilters);
//   };

//   const clearAllFilters = () => {
//     setActiveFilters({});
//     onSearch(searchQuery, {});
//   };

//   const hasActiveFilters = Object.keys(activeFilters).length > 0;

//   return (
//     <div className={`${className}`}>
//       {/* Main Search Bar */}
//       <div className="flex gap-3 mb-4">
//         <div className="flex-1 relative">
//           <input
//             type="text"
//             className="lms-input w-full pr-10"
//             placeholder={placeholder}
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
//           />
//           {/* Search Icon */}
//           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//             <FontAwesomeIcon 
//               icon={faSearch} 
//               className="w-5 h-5 text-gray-400"
//             />
//           </div>
//         </div>
        
//         <button 
//           onClick={handleSearch}
//           className="lms-button-primary px-6"
//         >
//           Search
//         </button>

//         {showFilters && (
//           <button 
//             onClick={() => setShowFilterPanel(!showFilterPanel)}
//             className={`lms-button-secondary px-4 relative ${hasActiveFilters ? 'ring-2 ring-yellow-400' : ''}`}
//           >
//             <FontAwesomeIcon icon={faFilter} className="mr-2" />
//             Filters
//             {hasActiveFilters && (
//               <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
//                 {Object.keys(activeFilters).length}
//               </span>
//             )}
//           </button>
//         )}
//       </div>

//       {/* Filter Panel */}
//       {showFilters && showFilterPanel && (
//         <div className="lms-card mb-4">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-lg font-semibold">Filters</h3>
//             {hasActiveFilters && (
//               <button 
//                 onClick={clearAllFilters}
//                 className="text-sm text-gray-600 hover:text-red-600 underline"
//               >
//                 Clear All
//               </button>
//             )}
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {filters.map((filter) => (
//               <div key={filter.key}>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   {filter.label}
//                 </label>
//                 <select
//                   className="lms-input w-full"
//                   value={activeFilters[filter.key] || ''}
//                   onChange={(e) => handleFilterChange(filter.key, e.target.value)}
//                 >
//                   <option value="">All</option>
//                   {filter.options.map((option) => (
//                     <option key={option.value} value={option.value}>
//                       {option.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             ))}
//           </div>

//           {/* Active Filters Display */}
//           {hasActiveFilters && (
//             <div className="mt-4 pt-4 border-t">
//               <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
//               <div className="flex flex-wrap gap-2">
//                 {Object.entries(activeFilters).map(([key, value]) => {
//                   const filter = filters.find(f => f.key === key);
//                   const option = filter?.options.find(o => o.value === value);
                  
//                   return (
//                     <span
//                       key={key}
//                       className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
//                       style={{ backgroundColor: 'var(--card-background)', border: '1px solid var(--border-color)' }}
//                     >
//                       {filter?.label}: {option?.label || value}
//                       <button
//                         onClick={() => handleFilterChange(key, '')}
//                         className="ml-2 text-red-500 hover:text-red-700"
//                       >
//                         <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
//                       </button>
//                     </span>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }