'use client';
import { FC } from 'react';
import { useAuth } from '../../context/authContext';
import { Course, Unit } from '../../../types';
import StudentUnitCard from '../../components/studentUnitCard';
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
    </div>
  );
};

export default CourseOverview;