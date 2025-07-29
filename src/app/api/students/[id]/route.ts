//individual student + their assignments + progress
import { NextResponse, NextRequest } from 'next/server';
import studentsData from '@/data/students.json';
import studentAssignmentsData from '@/data/studentAssignments.json';
import studentProgressData from '@/data/studentProgress.json';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

// PUT method for updating student progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('Updating student progress for ID:', id);
    console.log('Update data:', body);
    
    // Validate request body
    if (!body.unitCode || !body.weekNumber || !body.completed) {
      return NextResponse.json(
        { error: 'unitCode, weekNumber, and completed status are required' }, 
        { status: 400 }
      );
    }
    
    // Validate week number
    if (body.weekNumber < 1 || body.weekNumber > 4) {
      return NextResponse.json(
        { error: 'weekNumber must be between 1 and 4' }, 
        { status: 400 }
      );
    }
    
    // Read current progress data from studentProgress.json
    const dataPath = path.join(process.cwd(), 'data/studentProgress.json');
    
    console.log('Reading progress file from path:', dataPath);
    
    const currentData = await readFile(dataPath, 'utf8');
    const progressData = JSON.parse(currentData);
    
    console.log('Current progress data loaded, total items:', progressData.length);
    
    // Find and update the progress item
    const progressIndex = progressData.findIndex(
      (p: any) => p.studentId === id && p.unitCode === body.unitCode
    );
    
    if (progressIndex === -1) {
      console.log('Progress item not found for student:', id, 'unit:', body.unitCode);
      return NextResponse.json({ error: 'Progress item not found' }, { status: 404 });
    }
    
    console.log('Found progress item at index:', progressIndex);
    console.log('Current progress item:', progressData[progressIndex]);
    
    // Update the specific week material
    const weekField = `week${body.weekNumber}Material`;
    
    progressData[progressIndex] = {
      ...progressData[progressIndex],
      [weekField]: body.completed,
      updatedBy: body.updatedBy || 'coordinator',
      lastUpdated: new Date().toISOString()
    };
    
    console.log('Updated progress item:', progressData[progressIndex]);
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(progressData, null, 2));
    
    console.log('Progress updated successfully for student:', id);
    
    // Return updated student data
    const student = studentsData.find(s => s.id === id);
    const assignments = studentAssignmentsData.filter(sa => sa.studentId === id);
    const updatedProgress = progressData.filter((sp: any) => sp.studentId === id);
    
    return NextResponse.json({
      message: 'Progress updated successfully',
      student,
      assignments,
      progress: updatedProgress
    });
    
  } catch (error) {
    console.error('Student progress update error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json({ 
      error: 'Failed to update student progress',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
/* //individual student + their assignments + progress 
import { NextResponse, NextRequest } from 'next/server';
import studentsData from '@/data/students.json';
import studentAssignmentsData from '@/data/studentAssignments.json';
import studentProgressData from '@/data/studentProgress.json';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

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

// PUT method for updating student progress
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log('Updating student progress for ID:', id);
    console.log('Update data:', body);
    
    // Validate request body
    if (!body.unitCode || !body.weekNumber || !body.completed) {
      return NextResponse.json(
        { error: 'unitCode, weekNumber, and completed status are required' }, 
        { status: 400 }
      );
    }
    
    // Read current progress data
    const dataPath = path.join(process.cwd(), 'src/data/studentProgress.json');
    const currentData = await readFile(dataPath, 'utf8');
    const progressData = JSON.parse(currentData);
    
    // Find and update the progress item
    const progressIndex = progressData.findIndex(
      (p: any) => p.studentId === id && p.unitCode === body.unitCode
    );
    
    if (progressIndex === -1) {
      return NextResponse.json({ error: 'Progress item not found' }, { status: 404 });
    }
    
    // Update the specific week material
    const weekField = `week${body.weekNumber}Material`;
    progressData[progressIndex] = {
      ...progressData[progressIndex],
      [weekField]: body.completed,
      updatedBy: body.updatedBy || 'coordinator',
      lastUpdated: new Date().toISOString()
    };
    
    // Write updated data back to file
    await writeFile(dataPath, JSON.stringify(progressData, null, 2));
    
    console.log('Progress updated successfully for student:', id);
    
    // Return updated student data
    const student = studentsData.find(s => s.id === id);
    const assignments = studentAssignmentsData.filter(sa => sa.studentId === id);
    const updatedProgress = progressData.filter((sp: any) => sp.studentId === id);
    
    return NextResponse.json({
      message: 'Progress updated successfully',
      student,
      assignments,
      progress: updatedProgress
    });
    
  } catch (error) {
    console.error('Student progress update error:', error);
    return NextResponse.json({ error: 'Failed to update student progress' }, { status: 500 });
  }
}
 */