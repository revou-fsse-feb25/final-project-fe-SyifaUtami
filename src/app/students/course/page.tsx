'use client';
import { FC } from 'react';
import { useAuth } from '../../context/authContext';
import { Course, Unit } from '../../../types';
import StudentUnitCard from '../../components/studentUnitCard';
import { useStudentAssignments } from '../../context/useStudentAssignment';
// You'll need to import your courses/units data
import coursesData from '@/data/courses.json'; // Adjust path as needed

interface CoursesData {
  courses: Course[];
  units: Unit[];
}

const CourseOverview: FC = () => {
  const { user } = useAuth();

  // Early return if no user
  if (!user || !user.courseCode) {
    return (
      <div className="p-6">
        <p>Please log in to view your course.</p>
      </div>
    );
  }

  const data = coursesData as CoursesData;

  // Find the student's course
  const studentCourse = data.courses.find(course => course.code === user.courseCode);

  if (!studentCourse) {
    return (
      <div className="p-6">
        <p>Course not found.</p>
      </div>
    );
  }

  // Get units for this course
  const courseUnits = data.units.filter(unit => unit.courseCode === studentCourse.code);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Course Title */}
      <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--text-black)' }}>
        {studentCourse.name}
      </h1>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courseUnits.map((unit) => (
          <StudentUnitCard key={unit.code} unit={unit} />
        ))}
      </div>
        <div>
          {/* DEBUG LOGS DISPLAY */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">Debug Logs:</h3>
            <div className="text-sm text-yellow-700 max-h-96 overflow-y-auto">
              {debugLogs.map((log, index) => (
                <div key={index} className="font-mono text-xs mb-1">
                  {log}
                </div>
              ))}
            </div>
            <button 
              onClick={refetch}
              className="mt-2 px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-sm"
            >
              Refresh Data
            </button>
          </div>

          {/* CLOSED ASSIGNMENTS */}
          <h2>Closed Assignments</h2>
          {closedAssignments.map((item) => (
            <AssignmentCard
              key={item.assignment.id}
              assignment={item.assignment}
              submission={item.submission}
            />
          ))}

          {/* OPEN ASSIGNMENTS */}
          <h2>Open Assignments</h2>
          {openAssignments.map((item) => (
            <AssignmentCard
              key={item.assignment.id}
              assignment={item.assignment}
              submission={item.submission}
            />
          ))}
        </div>
    </div>
  );
};

export default CourseOverview;