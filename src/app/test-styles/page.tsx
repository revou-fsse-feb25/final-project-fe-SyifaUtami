'use client';
import ProgressBar from '@/src/app/components/progressBar';
import React from 'react';


export default function ProgressBarDemo() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-black)' }}>
          Progress Bar Components
        </h1>
        <p className="text-lg text-gray-600">
          LMS Progress Bar variations
        </p>
      </div>

      {/* Basic Progress Bars */}
      <div className="lms-card mb-8">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Basic Progress Bars
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Simple Progress</h3>
            <ProgressBar progress={75} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">With Custom Label</h3>
            <ProgressBar 
              progress={65} 
              label="Course Completion"
            />
          </div>
        </div>
      </div>

      {/* Different Sizes */}
      <div className="lms-card mb-8">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Sizes
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Medium (md) - Default</h3>
            <ProgressBar progress={60} label="Assignment Progress" />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Large (lg)</h3>
            <ProgressBar progress={80} size="lg" label="Course Progress" />
          </div>
        </div>
      </div>

      {/* Color Variants */}
      <div className="lms-card mb-8">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Color Variants
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Primary</h3>
            <ProgressBar 
              progress={70} 
              variant="primary" 
              label="Assignment Progress"
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Secondary (Red)</h3>
            <ProgressBar 
              progress={55} 
              variant="secondary"
              label="Quiz Completion"
            />
          </div>
        </div>
      </div>

      {/* Success and Warning States */}
      <div className="lms-card mb-8">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Success and Warning States
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Success ({'>'}95% Pass Rate) - With Glow</h3>
            <ProgressBar 
              progress={97} 
              variant="success"
              label="Student Pass Rate"
              isSuccess={97 >= 95} // true/false based on your logic
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Success ({'>'}90% Satisfaction) - With Glow</h3>
            <ProgressBar 
              progress={94} 
              variant="success"
              label="Course Satisfaction"
              isSuccess={94 > 90} // true/false based on your logic
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Warning ({'>'} 50% Drop Out) - Red Alert</h3>
            <ProgressBar 
              progress={65} 
              variant="warning"
              label="Drop Out Rate"
              isWarning={65 > 50} // true/false based on your logic
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Warning ({'<'}5% Satisfaction) - Red Alert</h3>
            <ProgressBar 
              progress={3} 
              variant="warning"
              label="Low Satisfaction Alert"
              isWarning={3 < 5} // true/false based on your logic
            />
          </div>
        </div>
      </div>

      {/* Real LMS Examples */}
      <div className="lms-card">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-black)' }}>
          Real LMS Usage Examples
        </h2>
        
        <div className="space-y-8">
          {/* Student Dashboard Example */}
          <div className="border-l-4 pl-4">
            <h3 className="text-lg font-medium mb-4">Student Dashboard</h3>
            <div className="space-y-4">
              <ProgressBar 
                progress={78} 
                size="lg"
                variant="primary"
                label="Overall Course Progress"
              />
              <ProgressBar 
                progress={92} 
                variant="success"
                label="Assignment Success Rate"
                isSuccess={92 >= 90} // true/false based on your logic
              />
            </div>
          </div>

          {/* Warning Examples */}
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="text-lg font-medium mb-4">Alert Examples</h3>
            <div className="space-y-4">
              <ProgressBar 
                progress={58} 
                variant="warning"
                label="Class Attendance Rate"
                isWarning={58 < 70} // true/false based on your logic
              />
              <ProgressBar 
                progress={2} 
                variant="warning"
                label="Critical: Very Low Engagement"
                isWarning={2 < 10} // true/false based on your logic
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}