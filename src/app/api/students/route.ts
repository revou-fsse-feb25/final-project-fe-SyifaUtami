// Students + filtering + optional data

import { NextResponse, NextRequest } from 'next/server';
import studentsData from '@/data/students.json';
import studentAssignmentsData from '@/data/studentAssignments.json';
import studentProgressData from '@/data/studentProgress.json';

async function checkCoordinatorAuth(request: NextRequest): Promise<boolean> {
  //temporary
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode');
    const includeData = searchParams.get('includeData') === 'true';
    
    // Check coordinator authorization for all students
    const isCoordinator = await checkCoordinatorAuth(request);
    if (!isCoordinator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    let filteredStudents = studentsData;
    
    // Filter by course if specified
    if (courseCode) {
      filteredStudents = studentsData.filter(s => s.courseCode === courseCode);
    }
    
    // Just return students if no additional data needed
    if (!includeData) {
      return NextResponse.json(filteredStudents);
    }
    
    // Include assignments and progress for detailed analytics
    const studentIds = filteredStudents.map(s => s.id);
    const assignments = studentAssignmentsData.filter(sa => 
      studentIds.includes(sa.studentId)
    );
    const progress = studentProgressData.filter(sp => 
      studentIds.includes(sp.studentId)
    );
    
    return NextResponse.json({
      students: filteredStudents,
      assignments,
      progress
    });
    
  } catch (error) {
    console.error('Students data error:', error);
    return NextResponse.json({ error: 'Failed to load students' }, { status: 500 });
  }
}