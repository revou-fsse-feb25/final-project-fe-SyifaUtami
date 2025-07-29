'use client';
import { ReactNode } from 'react';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T, value: any) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
  loadingRows?: number;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No data found",
  onRowClick,
  className = "",
  loadingRows = 5
}: DataTableProps<T>) {

  // Get value from nested object keys (e.g., "user.name")
  const getValue = (item: T, key: string): any => {
    return key.split('.').reduce((obj, k) => obj?.[k], item);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`lms-table ${className}`}>
        <table className="w-full">
          <thead>
            <tr className="lms-table-header">
              {columns.map((column, index) => (
                <th key={index} className={`py-3 px-4 text-left font-semibold ${column.className || ''}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: loadingRows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="animate-pulse border-b border-gray-200">
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className="py-3 px-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`lms-table ${className}`}>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-600 mb-2">No data found</h3>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Data table
  return (
    <div className={`lms-table ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="lms-table-header">
            {columns.map((column, index) => (
              <th 
                key={index} 
                className={`py-3 px-4 text-left font-semibold ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column, colIndex) => {
                const value = getValue(item, column.key as string);
                
                return (
                  <td key={colIndex} className={`py-3 px-4 text-sm ${column.className || ''}`}>
                    {column.render ? column.render(item, value) : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}