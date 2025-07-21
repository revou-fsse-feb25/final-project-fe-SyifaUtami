//individual student + their assignments + progress
import { NextResponse, NextRequest } from 'next/server';
import studentsData from '@/data/students.json';
import studentAssignmentsData from '@/data/studentAssignments.json';
import studentProgressData from '@/data/studentProgress.json';

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Filter to ONLY this student's data
    const student = studentsData.find(s => s.id === id);
    const assignments = studentAssignmentsData.filter(sa => sa.studentId === id);
    const progress = studentProgressData.filter(sp => sp.studentId === id);
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      student,
      assignments,
      progress
    });
  } catch (error) {
    console.error('Student by ID error:', error);
    return NextResponse.json({ error: 'Failed to load student data' }, { status: 500 });
  }
}