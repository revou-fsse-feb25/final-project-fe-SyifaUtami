// handles courses, faculty, and assignments

import { NextResponse } from 'next/server';
import coursesData from '@/data/courses.json';
import facultyData from '@/data/faculty.json';
import assignmentsData from '@/data/assignments.json';

export async function GET() {
  try {
    return NextResponse.json({
      courses: coursesData.courses,
      units: coursesData.units,
      teachers: facultyData.teachers,
      faculty: facultyData.faculty,
      assignments: assignmentsData
    });
  } catch (error) {
    console.error('Academic data error:', error);
    return NextResponse.json({ error: 'Failed to load academic data' }, { status: 500 });
  }
}