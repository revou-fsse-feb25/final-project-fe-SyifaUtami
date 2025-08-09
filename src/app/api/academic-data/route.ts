import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import facultyData from '@/data/faculty.json';
import assignmentsData from '@/data/assignments.json';

export async function GET() {
  try {
    // Read courses dynamically to get latest changes
    const coursesPath = path.join(process.cwd(), 'data/courses.json');
    const coursesContent = await readFile(coursesPath, 'utf8');
    const coursesData = JSON.parse(coursesContent);
    
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